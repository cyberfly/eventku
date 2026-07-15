import { createFileRoute } from '@tanstack/react-router'

import { parseJsonBody, jsonResponse, toErrorResponse } from '@/lib/http'
import { eventRegistrationInput } from '@/lib/organizer'

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        try {
          const body = eventRegistrationInput.parse(await parseJsonBody(request))
          const { purchaseEventAccess } = await import('@/server/lms')

          return jsonResponse(
            await purchaseEventAccess({
              ...body,
              slug: params.slug,
            }),
            {
              status: 201,
            },
          )
        } catch (error) {
          return toErrorResponse(error)
        }
      },
    },
  },
})
