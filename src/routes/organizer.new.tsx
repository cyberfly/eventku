import { useState } from 'react'

import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { CourseForm } from '@/components/course-form'
import { defaultCourseFormState } from '@/lib/organizer'
import {
  createOrganizerCourseFn,
  getOrganizerSessionFn,
} from '@/lib/organizer-server-fns'

export const Route = createFileRoute('/organizer/new')({
  component: OrganizerCreateCoursePage,
  loader: async () => {
    const session = await getOrganizerSessionFn()

    if (!session) {
      throw redirect({ to: '/organizer/login' })
    }

    return session
  },
})

function OrganizerCreateCoursePage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="page-stack">
      <section className="panel organizer-banner">
        <div>
          <p className="eyebrow">New Course</p>
          <h2>Create a draft or publish immediately</h2>
        </div>
        <Link className="ghost-link" to="/organizer">
          Back to dashboard
        </Link>
      </section>

      <section className="panel">
        <CourseForm
          errorMessage={errorMessage}
          initialValues={defaultCourseFormState}
          isSubmitting={isSubmitting}
          onSubmit={async (values) => {
            setErrorMessage(null)
            setSuccessMessage(null)
            setIsSubmitting(true)

            try {
              const result = await createOrganizerCourseFn({
                data: values,
              })
              setSuccessMessage(`Course created as ${result.slug}.`)
              await navigate({
                params: { courseId: String(result.courseId) },
                to: '/organizer/courses/$courseId',
              })
            } catch (error) {
              setErrorMessage(
                error instanceof Error ? error.message : 'Unable to create course.',
              )
            } finally {
              setIsSubmitting(false)
            }
          }}
          submitLabel="Create course"
          submittingLabel="Creating course..."
          successMessage={successMessage}
        />
      </section>
    </div>
  )
}
