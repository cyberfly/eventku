import { expect, test } from '@playwright/test'

const KNOWN_SLUGS = ['ops-foundations', 'cohort-playbooks', 'analytics-for-academies']

test.describe('GET /api/events', () => {
  test('lists only published events with parsed catalog data', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(Array.isArray(body.data)).toBe(true)

    const slugs = body.data.map((event: { slug: string }) => event.slug)

    for (const slug of KNOWN_SLUGS) {
      expect(slugs).toContain(slug)
    }

    for (const event of body.data) {
      expect(Array.isArray(event.highlights)).toBe(true)
      expect(Array.isArray(event.takeaways)).toBe(true)
      expect(typeof event.seatsRemaining).toBe('number')
      expect(event.status).toBeUndefined()
    }
  })
})

test.describe('GET /api/events/:slug', () => {
  test('returns event details with agenda and attendee preview', async ({ request }) => {
    const response = await request.get('/api/events/ops-foundations')
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.data.event.slug).toBe('ops-foundations')
    expect(Array.isArray(body.data.event.highlights)).toBe(true)
    expect(Array.isArray(body.data.event.takeaways)).toBe(true)
    expect(Array.isArray(body.data.agenda)).toBe(true)
    expect(body.data.agenda.length).toBeGreaterThan(0)
    expect(Array.isArray(body.data.attendeePreview)).toBe(true)
  })

  test('returns a consistent 404 error envelope for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist')
    expect(response.status()).toBe(404)

    const body = await response.json()
    expect(body.error.code).toBe('not_found')
    expect(typeof body.error.message).toBe('string')
  })
})

test.describe('POST /api/events/:slug/register', () => {
  test('registers a new attendee and reduces seats remaining', async ({ request }) => {
    const before = await (await request.get('/api/events/cohort-playbooks')).json()
    const seatsBefore = before.data.event.seatsRemaining

    const response = await request.post('/api/events/cohort-playbooks/register', {
      data: {
        attendeeEmail: `playwright-${Date.now()}@example.com`,
        attendeeName: 'Playwright Tester',
      },
    })
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(typeof body.data.confirmationCode).toBe('string')

    const after = await (await request.get('/api/events/cohort-playbooks')).json()
    expect(after.data.event.seatsRemaining).toBe(seatsBefore - 1)
  })

  test('rejects invalid registration input with a 422 error envelope', async ({ request }) => {
    const response = await request.post('/api/events/ops-foundations/register', {
      data: {
        attendeeEmail: 'not-an-email',
        attendeeName: 'A',
      },
    })
    expect(response.status()).toBe(422)

    const body = await response.json()
    expect(body.error.code).toBe('validation_error')
  })

  test('rejects a duplicate registration for the same event and email', async ({ request }) => {
    const response = await request.post('/api/events/ops-foundations/register', {
      data: {
        attendeeEmail: 'jalen@example.com',
        attendeeName: 'Jalen Brooks',
      },
    })
    expect(response.status()).toBe(409)

    const body = await response.json()
    expect(body.error.code).toBe('duplicate_registration')
  })

  test('rejects registration for an unknown event with a 404 error envelope', async ({ request }) => {
    const response = await request.post('/api/events/does-not-exist/register', {
      data: {
        attendeeEmail: `unknown-${Date.now()}@example.com`,
        attendeeName: 'Nobody',
      },
    })
    expect(response.status()).toBe(404)

    const body = await response.json()
    expect(body.error.code).toBe('not_found')
  })

  test('rejects registration once the event is sold out', async ({ request }) => {
    const detail = await (await request.get('/api/events/analytics-for-academies')).json()
    const seatsRemaining: number = detail.data.event.seatsRemaining

    for (let index = 0; index < seatsRemaining; index += 1) {
      const response = await request.post('/api/events/analytics-for-academies/register', {
        data: {
          attendeeEmail: `sellout-${index}-${Date.now()}@example.com`,
          attendeeName: `Sellout Tester ${index}`,
        },
      })
      expect(response.status()).toBe(200)
    }

    const response = await request.post('/api/events/analytics-for-academies/register', {
      data: {
        attendeeEmail: `sellout-final-${Date.now()}@example.com`,
        attendeeName: 'Final Tester',
      },
    })
    expect(response.status()).toBe(409)

    const body = await response.json()
    expect(body.error.code).toBe('sold_out')
  })
})
