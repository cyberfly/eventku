import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { getAttendeesListFn } from '@/lib/attendees-server-fns'
import { getOrganizerSessionFn } from '@/lib/organizer-server-fns'

const searchSchema = z.object({
  courseId: z.coerce.number().int().positive().optional(),
})

export const Route = createFileRoute('/organizer/attendees/')({
  component: OrganizerAttendeesPage,
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => ({ courseId: search.courseId }),
  loader: async ({ deps }) => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    return getAttendeesListFn({ data: { courseId: deps.courseId } })
  },
})

function OrganizerAttendeesPage() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()

  const activeCourse = search.courseId
    ? data.courses.find((course) => course.id === search.courseId)
    : null

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Organizer</p>
          <h2>Attendees</h2>
          <p className="muted-copy">
            View and manage enrollments across all your courses. Filter by course
            to narrow the list.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-link" to="/organizer">
            Back to dashboard
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

      {data.courses.length > 1 ? (
        <section className="panel">
          <div className="section-intro">
            <p className="eyebrow">Filter</p>
            <h3>By course</h3>
          </div>
          <div className="hero-actions">
            <button
              className={activeCourse ? 'ghost-button' : 'primary-button'}
              onClick={() => navigate({ to: '/organizer/attendees', search: {} })}
              type="button"
            >
              All courses
            </button>
            {data.courses.map((course) => (
              <button
                className={
                  activeCourse?.id === course.id ? 'primary-button' : 'ghost-button'
                }
                key={course.id}
                onClick={() =>
                  navigate({
                    to: '/organizer/attendees',
                    search: { courseId: course.id },
                  })
                }
                type="button"
              >
                {course.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">
            {activeCourse ? activeCourse.title : 'All courses'}
          </p>
          <h3>
            {data.attendees.length === 0
              ? 'No attendees yet'
              : `${data.attendees.length} attendee${data.attendees.length === 1 ? '' : 's'}`}
          </h3>
        </div>

        {data.attendees.length === 0 ? (
          <p className="muted-copy">
            No enrollments found
            {activeCourse ? ` for ${activeCourse.title}` : ''}.
          </p>
        ) : (
          <div className="enrollment-list">
            {data.attendees.map((attendee) => (
              <article className="enrollment-row" key={attendee.id}>
                <div>
                  <h4>{attendee.learnerName}</h4>
                  <p className="muted-copy">{attendee.learnerEmail}</p>
                  {!activeCourse ? (
                    <p className="event-card-category">{attendee.courseTitle}</p>
                  ) : null}
                </div>
                <div className="enrollment-progress">
                  <strong>{attendee.progress}%</strong>
                  <span className="pill">{attendee.status}</span>
                  <Link
                    className="ghost-link"
                    params={{ enrollmentId: String(attendee.id) }}
                    to="/organizer/attendees/$enrollmentId"
                  >
                    Manage
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
