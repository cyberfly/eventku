import { z } from 'zod'

export const registerEventAttendeeInput = z.object({
  attendeeEmail: z.string().email(),
  attendeeName: z.string().min(2).max(80),
})

export type RegisterEventAttendeeInput = z.infer<typeof registerEventAttendeeInput>
