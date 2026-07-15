import { createFileRoute } from '@tanstack/react-router'

import { eventRegistrationInput } from '@/lib/events'
import { jsonError } from '@/lib/http'

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: unknown

        try {
          body = await request.json()
        } catch {
          return jsonError('Request body must be valid JSON.', 400)
        }

        const parsed = eventRegistrationInput.safeParse(body)

        if (!parsed.success) {
          return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request body.', 400)
        }

        const { purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({
            slug: params.slug,
            attendeeName: parsed.data.attendeeName,
            attendeeEmail: parsed.data.attendeeEmail,
          })

          return Response.json(result, { status: 201 })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to complete registration.'

          if (message === 'This event is no longer available.') {
            return jsonError(message, 404)
          }

          if (message === 'This attendee already has a confirmed registration.') {
            return jsonError(message, 409)
          }

          return jsonError(message, 400)
        }
      },
    },
  },
})
