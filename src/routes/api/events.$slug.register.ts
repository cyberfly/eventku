import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const registerInput = z.object({
  attendeeEmail: z.string().email(),
  attendeeName: z.string().min(2).max(80),
})

const errorStatusByMessage: Record<string, number> = {
  'This event is no longer available.': 404,
  'This event is sold out.': 409,
  'This attendee already has a confirmed registration.': 409,
}

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        let body: unknown

        try {
          body = await request.json()
        } catch {
          return Response.json(
            { error: { message: 'Request body must be valid JSON.' } },
            { status: 400 },
          )
        }

        const parsed = registerInput.safeParse(body)

        if (!parsed.success) {
          return Response.json(
            {
              error: {
                message: 'Invalid registration details.',
                issues: parsed.error.flatten().fieldErrors,
              },
            },
            { status: 422 },
          )
        }

        const { purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({
            attendeeEmail: parsed.data.attendeeEmail,
            attendeeName: parsed.data.attendeeName,
            slug: params.slug,
          })

          return Response.json({ data: result }, { status: 201 })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to complete the purchase.'

          return Response.json(
            { error: { message } },
            { status: errorStatusByMessage[message] ?? 500 },
          )
        }
      },
    },
  },
})
