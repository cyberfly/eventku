import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/events/$slug')({
  GET: async ({ params }) => {
    const { getEventDetail } = await import('@/server/lms')
    const result = getEventDetail(params.slug)

    if (!result) {
      return Response.json({ error: 'Event not found.' }, { status: 404 })
    }

    return Response.json(result)
  },
})
