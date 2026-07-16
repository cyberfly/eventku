import { useState } from 'react'

import { Link, createFileRoute, notFound, redirect, useRouter } from '@tanstack/react-router'

import { attendeeStatusOptions } from '@/lib/attendees'
import {
  getAttendeeDetailFn,
  updateAttendeeStatusFn,
} from '@/lib/attendees-server-fns'
import { getOrganizerSessionFn } from '@/lib/organizer-server-fns'

export const Route = createFileRoute('/organizer/attendees/$enrollmentId')({
  component: OrganizerAttendeeDetailPage,
  loader: async ({ params }) => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    const attendee = await getAttendeeDetailFn({
      data: { enrollmentId: Number(params.enrollmentId) },
    })

    if (!attendee) {
      throw notFound()
    }

    return attendee
  },
})

function OrganizerAttendeeDetailPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<(typeof attendeeStatusOptions)[number]>(
    data.status as (typeof attendeeStatusOptions)[number],
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const enrolledDate = new Date(data.enrolledAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  async function handleStatusUpdate(event: React.FormEvent) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      await updateAttendeeStatusFn({
        data: {
          enrollmentId: data.enrollmentId,
          status: selectedStatus,
        },
      })
      setSuccessMessage(`Status updated to ${selectedStatus}.`)
      await router.invalidate()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to update status.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Attendee</p>
          <h2>{data.learnerName}</h2>
          <p className="muted-copy">{data.learnerEmail}</p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-link" to="/organizer/attendees">
            Back to attendees
          </Link>
          <Link
            className="ghost-link"
            params={{ courseId: String(data.courseId) }}
            to="/organizer/courses/$courseId"
          >
            View course
          </Link>
        </div>
      </section>

      <section className="two-column-layout">
        <div className="sidebar-stack">
          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Enrollment details</p>
              <h3>Progress and status</h3>
            </div>
            <dl className="booking-facts">
              <div>
                <dt>Progress</dt>
                <dd>{data.progress}%</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{data.status}</dd>
              </div>
              <div>
                <dt>Enrolled</dt>
                <dd>{enrolledDate}</dd>
              </div>
              <div>
                <dt>Course</dt>
                <dd>{data.courseTitle}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="sidebar-stack">
          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Manage</p>
              <h3>Update status</h3>
            </div>
            <form className="course-form" onSubmit={handleStatusUpdate}>
              <label>
                Status
                <select
                  disabled={isSubmitting}
                  onChange={(event) =>
                    setSelectedStatus(
                      event.target.value as (typeof attendeeStatusOptions)[number],
                    )
                  }
                  value={selectedStatus}
                >
                  {attendeeStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {errorMessage ? (
                <p className="form-error">{errorMessage}</p>
              ) : null}
              {successMessage ? (
                <p className="form-success">{successMessage}</p>
              ) : null}

              <button
                className="primary-button"
                disabled={isSubmitting || selectedStatus === data.status}
                type="submit"
              >
                {isSubmitting ? 'Saving...' : 'Save status'}
              </button>
            </form>
          </section>
        </div>
      </section>
    </div>
  )
}
