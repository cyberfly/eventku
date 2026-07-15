import { z } from 'zod'

export const eventRegistrationInput = z.object({
  attendeeName: z
    .string()
    .min(2, 'Attendee name must be at least 2 characters.')
    .max(120, 'Attendee name must be 120 characters or fewer.'),
  attendeeEmail: z.string().email('Enter a valid email address.'),
})

export type EventRegistrationInput = z.infer<typeof eventRegistrationInput>
