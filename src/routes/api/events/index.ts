import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/events/')({
  server: {
    handlers: {
      GET: async () => {
        const { getEventCatalog } = await import('@/server/lms')
        const catalog = getEventCatalog()

        return Response.json(catalog)
      },
    },
  },
})
