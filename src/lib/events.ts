import { z } from 'zod'

export const registerAttendeeInput = z.object({
  attendeeName: z
    .string()
    .min(2, 'attendeeName must be at least 2 characters.')
    .max(80, 'attendeeName must be 80 characters or fewer.')
    .trim(),
  attendeeEmail: z
    .string()
    .email('attendeeEmail must be a valid email address.')
    .trim(),
})

export type RegisterAttendeeInput = z.infer<typeof registerAttendeeInput>
