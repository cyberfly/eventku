import { createFileRoute } from '@tanstack/react-router'

import { auth } from '@/lib/auth'
import { bootstrapDatabase } from '@/db'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        await bootstrapDatabase()
        return auth.handler(request)
      },
      POST: async ({ request }: { request: Request }) => {
        await bootstrapDatabase()
        return auth.handler(request)
      },
    },
  },
})
