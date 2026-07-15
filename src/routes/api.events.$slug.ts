import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getEventDetail } = await import('@/server/lms')
        const detail = getEventDetail(params.slug)

        if (!detail) {
          return Response.json({ error: 'Event not found.' }, { status: 404 })
        }

        return Response.json(detail)
      },
    },
  },
})
