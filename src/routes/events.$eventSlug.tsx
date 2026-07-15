import type { CSSProperties } from 'react'

import { useState } from 'react'

import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { MediaPlaceholder } from '@/components/media-placeholder'
import { registerEventAttendeeInput } from '@/lib/events'
import { formatCurrency, formatEventDateTime, formatHours } from '@/lib/format'

const getEventDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { getEventDetail } = await import('@/server/lms')

    return getEventDetail(data.slug)
  })

const purchaseEventInput = registerEventAttendeeInput.extend({
  slug: z.string().min(1),
})

const purchaseEventAccess = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof purchaseEventInput>) => purchaseEventInput.parse(input))
  .handler(async ({ data }) => {
    const { purchaseEventAccess } = await import('@/server/lms')

    return purchaseEventAccess(data)
  })

export const Route = createFileRoute('/events/$eventSlug')({
  component: EventDetailPage,
  loader: async ({ params }) => {
    const event = await getEventDetail({
      data: {
        slug: params.eventSlug,
      },
    })

    if (!event) {
      throw notFound()
    }

    return event
  },
})

const initialFormState = {
  attendeeEmail: '',
  attendeeName: '',
}

function EventDetailPage() {
  const { agenda, attendeePreview, event } = Route.useLoaderData()
  const router = useRouter()
  const [formState, setFormState] = useState(initialFormState)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="page-stack">
      <section className="detail-hero panel" style={{ '--course-accent': event.accent } as CSSProperties}>
        <div className="detail-hero-layout">
          <div>
            <p className="eyebrow">{event.category}</p>
            <h2>{event.title}</h2>
            <p className="hero-copy">{event.summary}</p>
            <p className="detail-note">{event.heroNote}</p>
          </div>
          <MediaPlaceholder
            accent={event.accent}
            eyebrow={event.format}
            imageUrl={event.featuredImage}
            meta={`${event.city} • ${event.organizerName}`}
            title={event.title}
            variant="hero"
          />
        </div>
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
            <dt>Price</dt>
            <dd>{formatCurrency(event.price)}</dd>
          </div>
        </dl>
      </section>

      <section className="two-column-layout">
        <div className="sidebar-stack">
          <section className="panel detail-content-panel">
            <div className="section-intro">
              <p className="eyebrow">About This Event</p>
              <h3>What visitors should know before purchasing</h3>
            </div>
            <p className="muted-copy">
              {event.summary}
            </p>
            <div className="detail-chip-grid">
              <article className="detail-chip">
                <span className="detail-chip-label">Audience</span>
                <strong>{event.audience}</strong>
              </article>
              <article className="detail-chip">
                <span className="detail-chip-label">Format</span>
                <strong>{event.format}</strong>
              </article>
              <article className="detail-chip">
                <span className="detail-chip-label">Venue</span>
                <strong>{event.venue}</strong>
              </article>
            </div>
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Highlights</p>
              <h3>Why people book this event</h3>
            </div>
            <ul className="detail-list">
              {event.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Agenda</p>
              <h3>{event.moduleCount} segments and {event.lessonCount} session highlights</h3>
            </div>
            <div className="curriculum-stack">
              {agenda.map((module) => (
                <article className="curriculum-module" key={module.id}>
                  <div className="curriculum-head">
                    <div>
                      <p className="curriculum-position">Segment {module.position}</p>
                      <h4>{module.title}</h4>
                    </div>
                    <span className="pill">{formatHours(Math.round(module.durationMinutes / 60))}</span>
                  </div>
                  <p className="muted-copy">{module.summary}</p>
                  <ul className="lesson-list">
                    {module.sessions.map((session) => (
                      <li key={session.id}>
                        <span>{session.title}</span>
                        <span>
                          {session.lessonType}
                          {session.isPreview ? ' • Featured' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="sidebar-stack">
          <section className="panel booking-panel">
            <div className="section-intro">
              <p className="eyebrow">Purchase Access</p>
              <h3>Reserve one attendee seat</h3>
            </div>
            <div className="booking-price-row">
              <strong>{formatCurrency(event.price)}</strong>
              <span>{event.seatsRemaining} seats remaining</span>
            </div>
            <dl className="booking-facts">
              <div>
                <dt>Host</dt>
                <dd>{event.organizerName}</dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>{event.venue}</dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>{formatEventDateTime(event.endAt)}</dd>
              </div>
            </dl>
            <form
              className="booking-form"
              onSubmit={async (eventSubmit) => {
                eventSubmit.preventDefault()
                setErrorMessage(null)
                setSuccessMessage(null)
                setIsSubmitting(true)

                try {
                  const result = await purchaseEventAccess({
                    data: {
                      attendeeEmail: formState.attendeeEmail,
                      attendeeName: formState.attendeeName,
                      slug: event.slug,
                    },
                  })

                  setFormState(initialFormState)
                  setSuccessMessage(`Order confirmed. Reference ${result.confirmationCode}.`)
                  await router.invalidate()
                } catch (error) {
                  setErrorMessage(
                    error instanceof Error ? error.message : 'Unable to complete the purchase.',
                  )
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              <label>
                Full name
                <input
                  onChange={(eventInput) =>
                    setFormState((current) => ({
                      ...current,
                      attendeeName: eventInput.target.value,
                    }))
                  }
                  placeholder="Who is attending?"
                  value={formState.attendeeName}
                />
              </label>
              <label>
                Email address
                <input
                  onChange={(eventInput) =>
                    setFormState((current) => ({
                      ...current,
                      attendeeEmail: eventInput.target.value,
                    }))
                  }
                  placeholder="name@example.com"
                  type="email"
                  value={formState.attendeeEmail}
                />
              </label>
              {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
              {successMessage ? <p className="form-success">{successMessage}</p> : null}
              <button className="primary-button" disabled={isSubmitting || event.seatsRemaining === 0} type="submit">
                {event.seatsRemaining === 0
                  ? 'Sold out'
                  : isSubmitting
                    ? 'Processing purchase...'
                    : 'Purchase seat'}
              </button>
            </form>
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Takeaways</p>
              <h3>What attendees leave with</h3>
            </div>
            <ul className="detail-list">
              {event.takeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel host-panel">
            <div className="host-panel-head">
              <MediaPlaceholder
                accent={event.accent}
                title={event.organizerName}
                variant="avatar"
              />
              <div className="section-intro">
                <p className="eyebrow">Hosted By</p>
                <h3>{event.organizerName}</h3>
              </div>
            </div>
            <p className="muted-copy">{event.hostBio}</p>
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Registered Attendees</p>
              <h3>{event.attendeeCount} confirmed registrations</h3>
            </div>
            <div className="enrollment-list">
              {attendeePreview.map((attendee) => (
                <article className="enrollment-row" key={attendee.id}>
                  <div>
                    <h4>{attendee.learnerName}</h4>
                    <p className="muted-copy">{attendee.learnerEmail}</p>
                  </div>
                  <div className="enrollment-progress">
                    <strong>{attendee.status}</strong>
                    <span>{formatEventDateTime(attendee.enrolledAt)}</span>
                  </div>
                </article>
              ))}
            </div>
            <Link className="ghost-link" to="/events">
              Back to all events
            </Link>
          </section>
        </div>
      </section>
    </div>
  )
}
