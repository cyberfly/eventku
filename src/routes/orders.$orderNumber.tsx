import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { getOrderByNumberFn } from '@/lib/order-server-fns'
import { formatCurrency, formatEventDateTime } from '@/lib/format'

export const Route = createFileRoute('/orders/$orderNumber')({
  component: OrderConfirmationPage,
  loader: async ({ params }) => {
    const result = await getOrderByNumberFn({
      data: { orderNumber: params.orderNumber },
    })

    if (!result) {
      throw notFound()
    }

    return result
  },
})

function OrderConfirmationPage() {
  const { event, order } = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">Order Confirmation</p>
          <h2>{order.orderNumber}</h2>
        </div>
        <dl className="detail-stats">
          <div>
            <dt>Status</dt>
            <dd>{order.status}</dd>
          </div>
          <div>
            <dt>Amount paid</dt>
            <dd>{formatCurrency(order.amount)}</dd>
          </div>
          <div>
            <dt>Attendee</dt>
            <dd>{order.attendeeName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{order.attendeeEmail}</dd>
          </div>
        </dl>
      </section>

      {event ? (
        <section className="panel">
          <div className="section-intro">
            <p className="eyebrow">Event</p>
            <h3>{event.title}</h3>
          </div>
          <dl className="detail-stats">
            <div>
              <dt>Starts</dt>
              <dd>{formatEventDateTime(event.startAt)}</dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{event.venue}</dd>
            </div>
            <div>
              <dt>City</dt>
              <dd>{event.city}</dd>
            </div>
            <div>
              <dt>Host</dt>
              <dd>{event.organizerName}</dd>
            </div>
          </dl>
          <Link className="ghost-link" params={{ eventSlug: event.slug }} to="/events/$eventSlug">
            View event page
          </Link>
        </section>
      ) : null}
    </div>
  )
}
