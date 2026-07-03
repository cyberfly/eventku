import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { parseJsonBody, toErrorResponse } from '@/lib/http'
import { purchaseEventAccess } from '@/server/lms'

const registerSchema = z.object({
  attendeeName: z.string().min(2, 'attendeeName must be at least 2 characters.').trim(),
  attendeeEmail: z.string().email('attendeeEmail must be a valid email address.').trim(),
})

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { data, response } = await parseJsonBody(request, registerSchema)

        if (!data) {
          return response
        }

        try {
          const result = purchaseEventAccess({ slug: params.slug, ...data })

          return Response.json(result, { status: 201 })
        } catch (error) {
          return toErrorResponse(error, 'Registration failed.')
        }
      },
    },
  },
})
