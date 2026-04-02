import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">About</p>
        <h2>About Eventku</h2>
        <p>Eventku is an event marketplace for discovering and booking live training seminars and workshops.</p>
      </section>
    </div>
  )
}
