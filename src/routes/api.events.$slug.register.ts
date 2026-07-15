import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const registerBodySchema = z.object({
  attendeeEmail: z.string().email(),
  attendeeName: z.string().min(2).max(80),
})

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
        const rawBody = await request.json().catch(() => null)
        const parsedBody = registerBodySchema.safeParse(rawBody)

        if (!parsedBody.success) {
          return Response.json(
            { error: parsedBody.error.issues[0]?.message ?? 'Invalid request body.' },
            { status: 400 },
          )
        }

        const { purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({
            attendeeEmail: parsedBody.data.attendeeEmail,
            attendeeName: parsedBody.data.attendeeName,
            slug: params.slug,
          })

          return Response.json(result, { status: 201 })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to complete registration.'

          return Response.json(
            { error: message },
            { status: resolveRegistrationErrorStatus(message) },
          )
        }
      },
    },
  },
})
