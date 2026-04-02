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
        <p>
          Eventku is a Malaysian event marketplace for discovering and booking live training
          seminars and workshops. We connect knowledge seekers with expert-led programs across
          the country.
        </p>
      </section>

      <section className="section-grid panel">
        <div className="section-intro">
          <p className="eyebrow">Our Mission</p>
          <h3>Making professional learning accessible to everyone</h3>
        </div>
        <p className="muted-copy">
          We believe quality training should be easy to find, easy to book, and worth every
          ringgit. From operations and leadership to technical skills and personal development,
          Eventku curates events that move careers forward.
        </p>
      </section>

      <section className="metrics-grid">
        <div className="panel">
          <p className="eyebrow">Founded</p>
          <p><strong>2023</strong></p>
          <p className="muted-copy">Kuala Lumpur, Malaysia</p>
        </div>
        <div className="panel">
          <p className="eyebrow">Coverage</p>
          <p><strong>Nationwide</strong></p>
          <p className="muted-copy">KL, Selangor, Johor, Penang &amp; more</p>
        </div>
        <div className="panel">
          <p className="eyebrow">Formats</p>
          <p><strong>In-person &amp; Online</strong></p>
          <p className="muted-copy">Full-day seminars, workshops, bootcamps</p>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Contact</p>
        <h3>Get in touch</h3>
        <dl className="support-meta">
          <div>
            <dt>Email</dt>
            <dd>hello@eventku.my</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>+60 3-1234 5678</dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>Level 8, Menara XYZ, Jalan Ampang, 50450 Kuala Lumpur</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
