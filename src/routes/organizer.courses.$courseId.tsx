import { useState } from 'react'

import {
  Link,
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from '@tanstack/react-router'

import { CourseForm } from '@/components/course-form'
import { MediaPlaceholder } from '@/components/media-placeholder'
import type { OrganizerCourseInput } from '@/lib/organizer'
import {
  getOrganizerCourseDetailFn,
  getOrganizerSessionFn,
  updateOrganizerCourseFn,
} from '@/lib/organizer-server-fns'

function parseStringListOrFallback(value: string) {
  try {
    const parsed = JSON.parse(value)
    const items = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []

    return items.length > 0 ? items : ['']
  } catch {
    return ['']
  }
}

export const Route = createFileRoute('/organizer/courses/$courseId')({
  component: OrganizerCourseDetailPage,
  loader: async ({ params }) => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    const courseDetail = await getOrganizerCourseDetailFn({
      data: {
        courseId: Number(params.courseId),
      },
    })

    if (!courseDetail) {
      throw notFound()
    }

    return courseDetail
  },
})

function OrganizerCourseDetailPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialValues: OrganizerCourseInput = {
    accent: data.course.accent,
    category: data.course.category as OrganizerCourseInput['category'],
    completionRate: data.course.completionRate,
    durationHours: data.course.durationHours,
    instructorName: data.course.instructorName,
    level: data.course.level as OrganizerCourseInput['level'],
    seatCap: data.course.seatCap,
    slug: data.course.slug,
    status: data.course.status as OrganizerCourseInput['status'],
    summary: data.course.summary,
    title: data.course.title,
    price: data.course.price,
    format: data.course.format as OrganizerCourseInput['format'],
    venue: data.course.venue,
    city: data.course.city,
    audience: data.course.audience,
    heroNote: data.course.heroNote,
    hostBio: data.course.hostBio,
    startAt: data.course.startAt,
    endAt: data.course.endAt,
    highlights: parseStringListOrFallback(data.course.highlights),
    takeaways: parseStringListOrFallback(data.course.takeaways),
    featuredImage: data.course.featuredImage,
  }

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">Manage Course</p>
          <h2>{data.course.title}</h2>
          <p className="muted-copy">
            Update publishing, capacity, and course metadata without touching the
            public marketplace directly.
          </p>
        </div>
        <div className="organizer-banner-side">
          <MediaPlaceholder
            accent={data.course.accent}
            eyebrow={data.course.category}
            imageUrl={data.course.featuredImage}
            meta={data.course.status}
            title={data.course.title}
            variant="hero"
          />
          <div className="hero-actions">
            <Link className="ghost-link" to="/organizer">
              Back to dashboard
            </Link>
            {data.course.status === 'published' ? (
              <Link
                className="ghost-link"
                params={{ eventSlug: data.course.slug }}
                to="/events/$eventSlug"
              >
                View public page
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="two-column-layout">
        <div className="sidebar-stack">
          <section className="panel">
            <CourseForm
              errorMessage={errorMessage}
              initialValues={initialValues}
              isSubmitting={isSubmitting}
              onSubmit={async (values) => {
                setErrorMessage(null)
                setSuccessMessage(null)
                setIsSubmitting(true)

                try {
                  const result = await updateOrganizerCourseFn({
                    data: {
                      courseId: data.course.id,
                      ...values,
                    },
                  })
                  setSuccessMessage(`Saved. Public slug is ${result.slug}.`)
                  await router.invalidate()
                } catch (error) {
                  setErrorMessage(
                    error instanceof Error ? error.message : 'Unable to update course.',
                  )
                } finally {
                  setIsSubmitting(false)
                }
              }}
              submitLabel="Save changes"
              submittingLabel="Saving changes..."
              successMessage={successMessage}
            />
          </section>
        </div>

        <div className="sidebar-stack">
          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Course Health</p>
              <h3>Operational snapshot</h3>
            </div>
            <dl className="booking-facts">
              <div>
                <dt>Enrollments</dt>
                <dd>{data.stats.enrollmentCount}</dd>
              </div>
              <div>
                <dt>Modules</dt>
                <dd>{data.stats.moduleCount}</dd>
              </div>
              <div>
                <dt>Lessons</dt>
                <dd>{data.stats.lessonCount}</dd>
              </div>
            </dl>
            <dl className="booking-facts">
              <div>
                <dt>Seats remaining</dt>
                <dd>{data.stats.seatsRemaining}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{data.course.status}</dd>
              </div>
              <div>
                <dt>Slug</dt>
                <dd>{data.course.slug}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Curriculum</p>
              <h3>Current module structure</h3>
            </div>
            {data.modules.length === 0 ? (
              <p className="muted-copy">
                No modules exist yet for this course. This backend currently manages
                the course record and publishing state.
              </p>
            ) : (
              <div className="curriculum-stack">
                {data.modules.map((module) => (
                  <article className="curriculum-module" key={module.id}>
                    <div className="curriculum-head">
                      <div>
                        <p className="curriculum-position">Module {module.position}</p>
                        <h4>{module.title}</h4>
                      </div>
                      <span className="pill">{module.lessons.length} lessons</span>
                    </div>
                    <p className="muted-copy">{module.summary}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="section-intro">
              <p className="eyebrow">Enrollments</p>
              <h3>Recent learners</h3>
            </div>
            <Link
              className="ghost-link"
              params={{ courseId: String(data.course.id) }}
              to="/organizer/courses/$courseId/attendees"
            >
              Manage attendees
            </Link>
            {data.enrollments.length === 0 ? (
              <p className="muted-copy">No learners enrolled yet.</p>
            ) : (
              <div className="enrollment-list">
                {data.enrollments.slice(0, 5).map((enrollment) => (
                  <article className="enrollment-row" key={enrollment.id}>
                    <div>
                      <h4>{enrollment.learnerName}</h4>
                      <p className="muted-copy">{enrollment.learnerEmail}</p>
                    </div>
                    <div className="enrollment-progress">
                      <strong>{enrollment.progress}%</strong>
                      <span className="muted-copy">{enrollment.status}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}
