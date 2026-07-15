import { expect, test } from '@playwright/test'

const PUBLISHED_SLUG = 'ops-foundations'
const SOLD_OUT_CANDIDATE_SLUG = 'analytics-for-academies'

test.describe('GET /api/events', () => {
  test('lists published events', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)

    const events = await response.json()
    expect(Array.isArray(events)).toBe(true)
    expect(events.some((event: { slug: string }) => event.slug === PUBLISHED_SLUG)).toBe(true)
  })
})

test.describe('GET /api/events/:slug', () => {
  test('returns detail with parsed highlight/takeaway arrays for a known slug', async ({ request }) => {
    const response = await request.get(`/api/events/${PUBLISHED_SLUG}`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.event.slug).toBe(PUBLISHED_SLUG)
    expect(Array.isArray(body.event.highlights)).toBe(true)
    expect(Array.isArray(body.event.takeaways)).toBe(true)
    expect(Array.isArray(body.agenda)).toBe(true)
    expect(Array.isArray(body.attendeePreview)).toBe(true)
  })

  test('returns 404 for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist')
    expect(response.status()).toBe(404)

    const body = await response.json()
    expect(body.error).toBeTruthy()
  })
})

test.describe('POST /api/events/:slug/register', () => {
  test('registers a new attendee then rejects a duplicate email', async ({ request }) => {
    const email = `attendee-${Date.now()}@example.com`

    const first = await request.post(`/api/events/${PUBLISHED_SLUG}/register`, {
      data: { attendeeName: 'Test Attendee', attendeeEmail: email },
    })
    expect(first.status()).toBe(201)
    expect((await first.json()).confirmationCode).toBeTruthy()

    const duplicate = await request.post(`/api/events/${PUBLISHED_SLUG}/register`, {
      data: { attendeeName: 'Test Attendee', attendeeEmail: email },
    })
    expect(duplicate.status()).toBe(409)
  })

  test('returns 404 for an unknown event', async ({ request }) => {
    const response = await request.post('/api/events/does-not-exist/register', {
      data: { attendeeName: 'Test Attendee', attendeeEmail: 'nobody@example.com' },
    })
    expect(response.status()).toBe(404)
  })

  test('returns 400 for an invalid payload', async ({ request }) => {
    const response = await request.post(`/api/events/${PUBLISHED_SLUG}/register`, {
      data: { attendeeName: 'A', attendeeEmail: 'not-an-email' },
    })
    expect(response.status()).toBe(400)
  })

  test('returns 400 once the event is sold out', async ({ request }) => {
    const detailResponse = await request.get(`/api/events/${SOLD_OUT_CANDIDATE_SLUG}`)
    const { event } = await detailResponse.json()

    for (let index = 0; index < event.seatsRemaining; index += 1) {
      const fillerResponse = await request.post(`/api/events/${SOLD_OUT_CANDIDATE_SLUG}/register`, {
        data: {
          attendeeName: `Filler Attendee ${index}`,
          attendeeEmail: `filler-${Date.now()}-${index}@example.com`,
        },
      })
      expect(fillerResponse.status()).toBe(201)
    }

    const soldOutResponse = await request.post(`/api/events/${SOLD_OUT_CANDIDATE_SLUG}/register`, {
      data: { attendeeName: 'One Too Many', attendeeEmail: `overflow-${Date.now()}@example.com` },
    })
    expect(soldOutResponse.status()).toBe(400)
  })
})
