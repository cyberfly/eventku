import { and, eq } from 'drizzle-orm'

import { bootstrapDatabase } from '@/db'
import { courses, enrollments, lessons, modules, orders } from '@/db/schema'

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

function parseStringList(value: string) {
  try {
    const parsed = JSON.parse(value)

    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function getEventDetails(course: CourseRow) {
  return {
    accent: course.accent,
    audience: course.audience,
    category: course.category,
    city: course.city,
    endAt: course.endAt,
    featuredImage: course.featuredImage,
    format: course.format,
    heroNote: course.heroNote,
    highlights: parseStringList(course.highlights),
    organizerName: course.instructorName,
    price: course.price,
    startAt: course.startAt,
    summary: course.summary,
    takeaways: parseStringList(course.takeaways),
    title: course.title,
    venue: course.venue,
    hostBio: course.hostBio,
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

  const normalizedEmail = input.attendeeEmail.trim().toLowerCase()
  const alreadyRegistered = existingRegistrations.some(
    (registration) => registration.learnerEmail.trim().toLowerCase() === normalizedEmail,
  )

  if (alreadyRegistered) {
    throw new Error('This attendee already has a confirmed registration.')
  }

  const attendeeName = input.attendeeName.trim()
  const now = new Date().toISOString()

  const orderNumber = database.transaction((tx) => {
    const orderInsert = tx
      .insert(orders)
      .values({
        courseId: course.id,
        buyerName: attendeeName,
        buyerEmail: normalizedEmail,
        amount: course.price,
        status: 'confirmed',
        orderNumber: '',
        createdAt: now,
      })
      .run()

    const orderId = Number(orderInsert.lastInsertRowid)
    const generatedOrderNumber = `ORD-${course.id}-${String(orderId).padStart(4, '0')}`

    tx.update(orders).set({ orderNumber: generatedOrderNumber }).where(eq(orders.id, orderId)).run()

    tx.insert(enrollments)
      .values({
        courseId: course.id,
        orderId,
        learnerName: attendeeName,
        learnerEmail: normalizedEmail,
        status: 'Confirmed',
        progress: 0,
        enrolledAt: now,
      })
      .run()

    return generatedOrderNumber
  })

  return {
    orderNumber,
  }
}
