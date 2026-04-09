import type { CSSProperties } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { formatCurrency, formatEventDate } from '@/lib/format'

const getUpcomingEvents = createServerFn({ method: 'GET' }).handler(async () => {
  const { getEventCatalog } = await import('@/server/lms')

  return getEventCatalog()
})

export const Route = createFileRoute('/upcoming')({
  component: UpcomingPage,
  loader: async () => getUpcomingEvents(),
})

function formatMonthYear(isoDate: string) {
  return new Intl.DateTimeFormat('en-MY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(isoDate))
}

function formatDayNum(isoDate: string) {
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(isoDate))
}

function formatMonthAbbr(isoDate: string) {
  return new Intl.DateTimeFormat('en-MY', {
    month: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(isoDate))
}

function groupByMonth<T extends { startAt: string }>(events: T[]) {
  const groups = new Map<string, T[]>()

  for (const event of events) {
    const key = formatMonthYear(event.startAt)

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups.get(key)!.push(event)
  }

  return [...groups.entries()]
}

function UpcomingPage() {
  const events = Route.useLoaderData()
  const months = groupByMonth(events)

  return (
    <div className="page-stack">
      <section className="section-banner panel">
        <div>
          <p className="eyebrow">Upcoming Events</p>
          <h2>Events scheduled for the near future</h2>
        </div>
        <p className="muted-copy">
          Stay ahead of the schedule — browse events coming up soon and secure your spot early.
        </p>
      </section>

      {months.length === 0 && (
        <p className="muted-copy" style={{ textAlign: 'center', padding: '40px 0' }}>
          No upcoming events scheduled. Check back soon.
        </p>
      )}

      {months.map(([month, monthEvents]) => (
        <section key={month} className="upcoming-month">
          <h3 className="upcoming-month-label">{month}</h3>
          <ol className="upcoming-list">
            {monthEvents.map((event) => (
              <li
                key={event.slug}
                className="upcoming-row panel"
                style={{ '--course-accent': event.accent } as CSSProperties}
              >
                <div className="upcoming-row-date">
                  <strong className="upcoming-date-day">{formatDayNum(event.startAt)}</strong>
                  <span className="upcoming-date-month">{formatMonthAbbr(event.startAt)}</span>
                </div>

                <div className="upcoming-row-body">
                  <div className="upcoming-row-meta">
                    <span className="event-card-category">{event.category}</span>
                    <span className="pill">{event.format}</span>
                  </div>
                  <h4 className="upcoming-row-title">
                    <Link
                      className="event-title-link"
                      params={{ eventSlug: event.slug }}
                      to="/events/$eventSlug"
                    >
                      {event.title}
                    </Link>
                  </h4>
                  <p className="muted-copy upcoming-row-summary">{event.summary}</p>
                  <div className="upcoming-row-details">
                    <span>{formatEventDate(event.startAt)}</span>
                    <span className="upcoming-detail-sep">·</span>
                    <span>{event.city}</span>
                    <span className="upcoming-detail-sep">·</span>
                    <span>{event.seatsRemaining} seats left</span>
                  </div>
                </div>

                <div className="upcoming-row-action">
                  <strong className="upcoming-price">{formatCurrency(event.price)}</strong>
                  <Link
                    className="primary-link"
                    params={{ eventSlug: event.slug }}
                    to="/events/$eventSlug"
                  >
                    View event
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
