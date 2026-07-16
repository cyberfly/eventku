import { z } from 'zod'

export const createOrderInput = z.object({
  slug: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerName: z.string().min(2).max(80),
})

export const orderConfirmationCodeInput = z.object({
  confirmationCode: z.string().min(1),
})

export type CreateOrderInput = z.infer<typeof createOrderInput>
