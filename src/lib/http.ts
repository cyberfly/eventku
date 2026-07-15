import { ZodError } from 'zod'

type ErrorResponseOptions = {
  status?: number
}

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return Response.json(data, init)
}

export function errorResponse(message: string, options: ErrorResponseOptions = {}) {
  return jsonResponse(
    {
      error: message,
    },
    {
      status: options.status ?? 400,
    },
  )
}

export async function parseJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.')
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return errorResponse(error.message, {
      status: error.status,
    })
  }

  if (error instanceof ZodError) {
    return errorResponse(error.issues[0]?.message ?? 'Invalid request body.', {
      status: 400,
    })
  }

  if (error instanceof Error) {
    return errorResponse(error.message, {
      status: mapDomainErrorStatus(error.message),
    })
  }

  return errorResponse('Unexpected server error.', {
    status: 500,
  })
}

function mapDomainErrorStatus(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('no longer available')) {
    return 404
  }

  if (
    normalizedMessage.includes('sold out') ||
    normalizedMessage.includes('already has a confirmed registration')
  ) {
    return 409
  }

  return 400
}
