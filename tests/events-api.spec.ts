import { test, expect } from '@playwright/test'

const SEEDED_SLUG = 'ops-foundations'

function buildEventPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'API Test Event',
    slug: `api-test-event-${Date.now()}`,
    summary: 'A summary describing this API-created test event in detail.',
    category: 'Operations',
    level: 'Beginner',
    status: 'published',
    durationHours: 4,
    seatCap: 10,
    completionRate: 0,
    instructorName: 'Test Instructor',
    accent: '#0c7d69',
    price: 99,
    format: 'Virtual',
    venue: 'Test Venue',
    city: 'Test City',
    audience: 'Test audience members',
    heroNote: 'A live test event',
    hostBio: 'A host bio that is long enough to pass validation checks.',
    startAt: '2026-06-01T00:00:00.000Z',
    endAt: '2026-06-01T01:00:00.000Z',
    highlights: ['A highlight'],
    takeaways: ['A takeaway'],
    featuredImage: null,
    ...overrides,
  }
}

test.describe('GET /api/events', () => {
  test('lists published events', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)

    const events = await response.json()
    expect(Array.isArray(events)).toBe(true)
    expect(events.some((event: { slug: string }) => event.slug === SEEDED_SLUG)).toBe(true)
  })
})

test.describe('GET /api/events/:slug', () => {
  test('returns detail for a known slug', async ({ request }) => {
    const response = await request.get(`/api/events/${SEEDED_SLUG}`)
    expect(response.status()).toBe(200)

    const body = await response.json()
    expect(body.event.slug).toBe(SEEDED_SLUG)
  })

  test('returns 404 for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist')
    expect(response.status()).toBe(404)
  })
})

test.describe('event CRUD lifecycle', () => {
  test('create, update, and delete an event', async ({ request }) => {
    const created = await request.post('/api/events', {
      data: buildEventPayload(),
    })
    expect(created.status()).toBe(201)
    const createdBody = await created.json()
    const { slug } = createdBody

    const updated = await request.put(`/api/events/${slug}`, {
      data: buildEventPayload({ slug, title: 'API Test Event Updated' }),
    })
    expect(updated.status()).toBe(200)

    const detail = await request.get(`/api/events/${slug}`)
    expect((await detail.json()).event.title).toBe('API Test Event Updated')

    const deleted = await request.delete(`/api/events/${slug}`)
    expect(deleted.status()).toBe(200)

    const afterDelete = await request.get(`/api/events/${slug}`)
    expect(afterDelete.status()).toBe(404)
  })

  test('rejects invalid create payload', async ({ request }) => {
    const response = await request.post('/api/events', {
      data: buildEventPayload({ title: 'ab' }),
    })
    expect(response.status()).toBe(400)
  })
})

test.describe('POST /api/events/:slug/register', () => {
  test('registers a new attendee', async ({ request }) => {
    const email = `attendee-${Date.now()}@example.com`
    const response = await request.post(`/api/events/${SEEDED_SLUG}/register`, {
      data: { attendeeName: 'Test Attendee', attendeeEmail: email },
    })
    expect(response.status()).toBe(201)

    const duplicate = await request.post(`/api/events/${SEEDED_SLUG}/register`, {
      data: { attendeeName: 'Test Attendee', attendeeEmail: email },
    })
    expect(duplicate.status()).toBe(409)
  })

  test('returns 404 for an unknown event', async ({ request }) => {
    const response = await request.post('/api/events/does-not-exist/register', {
      data: { attendeeName: 'Test Attendee', attendeeEmail: 'test@example.com' },
    })
    expect(response.status()).toBe(404)
  })
})
