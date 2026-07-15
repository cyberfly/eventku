import { createFileRoute } from '@tanstack/react-router'

import { jsonError } from '@/lib/http'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getEventDetail } = await import('@/server/lms')
        const result = getEventDetail(params.slug)

        if (!result) {
          return jsonError('Event not found.', 404)
        }

        return Response.json(result)
      },
    },
  },
})
