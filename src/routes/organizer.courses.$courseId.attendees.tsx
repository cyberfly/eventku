import { useState } from 'react'

import { Link, createFileRoute, notFound, redirect } from '@tanstack/react-router'

import { formatEventDate, getInitials } from '@/lib/format'
import { enrollmentStatusOptions } from '@/lib/organizer'
import {
  getOrganizerCourseAttendeesFn,
  getOrganizerSessionFn,
} from '@/lib/organizer-server-fns'

export const Route = createFileRoute('/organizer/courses/$courseId/attendees')({
  component: OrganizerCourseAttendeesPage,
  loader: async ({ params }) => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    const data = await getOrganizerCourseAttendeesFn({
      data: {
        courseId: Number(params.courseId),
      },
    })

    if (!data) {
      throw notFound()
    }

    return data
  },
})

const STATUS_OPTIONS = ['All', ...enrollmentStatusOptions] as const

const STATUS_CLASS: Record<string, string> = {
  'Active': 'status-active',
  'At Risk': 'status-at-risk',
  'Completed': 'status-completed',
}

function OrganizerCourseAttendeesPage() {
  const data = Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>(
    'All',
  )

  const filtered = data.attendees.filter((attendee) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      query === '' ||
      attendee.learnerName.toLowerCase().includes(query) ||
      attendee.learnerEmail.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'All' || attendee.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Attendees</p>
          <h2>{data.course.title}</h2>
          <p className="muted-copy">
            All registered attendees for this event. Search by name or email, or
            filter by enrollment status.
          </p>
        </div>
        <div className="hero-actions">
          <Link
            className="ghost-link"
            params={{ courseId: String(data.course.id) }}
            to="/organizer/courses/$courseId"
          >
            Back to course
          </Link>
          <Link className="ghost-link" to="/organizer">
            Dashboard
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <p>Total</p>
          <strong>{data.stats.total}</strong>
        </article>
        <article className="metric-card">
          <p>Active</p>
          <strong>{data.stats.active}</strong>
        </article>
        <article className="metric-card">
          <p>At Risk</p>
          <strong>{data.stats.atRisk}</strong>
        </article>
        <article className="metric-card">
          <p>Completed</p>
          <strong>{data.stats.completed}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="attendee-filter-bar">
          <input
            className="attendee-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email..."
            type="search"
            value={search}
          />
          <select
            className="attendee-status-select"
            onChange={(event) =>
              setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])
            }
            value={statusFilter}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : option}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="muted-copy attendee-empty">
            {data.attendees.length === 0
              ? 'No attendees have registered yet.'
              : 'No attendees match the current filter.'}
          </p>
        ) : (
          <div className="attendee-list">
            {filtered.map((attendee) => (
              <article className="attendee-row" key={attendee.id}>
                <div
                  className="attendee-avatar"
                  style={{ '--attendee-accent': data.course.accent } as React.CSSProperties}
                >
                  {getInitials(attendee.learnerName)}
                </div>
                <div className="attendee-info">
                  <h4>{attendee.learnerName}</h4>
                  <p className="muted-copy">{attendee.learnerEmail}</p>
                </div>
                <div className="attendee-progress-col">
                  <div className="attendee-progress-bar">
                    <div
                      className="attendee-progress-fill"
                      style={{ width: `${attendee.progress}%` }}
                    />
                  </div>
                  <span className="muted-copy">{attendee.progress}%</span>
                </div>
                <div className="attendee-meta">
                  <span
                    className={`pill attendee-status ${STATUS_CLASS[attendee.status] ?? ''}`}
                  >
                    {attendee.status}
                  </span>
                  <p className="muted-copy attendee-date">
                    {formatEventDate(attendee.enrolledAt)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
