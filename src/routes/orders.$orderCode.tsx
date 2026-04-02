import type { CSSProperties } from 'react'

import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { MediaPlaceholder } from '@/components/media-placeholder'
import { formatCurrency, formatEventDateTime } from '@/lib/format'

const getOrderByCodeFn = createServerFn({ method: 'GET' })
  .inputValidator((input: { orderCode: string }) => input)
  .handler(async ({ data }) => {
    const { getOrderByCode } = await import('@/server/lms')

    return getOrderByCode(data.orderCode)
  })

export const Route = createFileRoute('/orders/$orderCode')({
  component: OrderConfirmationPage,
  loader: async ({ params }) => {
    const result = await getOrderByCodeFn({ data: { orderCode: params.orderCode } })

    if (!result) {
      throw notFound()
    }

    return result
  },
})

function OrderConfirmationPage() {
  const { order, event } = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section
        className="detail-hero panel"
        style={event ? ({ '--course-accent': event.accent } as CSSProperties) : undefined}
      >
        <div className="detail-hero-layout">
          <div>
            <p className="eyebrow">Order Confirmed</p>
            <h2>{event?.title ?? 'Your registration is confirmed'}</h2>
            <p className="detail-note">
              Reference {order.orderNumber} — a seat has been reserved for {order.attendeeName}.
            </p>
          </div>
          {event ? (
            <MediaPlaceholder
              accent={event.accent}
              eyebrow={event.category}
              meta={`${event.city} • ${event.organizerName}`}
              title={event.title}
              variant="hero"
            />
          ) : null}
        </div>
        {event ? (
          <dl className="detail-stats">
            <div>
              <dt>Starts</dt>
              <dd>{formatEventDateTime(event.startAt)}</dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{event.city}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>{event.format}</dd>
            </div>
            <div>
              <dt>Amount paid</dt>
              <dd>{formatCurrency(order.priceAtPurchase)}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="two-column-layout">
        <section className="panel">
          <div className="section-intro">
            <p className="eyebrow">Order Details</p>
            <h3>Registration summary</h3>
          </div>
          <dl className="booking-facts">
            <div>
              <dt>Order number</dt>
              <dd>{order.orderNumber}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd style={{ textTransform: 'capitalize' }}>{order.status}</dd>
            </div>
            <div>
              <dt>Purchased</dt>
              <dd>{formatEventDateTime(order.createdAt)}</dd>
            </div>
          </dl>
          <dl className="booking-facts" style={{ marginTop: '18px' }}>
            <div>
              <dt>Attendee name</dt>
              <dd>{order.attendeeName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{order.attendeeEmail}</dd>
            </div>
            <div>
              <dt>Amount paid</dt>
              <dd>{formatCurrency(order.priceAtPurchase)}</dd>
            </div>
          </dl>
        </section>

        <div className="sidebar-stack">
          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Next Steps</p>
              <h3>What to do now</h3>
            </div>
            <ul className="detail-list">
              <li>Check your inbox — a confirmation has been noted under reference {order.orderNumber}.</li>
              <li>Save the event date and add it to your calendar before it fills up.</li>
              <li>Share the event page with colleagues who may also benefit.</li>
            </ul>
          </section>

          <section className="panel">
            <div className="hero-actions">
              {event ? (
                <Link
                  className="primary-link"
                  params={{ eventSlug: event.slug }}
                  to="/events/$eventSlug"
                >
                  Back to event
                </Link>
              ) : null}
              <Link
                className="ghost-link"
                search={{ email: order.attendeeEmail }}
                to="/orders"
              >
                View all my orders
              </Link>
              <Link className="ghost-link" to="/events">
                Browse more events
              </Link>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
