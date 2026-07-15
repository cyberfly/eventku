import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/events/')({
  server: {
    handlers: {
      GET: async () => {
        const { getEventCatalog } = await import('@/server/lms')
        const events = getEventCatalog()
        
        return new Response(JSON.stringify(events), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      },
    }
  }
})
