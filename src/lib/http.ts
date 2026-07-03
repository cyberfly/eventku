import type { z } from 'zod'

import { buildFieldErrors } from '@/lib/organizer'

export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status })
  }

  const message = error instanceof Error ? error.message : fallbackMessage
  return Response.json({ error: message }, { status: 400 })
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>) {
  const body = await request.json().catch(() => null)

  if (body === null) {
    return {
      data: null,
      response: Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }),
    } as const
  }

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid request body.'
    return {
      data: null,
      response: Response.json(
        { error: message, fieldErrors: buildFieldErrors(parsed.error.issues) },
        { status: 400 },
      ),
    } as const
  }

  return { data: parsed.data, response: null } as const
}
