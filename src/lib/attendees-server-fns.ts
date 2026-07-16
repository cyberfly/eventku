import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  attendeeFilterInput,
  enrollmentIdInput,
  updateAttendeeStatusInput,
} from '@/lib/attendees'

export const getAttendeesListFn = createServerFn({ method: 'GET' })
  .inputValidator((input: z.infer<typeof attendeeFilterInput>) =>
    attendeeFilterInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { getAttendeesList } = await import('@/server/attendees')

    return getAttendeesList(data.courseId)
  })

export const getAttendeeDetailFn = createServerFn({ method: 'GET' })
  .inputValidator((input: z.infer<typeof enrollmentIdInput>) =>
    enrollmentIdInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { getAttendeeDetail } = await import('@/server/attendees')

    return getAttendeeDetail(data.enrollmentId)
  })

export const updateAttendeeStatusFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof updateAttendeeStatusInput>) =>
    updateAttendeeStatusInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { updateAttendeeStatus } = await import('@/server/attendees')

    return updateAttendeeStatus(data.enrollmentId, data.status)
  })
