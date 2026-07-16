import { useState } from 'react'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { formatCurrency, formatEventDateTime } from '@/lib/format'

const getOrdersByEmailFn = createServerFn({ method: 'GET' })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const { getOrdersByEmail } = await import('@/server/lms')

    return getOrdersByEmail(data.email)
  })

const searchSchema = z.object({
  email: z.string().optional(),
})

export const Route = createFileRoute('/orders/')({
  component: OrderLookupPage,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ email: search.email }),
  loader: async ({ deps }) => {
    if (!deps.email) {
      return { orders: [], searched: false }
    }

    const orders = await getOrdersByEmailFn({ data: { email: deps.email } })

    return { orders, searched: true }
  },
})

function OrderLookupPage() {
  const { orders, searched } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [emailInput, setEmailInput] = useState(search.email ?? '')

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">My Orders</p>
          <h2>Look up your registrations</h2>
          <p className="muted-copy">
            Enter the email address you used when purchasing a seat to see your order history.
          </p>
        </div>
        <form
          className="booking-form"
          onSubmit={(e) => {
            e.preventDefault()
            navigate({ to: '/orders', search: { email: emailInput.trim().toLowerCase() } })
          }}
        >
          <label>
            Email address
            <input
              key={search.email ?? ''}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="name@example.com"
              type="email"
              value={emailInput}
            />
          </label>
          <button className="primary-button" type="submit">
            Find orders
          </button>
        </form>
      </section>

      {searched && (
        <section className="panel">
          <div className="section-intro">
            <p className="eyebrow">Results</p>
            <h3>
              {orders.length === 0
                ? 'No orders found'
                : `${orders.length} order${orders.length === 1 ? '' : 's'} found`}
            </h3>
          </div>
          {orders.length === 0 ? (
            <p className="muted-copy">
              No orders were found for this email address. Double-check the address and try again.
            </p>
          ) : (
            <div className="support-list">
              {orders.map((order) => (
                <article className="support-row" key={order.id}>
                  <div>
                    <p className="support-ticket">{order.orderNumber}</p>
                    <h4>{order.eventTitle ?? 'Event no longer available'}</h4>
                    <p className="muted-copy">{formatEventDateTime(order.createdAt)}</p>
                  </div>
                  <dl className="support-meta">
                    <div>
                      <dt>Amount paid</dt>
                      <dd>{formatCurrency(order.priceAtPurchase)}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd style={{ textTransform: 'capitalize' }}>{order.status}</dd>
                    </div>
                    <div>
                      <dt>Details</dt>
                      <dd>
                        <Link
                          className="ghost-link"
                          params={{ orderCode: order.orderNumber }}
                          to="/orders/$orderCode"
                        >
                          View order
                        </Link>
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
