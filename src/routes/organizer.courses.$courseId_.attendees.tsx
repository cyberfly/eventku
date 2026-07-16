import { useMemo, useState } from 'react'

import { Link, createFileRoute, notFound, redirect, useRouter } from '@tanstack/react-router'

import { attendeeStatusOptions } from '@/lib/organizer'
import type { AttendeeStatus } from '@/lib/organizer'
import { formatEventDateTime } from '@/lib/format'
import {
  getOrganizerCourseAttendeesFn,
  getOrganizerSessionFn,
  removeAttendeeFn,
  updateAttendeeStatusFn,
} from '@/lib/organizer-server-fns'

export const Route = createFileRoute('/organizer/courses/$courseId_/attendees')({
  component: OrganizerAttendeesPage,
  loader: async ({ params }) => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    const courseId = Number(params.courseId)

    try {
      return await getOrganizerCourseAttendeesFn({ data: { courseId } })
    } catch {
      throw notFound()
    }
  },
})

function downloadAttendeesCsv(
  courseTitle: string,
  attendees: Array<{
    learnerName: string
    learnerEmail: string
    status: string
    enrolledAt: string
  }>,
) {
  const header = ['Name', 'Email', 'Status', 'Registered at']
  const rows = attendees.map((attendee) => [
    attendee.learnerName,
    attendee.learnerEmail,
    attendee.status,
    attendee.enrolledAt,
  ])
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-attendees.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function OrganizerAttendeesPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttendeeStatus | 'All'>('All')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingEnrollmentId, setPendingEnrollmentId] = useState<number | null>(null)

  const filteredAttendees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return data.attendees.filter((attendee) => {
      const matchesStatus = statusFilter === 'All' || attendee.status === statusFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        attendee.learnerName.toLowerCase().includes(normalizedSearch) ||
        attendee.learnerEmail.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [data.attendees, searchTerm, statusFilter])

  async function handleStatusChange(enrollmentId: number, status: AttendeeStatus) {
    setErrorMessage(null)
    setPendingEnrollmentId(enrollmentId)

    try {
      await updateAttendeeStatusFn({
        data: { courseId: data.course.id, enrollmentId, status },
      })
      await router.invalidate()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to update attendee status.',
      )
    } finally {
      setPendingEnrollmentId(null)
    }
  }

  async function handleRemove(enrollmentId: number) {
    setErrorMessage(null)
    setPendingEnrollmentId(enrollmentId)

    try {
      await removeAttendeeFn({ data: { courseId: data.course.id, enrollmentId } })
      await router.invalidate()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to remove attendee.',
      )
    } finally {
      setPendingEnrollmentId(null)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Manage Attendees</p>
          <h2>{data.course.title}</h2>
          <p className="muted-copy">
            Search, update status, and export the attendee list for this event.
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
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <p>Total attendees</p>
          <strong>{data.stats.total}</strong>
        </article>
        <article className="metric-card">
          <p>Seats remaining</p>
          <strong>{data.stats.seatsRemaining}</strong>
        </article>
        <article className="metric-card">
          <p>Seat capacity</p>
          <strong>{data.course.seatCap}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">Attendees</p>
          <h3>Registered for this event</h3>
        </div>

        <div className="attendee-toolbar">
          <input
            className="attendee-search"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name or email"
            type="search"
            value={searchTerm}
          />
          <select
            onChange={(event) =>
              setStatusFilter(event.target.value as AttendeeStatus | 'All')
            }
            value={statusFilter}
          >
            <option value="All">All statuses</option>
            {attendeeStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            className="ghost-button"
            disabled={filteredAttendees.length === 0}
            onClick={() => downloadAttendeesCsv(data.course.title, filteredAttendees)}
            type="button"
          >
            Export CSV
          </button>
        </div>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        {data.attendees.length === 0 ? (
          <p className="muted-copy">No attendees have registered yet.</p>
        ) : filteredAttendees.length === 0 ? (
          <p className="muted-copy">No attendees match your search.</p>
        ) : (
          <div className="support-list">
            {filteredAttendees.map((attendee) => (
              <article className="support-row attendee-row" key={attendee.id}>
                <div>
                  <h4>{attendee.learnerName}</h4>
                  <p className="muted-copy">{attendee.learnerEmail}</p>
                  <p className="muted-copy">
                    Registered {formatEventDateTime(attendee.enrolledAt)}
                  </p>
                </div>
                <div className="attendee-actions">
                  <span className="pill">{attendee.status}</span>
                  <div className="attendee-status-buttons">
                    {attendeeStatusOptions
                      .filter((status) => status !== attendee.status)
                      .map((status) => (
                        <button
                          className="ghost-button"
                          disabled={pendingEnrollmentId === attendee.id}
                          key={status}
                          onClick={() => handleStatusChange(attendee.id, status)}
                          type="button"
                        >
                          Mark {status}
                        </button>
                      ))}
                    <button
                      className="ghost-button"
                      disabled={pendingEnrollmentId === attendee.id}
                      onClick={() => handleRemove(attendee.id)}
                      type="button"
                    >
                      Remove
                    </button>
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
