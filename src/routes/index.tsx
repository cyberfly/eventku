import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { EventCard } from '@/components/event-card'
import { MediaPlaceholder } from '@/components/media-placeholder'
import { MetricCard } from '@/components/metric-card'
import { formatCurrency, formatEventDateTime } from '@/lib/format'

const getMarketplaceOverview = createServerFn({ method: 'GET' }).handler(async () => {
  const { getMarketplaceOverview } = await import('@/server/lms')

  return getMarketplaceOverview()
})

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => getMarketplaceOverview(),
})

function Home() {
  const data = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="hero panel">
        <div>
          <p className="eyebrow">Event Marketplace</p>
          <h2>Browse seminars, open the event, and purchase your seat.</h2>
          <p className="hero-copy">
            Eventku is now positioned like an Eventbrite-style training marketplace:
            visitors discover upcoming seminars, compare formats and pricing, and
            register from the event detail page.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-link" to="/events">
            Explore events
          </Link>
          <Link className="ghost-link" params={{ eventSlug: data.spotlightEvents[0]?.slug ?? 'ops-foundations' }} to="/events/$eventSlug">
            View featured event
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="section-grid">
        <div className="section-intro">
          <p className="eyebrow">Featured Events</p>
          <h3>Upcoming seminars with the strongest booking momentum</h3>
        </div>
        <div className="event-grid">
          {data.spotlightEvents.map((event) => (
            <EventCard key={event.slug} {...event} />
          ))}
        </div>
      </section>

      <section className="section-grid">
        <div className="section-intro">
          <p className="eyebrow">Coming Up</p>
          <h3>Next event windows visitors can book right now</h3>
        </div>
          <div className="support-list panel">
          {data.upcomingMoments.map((event) => (
            <article className="support-row" key={event.slug}>
              <div className="support-row-main">
                <MediaPlaceholder
                  accent={event.accent}
                  eyebrow={event.category}
                  imageUrl={event.featuredImage}
                  meta={`${event.format} • ${event.city}`}
                  title={event.title}
                  variant="row"
                />
                <div>
                  <p className="support-ticket">{event.category}</p>
                  <h4>
                    <Link className="event-title-link" params={{ eventSlug: event.slug }} to="/events/$eventSlug">
                      {event.title}
                    </Link>
                  </h4>
                  <p className="muted-copy">{event.venue}</p>
                </div>
              </div>
              <dl className="support-meta">
                <div>
                  <dt>Starts</dt>
                  <dd>{formatEventDateTime(event.startAt)}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{event.format}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{formatCurrency(event.price)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
