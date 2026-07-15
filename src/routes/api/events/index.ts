import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/events')({
  GET: async () => {
    const { getEventCatalog } = await import('@/server/lms')
    const events = getEventCatalog()

    return Response.json({ events })
  },
})
