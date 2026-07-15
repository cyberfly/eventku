export type ApiErrorCode =
  | 'not_found'
  | 'sold_out'
  | 'duplicate_registration'
  | 'validation_error'
  | 'invalid_json'

export function apiError(status: number, code: ApiErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status })
}

export function apiData<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init)
}
