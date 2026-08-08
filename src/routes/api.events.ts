import { createFileRoute } from '@tanstack/react-router'

import { getEventCatalog } from '@/server/lms'

export const Route = createFileRoute('/api/events')({
  server: {
    handlers: {
      GET: () => Response.json(getEventCatalog()),
    },
  },
})
