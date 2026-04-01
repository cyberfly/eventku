import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { organizerCourseInput, organizerLoginInput } from '@/lib/organizer'

const courseIdInput = z.object({
  courseId: z.number().int().positive(),
})

const updateOrganizerCourseInput = organizerCourseInput.extend({
  courseId: z.number().int().positive(),
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
