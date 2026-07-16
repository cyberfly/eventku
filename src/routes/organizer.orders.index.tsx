import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { formatCurrency, formatEventDateTime } from '@/lib/format'
import {
  getOrganizerOrdersFn,
  getOrganizerSessionFn,
} from '@/lib/organizer-server-fns'

export const Route = createFileRoute('/organizer/orders/')({
  component: OrganizerOrdersPage,
  loader: async () => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    return getOrganizerOrdersFn()
  },
})

function OrganizerOrdersPage() {
  const data = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Orders</p>
          <h2>Track customer purchases and revenue</h2>
          <p className="muted-copy">
            Every public seat purchase creates an order record and a linked
            attendee enrollment for the selected event.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-link" to="/organizer">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        {data.metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">Order Queue</p>
          <h3>Recent purchase activity</h3>
        </div>

        {data.orders.length === 0 ? (
          <p className="muted-copy">
            No orders yet. Orders will appear here after visitors purchase event seats.
          </p>
        ) : (
          <div className="support-list">
            {data.orders.map((order) => (
              <article className="support-row" key={order.id}>
                <div className="support-row-main">
                  <div className="order-avatar">
                    {order.attendeeName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="support-ticket">{order.orderNumber}</p>
                    <h4>{order.attendeeName}</h4>
                    <p className="muted-copy">
                      {order.attendeeEmail} ordered{' '}
                      {order.course?.title ?? 'an archived course'}.
                    </p>
                  </div>
                </div>
                <div className="organizer-course-side">
                  <dl className="support-meta organizer-course-meta">
                    <div>
                      <dt>Total</dt>
                      <dd>{formatCurrency(order.amount)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>{order.status}</dd>
                    </div>
                    <div>
                      <dt>Ordered</dt>
                      <dd>{formatEventDateTime(order.createdAt)}</dd>
                    </div>
                  </dl>
                  <Link
                    className="ghost-link"
                    params={{ orderId: String(order.id) }}
                    to="/organizer/orders/$orderId"
                  >
                    View order
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
