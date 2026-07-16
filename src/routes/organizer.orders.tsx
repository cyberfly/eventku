import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { getOrganizerSessionFn } from '@/lib/organizer-server-fns'
import { getOrganizerOrdersFn } from '@/lib/order-server-fns'
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

function OrganizerOrdersPage() {
  const data = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Organizer Dashboard</p>
          <h2>Orders</h2>
          <p className="muted-copy">
            Every purchase captured across your published events, newest first.
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
          <p className="eyebrow">All orders</p>
          <h3>Purchases across your events</h3>
        </div>

        {data.orders.length === 0 ? (
          <p className="muted-copy">
            No orders yet. Orders appear here as visitors purchase seats on your published events.
          </p>
        ) : (
          <div className="support-list">
            {data.orders.map((order) => (
              <article className="support-row" key={order.id}>
                <div className="support-row-main">
                  <div>
                    <p className="support-ticket">
                      {order.orderNumber} · {order.status}
                    </p>
                    <h4>{order.courseTitle}</h4>
                    <p className="muted-copy">
                      {order.attendeeName} ({order.attendeeEmail})
                    </p>
                  </div>
                </div>
                <div className="organizer-course-side">
                  <dl className="support-meta organizer-course-meta">
                    <div>
                      <dt>Amount</dt>
                      <dd>{formatCurrency(order.amount)}</dd>
                    </div>
                    <div>
                      <dt>Placed</dt>
                      <dd>{formatEventDateTime(order.createdAt)}</dd>
                    </div>
                  </dl>
                  {order.courseSlug ? (
                    <div className="hero-actions">
                      <Link
                        className="ghost-link"
                        params={{ eventSlug: order.courseSlug }}
                        to="/events/$eventSlug"
                      >
                        View event page
                      </Link>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
