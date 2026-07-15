import { createFileRoute } from '@tanstack/react-router'
import { registerEventInput } from '@/lib/organizer'

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const body = await request.json().catch(() => null)
          const parsed = registerEventInput.safeParse(body)
          if (!parsed.success) {
            return Response.json(
              { error: parsed.error.issues[0]?.message ?? 'Invalid request body.' },
              { status: 400 },
            )
          }

          const { purchaseEventAccess } = await import('@/server/lms')
          const result = purchaseEventAccess({
            attendeeName: parsed.data.attendeeName,
            attendeeEmail: parsed.data.attendeeEmail,
            slug: params.slug,
          })

          return Response.json(result, { status: 201 })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'An unexpected error occurred.'
          const status = message.toLowerCase().includes('no longer available')
            ? 404
            : 400
          return Response.json({ error: message }, { status })
        }
      },
    },
  },
})
