import { eq, inArray } from 'drizzle-orm'

import { bootstrapDatabase } from '@/db'
import { courses, orders } from '@/db/schema'
import { requireOrganizerSession } from '@/server/organizer'

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
    return { orders: [], metrics: buildMetrics([]) }
  }

  const orderRows = database
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      courseId: orders.courseId,
      enrollmentId: orders.enrollmentId,
      attendeeName: orders.attendeeName,
      attendeeEmail: orders.attendeeEmail,
      amountPaid: orders.amountPaid,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(inArray(orders.courseId, organizerCourseIds))
    .all()
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )

  const courseMap = new Map(
    database
      .select({ id: courses.id, title: courses.title, slug: courses.slug })
      .from(courses)
      .where(inArray(courses.id, organizerCourseIds))
      .all()
      .map((row) => [row.id, row]),
  )

  const enriched = orderRows.map((order) => ({
    ...order,
    courseTitle: order.courseId ? (courseMap.get(order.courseId)?.title ?? 'Unknown') : 'Unknown',
    courseSlug: order.courseId ? (courseMap.get(order.courseId)?.slug ?? null) : null,
  }))

  return { orders: enriched, metrics: buildMetrics(enriched) }
}

export function getOrganizerOrderDetail(orderId: number) {
  const organizer = requireOrganizerSession()
  const database = bootstrapDatabase()

  const organizerCourseIds = database
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.organizerId, organizer.id))
    .all()
    .map((row) => row.id)

  const order = database
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get()

  if (!order || order.courseId === null || !organizerCourseIds.includes(order.courseId)) {
    return null
  }

  const course = database
    .select({ id: courses.id, title: courses.title, slug: courses.slug })
    .from(courses)
    .where(eq(courses.id, order.courseId))
    .get()

  return {
    ...order,
    courseTitle: course?.title ?? 'Unknown',
    courseSlug: course?.slug ?? null,
  }
}

type OrderRow = {
  amountPaid: number
  status: string
  createdAt: string
}

function buildMetrics(orderRows: OrderRow[]) {
  const confirmed = orderRows.filter((o) => o.status === 'confirmed')
  const totalRevenue = confirmed.reduce((sum, o) => sum + o.amountPaid, 0)
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)
  const thisMonth = confirmed.filter(
    (o) => new Date(o.createdAt).getTime() >= thisMonthStart.getTime(),
  )

  return [
    { label: 'Total orders', value: String(orderRows.length) },
    { label: 'Confirmed', value: String(confirmed.length) },
    { label: 'Revenue (MYR)', value: String(totalRevenue) },
    { label: 'This month', value: String(thisMonth.length) },
  ]
}
