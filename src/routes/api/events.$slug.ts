import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getEventDetail } = await import('@/server/lms')
        const result = getEventDetail(params.slug)

        if (!result) {
          return Response.json(
            { error: { message: 'Event not found.' } },
            { status: 404 },
          )
        }

        return Response.json({ data: result })
      },
    },
  },
})
