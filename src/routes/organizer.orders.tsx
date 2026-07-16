import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import { formatCurrency, formatEventDateTime } from '@/lib/format'
import { getOrganizerSessionFn } from '@/lib/organizer-server-fns'
import { listOrganizerOrdersFn } from '@/lib/orders-server-fns'

export const Route = createFileRoute('/organizer/orders')({
  component: OrganizerOrdersPage,
  loader: async () => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    return listOrganizerOrdersFn()
  },
})

function OrganizerOrdersPage() {
  const data = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Orders</p>
          <h2>Purchases across your events</h2>
          <p className="muted-copy">
            Every confirmed seat purchase for your published events, with the buyer
            contact and confirmation reference.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-link" to="/organizer">
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <p>Orders</p>
          <strong>{data.summary.orderCount}</strong>
        </article>
        <article className="metric-card">
          <p>Revenue</p>
          <strong>{formatCurrency(data.summary.totalRevenue)}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">Order History</p>
          <h3>Most recent purchases first</h3>
        </div>

        {data.orders.length === 0 ? (
          <p className="muted-copy">
            No orders yet. Orders appear here as soon as someone purchases a seat for
            one of your events.
          </p>
        ) : (
          <div className="support-list">
            {data.orders.map((order) => (
              <article className="support-row" key={order.id}>
                <div className="support-row-main">
                  <div>
                    <p className="support-ticket">
                      {order.confirmationCode} · {order.status}
                    </p>
                    <h4>{order.buyerName}</h4>
                    <p className="muted-copy">{order.buyerEmail}</p>
                  </div>
                </div>
                <dl className="support-meta">
                  <div>
                    <dt>Event</dt>
                    <dd>{order.course?.title ?? 'Removed event'}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>{formatCurrency(order.amount)}</dd>
                  </div>
                  <div>
                    <dt>Purchased</dt>
                    <dd>{formatEventDateTime(order.createdAt)}</dd>
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
