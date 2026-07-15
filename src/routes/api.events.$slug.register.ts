import { createFileRoute } from '@tanstack/react-router'

import { registerEventAttendeeInput } from '@/lib/events'
import { jsonError } from '@/lib/http'

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: unknown

        try {
          body = await request.json()
        } catch {
          return jsonError(400, 'Request body must be valid JSON.')
        }

        const parsed = registerEventAttendeeInput.safeParse(body)

        if (!parsed.success) {
          return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid request body.')
        }

        const { purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({
            attendeeEmail: parsed.data.attendeeEmail,
            attendeeName: parsed.data.attendeeName,
            slug: params.slug,
          })

          return Response.json(result, { status: 201 })
        } catch (error) {
          return jsonError(400, error instanceof Error ? error.message : 'Unable to complete registration.')
        }
      },
    },
  },
})
