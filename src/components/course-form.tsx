import { useEffect, useState } from 'react'

import type { OrganizerCourseInput } from '@/lib/organizer'
import {
  courseCategoryOptions,
  courseDeliveryFormatOptions,
  courseLanguageOptions,
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

  function updateField<Key extends keyof OrganizerCourseInput>(
    key: Key,
    value: OrganizerCourseInput[Key],
  ) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  return (
    <form
      className="course-form"
      onSubmit={async (event) => {
        event.preventDefault()
        await onSubmit(formState)
      }}
    >
      <section className="form-section">
        <div className="form-section-header">
          <p className="eyebrow">Basics</p>
          <h3>Course identity</h3>
        </div>

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
                updateField('slug', slugifyValue(event.target.value))
              }}
              placeholder="operations-foundations"
              value={formState.slug}
            />
          </label>
        </div>

        <label>
          Subtitle
          <input
            onChange={(event) => updateField('subtitle', event.target.value)}
            placeholder="Build the support engine behind a dependable learning business."
            value={formState.subtitle}
          />
        </label>

        <label>
          Summary
          <textarea
            onChange={(event) => updateField('summary', event.target.value)}
            placeholder="Describe what learners will get from this course."
            rows={5}
            value={formState.summary}
          />
        </label>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <p className="eyebrow">Positioning</p>
          <h3>Catalog metadata</h3>
        </div>

        <div className="form-split form-split-3">
          <label>
            Category
            <select
              onChange={(event) =>
                updateField(
                  'category',
                  event.target.value as OrganizerCourseInput['category'],
                )
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
                updateField(
                  'level',
                  event.target.value as OrganizerCourseInput['level'],
                )
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
                updateField(
                  'status',
                  event.target.value as OrganizerCourseInput['status'],
                )
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

        <div className="form-split form-split-3">
          <label>
            Language
            <select
              onChange={(event) =>
                updateField(
                  'language',
                  event.target.value as OrganizerCourseInput['language'],
                )
              }
              value={formState.language}
            >
              {courseLanguageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Delivery format
            <select
              onChange={(event) =>
                updateField(
                  'deliveryFormat',
                  event.target.value as OrganizerCourseInput['deliveryFormat'],
                )
              }
              value={formState.deliveryFormat}
            >
              {courseDeliveryFormatOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Location
            <input
              onChange={(event) => updateField('location', event.target.value)}
              placeholder="Virtual or venue name"
              value={formState.location}
            />
          </label>
        </div>

        <div className="form-split">
          <label>
            Timezone
            <input
              onChange={(event) => updateField('timezone', event.target.value)}
              placeholder="Asia/Kuala_Lumpur"
              value={formState.timezone}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <p className="eyebrow">Delivery</p>
          <h3>Capacity and structure</h3>
        </div>

        <div className="form-split form-split-4">
          <label>
            Duration (hours)
            <input
              min={1}
              onChange={(event) =>
                updateField('durationHours', Number(event.target.value))
              }
              type="number"
              value={formState.durationHours}
            />
          </label>
          <label>
            Weekly hours
            <input
              min={1}
              onChange={(event) =>
                updateField('estimatedWeeklyHours', Number(event.target.value))
              }
              type="number"
              value={formState.estimatedWeeklyHours}
            />
          </label>
          <label>
            Total modules
            <input
              min={0}
              onChange={(event) =>
                updateField('totalModules', Number(event.target.value))
              }
              type="number"
              value={formState.totalModules}
            />
          </label>
          <label>
            Total lessons
            <input
              min={0}
              onChange={(event) =>
                updateField('totalLessons', Number(event.target.value))
              }
              type="number"
              value={formState.totalLessons}
            />
          </label>
        </div>

        <div className="form-split form-split-4">
          <label>
            Seat cap
            <input
              min={1}
              onChange={(event) => updateField('seatCap', Number(event.target.value))}
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
                updateField('completionRate', Number(event.target.value))
              }
              type="number"
              value={formState.completionRate}
            />
          </label>
          <label>
            Price (USD)
            <input
              min={0}
              onChange={(event) => updateField('priceUsd', Number(event.target.value))}
              type="number"
              value={formState.priceUsd}
            />
          </label>
          <label>
            Instructor name
            <input
              onChange={(event) =>
                updateField('instructorName', event.target.value)
              }
              placeholder="Aimee Santos"
              value={formState.instructorName}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <p className="eyebrow">Schedule</p>
          <h3>Enrollment and run dates</h3>
        </div>

        <div className="form-split form-split-4">
          <label>
            Enrollment opens
            <input
              onChange={(event) =>
                updateField('enrollmentStartDate', event.target.value)
              }
              type="date"
              value={formState.enrollmentStartDate}
            />
          </label>
          <label>
            Enrollment closes
            <input
              onChange={(event) =>
                updateField('enrollmentEndDate', event.target.value)
              }
              type="date"
              value={formState.enrollmentEndDate}
            />
          </label>
          <label>
            Course starts
            <input
              onChange={(event) =>
                updateField('courseStartDate', event.target.value)
              }
              type="date"
              value={formState.courseStartDate}
            />
          </label>
          <label>
            Course ends
            <input
              onChange={(event) => updateField('courseEndDate', event.target.value)}
              type="date"
              value={formState.courseEndDate}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <p className="eyebrow">Flags</p>
          <h3>Commercial and visual settings</h3>
        </div>

        <div className="form-split form-split-2">
          <label className="checkbox-field">
            <span>Certificate included</span>
            <input
              checked={formState.certificateIncluded}
              onChange={(event) =>
                updateField('certificateIncluded', event.target.checked)
              }
              type="checkbox"
            />
          </label>
          <label className="checkbox-field">
            <span>Featured course</span>
            <input
              checked={formState.featured}
              onChange={(event) => updateField('featured', event.target.checked)}
              type="checkbox"
            />
          </label>
        </div>

        <div className="form-split">
          <label>
            Accent color
            <input
              onChange={(event) => updateField('accent', event.target.value)}
              type="color"
              value={formState.accent}
            />
          </label>
          <label>
            Preview color hex
            <input
              onChange={(event) => updateField('accent', event.target.value)}
              placeholder="#0c7d69"
              value={formState.accent}
            />
          </label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <p className="eyebrow">Audience</p>
          <h3>Learner-facing details</h3>
        </div>

        <label>
          Prerequisites
          <textarea
            onChange={(event) => updateField('prerequisites', event.target.value)}
            placeholder="Outline the prior experience learners should have before enrolling."
            rows={3}
            value={formState.prerequisites}
          />
        </label>

        <label>
          Learning outcomes
          <textarea
            onChange={(event) => updateField('learningOutcomes', event.target.value)}
            placeholder="List the skills, deliverables, or behavior changes learners should leave with."
            rows={4}
            value={formState.learningOutcomes}
          />
        </label>

        <label>
          Target audience
          <textarea
            onChange={(event) => updateField('targetAudience', event.target.value)}
            placeholder="Describe who this course is designed for."
            rows={3}
            value={formState.targetAudience}
          />
        </label>

        <label>
          Materials included
          <textarea
            onChange={(event) =>
              updateField('materialsIncluded', event.target.value)
            }
            placeholder="List templates, downloads, recordings, or other takeaways."
            rows={3}
            value={formState.materialsIncluded}
          />
        </label>

        <label>
          Support details
          <textarea
            onChange={(event) => updateField('supportDetails', event.target.value)}
            placeholder="Explain office hours, discussion access, or support channels."
            rows={3}
            value={formState.supportDetails}
          />
        </label>
      </section>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {successMessage ? <p className="form-success">{successMessage}</p> : null}

      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
