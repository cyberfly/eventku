import { z } from 'zod'

export const eventRegistrationInput = z.object({
  attendeeEmail: z.string().email(),
  attendeeName: z.string().min(2).max(80),
})

export const purchaseEventInput = eventRegistrationInput.extend({
  slug: z.string().min(1),
})

export type EventRegistrationInput = z.infer<typeof eventRegistrationInput>
export type PurchaseEventInput = z.infer<typeof purchaseEventInput>
