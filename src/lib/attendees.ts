import { z } from 'zod'

export const attendeeStatusOptions = [
  'Active',
  'At Risk',
  'Completed',
  'Confirmed',
] as const

export const updateAttendeeStatusInput = z.object({
  enrollmentId: z.number().int().positive(),
  status: z.enum(attendeeStatusOptions),
})

export const attendeeFilterInput = z.object({
  courseId: z.number().int().positive().optional(),
})

export const enrollmentIdInput = z.object({
  enrollmentId: z.number().int().positive(),
})

export type UpdateAttendeeStatusInput = z.infer<typeof updateAttendeeStatusInput>
export type AttendeeFilterInput = z.infer<typeof attendeeFilterInput>
export type EnrollmentIdInput = z.infer<typeof enrollmentIdInput>
