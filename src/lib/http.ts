export class HttpError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof HttpError) {
    return jsonError(error.message, error.status)
  }

  return jsonError(error instanceof Error ? error.message : fallbackMessage, 400)
}
