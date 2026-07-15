import { createFileRoute } from '@tanstack/react-router'

import { jsonResponse, toErrorResponse } from '@/lib/http'

export const Route = createFileRoute('/api/events/')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { getEventCatalog } = await import('@/server/lms')

          return jsonResponse(await getEventCatalog())
        } catch (error) {
          return toErrorResponse(error)
        }
      },
    },
  },
})
