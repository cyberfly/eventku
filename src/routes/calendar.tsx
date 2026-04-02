import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/calendar')({
  component: Calendar,
})

function Calendar() {
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Calendar</p>
        <h2>Events Calendar</h2>
        <p>Browse upcoming events and workshops by date.</p>
      </section>
    </div>
  )
}
