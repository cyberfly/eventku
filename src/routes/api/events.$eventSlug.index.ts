import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/events/$eventSlug/')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getEventDetail } = await import('@/server/lms')
        const detail = getEventDetail(params.eventSlug)
        
        if (!detail) {
          return new Response(JSON.stringify({ error: 'Event not found' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }
        
        return new Response(JSON.stringify(detail), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      },
    }
  }
})
