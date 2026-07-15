import { eq } from 'drizzle-orm'
import { expect, test } from '@playwright/test'

import { bootstrapDatabase } from '@/db'
import { courses } from '@/db/schema'

const PUBLISHED_SLUG = 'ops-foundations'

async function createTestCourse(overrides: Partial<typeof courses.$inferInsert> = {}) {
  const database = bootstrapDatabase()
  const slug = `test-course-${Date.now()}-${Math.round(Math.random() * 1e6)}`

  database
    .insert(courses)
    .values({
      slug,
      title: 'Test Course',
      summary: 'A test-only course seeded directly for API coverage.',
      category: 'Operations',
      level: 'Beginner',
      status: 'published',
      durationHours: 1,
      seatCap: 10,
      completionRate: 0,
      instructorName: 'Test Host',
      accent: '#0c7d69',
      createdAt: new Date().toISOString(),
      ...overrides,
    })
    .run()

  return slug
}

async function deleteTestCourse(slug: string) {
  const database = bootstrapDatabase()

  database.delete(courses).where(eq(courses.slug, slug)).run()
}

test.describe('GET /api/events', () => {
  test('lists only published events', async ({ request }) => {
    const draftSlug = await createTestCourse({ status: 'draft' })

    try {
      const response = await request.get('/api/events')
      expect(response.ok()).toBeTruthy()

      const events = await response.json()

      expect(Array.isArray(events)).toBe(true)
      expect(events.some((event: { slug: string }) => event.slug === PUBLISHED_SLUG)).toBe(true)
      expect(events.some((event: { slug: string }) => event.slug === draftSlug)).toBe(false)
    } finally {
      await deleteTestCourse(draftSlug)
    }
  })
})

test.describe('GET /api/events/:slug', () => {
  test('404s for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist')

    expect(response.status()).toBe(404)
    expect((await response.json()).error).toBeTruthy()
  })

  test('404s for a draft slug', async ({ request }) => {
    const draftSlug = await createTestCourse({ status: 'draft' })

    try {
      const response = await request.get(`/api/events/${draftSlug}`)

      expect(response.status()).toBe(404)
      expect((await response.json()).error).toBeTruthy()
    } finally {
      await deleteTestCourse(draftSlug)
    }
  })

  test('returns event detail for a published slug', async ({ request }) => {
    const response = await request.get(`/api/events/${PUBLISHED_SLUG}`)

    expect(response.ok()).toBeTruthy()

    const body = await response.json()

    expect(body.event.slug).toBe(PUBLISHED_SLUG)
    expect(Array.isArray(body.agenda)).toBe(true)
    expect(Array.isArray(body.attendeePreview)).toBe(true)
  })
})

test.describe('POST /api/events/:slug/register', () => {
  test('succeeds then rejects a duplicate email', async ({ request }) => {
    const slug = await createTestCourse()
    const email = `attendee-${Date.now()}@example.com`

    try {
      const first = await request.post(`/api/events/${slug}/register`, {
        data: { attendeeEmail: email, attendeeName: 'Test Attendee' },
      })

      expect(first.status()).toBe(201)
      expect((await first.json()).confirmationCode).toBeTruthy()

      const second = await request.post(`/api/events/${slug}/register`, {
        data: { attendeeEmail: email, attendeeName: 'Test Attendee' },
      })

      expect(second.status()).toBe(400)
      expect((await second.json()).error).toBeTruthy()
    } finally {
      await deleteTestCourse(slug)
    }
  })

  test('400s on a sold-out event', async ({ request }) => {
    const slug = await createTestCourse({ seatCap: 0 })

    try {
      const response = await request.post(`/api/events/${slug}/register`, {
        data: { attendeeEmail: 'sold-out@example.com', attendeeName: 'Test Attendee' },
      })

      expect(response.status()).toBe(400)
      expect((await response.json()).error).toBeTruthy()
    } finally {
      await deleteTestCourse(slug)
    }
  })

  test('404s for an unknown slug', async ({ request }) => {
    const response = await request.post('/api/events/does-not-exist/register', {
      data: { attendeeEmail: 'unknown-event@example.com', attendeeName: 'Test Attendee' },
    })

    expect(response.status()).toBe(404)
    expect((await response.json()).error).toBeTruthy()
  })

  test('400s on invalid input', async ({ request }) => {
    const response = await request.post(`/api/events/${PUBLISHED_SLUG}/register`, {
      data: { attendeeEmail: 'not-an-email', attendeeName: 'a' },
    })

    expect(response.status()).toBe(400)
    expect((await response.json()).error).toBeTruthy()
  })
})
