import { createFileRoute } from '@tanstack/react-router'

import { jsonError } from '@/lib/http'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getEventDetail } = await import('@/server/lms')
        const detail = getEventDetail(params.slug)

        if (!detail) {
          return jsonError(404, 'Event not found.')
        }

        return Response.json(detail)
      },
    },
  },
})
