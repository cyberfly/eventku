import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/upcoming')({
  component: UpcomingPage,
})

function UpcomingPage() {
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
    </div>
  )
}
