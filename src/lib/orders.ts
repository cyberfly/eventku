import { z } from 'zod'

export const orderStatusOptions = [
  'confirmed',
  'cancelled',
] as const

export const orderStatusSchema = z.enum(orderStatusOptions)

export type OrderStatus = z.infer<typeof orderStatusSchema>
