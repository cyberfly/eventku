import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/events/$slug/register')({
  POST: async ({ params, request }) => {
    let body: unknown

    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).attendeeEmail !== 'string' ||
      typeof (body as Record<string, unknown>).attendeeName !== 'string'
    ) {
      return Response.json(
        { error: 'attendeeEmail and attendeeName are required.' },
        { status: 400 },
      )
    }

    const { attendeeEmail, attendeeName } = body as {
      attendeeEmail: string
      attendeeName: string
    }

    if (!attendeeEmail.trim() || !attendeeName.trim()) {
      return Response.json(
        { error: 'attendeeEmail and attendeeName must not be empty.' },
        { status: 400 },
      )
    }

    try {
      const { purchaseEventAccess } = await import('@/server/lms')
      const result = purchaseEventAccess({
        attendeeEmail,
        attendeeName,
        slug: params.slug,
      })

      return Response.json(result, { status: 201 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed.'

      if (message === 'This event is no longer available.') {
        return Response.json({ error: message }, { status: 404 })
      }

      if (
        message === 'This event is sold out.' ||
        message === 'This attendee already has a confirmed registration.'
      ) {
        return Response.json({ error: message }, { status: 409 })
      }

      return Response.json({ error: message }, { status: 400 })
    }
  },
})
