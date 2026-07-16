import { useState } from 'react'

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import {
  getOrganizerSessionFn,
  loginOrganizerFn,
} from '@/lib/organizer-server-fns'

export const Route = createFileRoute('/organizer/login')({
  component: OrganizerLoginPage,
  loader: async () => {
    const session = await getOrganizerSessionFn()

    if (session) {
      throw redirect({ to: '/organizer' })
    }

    return null
  },
})

function OrganizerLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('organizer@eventmung.local')
  const [password, setPassword] = useState('organizer123')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <div className="organizer-auth-layout">
      <section className="panel organizer-auth-panel">
        <div className="section-intro">
          <p className="eyebrow">Organizer Backend</p>
          <h3>Login to create and manage courses</h3>
        </div>
        <p className="muted-copy">
          Organizer sessions are handled on the server with an HTTP-only cookie.
          Update `ORGANIZER_EMAIL`, `ORGANIZER_NAME`, and `ORGANIZER_PASSWORD` in
          the environment to replace the default account.
        </p>
        <form
          className="course-form"
          onSubmit={async (event) => {
            event.preventDefault()
            setErrorMessage(null)
            setIsSubmitting(true)

            try {
              await loginOrganizerFn({
                data: {
                  email,
                  password,
                },
              })
              await navigate({ to: '/organizer' })
            } catch (error) {
              setErrorMessage(
                error instanceof Error ? error.message : 'Unable to login.',
              )
            } finally {
              setIsSubmitting(false)
            }
          }}
        >
          <label>
            Organizer email
            <input
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  )
}
