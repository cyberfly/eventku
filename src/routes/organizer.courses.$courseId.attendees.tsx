import { useMemo, useState } from 'react'

import {
  Link,
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from '@tanstack/react-router'

import {
  cancelAttendeeFn,
  getOrganizerCourseAttendeesFn,
  getOrganizerSessionFn,
  checkInAttendeeFn,
} from '@/lib/organizer-server-fns'
import { formatEventDateTime } from '@/lib/format'

const statusFilterOptions = ['All', 'Confirmed', 'Checked-in', 'Active', 'Completed', 'At Risk'] as const

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) {
    return
  }

  const headers = Object.keys(rows[0])
  const escapeCell = (value: string | number) => {
    const text = String(value)

    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const Route = createFileRoute('/organizer/courses/$courseId/attendees')({
  component: OrganizerAttendeesPage,
  loader: async ({ params }) => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    try {
      return await getOrganizerCourseAttendeesFn({
        data: { courseId: Number(params.courseId) },
      })
    } catch {
      throw notFound()
    }
  },
})

function OrganizerAttendeesPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [attendees, setAttendees] = useState(data.attendees)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilterOptions)[number]>('All')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const filteredAttendees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return attendees.filter((attendee) => {
      const matchesStatus = statusFilter === 'All' || attendee.status === statusFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        attendee.learnerName.toLowerCase().includes(normalizedSearch) ||
        attendee.learnerEmail.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [attendees, searchTerm, statusFilter])

  async function handleCheckIn(attendeeId: number) {
    setErrorMessage(null)
    setPendingId(attendeeId)

    try {
      await checkInAttendeeFn({ data: { attendeeId, courseId: data.course.id } })
      setAttendees((current) =>
        current.map((attendee) =>
          attendee.id === attendeeId ? { ...attendee, status: 'Checked-in' } : attendee,
        ),
      )
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to check in attendee.')
    } finally {
      setPendingId(null)
    }
  }

  async function handleCancel(attendeeId: number) {
    if (!window.confirm('Cancel this registration? This will free up the seat.')) {
      return
    }

    setErrorMessage(null)
    setPendingId(attendeeId)

    try {
      await cancelAttendeeFn({ data: { attendeeId, courseId: data.course.id } })
      setAttendees((current) => current.filter((attendee) => attendee.id !== attendeeId))
      await router.invalidate()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to cancel registration.')
    } finally {
      setPendingId(null)
    }
  }

  function handleExport() {
    downloadCsv(
      `${data.course.slug}-attendees.csv`,
      filteredAttendees.map((attendee) => ({
        name: attendee.learnerName,
        email: attendee.learnerEmail,
        status: attendee.status,
        registeredAt: attendee.enrolledAt,
      })),
    )
  }

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Attendees</p>
          <h2>{data.course.title}</h2>
          <p className="muted-copy">
            Search, check in, and manage everyone registered for this event.
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
        </div>
      </section>

      <section className="panel">
        <div className="section-intro">
          <p className="eyebrow">{filteredAttendees.length} of {attendees.length} attendees</p>
          <h3>Registration list</h3>
        </div>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <div className="attendee-toolbar">
          <input
            aria-label="Search attendees"
            className="attendee-search"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name or email"
            type="search"
            value={searchTerm}
          />
          <select
            aria-label="Filter by status"
            onChange={(event) =>
              setStatusFilter(event.target.value as (typeof statusFilterOptions)[number])
            }
            value={statusFilter}
          >
            {statusFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            className="ghost-button"
            disabled={filteredAttendees.length === 0}
            onClick={handleExport}
            type="button"
          >
            Export CSV
          </button>
        </div>

        {filteredAttendees.length === 0 ? (
          <p className="muted-copy">No attendees match your search.</p>
        ) : (
          <div className="support-list panel">
            {filteredAttendees.map((attendee) => (
              <article className="support-row attendee-row" key={attendee.id}>
                <div>
                  <h4>{attendee.learnerName}</h4>
                  <p className="muted-copy">{attendee.learnerEmail}</p>
                  <p className="muted-copy">
                    Registered {formatEventDateTime(attendee.enrolledAt)}
                  </p>
                </div>
                <div className="attendee-row-side">
                  <span className="pill">{attendee.status}</span>
                  <div className="hero-actions">
                    {attendee.status !== 'Checked-in' ? (
                      <button
                        className="ghost-button"
                        disabled={pendingId === attendee.id}
                        onClick={() => handleCheckIn(attendee.id)}
                        type="button"
                      >
                        Check in
                      </button>
                    ) : null}
                    <button
                      className="ghost-button danger-button"
                      disabled={pendingId === attendee.id}
                      onClick={() => handleCancel(attendee.id)}
                      type="button"
                    >
                      Cancel
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
