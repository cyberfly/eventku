import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { apiData, apiError } from '@/lib/api-response'

const registerBodySchema = z.object({
  attendeeEmail: z.string().email(),
  attendeeName: z.string().min(2).max(80),
})

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let rawBody: unknown

        try {
          rawBody = await request.json()
        } catch {
          return apiError(400, 'invalid_json', 'Request body must be valid JSON.')
        }

        const parsedBody = registerBodySchema.safeParse(rawBody)

        if (!parsedBody.success) {
          return apiError(
            422,
            'validation_error',
            parsedBody.error.issues[0]?.message ?? 'Registration details are invalid.',
          )
        }

        const { EventAccessError, purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({
            attendeeEmail: parsedBody.data.attendeeEmail,
            attendeeName: parsedBody.data.attendeeName,
            slug: params.slug,
          })

          return apiData(result)
        } catch (error) {
          if (error instanceof EventAccessError) {
            const status = error.code === 'not_found' ? 404 : 409

            return apiError(status, error.code, error.message)
          }

          throw error
        }
      },
    },
  },
})
