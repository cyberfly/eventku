import { createFileRoute } from '@tanstack/react-router'

import { jsonError } from '@/lib/api-response'
import { eventRegistrationInput } from '@/lib/events'

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await request.json().catch(() => null)
        const parsed = eventRegistrationInput.safeParse(body)

        if (!parsed.success) {
          return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid registration details.')
        }

        const { purchaseEventAccess, EventAccessError } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({
            attendeeEmail: parsed.data.attendeeEmail,
            attendeeName: parsed.data.attendeeName,
            slug: params.slug,
          })

          return Response.json(result)
        } catch (error) {
          if (error instanceof EventAccessError) {
            return jsonError(error.status, error.message)
          }

          throw error
        }
      },
    },
  },
})
