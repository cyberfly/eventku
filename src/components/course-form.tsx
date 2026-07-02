import { useEffect, useState } from 'react'

import type { OrganizerCourseInput } from '@/lib/organizer'
import {
  buildFieldErrors,
  courseCategoryOptions,
  courseFormatOptions,
  courseLevelOptions,
  courseStatusOptions,
  organizerCourseInput,
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

type FieldErrors = Record<string, string>

function toDateTimeLocalValue(isoValue: string) {
  if (!isoValue) {
    return ''
  }

  const date = new Date(isoValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  function pad(value: number) {
    return String(value).padStart(2, '0')
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDateTimeLocalValue(localValue: string) {
  if (!localValue) {
    return ''
  }

  const date = new Date(localValue)

  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

type DynamicListFieldProps = {
  errors: FieldErrors
  fieldKey: 'highlights' | 'takeaways'
  hint: string
  label: string
  onChange: (values: string[]) => void
  placeholder: string
  values: string[]
}

function DynamicListField({
  errors,
  fieldKey,
  hint,
  label,
  onChange,
  placeholder,
  values,
}: DynamicListFieldProps) {
  function updateItem(index: number, value: string) {
    const next = [...values]
    next[index] = value
    onChange(next)
  }

  function removeItem(index: number) {
    onChange(values.filter((_, itemIndex) => itemIndex !== index))
  }

  function addItem() {
    onChange([...values, ''])
  }

  const groupError = errors[fieldKey]

  return (
    <div>
      <p className="form-field-label">{label}</p>
      <p className="form-hint">{hint}</p>
      <div className="dynamic-list">
        {values.map((value, index) => {
          const itemError = errors[`${fieldKey}.${index}`]

          return (
            <div key={index}>
              <div className="dynamic-list-row">
                <input
                  className={itemError ? 'has-error' : undefined}
                  onChange={(event) => updateItem(index, event.target.value)}
                  placeholder={placeholder}
                  value={value}
                />
                <button
                  aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                  className="dynamic-list-remove"
                  disabled={values.length <= 1}
                  onClick={() => removeItem(index)}
                  type="button"
                >
                  ✗
                </button>
              </div>
              {itemError ? <p className="field-error">{itemError}</p> : null}
            </div>
          )
        })}
      </div>
      {groupError ? <p className="field-error">{groupError}</p> : null}
      <button
        className="ghost-button dynamic-list-add"
        disabled={values.length >= 8}
        onClick={addItem}
        type="button"
      >
        Add {label.toLowerCase()}
      </button>
    </div>
  )
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  useEffect(() => {
    setFormState(initialValues)
    setHasCustomSlug(initialValues.slug.length > 0)
    setFieldErrors({})
    setHasAttemptedSubmit(false)
  }, [initialValues])

  useEffect(() => {
    if (!hasAttemptedSubmit) {
      return
    }

    const parsed = organizerCourseInput.safeParse(formState)

    setFieldErrors(parsed.success ? {} : buildFieldErrors(parsed.error.issues))
  }, [formState, hasAttemptedSubmit])

  function fieldClass(field: string) {
    return fieldErrors[field] ? 'has-error' : undefined
  }

  function fieldError(field: string) {
    return fieldErrors[field] ? (
      <p className="field-error">{fieldErrors[field]}</p>
    ) : null
  }

  return (
    <form
      className="course-form"
      onSubmit={async (event) => {
        event.preventDefault()
        setHasAttemptedSubmit(true)

        const parsed = organizerCourseInput.safeParse(formState)

        if (!parsed.success) {
          setFieldErrors(buildFieldErrors(parsed.error.issues))
          return
        }

        setFieldErrors({})
        await onSubmit(parsed.data)
      }}
    >
      <div className="form-section">
        <p className="form-section-title">Basics</p>
        <div className="form-split">
          <label>
            Course title
            <input
              className={fieldClass('title')}
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
            {fieldError('title')}
          </label>
          <label>
            URL slug
            <input
              className={fieldClass('slug')}
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
            {fieldError('slug')}
          </label>
        </div>

        <label>
          Summary
          <textarea
            className={fieldClass('summary')}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                summary: event.target.value,
              }))
            }
            placeholder="Describe what learners will get from this event."
            rows={5}
            value={formState.summary}
          />
          {fieldError('summary')}
        </label>
      </div>

      <div className="form-section">
        <p className="form-section-title">Classification</p>
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
      </div>

      <div className="form-section">
        <p className="form-section-title">Schedule &amp; Location</p>
        <div className="form-split">
          <label>
            Starts
            <input
              className={fieldClass('startAt')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  startAt: fromDateTimeLocalValue(event.target.value),
                }))
              }
              type="datetime-local"
              value={toDateTimeLocalValue(formState.startAt)}
            />
            {fieldError('startAt')}
          </label>
          <label>
            Ends
            <input
              className={fieldClass('endAt')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  endAt: fromDateTimeLocalValue(event.target.value),
                }))
              }
              type="datetime-local"
              value={toDateTimeLocalValue(formState.endAt)}
            />
            {fieldError('endAt')}
          </label>
        </div>
        <div className="form-split form-split-3">
          <label>
            Format
            <select
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  format: event.target.value as OrganizerCourseInput['format'],
                }))
              }
              value={formState.format}
            >
              {courseFormatOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Venue
            <input
              className={fieldClass('venue')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  venue: event.target.value,
                }))
              }
              placeholder="Eventku Live Studio"
              value={formState.venue}
            />
            {fieldError('venue')}
          </label>
          <label>
            City
            <input
              className={fieldClass('city')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  city: event.target.value,
                }))
              }
              placeholder="Streaming worldwide"
              value={formState.city}
            />
            {fieldError('city')}
          </label>
        </div>
      </div>

      <div className="form-section">
        <p className="form-section-title">Capacity &amp; Pricing</p>
        <div className="form-split form-split-4">
          <label>
            Duration (hours)
            <input
              className={fieldClass('durationHours')}
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
            {fieldError('durationHours')}
          </label>
          <label>
            Seat cap
            <input
              className={fieldClass('seatCap')}
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
            {fieldError('seatCap')}
          </label>
          <label>
            Completion rate
            <input
              className={fieldClass('completionRate')}
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
            {fieldError('completionRate')}
          </label>
          <label>
            Price (MYR)
            <input
              className={fieldClass('price')}
              min={0}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  price: Number(event.target.value),
                }))
              }
              type="number"
              value={formState.price}
            />
            {fieldError('price')}
          </label>
        </div>
      </div>

      <div className="form-section">
        <p className="form-section-title">Marketing</p>
        <label>
          Audience
          <input
            className={fieldClass('audience')}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                audience: event.target.value,
              }))
            }
            placeholder="Support leads, training managers, and operations coordinators"
            value={formState.audience}
          />
          {fieldError('audience')}
        </label>
        <label>
          Hero note
          <input
            className={fieldClass('heroNote')}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                heroNote: event.target.value,
              }))
            }
            placeholder="A live operating-systems seminar built for teams scaling service delivery."
            value={formState.heroNote}
          />
          {fieldError('heroNote')}
        </label>
        <DynamicListField
          errors={fieldErrors}
          fieldKey="highlights"
          hint="What makes this event worth attending. Shown as bullet points on the public page."
          label="Highlights"
          onChange={(highlights) =>
            setFormState((current) => ({ ...current, highlights }))
          }
          placeholder="Live facilitation with real workflow examples"
          values={formState.highlights}
        />
        <DynamicListField
          errors={fieldErrors}
          fieldKey="takeaways"
          hint="What attendees leave with. Shown separately from highlights on the public page."
          label="Takeaways"
          onChange={(takeaways) =>
            setFormState((current) => ({ ...current, takeaways }))
          }
          placeholder="Build a clearer service ownership model"
          values={formState.takeaways}
        />
      </div>

      <div className="form-section">
        <p className="form-section-title">Host</p>
        <div className="form-split">
          <label>
            Instructor / host name
            <input
              className={fieldClass('instructorName')}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  instructorName: event.target.value,
                }))
              }
              placeholder="Aimee Santos"
              value={formState.instructorName}
            />
            {fieldError('instructorName')}
          </label>
          <label>
            Accent color
            <div className="color-field">
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
              <input
                className={fieldClass('accent')}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    accent: event.target.value,
                  }))
                }
                placeholder="#0c7d69"
                value={formState.accent}
              />
            </div>
            {fieldError('accent')}
          </label>
        </div>
        <label>
          Host bio
          <textarea
            className={fieldClass('hostBio')}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                hostBio: event.target.value,
              }))
            }
            placeholder="Aimee Santos advises academy and support teams on service design, escalation systems, and training operations."
            rows={4}
            value={formState.hostBio}
          />
          {fieldError('hostBio')}
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
