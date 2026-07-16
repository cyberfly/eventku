import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { getOrganizerOrdersFn } from '@/lib/orders-server-fns'
import { getOrganizerSessionFn } from '@/lib/organizer-server-fns'
import { formatCurrency, formatEventDateTime } from '@/lib/format'

export const Route = createFileRoute('/organizer/orders')({
  component: OrganizerOrdersPage,
  loader: async () => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    return getOrganizerOrdersFn()
  },
})

function statusPill(status: string) {
  return <span className={`pill pill--${status}`}>{status}</span>
}

function OrganizerOrdersPage() {
  const { orders, metrics } = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Organizer</p>
          <h2>Orders</h2>
          <p className="muted-copy">
            All purchase records for your events. Each confirmed order maps to an
            attendee enrollment.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-link" to="/organizer/">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">All Orders</p>
          <h3>{orders.length} purchase records</h3>
        </div>

        {orders.length === 0 ? (
          <p className="muted-copy">
            No orders yet. Orders appear here once a purchase is completed.
          </p>
        ) : (
          <div className="support-list">
            {orders.map((order) => (
              <article className="support-row" key={order.id}>
                <div className="support-row-main">
                  <div>
                    <p className="support-ticket">{order.orderNumber}</p>
                    <h4>{order.attendeeName}</h4>
                    <p className="muted-copy">{order.attendeeEmail}</p>
                  </div>
                </div>
                <dl className="support-meta">
                  <div>
                    <dt>Event</dt>
                    <dd>{order.courseTitle}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>{formatCurrency(order.amountPaid)}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{formatEventDateTime(order.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{statusPill(order.status)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
