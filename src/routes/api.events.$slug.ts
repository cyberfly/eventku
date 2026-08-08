import { createFileRoute } from '@tanstack/react-router'

import { getEventDetail } from '@/server/lms'

export const Route = createFileRoute('/api/events/$slug')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const result = getEventDetail(params.slug)

        if (!result) {
          return Response.json({ error: 'Event not found.' }, { status: 404 })
        }

        return Response.json(result)
      },
    },
  },
})
