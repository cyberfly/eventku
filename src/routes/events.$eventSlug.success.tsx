import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const getSessionConfirmation = createServerFn({ method: 'GET' })
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data }) => {
    const { getCheckoutSessionForSuccess } = await import('@/server/stripe')
    return getCheckoutSessionForSuccess(data.sessionId)
  })

export const Route = createFileRoute('/events/$eventSlug/success')({
  validateSearch: z.object({ session_id: z.string() }),
  component: SuccessPage,
  loader: async ({ search }) => {
    return getSessionConfirmation({ data: { sessionId: search.session_id } })
  },
})

function SuccessPage() {
  const data = Route.useLoaderData()

  if (!data) {
    return (
      <div className="page-stack">
        <section className="panel">
          <div className="section-intro">
            <p className="eyebrow">Payment Received</p>
            <h2>Confirming your registration...</h2>
          </div>
          <p className="muted-copy">
            Your payment was processed. Your registration is being confirmed — refresh this page in
            a moment to see your confirmation details.
          </p>
          <Link className="ghost-link" to="/events">
            Back to all events
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">Registration Confirmed</p>
          <h2>{data.courseTitle}</h2>
        </div>
        <dl className="booking-facts">
          <div>
            <dt>Confirmation</dt>
            <dd>
              <strong>{data.confirmationCode}</strong>
            </dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>{data.attendeeName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{data.attendeeEmail}</dd>
          </div>
        </dl>
        <p className="muted-copy">Keep your confirmation code as proof of purchase.</p>
        <Link className="ghost-link" to="/events">
          Back to all events
        </Link>
      </section>
    </div>
  )
}
