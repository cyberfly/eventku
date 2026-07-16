import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import {
  getOrganizerDashboardFn,
  getOrganizerSessionFn,
  logoutOrganizerFn,
} from '@/lib/organizer-server-fns'
import { MediaPlaceholder } from '@/components/media-placeholder'

export const Route = createFileRoute('/organizer/')({
  component: OrganizerDashboardPage,
  loader: async () => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    return getOrganizerDashboardFn()
  },
})

function OrganizerDashboardPage() {
  const navigate = useNavigate()
  const data = Route.useLoaderData()

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Organizer Dashboard</p>
          <h2>{data.organizer.name}</h2>
          <p className="muted-copy">
            Create draft courses, publish live ones, and keep an eye on enrollment
            and curriculum coverage from one place.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-link" to="/organizer/new">
            Create course
          </Link>
          <button
            className="ghost-button"
            onClick={async () => {
              await logoutOrganizerFn()
              await navigate({ to: '/organizer/login' })
            }}
            type="button"
          >
            Logout
          </button>
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

      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">Courses</p>
          <h3>Manage your course catalog</h3>
        </div>

        {data.courses.length === 0 ? (
          <p className="muted-copy">
            No courses yet. Create your first course to start filling the catalog.
          </p>
        ) : (
          <div className="support-list">
            {data.courses.map((course) => (
              <article className="support-row" key={course.id}>
                <div className="support-row-main">
                  <MediaPlaceholder
                    accent={course.accent}
                    eyebrow={course.category}
                    imageUrl={course.featuredImage}
                    meta={course.status}
                    title={course.title}
                    variant="row"
                  />
                  <div>
                    <p className="support-ticket">
                      {course.status} · {course.category}
                    </p>
                    <h4>{course.title}</h4>
                    <p className="muted-copy">{course.summary}</p>
                  </div>
                </div>
                <div className="organizer-course-side">
                  <dl className="support-meta organizer-course-meta">
                    <div>
                      <dt>Enrollments</dt>
                      <dd>{course.enrollmentCount}</dd>
                    </div>
                    <div>
                      <dt>Modules</dt>
                      <dd>{course.moduleCount}</dd>
                    </div>
                    <div>
                      <dt>Seats left</dt>
                      <dd>{course.seatsRemaining}</dd>
                    </div>
                  </dl>
                  <div className="hero-actions">
                    <Link
                      className="ghost-link"
                      params={{ courseId: String(course.id) }}
                      to="/organizer/courses/$courseId"
                    >
                      Manage
                    </Link>
                    <Link
                      className="ghost-link"
                      params={{ courseId: String(course.id) }}
                      to="/organizer/courses/$courseId/attendees"
                    >
                      Attendees
                    </Link>
                    {course.status === 'published' ? (
                      <Link
                        className="ghost-link"
                        params={{ eventSlug: course.slug }}
                        to="/events/$eventSlug"
                      >
                        View public page
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
