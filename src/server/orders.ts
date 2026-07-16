import { and, eq, inArray } from 'drizzle-orm'

import { bootstrapDatabase } from '@/db'
import { courses, enrollments, orders } from '@/db/schema'
import type { CreateOrderInput } from '@/lib/orders'
import { requireOrganizerSession } from '@/server/organizer'

export function createOrder(input: CreateOrderInput) {
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

  const normalizedEmail = input.buyerEmail.trim().toLowerCase()
  const alreadyRegistered = existingRegistrations.some(
    (registration) => registration.learnerEmail.trim().toLowerCase() === normalizedEmail,
  )

  if (alreadyRegistered) {
    throw new Error('This attendee already has a confirmed registration.')
  }

  const now = new Date().toISOString()
  const buyerName = input.buyerName.trim()

  const enrollmentResult = database
    .insert(enrollments)
    .values({
      courseId: course.id,
      learnerName: buyerName,
      learnerEmail: normalizedEmail,
      status: 'Confirmed',
      progress: 0,
      enrolledAt: now,
    })
    .run()

  const enrollmentId = Number(enrollmentResult.lastInsertRowid)
  const confirmationCode = `NS-${course.id}-${String(enrollmentId).padStart(4, '0')}`

  database
    .insert(orders)
    .values({
      courseId: course.id,
      enrollmentId,
      confirmationCode,
      buyerName,
      buyerEmail: normalizedEmail,
      amount: course.price,
      status: 'paid',
      createdAt: now,
    })
    .run()

  return {
    amount: course.price,
    confirmationCode,
  }
}

export function getOrderByConfirmationCode(confirmationCode: string) {
  const database = bootstrapDatabase()
  const order = database
    .select()
    .from(orders)
    .where(eq(orders.confirmationCode, confirmationCode))
    .get()

  if (!order) {
    return null
  }

  const course = database
    .select()
    .from(courses)
    .where(eq(courses.id, order.courseId))
    .get()

  if (!course) {
    return null
  }

  return {
    order,
    course: {
      city: course.city,
      format: course.format,
      slug: course.slug,
      startAt: course.startAt,
      title: course.title,
      venue: course.venue,
    },
  }
}

export function listOrganizerOrders() {
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
  const courseById = new Map(organizerCourses.map((course) => [course.id, course]))

  const orderRows =
    courseIds.length > 0
      ? database
          .select()
          .from(orders)
          .where(inArray(orders.courseId, courseIds))
          .all()
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          )
      : []

  const totalRevenue = orderRows
    .filter((order) => order.status === 'paid')
    .reduce((sum, order) => sum + order.amount, 0)

  return {
    orders: orderRows.map((order) => ({
      ...order,
      course: courseById.get(order.courseId) ?? null,
    })),
    summary: {
      orderCount: orderRows.length,
      totalRevenue,
    },
  }
}
