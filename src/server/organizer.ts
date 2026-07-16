import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { and, desc, eq, inArray, lt } from 'drizzle-orm'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

import { bootstrapDatabase } from '@/db'
import {
  courses,
  enrollments,
  lessons,
  modules,
  orders,
  organizers,
  organizerSessions,
} from '@/db/schema'
import type { OrganizerCourseInput, OrganizerLoginInput } from '@/lib/organizer'
import { createSessionToken, normalizeEmail, verifyPassword } from '@/lib/organizer-auth'

const SESSION_COOKIE_NAME = 'organizer_session'
const COURSE_IMAGE_DIR = resolve(process.cwd(), 'public/uploads/courses')
const COURSE_IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_COURSE_IMAGE_BYTES = 5 * 1024 * 1024
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7

function getSessionCookieOptions(expires: Date = new Date(0)) {
  return {
    expires,
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

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

function cleanupExpiredSessions() {
  const database = bootstrapDatabase()

  database
    .delete(organizerSessions)
    .where(lt(organizerSessions.expiresAt, new Date().toISOString()))
    .run()
}

function clearOrganizerSessionCookie() {
  deleteCookie(SESSION_COOKIE_NAME, getSessionCookieOptions())
}

function getOrganizerSessionRecord() {
  cleanupExpiredSessions()

  const token = getCookie(SESSION_COOKIE_NAME)

  if (!token) {
    return null
  }

  const database = bootstrapDatabase()
  const session = database
    .select({
      expiresAt: organizerSessions.expiresAt,
      organizerEmail: organizers.email,
      organizerId: organizers.id,
      organizerName: organizers.name,
      token: organizerSessions.token,
    })
    .from(organizerSessions)
    .innerJoin(organizers, eq(organizerSessions.organizerId, organizers.id))
    .where(eq(organizerSessions.token, token))
    .get()

  if (!session) {
    clearOrganizerSessionCookie()
    return null
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    database
      .delete(organizerSessions)
      .where(eq(organizerSessions.token, session.token))
      .run()
    clearOrganizerSessionCookie()
    return null
  }

  return {
    email: session.organizerEmail,
    id: session.organizerId,
    name: session.organizerName,
  }
}

function requireOrganizerSession() {
  const organizer = getOrganizerSessionRecord()

  if (!organizer) {
    throw new Error('Organizer authentication required.')
  }

  return organizer
}

function resolveUniqueSlug(
  requestedSlug: string,
  excludedCourseId?: number,
) {
  const database = bootstrapDatabase()
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

export function loginOrganizer(input: OrganizerLoginInput) {
  cleanupExpiredSessions()

  const database = bootstrapDatabase()
  const organizer = database
    .select()
    .from(organizers)
    .where(eq(organizers.email, normalizeEmail(input.email)))
    .get()

  if (!organizer || !verifyPassword(input.password, organizer.passwordHash)) {
    throw new Error('Invalid organizer email or password.')
  }

  const token = createSessionToken()
  const expires = new Date(Date.now() + SESSION_DURATION_MS)

  database
    .insert(organizerSessions)
    .values({
      organizerId: organizer.id,
      token,
      expiresAt: expires.toISOString(),
      createdAt: new Date().toISOString(),
    })
    .run()

  setCookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions(expires))

  return {
    organizer: {
      email: organizer.email,
      id: organizer.id,
      name: organizer.name,
    },
  }
}

export function logoutOrganizer() {
  const database = bootstrapDatabase()
  const token = getCookie(SESSION_COOKIE_NAME)

  if (token) {
    database
      .delete(organizerSessions)
      .where(eq(organizerSessions.token, token))
      .run()
  }

  clearOrganizerSessionCookie()

  return {
    ok: true,
  }
}

export function getOrganizerDashboard() {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()
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
  const orderRows =
    courseIds.length > 0
      ? database
          .select()
          .from(orders)
          .where(inArray(orders.courseId, courseIds))
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
  const orderCountByCourse = countBy(orderRows, (row) => row.courseId)
  const revenueByCourse = new Map<number, number>()

  for (const order of orderRows) {
    if (order.courseId === null) {
      continue
    }

    revenueByCourse.set(
      order.courseId,
      (revenueByCourse.get(order.courseId) ?? 0) + order.amount,
    )
  }

  return {
    courses: organizerCourses.map((course) => {
      const enrollmentCount = enrollmentCountByCourse.get(course.id) ?? 0

      return {
        ...course,
        enrollmentCount,
        lessonCount: lessonCountByCourse.get(course.id) ?? 0,
        moduleCount: moduleCountByCourse.get(course.id) ?? 0,
        orderCount: orderCountByCourse.get(course.id) ?? 0,
        revenue: revenueByCourse.get(course.id) ?? 0,
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
        label: 'Orders',
        value: String(orderRows.length),
      },
      {
        label: 'Revenue',
        value: `MYR ${orderRows.reduce((sum, order) => sum + order.amount, 0).toLocaleString('en-MY')}`,
      },
    ],
    organizer,
  }
}

export function getOrganizerOrders() {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()
  const organizerCourses = database
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
    })
    .from(courses)
    .where(eq(courses.organizerId, organizer.id))
    .all()
  const courseIds = organizerCourses.map((course) => course.id)

  if (courseIds.length === 0) {
    return {
      metrics: [
        { label: 'Orders', value: '0' },
        { label: 'Revenue', value: 'MYR 0' },
        { label: 'Confirmed', value: '0' },
        { label: 'Pending review', value: '0' },
      ],
      orders: [],
      organizer,
    }
  }

  const courseById = new Map(organizerCourses.map((course) => [course.id, course]))
  const orderRows = database
    .select()
    .from(orders)
    .where(inArray(orders.courseId, courseIds))
    .orderBy(desc(orders.createdAt))
    .all()
  const totalRevenue = orderRows.reduce((sum, order) => sum + order.amount, 0)

  return {
    metrics: [
      { label: 'Orders', value: String(orderRows.length) },
      { label: 'Revenue', value: `MYR ${totalRevenue.toLocaleString('en-MY')}` },
      {
        label: 'Confirmed',
        value: String(orderRows.filter((order) => order.status === 'confirmed').length),
      },
      {
        label: 'Pending review',
        value: String(orderRows.filter((order) => order.status === 'review').length),
      },
    ],
    orders: orderRows.map((order) => ({
      ...order,
      course: order.courseId === null ? null : courseById.get(order.courseId) ?? null,
    })),
    organizer,
  }
}

export function getOrganizerOrderDetail(orderId: number) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()
  const order = database
    .select({
      amount: orders.amount,
      attendeeEmail: orders.attendeeEmail,
      attendeeName: orders.attendeeName,
      courseId: orders.courseId,
      courseSlug: courses.slug,
      courseTitle: courses.title,
      createdAt: orders.createdAt,
      currency: orders.currency,
      enrollmentId: orders.enrollmentId,
      id: orders.id,
      orderNumber: orders.orderNumber,
      organizerId: courses.organizerId,
      paymentStatus: orders.paymentStatus,
      status: orders.status,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .innerJoin(courses, eq(orders.courseId, courses.id))
    .where(and(eq(orders.id, orderId), eq(courses.organizerId, organizer.id)))
    .get()

  if (!order) {
    return null
  }

  const enrollment =
    order.enrollmentId === null
      ? null
      : database
          .select()
          .from(enrollments)
          .where(eq(enrollments.id, order.enrollmentId))
          .get() ?? null

  return {
    enrollment,
    order,
    organizer,
  }
}

export function createOrganizerCourse(input: OrganizerCourseInput) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()
  const slug = resolveUniqueSlug(input.slug)
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

export function getOrganizerCourseDetail(courseId: number) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()
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

export function updateOrganizerCourse(
  courseId: number,
  input: OrganizerCourseInput,
) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()
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

  const slug = resolveUniqueSlug(input.slug, courseId)

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
