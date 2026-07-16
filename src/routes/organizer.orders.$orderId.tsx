import {
  Link,
  createFileRoute,
  notFound,
  redirect,
} from '@tanstack/react-router'

import { formatCurrency, formatEventDateTime } from '@/lib/format'
import {
  getOrganizerOrderDetailFn,
  getOrganizerSessionFn,
} from '@/lib/organizer-server-fns'

export const Route = createFileRoute('/organizer/orders/$orderId')({
  component: OrganizerOrderDetailPage,
  loader: async ({ params }) => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    const orderDetail = await getOrganizerOrderDetailFn({
      data: {
        orderId: Number(params.orderId),
      },
    })

    if (!orderDetail) {
      throw notFound()
    }

    return orderDetail
  },
})

function OrganizerOrderDetailPage() {
  const { enrollment, order } = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Order Detail</p>
          <h2>{order.orderNumber}</h2>
          <p className="muted-copy">
            Review the purchase record, linked attendee registration, and payment
            state for this event seat.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-link" to="/organizer/orders">
            Back to orders
          </Link>
          <Link
            className="ghost-link"
            params={{ courseId: String(order.courseId) }}
            to="/organizer/courses/$courseId"
          >
            Manage course
          </Link>
        </div>
      </section>

      <section className="two-column-layout">
        <div className="sidebar-stack">
          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Customer</p>
              <h3>{order.attendeeName}</h3>
            </div>
            <dl className="booking-facts">
              <div>
                <dt>Email</dt>
                <dd>{order.attendeeEmail}</dd>
              </div>
              <div>
                <dt>Course</dt>
                <dd>{order.courseTitle}</dd>
              </div>
              <div>
                <dt>Ordered</dt>
                <dd>{formatEventDateTime(order.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Enrollment</p>
              <h3>Registration created from this order</h3>
            </div>
            {enrollment ? (
              <div className="enrollment-list">
                <article className="enrollment-row">
                  <div>
                    <h4>{enrollment.learnerName}</h4>
                    <p className="muted-copy">{enrollment.learnerEmail}</p>
                  </div>
                  <div className="enrollment-progress">
                    <strong>{enrollment.status}</strong>
                    <span>{formatEventDateTime(enrollment.enrolledAt)}</span>
                  </div>
                </article>
              </div>
            ) : (
              <p className="muted-copy">
                This order does not have an active linked enrollment.
              </p>
            )}
          </section>
        </div>

        <div className="sidebar-stack">
          <section className="panel booking-panel">
            <div className="section-intro">
              <p className="eyebrow">Payment</p>
              <h3>{formatCurrency(order.amount)}</h3>
            </div>
            <dl className="booking-facts">
              <div>
                <dt>Order status</dt>
                <dd>{order.status}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{order.paymentStatus}</dd>
              </div>
              <div>
                <dt>Currency</dt>
                <dd>{order.currency}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Timeline</p>
              <h3>Order lifecycle</h3>
            </div>
            <div className="ticket-stack">
              <article className="ticket-card">
                <p className="ticket-number">Created</p>
                <h4>{formatEventDateTime(order.createdAt)}</h4>
                <p className="muted-copy">
                  Order and enrollment were recorded for this attendee.
                </p>
              </article>
              <article className="ticket-card">
                <p className="ticket-number">Updated</p>
                <h4>{formatEventDateTime(order.updatedAt)}</h4>
                <p className="muted-copy">
                  Latest operational update for this order record.
                </p>
              </article>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
