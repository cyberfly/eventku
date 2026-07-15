import { z } from 'zod'

export const eventRegistrationInput = z.object({
  attendeeEmail: z.string().email(),
  attendeeName: z.string().min(2).max(80),
})

export type EventRegistrationInput = z.infer<typeof eventRegistrationInput>
