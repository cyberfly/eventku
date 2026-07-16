import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { formatCurrency, formatEventDateTime } from '@/lib/format'

const getOrderDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: { confirmationCode: string }) => input)
  .handler(async ({ data }) => {
    const { getOrderByConfirmationCode } = await import('@/server/orders')

    return getOrderByConfirmationCode(data.confirmationCode)
  })

export const Route = createFileRoute('/orders/$confirmationCode')({
  component: OrderConfirmationPage,
  loader: async ({ params }) => {
    const detail = await getOrderDetail({
      data: {
        confirmationCode: params.confirmationCode,
      },
    })

    if (!detail) {
      throw notFound()
    }

    return detail
  },
})

function OrderConfirmationPage() {
  const { course, order } = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">Order Confirmation</p>
          <h2>{order.confirmationCode}</h2>
          <p className="muted-copy">
            Keep this reference for your records. It confirms your seat for{' '}
            {course.title}.
          </p>
        </div>
        <dl className="booking-facts">
          <div>
            <dt>Event</dt>
            <dd>{course.title}</dd>
          </div>
          <div>
            <dt>Starts</dt>
            <dd>{formatEventDateTime(course.startAt)}</dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{course.venue} · {course.city}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>{course.format}</dd>
          </div>
        </dl>
        <dl className="booking-facts">
          <div>
            <dt>Buyer</dt>
            <dd>{order.buyerName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{order.buyerEmail}</dd>
          </div>
          <div>
            <dt>Amount paid</dt>
            <dd>{formatCurrency(order.amount)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{order.status}</dd>
          </div>
          <div>
            <dt>Purchased</dt>
            <dd>{formatEventDateTime(order.createdAt)}</dd>
          </div>
        </dl>
        <div className="hero-actions">
          <Link className="primary-link" params={{ eventSlug: course.slug }} to="/events/$eventSlug">
            View event page
          </Link>
          <Link className="ghost-link" to="/events">
            Back to all events
          </Link>
        </div>
      </section>
    </div>
  )
}
