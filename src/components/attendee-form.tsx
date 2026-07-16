import { useEffect, useState } from 'react'

import type { OrganizerAttendeeInput } from '@/lib/organizer'
import { attendeeStatusOptions, buildFieldErrors, organizerAttendeeInput } from '@/lib/organizer'

type AttendeeFormProps = {
  errorMessage?: string | null
  initialValues: OrganizerAttendeeInput
  isSubmitting: boolean
  onCancel?: () => void
  onSubmit: (values: OrganizerAttendeeInput) => Promise<void>
  submitLabel: string
  submittingLabel: string
}

type FieldErrors = Record<string, string>

export function AttendeeForm({
  errorMessage,
  initialValues,
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
  submittingLabel,
}: AttendeeFormProps) {
  const [formState, setFormState] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  useEffect(() => {
    setFormState(initialValues)
    setFieldErrors({})
    setHasAttemptedSubmit(false)
  }, [initialValues])

  useEffect(() => {
    if (!hasAttemptedSubmit) {
      return
    }

    const parsed = organizerAttendeeInput.safeParse(formState)

    setFieldErrors(parsed.success ? {} : buildFieldErrors(parsed.error.issues))
  }, [formState, hasAttemptedSubmit])

  function fieldClass(field: string) {
    return fieldErrors[field] ? 'has-error' : undefined
  }

  function fieldError(field: string) {
    return fieldErrors[field] ? <p className="field-error">{fieldErrors[field]}</p> : null
  }

  return (
    <form
      className="attendee-form"
      onSubmit={async (event) => {
        event.preventDefault()
        setHasAttemptedSubmit(true)

        const parsed = organizerAttendeeInput.safeParse(formState)

        if (!parsed.success) {
          setFieldErrors(buildFieldErrors(parsed.error.issues))
          return
        }

        setFieldErrors({})
        await onSubmit(parsed.data)
      }}
    >
      <div className="form-split">
        <label>
          Name
          <input
            className={fieldClass('learnerName')}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                learnerName: event.target.value,
              }))
            }
            placeholder="Jalen Brooks"
            value={formState.learnerName}
          />
          {fieldError('learnerName')}
        </label>
        <label>
          Email
          <input
            className={fieldClass('learnerEmail')}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                learnerEmail: event.target.value,
              }))
            }
            placeholder="jalen@example.com"
            type="email"
            value={formState.learnerEmail}
          />
          {fieldError('learnerEmail')}
        </label>
      </div>

      <div className="form-split">
        <label>
          Status
          <select
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                status: event.target.value as OrganizerAttendeeInput['status'],
              }))
            }
            value={formState.status}
          >
            {attendeeStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Progress (%)
          <input
            className={fieldClass('progress')}
            max={100}
            min={0}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                progress: Number(event.target.value),
              }))
            }
            type="number"
            value={formState.progress}
          />
          {fieldError('progress')}
        </label>
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

      <div className="attendee-form-actions">
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
        {onCancel ? (
          <button
            className="ghost-button"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}
