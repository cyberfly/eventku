import { and, desc, eq, inArray } from 'drizzle-orm'

import { bootstrapDatabase } from '@/db'
import { courses, enrollments } from '@/db/schema'
import type { AttendeeFilterInput, UpdateAttendeeStatusInput } from '@/lib/attendees'
import { attendeeStatusOptions } from '@/lib/attendees'
import { requireOrganizerSession } from '@/server/organizer'

export function getAttendeesList(courseId?: AttendeeFilterInput['courseId']) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()

  const organizerCourses = database
    .select({ id: courses.id, title: courses.title, slug: courses.slug, accent: courses.accent })
    .from(courses)
    .where(eq(courses.organizerId, organizer.id))
    .all()

  const courseIds = organizerCourses.map((course) => course.id)

  if (courseIds.length === 0) {
    return { attendees: [], courses: [], metrics: buildMetrics([]) }
  }

  const filteredCourseIds = courseId ? courseIds.filter((id) => id === courseId) : courseIds

  if (filteredCourseIds.length === 0) {
    return { attendees: [], courses: organizerCourses, metrics: buildMetrics([]) }
  }

  const enrollmentRows = database
    .select()
    .from(enrollments)
    .where(inArray(enrollments.courseId, filteredCourseIds))
    .orderBy(desc(enrollments.enrolledAt))
    .all()

  const courseMap = new Map(organizerCourses.map((course) => [course.id, course]))

  const attendees = enrollmentRows.map((enrollment) => {
    const course = courseMap.get(enrollment.courseId)!

    return {
      courseAccent: course.accent,
      courseId: course.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      enrolledAt: enrollment.enrolledAt,
      id: enrollment.id,
      learnerEmail: enrollment.learnerEmail,
      learnerName: enrollment.learnerName,
      progress: enrollment.progress,
      status: enrollment.status,
    }
  })

  return {
    attendees,
    courses: organizerCourses,
    metrics: buildMetrics(enrollmentRows),
  }
}

export function getAttendeeDetail(enrollmentId: number) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()

  const row = database
    .select({
      courseAccent: courses.accent,
      courseId: courses.id,
      courseSlug: courses.slug,
      courseTitle: courses.title,
      enrolledAt: enrollments.enrolledAt,
      enrollmentId: enrollments.id,
      learnerEmail: enrollments.learnerEmail,
      learnerName: enrollments.learnerName,
      progress: enrollments.progress,
      status: enrollments.status,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(and(eq(enrollments.id, enrollmentId), eq(courses.organizerId, organizer.id)))
    .get()

  return row ?? null
}

export function updateAttendeeStatus(
  enrollmentId: UpdateAttendeeStatusInput['enrollmentId'],
  status: UpdateAttendeeStatusInput['status'],
) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()

  const ownedCourseIds = database
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.organizerId, organizer.id))

  const result = database
    .update(enrollments)
    .set({ status })
    .where(and(eq(enrollments.id, enrollmentId), inArray(enrollments.courseId, ownedCourseIds)))
    .run()

  if (result.changes === 0) {
    throw new Error('Attendee not found.')
  }

  return { enrollmentId, status }
}

type StatusRow = { status: (typeof attendeeStatusOptions)[number] }

function buildMetrics(rows: StatusRow[]) {
  let active = 0
  let atRisk = 0
  let completed = 0

  for (const row of rows) {
    if (row.status === 'Active') active++
    else if (row.status === 'At Risk') atRisk++
    else if (row.status === 'Completed' || row.status === 'Confirmed') completed++
  }

  return [
    { label: 'Total', value: String(rows.length) },
    { label: 'Active', value: String(active) },
    { label: 'At Risk', value: String(atRisk) },
    { label: 'Completed', value: String(completed) },
  ]
}
