import { expect, test } from '@playwright/test'

import {
  addTestEnrollment,
  deleteTestCourses,
  insertTestCourse,
} from './fixtures/events-db'

test.use({ storageState: { cookies: [], origins: [] } })

const draftSlug = 'api-test-draft-event'
const registerSlug = 'api-test-register-event'
const soldOutSlug = 'api-test-sold-out-event'

test.describe('Events API', () => {
  test.beforeAll(() => {
    insertTestCourse({ slug: draftSlug, status: 'draft', seatCap: 10 })
    insertTestCourse({ slug: registerSlug, status: 'published', seatCap: 5 })

    const soldOutCourseId = insertTestCourse({
      slug: soldOutSlug,
      status: 'published',
      seatCap: 1,
    })
    addTestEnrollment(soldOutCourseId, 'sold-out-holder@example.com')
  })

  test.afterAll(() => {
    deleteTestCourses([draftSlug, registerSlug, soldOutSlug])
  })

  test('GET /api/events lists only published events', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)

    const events = await response.json()
    const slugs = events.map((event: { slug: string }) => event.slug)

    expect(slugs).toContain('ops-foundations')
    expect(slugs).not.toContain(draftSlug)
  })

  test('GET /api/events/:slug 404s for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist')

    expect(response.status()).toBe(404)
    expect(await response.json()).toEqual({ error: expect.any(String) })
  })

  test('GET /api/events/:slug 404s for a draft slug', async ({ request }) => {
    const response = await request.get(`/api/events/${draftSlug}`)

    expect(response.status()).toBe(404)
  })

  test('GET /api/events/:slug returns detail for a published slug', async ({ request }) => {
    const response = await request.get('/api/events/ops-foundations')
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.event.slug).toBe('ops-foundations')
    expect(Array.isArray(body.agenda)).toBe(true)
    expect(Array.isArray(body.attendeePreview)).toBe(true)
  })

  test('POST /api/events/:slug/register succeeds then rejects a duplicate email', async ({ request }) => {
    const attendeeEmail = `playwright-${Date.now()}@example.com`

    const first = await request.post(`/api/events/${registerSlug}/register`, {
      data: { attendeeName: 'Playwright Tester', attendeeEmail },
    })
    expect(first.status()).toBe(200)
    expect((await first.json()).confirmationCode).toEqual(expect.any(String))

    const second = await request.post(`/api/events/${registerSlug}/register`, {
      data: { attendeeName: 'Playwright Tester', attendeeEmail },
    })
    expect(second.status()).toBe(409)
    expect(await second.json()).toEqual({ error: expect.any(String) })
  })

  test('POST /api/events/:slug/register 400s on a sold-out event', async ({ request }) => {
    const response = await request.post(`/api/events/${soldOutSlug}/register`, {
      data: { attendeeName: 'Late Arrival', attendeeEmail: 'late@example.com' },
    })

    expect(response.status()).toBe(400)
    expect(await response.json()).toEqual({ error: expect.any(String) })
  })
})
