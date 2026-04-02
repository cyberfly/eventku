import { and, desc, eq, inArray } from 'drizzle-orm'

import { bootstrapDatabase } from '@/db'
import { courses, enrollments, lessons, modules, orders } from '@/db/schema'
import { normalizeEmail } from '@/lib/organizer-auth'
import { getEventExperience } from '@/lib/events'

type CourseRow = typeof courses.$inferSelect
type EnrollmentRow = typeof enrollments.$inferSelect
type ModuleRow = typeof modules.$inferSelect
type LessonRow = typeof lessons.$inferSelect

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

function average(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  const total = values.reduce((sum, value) => sum + value, 0)

  return Math.round(total / values.length)
}

function sortByDateAsc<T>(rows: T[], getDate: (row: T) => string) {
  return [...rows].sort(
    (left, right) =>
      new Date(getDate(left)).getTime() - new Date(getDate(right)).getTime(),
  )
}

function getEventDetails(course: CourseRow) {
  const configured = getEventExperience(course.slug)

  return {
    accent: course.accent,
    audience: configured?.audience ?? 'Training teams and operators',
    category: configured?.category ?? course.category,
    city: configured?.city ?? 'Online',
    endAt: configured?.endAt ?? course.createdAt,
    format: configured?.format ?? course.level,
    heroNote: configured?.heroNote ?? 'Live training event',
    highlights: configured?.highlights ?? [],
    organizerName: configured?.organizerName ?? course.instructorName,
    price: configured?.price ?? 129,
    startAt: configured?.startAt ?? course.createdAt,
    summary: configured?.summary ?? course.summary,
    takeaways: configured?.takeaways ?? [],
    title: configured?.title ?? course.title,
    venue: configured?.venue ?? 'Eventku Live',
    hostBio: configured?.hostBio ?? `${course.instructorName} leads this event.`,
  }
}

function toEventCard(
  course: CourseRow,
  moduleCountByCourse: Map<number, number>,
  lessonCountByCourse: Map<number, number>,
  attendeesByCourse: Map<number, number>,
) {
  const event = getEventDetails(course)
  const attendeeCount = attendeesByCourse.get(course.id) ?? 0
  const seatsRemaining = Math.max(course.seatCap - attendeeCount, 0)

  return {
    ...event,
    id: course.id,
    slug: course.slug,
    durationHours: course.durationHours,
    moduleCount: moduleCountByCourse.get(course.id) ?? 0,
    lessonCount: lessonCountByCourse.get(course.id) ?? 0,
    attendeeCount,
    seatsRemaining,
  }
}

export function getMarketplaceOverview() {
  const database = bootstrapDatabase()
  const courseRows = database
    .select()
    .from(courses)
    .where(eq(courses.status, 'published'))
    .all()
  const moduleRows = database.select().from(modules).all()
  const lessonRows = database.select().from(lessons).all()
  const enrollmentRows = database.select().from(enrollments).all()

  const moduleCountByCourse = countBy(moduleRows, (row) => row.courseId)
  const moduleIdToCourseId = new Map(moduleRows.map((row) => [row.id, row.courseId]))
  const lessonCountByCourse = countBy(lessonRows, (row) => moduleIdToCourseId.get(row.moduleId) ?? null)
  const attendeesByCourse = countBy(enrollmentRows, (row) => row.courseId)
  const allEvents = courseRows
    .map((course) =>
      toEventCard(
        course,
        moduleCountByCourse,
        lessonCountByCourse,
        attendeesByCourse,
      ),
    )
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())

  const totalSeats = courseRows.reduce((sum, course) => sum + course.seatCap, 0)
  const seatsSold = enrollmentRows.length
  const fillRates = allEvents.map((event) => {
    if (event.attendeeCount === 0) {
      return 0
    }

    return Math.round((event.attendeeCount / (event.attendeeCount + event.seatsRemaining)) * 100)
  })

  return {
    metrics: [
      {
        label: 'Live events',
        value: String(courseRows.length),
        detail: 'Upcoming seminars visitors can purchase today',
      },
      {
        label: 'Confirmed attendees',
        value: String(seatsSold),
        detail: 'Registrations already captured in the event funnel',
      },
      {
        label: 'Seats remaining',
        value: String(Math.max(totalSeats - seatsSold, 0)),
        detail: 'Inventory still open across the current lineup',
      },
      {
        label: 'Avg. sell-through',
        value: `${average(fillRates)}%`,
        detail: 'Average booking progress across published events',
      },
    ],
    spotlightEvents: [...allEvents]
      .sort((left, right) => right.attendeeCount - left.attendeeCount)
      .slice(0, 3),
    upcomingMoments: allEvents.slice(0, 4),
  }
}

export function getEventCatalog() {
  const database = bootstrapDatabase()
  const courseRows = database
    .select()
    .from(courses)
    .where(eq(courses.status, 'published'))
    .all()
  const moduleRows = database.select().from(modules).all()
  const lessonRows = database.select().from(lessons).all()
  const enrollmentRows = database.select().from(enrollments).all()

  const moduleCountByCourse = countBy(moduleRows, (row) => row.courseId)
  const moduleIdToCourseId = new Map(moduleRows.map((row) => [row.id, row.courseId]))
  const lessonCountByCourse = countBy(lessonRows, (row) => moduleIdToCourseId.get(row.moduleId) ?? null)
  const attendeesByCourse = countBy(enrollmentRows, (row) => row.courseId)

  return courseRows
    .map((course) =>
      toEventCard(
        course,
        moduleCountByCourse,
        lessonCountByCourse,
        attendeesByCourse,
      ),
    )
    .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
}

export function getEventDetail(slug: string) {
  const database = bootstrapDatabase()
  const course = database
    .select()
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.status, 'published')))
    .get()

  if (!course) {
    return null
  }

  const moduleRows = database
    .select()
    .from(modules)
    .where(eq(modules.courseId, course.id))
    .all()
  const sortedModules = [...moduleRows].sort((left, right) => left.position - right.position)

  const moduleIds = new Set(sortedModules.map((module) => module.id))
  const lessonRows = database
    .select()
    .from(lessons)
    .all()
    .filter((lesson) => moduleIds.has(lesson.moduleId))
  const enrollmentRows = sortByDateAsc(
    database
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, course.id))
      .all(),
    (row) => row.enrolledAt,
  ).reverse()
  const eventDetails = getEventDetails(course)
  const attendeeCount = enrollmentRows.length

  const agenda = sortedModules.map((module) => ({
    ...module,
    sessions: lessonRows
      .filter((lesson) => lesson.moduleId === module.id)
      .sort((left, right) => left.position - right.position),
  }))

  return {
    event: {
      ...eventDetails,
      slug: course.slug,
      attendeeCount,
      lessonCount: lessonRows.length,
      moduleCount: sortedModules.length,
      seatsRemaining: Math.max(course.seatCap - attendeeCount, 0),
    },
    agenda,
    attendeePreview: enrollmentRows.slice(0, 6).map((row) => ({
      ...row,
      status: row.status === 'Completed' ? 'Confirmed' : row.status,
    })),
  }
}

type PurchaseEventInput = {
  attendeeEmail: string
  attendeeName: string
  slug: string
}

export function purchaseEventAccess(input: PurchaseEventInput) {
  const database = bootstrapDatabase()
  const course = database
    .select()
    .from(courses)
    .where(and(eq(courses.slug, input.slug), eq(courses.status, 'published')))
    .get()

  if (!course) {
    throw new Error('This event is no longer available.')
  }

  const existingRegistrations = database
    .select()
    .from(enrollments)
    .where(eq(enrollments.courseId, course.id))
    .all()

  if (existingRegistrations.length >= course.seatCap) {
    throw new Error('This event is sold out.')
  }

  const normalizedEmail = normalizeEmail(input.attendeeEmail)
  const alreadyRegistered = existingRegistrations.some(
    (registration) => normalizeEmail(registration.learnerEmail) === normalizedEmail,
  )

  if (alreadyRegistered) {
    throw new Error('This attendee already has a confirmed registration.')
  }

  const enrollmentResult = database
    .insert(enrollments)
    .values({
      courseId: course.id,
      learnerName: input.attendeeName.trim(),
      learnerEmail: normalizedEmail,
      status: 'Confirmed',
      progress: 0,
      enrolledAt: new Date().toISOString(),
    })
    .run()

  const enrollmentId = Number(enrollmentResult.lastInsertRowid)
  const orderNumber = `ORD-${String(enrollmentId).padStart(5, '0')}`
  const eventDetails = getEventDetails(course)

  database
    .insert(orders)
    .values({
      enrollmentId,
      courseId: course.id,
      orderNumber,
      attendeeName: input.attendeeName.trim(),
      attendeeEmail: normalizedEmail,
      priceAtPurchase: eventDetails.price,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    })
    .run()

  return { orderNumber }
}

export function getOrderByCode(orderCode: string) {
  const database = bootstrapDatabase()
  const order = database
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderCode))
    .get()

  if (!order) {
    return null
  }

  const course = order.courseId
    ? database.select().from(courses).where(eq(courses.id, order.courseId)).get()
    : null

  const eventDetails = course ? getEventDetails(course) : null

  return {
    order,
    event: eventDetails && course
      ? {
          title: eventDetails.title,
          category: eventDetails.category,
          format: eventDetails.format,
          city: eventDetails.city,
          startAt: eventDetails.startAt,
          endAt: eventDetails.endAt,
          organizerName: eventDetails.organizerName,
          accent: eventDetails.accent,
          slug: course.slug,
        }
      : null,
  }
}

export function getOrdersByEmail(email: string) {
  const database = bootstrapDatabase()
  const normalizedEmail = normalizeEmail(email)

  const orderRows = database
    .select()
    .from(orders)
    .where(eq(orders.attendeeEmail, normalizedEmail))
    .orderBy(desc(orders.createdAt))
    .all()

  if (orderRows.length === 0) {
    return []
  }

  const courseIds = [...new Set(orderRows.map((o) => o.courseId).filter((id): id is number => id !== null))]
  const courseRows = courseIds.length > 0
    ? database.select().from(courses).where(inArray(courses.id, courseIds)).all()
    : []
  const courseById = new Map(courseRows.map((c) => [c.id, c]))

  return orderRows.map((order) => {
    const course = order.courseId ? courseById.get(order.courseId) : null
    const eventDetails = course ? getEventDetails(course) : null

    return {
      ...order,
      eventTitle: eventDetails?.title ?? null,
      eventSlug: course?.slug ?? null,
      accent: course?.accent ?? null,
    }
  })
}
