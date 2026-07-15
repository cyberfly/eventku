import { createFileRoute } from '@tanstack/react-router'

import { apiData, apiError } from '@/lib/api-response'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { getEventDetail } = await import('@/server/lms')
        const detail = getEventDetail(params.slug)

        if (!detail) {
          return apiError(404, 'not_found', 'This event was not found.')
        }

        return apiData(detail)
      },
    },
  },
})
