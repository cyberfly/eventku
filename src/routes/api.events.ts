import { createFileRoute } from '@tanstack/react-router'

import { apiData } from '@/lib/api-response'

export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      GET: async () => {
        const { getEventCatalog } = await import('@/server/lms')

        return apiData(getEventCatalog())
      },
    },
  },
})
