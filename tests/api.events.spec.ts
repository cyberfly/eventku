import { test, expect } from '@playwright/test'

const BASE = '/api/events'

test.describe('GET /api/events', () => {
  test('returns published events as JSON array', async ({ request }) => {
    const response = await request.get(BASE)

    expect(response.status()).toBe(200)

    const body = await response.json()

    expect(body).toHaveProperty('events')
    expect(Array.isArray(body.events)).toBe(true)
  })

  test('each event has required fields', async ({ request }) => {
    const response = await request.get(BASE)
    const { events } = await response.json()

    for (const event of events) {
      expect(typeof event.slug).toBe('string')
      expect(typeof event.title).toBe('string')
      expect(Array.isArray(event.highlights)).toBe(true)
      expect(Array.isArray(event.takeaways)).toBe(true)
    }
  })
})

test.describe('GET /api/events/:slug', () => {
  test('returns 404 for unknown slug', async ({ request }) => {
    const response = await request.get(`${BASE}/does-not-exist-xyz`)

    expect(response.status()).toBe(404)

    const body = await response.json()

    expect(body).toHaveProperty('error')
  })

  test('returns event detail for valid published slug', async ({ request }) => {
    const listResponse = await request.get(BASE)
    const { events } = await listResponse.json()

    if (events.length === 0) {
      test.skip()
      return
    }

    const slug = events[0].slug
    const response = await request.get(`${BASE}/${slug}`)

    expect(response.status()).toBe(200)

    const body = await response.json()

    expect(body).toHaveProperty('event')
    expect(body).toHaveProperty('agenda')
    expect(body).toHaveProperty('attendeePreview')
    expect(body.event.slug).toBe(slug)
  })
})

test.describe('POST /api/events/:slug/register', () => {
  test('returns 404 when slug does not exist', async ({ request }) => {
    const response = await request.post(`${BASE}/no-such-event/register`, {
      data: { attendeeEmail: 'test@example.com', attendeeName: 'Test User' },
    })

    expect(response.status()).toBe(404)

    const body = await response.json()

    expect(body.error).toBe('This event is no longer available.')
  })

  test('returns 400 when body is missing required fields', async ({ request }) => {
    const response = await request.post(`${BASE}/any-slug/register`, {
      data: {},
    })

    expect(response.status()).toBe(400)

    const body = await response.json()

    expect(body).toHaveProperty('error')
  })

  test('registers successfully and returns confirmation code', async ({ request }) => {
    const listResponse = await request.get(BASE)
    const { events } = await listResponse.json()

    if (events.length === 0) {
      test.skip()
      return
    }

    const slug = events[0].slug
    const uniqueEmail = `playwright-${Date.now()}@example.com`

    const response = await request.post(`${BASE}/${slug}/register`, {
      data: { attendeeEmail: uniqueEmail, attendeeName: 'Playwright Tester' },
    })

    expect(response.status()).toBe(201)

    const body = await response.json()

    expect(typeof body.confirmationCode).toBe('string')
    expect(body.confirmationCode).toMatch(/^NS-\d+-\d{4}$/)
  })

  test('rejects duplicate email registration with 409', async ({ request }) => {
    const listResponse = await request.get(BASE)
    const { events } = await listResponse.json()

    if (events.length === 0) {
      test.skip()
      return
    }

    const slug = events[0].slug
    const uniqueEmail = `playwright-dupe-${Date.now()}@example.com`
    const payload = { attendeeEmail: uniqueEmail, attendeeName: 'Dupe Tester' }

    await request.post(`${BASE}/${slug}/register`, { data: payload })

    const second = await request.post(`${BASE}/${slug}/register`, { data: payload })

    expect(second.status()).toBe(409)

    const body = await second.json()

    expect(body.error).toBe('This attendee already has a confirmed registration.')
  })
})
