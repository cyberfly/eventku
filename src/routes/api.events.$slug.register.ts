import { createFileRoute } from '@tanstack/react-router'

import { eventRegistrationInput } from '@/lib/events'

function resolveRegistrationErrorStatus(message: string) {
  if (message === 'This event is no longer available.') {
    return 404
  }

  return 400
}

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await request.json().catch(() => null)
        const parsed = eventRegistrationInput.safeParse(body)

        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? 'Invalid request body.' },
            { status: 400 },
          )
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
          const message =
            error instanceof Error ? error.message : 'Unable to complete the registration.'

          return Response.json(
            { error: message },
            { status: resolveRegistrationErrorStatus(message) },
          )
        }
      },
    },
  },
})
