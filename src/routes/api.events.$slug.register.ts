import { createFileRoute } from '@tanstack/react-router'

import { registerAttendeeInput } from '@/lib/events'
import { jsonError, toErrorResponse } from '@/lib/http'

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await request.json().catch(() => null)

        if (body === null) {
          return jsonError('Request body must be valid JSON.', 400)
        }

        const parsed = registerAttendeeInput.safeParse(body)

        if (!parsed.success) {
          return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request body.', 400)
        }

        const { purchaseEventAccess } = await import('@/server/lms')

        try {
          const result = purchaseEventAccess({ slug: params.slug, ...parsed.data })

          return Response.json(result, { status: 201 })
        } catch (error) {
          return toErrorResponse(error, 'Registration failed.')
        }
      },
    },
  },
})
