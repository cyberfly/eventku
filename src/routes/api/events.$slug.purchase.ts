import { createFileRoute } from '@tanstack/react-start'
import { z } from 'zod'

import { purchaseEventInput } from '@/lib/events'

export const Route = createFileRoute('/api/events/$slug/purchase')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const body = await request.json()
        const parsed = purchaseEventInput.safeParse({ ...body, slug: params.slug })

        if (!parsed.success) {
          return Response.json(
            { error: z.ZodError.flatten(parsed.error).fieldErrors },
            { status: 400 },
          )
        }

        const { purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess(parsed.data)

          return Response.json(result, { status: 201 })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unable to complete the purchase.'

          return Response.json({ error: message }, { status: 422 })
        }
      },
    },
  },
})
