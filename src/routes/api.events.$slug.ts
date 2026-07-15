import { createFileRoute } from '@tanstack/react-router'

import { jsonError } from '@/lib/api-response'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getEventDetail } = await import('@/server/lms')
        const detail = getEventDetail(params.slug)

        if (!detail) {
          return jsonError(404, 'This event could not be found.')
        }

        return Response.json(detail)
      },
    },
  },
})
