import { createFileRoute } from '@tanstack/react-router'

const registerInput = {
  parse(body: unknown) {
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).attendeeName !== 'string' ||
      typeof (body as Record<string, unknown>).attendeeEmail !== 'string'
    ) {
      return null
    }

    const { attendeeName, attendeeEmail } = body as Record<string, string>

    return { attendeeName: attendeeName.trim(), attendeeEmail: attendeeEmail.trim() }
  },
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

        const input = registerInput.parse(body)

        if (!input) {
          return Response.json(
            { error: 'attendeeName and attendeeEmail are required.' },
            { status: 400 },
          )
        }

        if (!input.attendeeName || input.attendeeName.length < 2) {
          return Response.json(
            { error: 'attendeeName must be at least 2 characters.' },
            { status: 400 },
          )
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (!emailPattern.test(input.attendeeEmail)) {
          return Response.json({ error: 'attendeeEmail must be a valid email address.' }, { status: 400 })
        }

        const { purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({
            slug: params.slug,
            attendeeName: input.attendeeName,
            attendeeEmail: input.attendeeEmail,
          })

          return Response.json(result, { status: 201 })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed.'
          const isNotFound = message === 'This event is no longer available.'

          return Response.json({ error: message }, { status: isNotFound ? 404 : 409 })
        }
      },
    },
  },
})
