import { createFileRoute } from '@tanstack/react-router'

import { errorResponse, jsonResponse, toErrorResponse } from '@/lib/http'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { getEventDetail } = await import('@/server/lms')
          const event = await getEventDetail(params.slug)

          if (!event) {
            return errorResponse('Event not found.', {
              status: 404,
            })
          }

          return jsonResponse(event)
        } catch (error) {
          return toErrorResponse(error)
        }
      },
    },
  },
})
