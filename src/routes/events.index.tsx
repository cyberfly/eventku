import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { EventCard } from '@/components/event-card'

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

      <div className="event-grid">
        {events.map((event) => (
          <EventCard key={event.slug} {...event} />
        ))}
      </div>
    </div>
  )
}
