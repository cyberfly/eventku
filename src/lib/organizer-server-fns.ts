import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
  organizerAttendeeInput,
  organizerCourseInput,
  organizerLoginInput,
} from '@/lib/organizer'

const courseIdInput = z.object({
  courseId: z.number().int().positive(),
})

const updateOrganizerCourseInput = organizerCourseInput.extend({
  courseId: z.number().int().positive(),
})

const createOrganizerAttendeeInput = organizerAttendeeInput.extend({
  courseId: z.number().int().positive(),
})

const updateOrganizerAttendeeInput = organizerAttendeeInput.extend({
  courseId: z.number().int().positive(),
  attendeeId: z.number().int().positive(),
})

const deleteOrganizerAttendeeInput = z.object({
  courseId: z.number().int().positive(),
  attendeeId: z.number().int().positive(),
})

export const getOrganizerSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getOrganizerSession } = await import('@/server/organizer')

    return getOrganizerSession()
  },
)

export const loginOrganizerFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof organizerLoginInput>) =>
    organizerLoginInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { loginOrganizer } = await import('@/server/organizer')

    return loginOrganizer(data)
  })

export const logoutOrganizerFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { logoutOrganizer } = await import('@/server/organizer')

    return logoutOrganizer()
  },
)

export const getOrganizerDashboardFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getOrganizerDashboard } = await import('@/server/organizer')

    return getOrganizerDashboard()
  },
)

export const createOrganizerCourseFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof organizerCourseInput>) =>
    organizerCourseInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { createOrganizerCourse } = await import('@/server/organizer')

    return createOrganizerCourse(data)
  })

export const getOrganizerCourseDetailFn = createServerFn({ method: 'GET' })
  .inputValidator((input: z.infer<typeof courseIdInput>) =>
    courseIdInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { getOrganizerCourseDetail } = await import('@/server/organizer')

    return getOrganizerCourseDetail(data.courseId)
  })

export const updateOrganizerCourseFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof updateOrganizerCourseInput>) =>
    updateOrganizerCourseInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { updateOrganizerCourse } = await import('@/server/organizer')

    return updateOrganizerCourse(data.courseId, data)
  })

export const createOrganizerAttendeeFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof createOrganizerAttendeeInput>) =>
    createOrganizerAttendeeInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { createOrganizerAttendee } = await import('@/server/organizer')
    const { courseId, ...input } = data

    return createOrganizerAttendee(courseId, input)
  })

export const updateOrganizerAttendeeFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof updateOrganizerAttendeeInput>) =>
    updateOrganizerAttendeeInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { updateOrganizerAttendee } = await import('@/server/organizer')
    const { courseId, attendeeId, ...input } = data

    return updateOrganizerAttendee(courseId, attendeeId, input)
  })

export const deleteOrganizerAttendeeFn = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof deleteOrganizerAttendeeInput>) =>
    deleteOrganizerAttendeeInput.parse(input),
  )
  .handler(async ({ data }) => {
    const { deleteOrganizerAttendee } = await import('@/server/organizer')

    return deleteOrganizerAttendee(data.courseId, data.attendeeId)
  })

export const uploadCourseImageFn = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) {
      throw new Error('Expected form data.')
    }

    return input
  })
  .handler(async ({ data }) => {
    const { uploadCourseImage } = await import('@/server/organizer')

    return uploadCourseImage(data)
  })
