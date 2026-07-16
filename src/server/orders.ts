import { eq, inArray } from 'drizzle-orm'

import { bootstrapDatabase } from '@/db'
import { courses, orders } from '@/db/schema'
import { requireOrganizerSession } from '@/server/organizer'

export function getOrderByNumber(orderNumber: string) {
  const database = bootstrapDatabase()
  const order = database
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber.trim().toUpperCase()))
    .get()

  if (!order) {
    return null
  }

  const course = order.courseId
    ? database.select().from(courses).where(eq(courses.id, order.courseId)).get()
    : null

  return {
    event: course
      ? {
          accent: course.accent,
          city: course.city,
          endAt: course.endAt,
          format: course.format,
          organizerName: course.instructorName,
          slug: course.slug,
          startAt: course.startAt,
          title: course.title,
          venue: course.venue,
        }
      : null,
    order,
  }
}

export function getOrganizerOrders() {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()

  const organizerCourseIds = database
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.organizerId, organizer.id))
    .all()
    .map((row) => row.id)

  if (organizerCourseIds.length === 0) {
    return { metrics: buildMetrics([]), orders: [] }
  }

  const orderRows = database
    .select()
    .from(orders)
    .where(inArray(orders.courseId, organizerCourseIds))
    .all()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )

  const courseMap = new Map(
    database
      .select({ id: courses.id, slug: courses.slug, title: courses.title })
      .from(courses)
      .where(inArray(courses.id, organizerCourseIds))
      .all()
      .map((row) => [row.id, row]),
  )

  const enrichedOrders = orderRows.map((order) => ({
    ...order,
    courseSlug: order.courseId ? (courseMap.get(order.courseId)?.slug ?? null) : null,
    courseTitle: order.courseId ? (courseMap.get(order.courseId)?.title ?? 'Unknown') : 'Unknown',
  }))

  return {
    metrics: buildMetrics(enrichedOrders),
    orders: enrichedOrders,
  }
}

type OrderRow = {
  amount: number
  status: string
}

function buildMetrics(orderRows: OrderRow[]) {
  const confirmed = orderRows.filter((order) => order.status === 'confirmed')
  const totalRevenue = confirmed.reduce((sum, order) => sum + order.amount, 0)

  return [
    { label: 'Total orders', value: String(orderRows.length) },
    { label: 'Confirmed', value: String(confirmed.length) },
    { label: 'Revenue (MYR)', value: String(totalRevenue) },
  ]
}
