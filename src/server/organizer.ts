import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { and, eq, inArray } from 'drizzle-orm'
import { getRequestHeaders, setResponseHeader } from '@tanstack/react-start/server'

import { auth } from '@/lib/auth'
import { bootstrapDatabase } from '@/db'
import {
  courses,
  enrollments,
  lessons,
  modules,
  organizers,
} from '@/db/schema'
import type { OrganizerCourseInput, OrganizerLoginInput } from '@/lib/organizer'
import { normalizeEmail } from '@/lib/organizer-auth'

const COURSE_IMAGE_DIR = resolve(process.cwd(), 'public/uploads/courses')
const COURSE_IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_COURSE_IMAGE_BYTES = 5 * 1024 * 1024

function countBy<T>(rows: T[], getKey: (row: T) => number | null) {
  const counts = new Map<number, number>()

  for (const row of rows) {
    const key = getKey(row)

    if (key === null) {
      continue
    }

    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return counts
}

async function getOrganizerSessionRecord() {
  const session = await auth.api.getSession({ headers: getRequestHeaders() })

  if (!session) {
    return null
  }

  const database = await bootstrapDatabase()
  const organizer = database
    .select()
    .from(organizers)
    .where(eq(organizers.email, session.user.email))
    .get()

  if (!organizer) {
    return null
  }

  return {
    email: organizer.email,
    id: organizer.id,
    name: organizer.name,
  }
}

async function requireOrganizerSession() {
  const organizer = await getOrganizerSessionRecord()

  if (!organizer) {
    throw new Error('Organizer authentication required.')
  }

  return organizer
}

async function resolveUniqueSlug(
  requestedSlug: string,
  excludedCourseId?: number,
) {
  const database = await bootstrapDatabase()
  const normalizedBaseSlug = requestedSlug.trim().toLowerCase()
  const matchingCourses = database
    .select({
      id: courses.id,
      slug: courses.slug,
    })
    .from(courses)
    .all()
    .filter((course) => {
      if (excludedCourseId && course.id === excludedCourseId) {
        return false
      }

      return (
        course.slug === normalizedBaseSlug ||
        course.slug.startsWith(`${normalizedBaseSlug}-`)
      )
    })

  if (!matchingCourses.some((course) => course.slug === normalizedBaseSlug)) {
    return normalizedBaseSlug
  }

  let suffix = 2

  while (
    matchingCourses.some(
      (course) => course.slug === `${normalizedBaseSlug}-${suffix}`,
    )
  ) {
    suffix += 1
  }

  return `${normalizedBaseSlug}-${suffix}`
}

export function getOrganizerSession() {
  return getOrganizerSessionRecord()
}

export async function loginOrganizer(input: OrganizerLoginInput) {
  const email = normalizeEmail(input.email)

  const response = await auth.api.signInEmail({
    body: { email, password: input.password },
    asResponse: true,
  })

  if (!response.ok) {
    throw new Error('Invalid organizer email or password.')
  }

  const database = await bootstrapDatabase()
  const organizer = database
    .select()
    .from(organizers)
    .where(eq(organizers.email, email))
    .get()

  if (!organizer) {
    throw new Error('Invalid organizer email or password.')
  }

  const setCookieHeaders = response.headers.getSetCookie()

  if (setCookieHeaders.length > 0) {
    setResponseHeader('set-cookie', setCookieHeaders)
  }

  return {
    organizer: {
      email: organizer.email,
      id: organizer.id,
      name: organizer.name,
    },
  }
}

export async function logoutOrganizer() {
  const response = await auth.api.signOut({
    headers: getRequestHeaders(),
    asResponse: true,
  })

  const setCookieHeaders = response.headers.getSetCookie()

  if (setCookieHeaders.length > 0) {
    setResponseHeader('set-cookie', setCookieHeaders)
  }

  return {
    ok: true,
  }
}

export async function getOrganizerDashboard() {
  const organizer = await requireOrganizerSession()
  const database = await bootstrapDatabase()
  const organizerCourses = database
    .select()
    .from(courses)
    .where(eq(courses.organizerId, organizer.id))
    .all()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )

  const courseIds = organizerCourses.map((course) => course.id)
  const moduleRows =
    courseIds.length > 0
      ? database
          .select()
          .from(modules)
          .where(inArray(modules.courseId, courseIds))
          .all()
      : []
  const lessonRows =
    moduleRows.length > 0
      ? database
          .select()
          .from(lessons)
          .where(inArray(lessons.moduleId, moduleRows.map((module) => module.id)))
          .all()
      : []
  const enrollmentRows =
    courseIds.length > 0
      ? database
          .select()
          .from(enrollments)
          .where(inArray(enrollments.courseId, courseIds))
          .all()
      : []

  const moduleCountByCourse = countBy(moduleRows, (row) => row.courseId)
  const moduleIdToCourseId = new Map(
    moduleRows.map((row) => [row.id, row.courseId]),
  )
  const lessonCountByCourse = countBy(
    lessonRows,
    (row) => moduleIdToCourseId.get(row.moduleId) ?? null,
  )
  const enrollmentCountByCourse = countBy(
    enrollmentRows,
    (row) => row.courseId,
  )

  return {
    courses: organizerCourses.map((course) => {
      const enrollmentCount = enrollmentCountByCourse.get(course.id) ?? 0

      return {
        ...course,
        enrollmentCount,
        lessonCount: lessonCountByCourse.get(course.id) ?? 0,
        moduleCount: moduleCountByCourse.get(course.id) ?? 0,
        seatsRemaining: Math.max(course.seatCap - enrollmentCount, 0),
      }
    }),
    metrics: [
      {
        label: 'Courses',
        value: String(organizerCourses.length),
      },
      {
        label: 'Published',
        value: String(
          organizerCourses.filter((course) => course.status === 'published').length,
        ),
      },
      {
        label: 'Drafts',
        value: String(
          organizerCourses.filter((course) => course.status === 'draft').length,
        ),
      },
      {
        label: 'Enrollments',
        value: String(enrollmentRows.length),
      },
    ],
    organizer,
  }
}

export async function createOrganizerCourse(input: OrganizerCourseInput) {
  const organizer = await requireOrganizerSession()
  const database = await bootstrapDatabase()
  const slug = await resolveUniqueSlug(input.slug)
  const now = new Date().toISOString()
  const result = database
    .insert(courses)
    .values({
      organizerId: organizer.id,
      slug,
      title: input.title.trim(),
      summary: input.summary.trim(),
      category: input.category,
      level: input.level,
      status: input.status,
      durationHours: input.durationHours,
      seatCap: input.seatCap,
      completionRate: input.completionRate,
      instructorName: input.instructorName.trim(),
      accent: input.accent,
      price: input.price,
      format: input.format,
      venue: input.venue.trim(),
      city: input.city.trim(),
      audience: input.audience.trim(),
      heroNote: input.heroNote.trim(),
      hostBio: input.hostBio.trim(),
      startAt: new Date(input.startAt).toISOString(),
      endAt: new Date(input.endAt).toISOString(),
      highlights: JSON.stringify(input.highlights.map((item) => item.trim())),
      takeaways: JSON.stringify(input.takeaways.map((item) => item.trim())),
      featuredImage: input.featuredImage,
      createdAt: now,
    })
    .run()

  return {
    courseId: Number(result.lastInsertRowid),
    slug,
  }
}

export async function getOrganizerCourseDetail(courseId: number) {
  const organizer = await requireOrganizerSession()
  const database = await bootstrapDatabase()
  const course = database
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.organizerId, organizer.id)))
    .get()

  if (!course) {
    return null
  }

  const moduleRows = database
    .select()
    .from(modules)
    .where(eq(modules.courseId, course.id))
    .all()
    .sort((left, right) => left.position - right.position)
  const moduleIds = moduleRows.map((module) => module.id)
  const lessonRows =
    moduleIds.length > 0
      ? database
          .select()
          .from(lessons)
          .where(inArray(lessons.moduleId, moduleIds))
          .all()
      : []
  const enrollmentRows = database
    .select()
    .from(enrollments)
    .where(eq(enrollments.courseId, course.id))
    .all()
    .sort(
      (left, right) =>
        new Date(right.enrolledAt).getTime() - new Date(left.enrolledAt).getTime(),
    )

  return {
    course,
    enrollments: enrollmentRows,
    modules: moduleRows.map((module) => ({
      ...module,
      lessons: lessonRows
        .filter((lesson) => lesson.moduleId === module.id)
        .sort((left, right) => left.position - right.position),
    })),
    organizer,
    stats: {
      enrollmentCount: enrollmentRows.length,
      lessonCount: lessonRows.length,
      moduleCount: moduleRows.length,
      seatsRemaining: Math.max(course.seatCap - enrollmentRows.length, 0),
    },
  }
}

export async function updateOrganizerCourse(
  courseId: number,
  input: OrganizerCourseInput,
) {
  const organizer = await requireOrganizerSession()
  const database = await bootstrapDatabase()
  const existingCourse = database
    .select({
      id: courses.id,
    })
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.organizerId, organizer.id)))
    .get()

  if (!existingCourse) {
    throw new Error('Course not found.')
  }

  const slug = await resolveUniqueSlug(input.slug, courseId)

  database
    .update(courses)
    .set({
      slug,
      title: input.title.trim(),
      summary: input.summary.trim(),
      category: input.category,
      level: input.level,
      status: input.status,
      durationHours: input.durationHours,
      seatCap: input.seatCap,
      completionRate: input.completionRate,
      instructorName: input.instructorName.trim(),
      accent: input.accent,
      price: input.price,
      format: input.format,
      venue: input.venue.trim(),
      city: input.city.trim(),
      audience: input.audience.trim(),
      heroNote: input.heroNote.trim(),
      hostBio: input.hostBio.trim(),
      startAt: new Date(input.startAt).toISOString(),
      endAt: new Date(input.endAt).toISOString(),
      highlights: JSON.stringify(input.highlights.map((item) => item.trim())),
      takeaways: JSON.stringify(input.takeaways.map((item) => item.trim())),
      featuredImage: input.featuredImage,
    })
    .where(eq(courses.id, courseId))
    .run()

  return {
    courseId,
    slug,
  }
}

export async function uploadCourseImage(formData: FormData) {
  requireOrganizerSession()

  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw new Error('No image file was provided.')
  }

  const extension = COURSE_IMAGE_EXTENSION_BY_TYPE[file.type]

  if (!extension) {
    throw new Error('Upload a JPEG, PNG, WebP, or GIF image.')
  }

  if (file.size > MAX_COURSE_IMAGE_BYTES) {
    throw new Error('Image must be 5MB or smaller.')
  }

  await mkdir(COURSE_IMAGE_DIR, { recursive: true })

  const filename = `${randomUUID()}.${extension}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await writeFile(resolve(COURSE_IMAGE_DIR, filename), buffer)

  return {
    url: `/uploads/courses/${filename}`,
  }
}
