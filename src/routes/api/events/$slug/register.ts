import { createFileRoute } from '@tanstack/react-router'

import { eventRegistrationInput } from '@/lib/organizer'

function registrationError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to register for this event.'

  if (message === 'This event is no longer available.') {
    return Response.json({ error: message }, { status: 404 })
  }

  if (
    message === 'This event is sold out.' ||
    message === 'This attendee already has a confirmed registration.'
  ) {
    return Response.json({ error: message }, { status: 409 })
  }

  return Response.json(
    { error: 'Unable to register for this event.' },
    { status: 500 },
  )
}

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: unknown

        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
        }

        const parsed = eventRegistrationInput.safeParse(body)

        if (!parsed.success) {
          return Response.json(
            { error: parsed.error.issues[0]?.message ?? 'Invalid registration details.' },
            { status: 400 },
          )
        }

        try {
          const { purchaseEventAccess } = await import('@/server/lms')
          const registration = purchaseEventAccess({
            ...parsed.data,
            slug: params.slug,
          })

          return Response.json(registration, { status: 201 })
        } catch (error) {
          return registrationError(error)
        }
      },
    },
  },
})
