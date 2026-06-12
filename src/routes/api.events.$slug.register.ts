import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { purchaseEventAccess, RegistrationError } from '@/server/lms'

const registerSchema = z.object({
  attendeeName: z.string().min(2, 'attendeeName must be at least 2 characters.').trim(),
  attendeeEmail: z.string().email('attendeeEmail must be a valid email address.').trim(),
})

export const Route = createFileRoute('/api/events/$slug/register')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = await request.json().catch(() => null)

        if (body === null) {
          return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
        }

        const parsed = registerSchema.safeParse(body)

        if (!parsed.success) {
          const message = parsed.error.errors[0]?.message ?? 'Invalid request body.'
          return Response.json({ error: message }, { status: 400 })
        }

        try {
          const result = purchaseEventAccess({ slug: params.slug, ...parsed.data })

          return Response.json(result, { status: 201 })
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed.'
          const status = error instanceof RegistrationError && error.code === 'EVENT_NOT_FOUND' ? 404 : 409

          return Response.json({ error: message }, { status })
        }
      },
    },
  },
})
