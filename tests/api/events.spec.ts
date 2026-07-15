import { expect, test } from '@playwright/test'

import {
  ensureQaFixtureEvents,
  QA_DRAFT_EVENT_SLUG,
  QA_OPEN_EVENT_SLUG,
  QA_SOLD_OUT_EVENT_SLUG,
} from './fixtures'

test.beforeAll(() => {
  ensureQaFixtureEvents()
})

test.describe('GET /api/events', () => {
  test('lists only published events', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)

    const events: Array<{ slug: string }> = await response.json()
    const slugs = events.map((event) => event.slug)

    expect(slugs).toContain(QA_OPEN_EVENT_SLUG)
    expect(slugs).not.toContain(QA_DRAFT_EVENT_SLUG)
  })
})

test.describe('GET /api/events/:slug', () => {
  test('returns event detail for a published slug', async ({ request }) => {
    const response = await request.get(`/api/events/${QA_OPEN_EVENT_SLUG}`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.event.slug).toBe(QA_OPEN_EVENT_SLUG)
    expect(Array.isArray(body.agenda)).toBe(true)
    expect(Array.isArray(body.attendeePreview)).toBe(true)
  })

  test('404s for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist-slug')
    expect(response.status()).toBe(404)
    expect((await response.json()).error).toBeTruthy()
  })

  test('404s for a draft slug', async ({ request }) => {
    const response = await request.get(`/api/events/${QA_DRAFT_EVENT_SLUG}`)
    expect(response.status()).toBe(404)
    expect((await response.json()).error).toBeTruthy()
  })
})

test.describe('POST /api/events/:slug/register', () => {
  test('registers then rejects a duplicate email', async ({ request }) => {
    const attendeeEmail = `qa-register-${Date.now()}@example.com`

    const firstResponse = await request.post(`/api/events/${QA_OPEN_EVENT_SLUG}/register`, {
      data: { attendeeEmail, attendeeName: 'QA Attendee' },
    })
    expect(firstResponse.status()).toBe(201)
    expect((await firstResponse.json()).confirmationCode).toBeTruthy()

    const secondResponse = await request.post(`/api/events/${QA_OPEN_EVENT_SLUG}/register`, {
      data: { attendeeEmail, attendeeName: 'QA Attendee' },
    })
    expect(secondResponse.status()).toBe(400)
    expect((await secondResponse.json()).error).toBeTruthy()
  })

  test('400s on a sold-out event', async ({ request }) => {
    const response = await request.post(`/api/events/${QA_SOLD_OUT_EVENT_SLUG}/register`, {
      data: { attendeeEmail: `qa-soldout-${Date.now()}@example.com`, attendeeName: 'QA Attendee' },
    })
    expect(response.status()).toBe(400)
    expect((await response.json()).error).toBeTruthy()
  })

  test('400s on an invalid body', async ({ request }) => {
    const response = await request.post(`/api/events/${QA_OPEN_EVENT_SLUG}/register`, {
      data: {},
    })
    expect(response.status()).toBe(400)
  })
})
