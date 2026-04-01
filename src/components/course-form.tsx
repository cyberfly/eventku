import { useEffect, useState } from 'react'

import type { OrganizerCourseInput } from '@/lib/organizer'
import {
  courseCategoryOptions,
  courseLevelOptions,
  courseStatusOptions,
  slugifyValue,
} from '@/lib/organizer'

type CourseFormProps = {
  errorMessage?: string | null
  initialValues: OrganizerCourseInput
  isSubmitting: boolean
  onSubmit: (values: OrganizerCourseInput) => Promise<void>
  submitLabel: string
  submittingLabel: string
  successMessage?: string | null
}

export function CourseForm({
  errorMessage,
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel,
  submittingLabel,
  successMessage,
}: CourseFormProps) {
  const [formState, setFormState] = useState(initialValues)
  const [hasCustomSlug, setHasCustomSlug] = useState(
    initialValues.slug.length > 0,
  )

  useEffect(() => {
    setFormState(initialValues)
    setHasCustomSlug(initialValues.slug.length > 0)
  }, [initialValues])

  return (
    <form
      className="course-form"
      onSubmit={async (event) => {
        event.preventDefault()
        await onSubmit(formState)
      }}
    >
      <div className="form-split">
        <label>
          Course title
          <input
            onChange={(event) => {
              const title = event.target.value

              setFormState((current) => ({
                ...current,
                title,
                slug:
                  hasCustomSlug || current.slug !== slugifyValue(current.title)
                    ? current.slug
                    : slugifyValue(title),
              }))
            }}
            placeholder="Operations Foundations"
            value={formState.title}
          />
        </label>
        <label>
          URL slug
          <input
            onChange={(event) => {
              setHasCustomSlug(true)
              setFormState((current) => ({
                ...current,
                slug: slugifyValue(event.target.value),
              }))
            }}
            placeholder="operations-foundations"
            value={formState.slug}
          />
        </label>
      </div>

      <label>
        Summary
        <textarea
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              summary: event.target.value,
            }))
          }
          placeholder="Describe what learners will get from this course."
          rows={5}
          value={formState.summary}
        />
      </label>

      <div className="form-split form-split-3">
        <label>
          Category
          <select
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                category:
                  event.target.value as OrganizerCourseInput['category'],
              }))
            }
            value={formState.category}
          >
            {courseCategoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Level
          <select
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                level: event.target.value as OrganizerCourseInput['level'],
              }))
            }
            value={formState.level}
          >
            {courseLevelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                status: event.target.value as OrganizerCourseInput['status'],
              }))
            }
            value={formState.status}
          >
            {courseStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-split form-split-4">
        <label>
          Duration (hours)
          <input
            min={1}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                durationHours: Number(event.target.value),
              }))
            }
            type="number"
            value={formState.durationHours}
          />
        </label>
        <label>
          Seat cap
          <input
            min={1}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                seatCap: Number(event.target.value),
              }))
            }
            type="number"
            value={formState.seatCap}
          />
        </label>
        <label>
          Completion rate
          <input
            max={100}
            min={0}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                completionRate: Number(event.target.value),
              }))
            }
            type="number"
            value={formState.completionRate}
          />
        </label>
        <label>
          Accent color
          <input
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                accent: event.target.value,
              }))
            }
            type="color"
            value={formState.accent}
          />
        </label>
      </div>

      <div className="form-split">
        <label>
          Instructor name
          <input
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                instructorName: event.target.value,
              }))
            }
            placeholder="Aimee Santos"
            value={formState.instructorName}
          />
        </label>
        <label>
          Preview color hex
          <input
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                accent: event.target.value,
              }))
            }
            placeholder="#0c7d69"
            value={formState.accent}
          />
        </label>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {successMessage ? <p className="form-success">{successMessage}</p> : null}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
