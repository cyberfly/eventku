import { test, expect } from '@playwright/test'

const SEEDED_SLUG = 'ops-foundations'

test.describe('GET /api/events', () => {
  test('lists published events', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)

    const events = await response.json()
    expect(Array.isArray(events)).toBe(true)
    expect(events.length).toBeGreaterThan(0)
    expect(events.some((event: { slug: string }) => event.slug === SEEDED_SLUG)).toBe(true)

    const event = events.find((item: { slug: string }) => item.slug === SEEDED_SLUG)
    expect(Array.isArray(event.highlights)).toBe(true)
    expect(Array.isArray(event.takeaways)).toBe(true)
  })
})

test.describe('GET /api/events/:slug', () => {
  test('returns detail for a known slug', async ({ request }) => {
    const response = await request.get(`/api/events/${SEEDED_SLUG}`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.event.slug).toBe(SEEDED_SLUG)
    expect(Array.isArray(body.agenda)).toBe(true)
    expect(Array.isArray(body.attendeePreview)).toBe(true)
  })

  test('returns 404 with a JSON error body for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist-slug')
    expect(response.status()).toBe(404)

    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })
})

test.describe('POST /api/events/:slug/register', () => {
  test('registers a new attendee then rejects a duplicate email', async ({ request }) => {
    const email = `attendee-${Date.now()}@example.com`

    const created = await request.post(`/api/events/${SEEDED_SLUG}/register`, {
      data: { attendeeName: 'Test Attendee', attendeeEmail: email },
    })
    expect(created.status()).toBe(201)
    const createdBody = await created.json()
    expect(typeof createdBody.confirmationCode).toBe('string')

    const duplicate = await request.post(`/api/events/${SEEDED_SLUG}/register`, {
      data: { attendeeName: 'Test Attendee', attendeeEmail: email },
    })
    expect(duplicate.status()).toBe(400)
    const duplicateBody = await duplicate.json()
    expect(typeof duplicateBody.error).toBe('string')
  })

  test('rejects an invalid payload with 400', async ({ request }) => {
    const response = await request.post(`/api/events/${SEEDED_SLUG}/register`, {
      data: { attendeeName: '', attendeeEmail: 'not-an-email' },
    })
    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  test('returns a 4xx JSON error for an unknown event', async ({ request }) => {
    const response = await request.post('/api/events/does-not-exist-slug/register', {
      data: { attendeeName: 'Test Attendee', attendeeEmail: `unknown-${Date.now()}@example.com` },
    })
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)

    const body = await response.json()
    expect(typeof body.error).toBe('string')
  })

  test('rejects registration once the event is sold out', async ({ request }) => {
    const detailResponse = await request.get(`/api/events/${SEEDED_SLUG}`)
    const { event } = await detailResponse.json()
    const seatsRemaining: number = event.seatsRemaining

    for (let index = 0; index < seatsRemaining; index += 1) {
      const response = await request.post(`/api/events/${SEEDED_SLUG}/register`, {
        data: {
          attendeeName: `Sold Out Filler ${index}`,
          attendeeEmail: `sold-out-filler-${Date.now()}-${index}@example.com`,
        },
      })
      expect(response.status()).toBe(201)
    }

    const overflow = await request.post(`/api/events/${SEEDED_SLUG}/register`, {
      data: {
        attendeeName: 'One Too Many',
        attendeeEmail: `sold-out-overflow-${Date.now()}@example.com`,
      },
    })
    expect(overflow.status()).toBe(400)
    const overflowBody = await overflow.json()
    expect(overflowBody.error).toMatch(/sold out/i)
  })
})
