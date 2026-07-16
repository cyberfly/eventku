import { Link, createFileRoute, redirect } from '@tanstack/react-router'

import {
  getOrganizerAttendeesFn,
  getOrganizerSessionFn,
} from '@/lib/organizer-server-fns'
import { formatLongDate } from '@/lib/format'

export const Route = createFileRoute('/organizer/attendees')({
  component: OrganizerAttendeesPage,
  loader: async () => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    return getOrganizerAttendeesFn()
  },
})

function OrganizerAttendeesPage() {
  const data = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Attendees</p>
          <h2>Registration management</h2>
          <p className="muted-copy">
            Review every attendee registered across your Eventku courses, with
            course context, status, and seat usage in one operational view.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-link" to="/organizer">
            Back to dashboard
          </Link>
          <Link className="primary-link" to="/organizer/new">
            Create course
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        {data.metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="two-column-layout">
        <div className="sidebar-stack">
          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Directory</p>
              <h3>All attendees</h3>
            </div>

            {data.attendees.length === 0 ? (
              <p className="muted-copy">
                No attendee registrations yet. Published event purchases will
                appear here.
              </p>
            ) : (
              <div className="attendee-table" role="table" aria-label="Attendees">
                <div className="attendee-table-row attendee-table-head" role="row">
                  <span role="columnheader">Attendee</span>
                  <span role="columnheader">Course</span>
                  <span role="columnheader">Registered</span>
                  <span role="columnheader">Status</span>
                </div>
                {data.attendees.map((attendee) => (
                  <article className="attendee-table-row" key={attendee.id} role="row">
                    <div role="cell">
                      <strong>{attendee.learnerName}</strong>
                      <span>{attendee.learnerEmail}</span>
                    </div>
                    <div role="cell">
                      {attendee.course ? (
                        <Link
                          className="text-link"
                          params={{ courseId: String(attendee.course.id) }}
                          to="/organizer/courses/$courseId"
                        >
                          {attendee.course.title}
                        </Link>
                      ) : (
                        <span>Unassigned course</span>
                      )}
                    </div>
                    <span role="cell">{formatLongDate(attendee.enrolledAt)}</span>
                    <div role="cell">
                      <span className="pill">{attendee.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="sidebar-stack">
          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Courses</p>
              <h3>Seat usage</h3>
            </div>

            {data.courses.length === 0 ? (
              <p className="muted-copy">Create a course before tracking attendees.</p>
            ) : (
              <div className="support-list">
                {data.courses.map((course) => (
                  <article className="support-row compact" key={course.id}>
                    <div>
                      <p className="support-ticket">{course.status}</p>
                      <h4>{course.title}</h4>
                      <p className="muted-copy">
                        {course.attendeeCount} attendees, {course.seatsRemaining}{' '}
                        seats left
                      </p>
                    </div>
                    <Link
                      className="ghost-link"
                      params={{ courseId: String(course.id) }}
                      to="/organizer/courses/$courseId"
                    >
                      Manage
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </div>
  )
}
