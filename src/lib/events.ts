import { z } from 'zod'

export const eventRegistrationInput = z.object({
  attendeeEmail: z.string().trim().email(),
  attendeeName: z.string().trim().min(2).max(80),
})

export type EventRegistrationInput = z.infer<typeof eventRegistrationInput>
