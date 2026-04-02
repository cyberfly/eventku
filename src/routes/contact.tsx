import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contact')({
  component: Contact,
})

function Contact() {
  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">Contact</p>
        <h2>Get In Touch</h2>
        <p>Have questions about an event? Reach out and we'll get back to you.</p>
      </section>
    </div>
  )
}
