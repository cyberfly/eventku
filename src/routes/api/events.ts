import { createFileRoute } from '@tanstack/react-start'

export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      GET: async () => {
        const { getEventCatalog } = await import('@/server/lms')

        return Response.json(getEventCatalog())
      },
    },
  },
})
