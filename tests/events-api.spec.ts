import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'

import { bootstrapDatabase } from '../src/db'
import { courses, enrollments } from '../src/db/schema'

type EventCard = { slug: string; status?: string }

const DRAFT_SLUG = 'events-api-test-draft'
const SOLD_OUT_SLUG = 'events-api-test-sold-out'

function baseCourseRow(overrides: Partial<typeof courses.$inferInsert>) {
  return {
    slug: overrides.slug!,
    title: 'Events API Test Course',
    summary: 'A course created only for events API test coverage.',
    category: 'Operations',
    level: 'Beginner',
    status: 'published',
    durationHours: 4,
    seatCap: 1,
    completionRate: 0,
    instructorName: 'Test Instructor',
    accent: '#0c7d69',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

test.describe('events API', () => {
  test.beforeAll(async () => {
    const database = bootstrapDatabase()

    database.delete(courses).where(eq(courses.slug, DRAFT_SLUG)).run()
    database.delete(courses).where(eq(courses.slug, SOLD_OUT_SLUG)).run()

    database
      .insert(courses)
      .values(baseCourseRow({ slug: DRAFT_SLUG, status: 'draft' }))
      .run()

    const soldOutCourse = database
      .insert(courses)
      .values(baseCourseRow({ slug: SOLD_OUT_SLUG, seatCap: 1 }))
      .returning({ id: courses.id })
      .get()

    database
      .insert(enrollments)
      .values({
        courseId: soldOutCourse.id,
        learnerName: 'Existing Attendee',
        learnerEmail: 'existing-attendee@example.com',
        status: 'Confirmed',
        progress: 0,
        enrolledAt: new Date().toISOString(),
      })
      .run()
  })

  test.afterAll(async () => {
    const database = bootstrapDatabase()

    database.delete(courses).where(eq(courses.slug, DRAFT_SLUG)).run()
    database.delete(courses).where(eq(courses.slug, SOLD_OUT_SLUG)).run()
  })

  test('GET /api/events lists only published events', async ({ request }) => {
    const response = await request.get('/api/events')

    expect(response.status()).toBe(200)

    const events = (await response.json()) as EventCard[]

    expect(events.length).toBeGreaterThan(0)
    expect(events.some((event) => event.slug === DRAFT_SLUG)).toBe(false)
  })

  test('GET /api/events/:slug 404s for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist')

    expect(response.status()).toBe(404)
    expect(await response.json()).toEqual({ error: 'Event not found.' })
  })

  test('GET /api/events/:slug 404s for a draft slug', async ({ request }) => {
    const response = await request.get(`/api/events/${DRAFT_SLUG}`)

    expect(response.status()).toBe(404)
    expect(await response.json()).toEqual({ error: 'Event not found.' })
  })

  test('POST /api/events/:slug/register succeeds then rejects a duplicate email', async ({
    request,
  }) => {
    const email = `duplicate-check-${Date.now()}@example.com`

    const firstResponse = await request.post('/api/events/ops-foundations/register', {
      data: { attendeeName: 'First Timer', attendeeEmail: email },
    })

    expect(firstResponse.status()).toBe(201)
    expect((await firstResponse.json()).confirmationCode).toMatch(/^NS-/)

    const secondResponse = await request.post('/api/events/ops-foundations/register', {
      data: { attendeeName: 'First Timer', attendeeEmail: email },
    })

    expect(secondResponse.status()).toBe(409)
    expect(await secondResponse.json()).toEqual({
      error: 'This attendee already has a confirmed registration.',
    })
  })

  test('POST /api/events/:slug/register 400s on a sold-out event', async ({ request }) => {
    const response = await request.post(`/api/events/${SOLD_OUT_SLUG}/register`, {
      data: { attendeeName: 'Latecomer', attendeeEmail: 'latecomer@example.com' },
    })

    expect(response.status()).toBe(400)
    expect(await response.json()).toEqual({ error: 'This event is sold out.' })
  })
})
