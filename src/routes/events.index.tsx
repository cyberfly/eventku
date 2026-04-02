import type { CSSProperties } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { EventCard } from '@/components/event-card'
import { MediaPlaceholder } from '@/components/media-placeholder'
import { formatCurrency, formatEventDate, formatHours } from '@/lib/format'

const getEventCatalog = createServerFn({ method: 'GET' }).handler(async () => {
  const { getEventCatalog } = await import('@/server/lms')

  return getEventCatalog()
})

export const Route = createFileRoute('/events/')({
  component: EventsPage,
  loader: async () => getEventCatalog(),
})

function EventsPage() {
  const events = Route.useLoaderData()
  const featuredEvent = events.find((e) => e.featured)
  const otherEvents = events.filter((e) => !e.featured)

  return (
    <div className="page-stack">
      <section className="section-banner panel">
        <div>
          <p className="eyebrow">Browse Events</p>
          <h2>Training events that visitors can evaluate and book in a few clicks</h2>
        </div>
        <p className="muted-copy">
          Each listing surfaces date, location, format, remaining seats, and pricing so
          the buying path is closer to an event marketplace than an LMS admin tool.
        </p>
      </section>

      {featuredEvent && (
        <article
          className="featured-event panel"
          style={{ '--course-accent': featuredEvent.accent } as CSSProperties}
        >
          <div className="featured-event-layout">
            <div className="featured-event-media">
              <MediaPlaceholder
                accent={featuredEvent.accent}
                eyebrow={featuredEvent.category}
                meta={`${featuredEvent.format} • ${featuredEvent.city}`}
                title={featuredEvent.title}
                variant="hero"
              />
            </div>
            <div className="featured-event-body">
              <div className="featured-event-top">
                <p className="eyebrow">Featured Event</p>
                <span className="pill">{featuredEvent.format}</span>
              </div>
              <p className="event-card-category">{featuredEvent.category}</p>
              <h3>
                <Link
                  className="event-title-link"
                  params={{ eventSlug: featuredEvent.slug }}
                  to="/events/$eventSlug"
                >
                  {featuredEvent.title}
                </Link>
              </h3>
              <p className="muted-copy">{featuredEvent.summary}</p>
              <dl className="stats-grid">
                <div>
                  <dt>Date</dt>
                  <dd>{formatEventDate(featuredEvent.startAt)}</dd>
                </div>
                <div>
                  <dt>Venue</dt>
                  <dd>{featuredEvent.city}</dd>
                </div>
                <div>
                  <dt>Attendees</dt>
                  <dd>{featuredEvent.attendeeCount}</dd>
                </div>
                <div>
                  <dt>Seats left</dt>
                  <dd>{featuredEvent.seatsRemaining}</dd>
                </div>
              </dl>
              <div className="featured-event-footer">
                <div className="event-card-meta">
                  <span>{formatCurrency(featuredEvent.price)}</span>
                  <span>{formatHours(featuredEvent.durationHours)} at {featuredEvent.venue}</span>
                </div>
                <Link
                  className="primary-link"
                  params={{ eventSlug: featuredEvent.slug }}
                  to="/events/$eventSlug"
                >
                  View event
                </Link>
              </div>
            </div>
          </div>
        </article>
      )}

      <div className="event-grid">
        {otherEvents.map((event) => (
          <EventCard key={event.slug} {...event} />
        ))}
      </div>
    </div>
  )
}
