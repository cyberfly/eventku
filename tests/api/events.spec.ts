import { eq } from 'drizzle-orm'
import { expect, test } from '@playwright/test'

import { bootstrapDatabase } from '@/db'
import { courses, enrollments } from '@/db/schema'

const draftSlug = `pw-draft-event-${Date.now()}`
const soldOutSlug = `pw-sold-out-event-${Date.now()}`

test.describe('/api/events', () => {
  test.beforeAll(() => {
    const db = bootstrapDatabase()

    db.insert(courses)
      .values([
        {
          slug: draftSlug,
          title: 'Playwright Draft Event',
          summary: 'Not yet published, should never appear in the public API.',
          category: 'Test',
          level: 'Beginner',
          status: 'draft',
          durationHours: 1,
          seatCap: 10,
          completionRate: 0,
          instructorName: 'Playwright',
          accent: '#000000',
          createdAt: new Date().toISOString(),
        },
        {
          slug: soldOutSlug,
          title: 'Playwright Sold Out Event',
          summary: 'Published with zero seat capacity to exercise sold-out handling.',
          category: 'Test',
          level: 'Beginner',
          status: 'published',
          durationHours: 1,
          seatCap: 0,
          completionRate: 0,
          instructorName: 'Playwright',
          accent: '#000000',
          createdAt: new Date().toISOString(),
        },
      ])
      .run()
  })

  test.afterAll(() => {
    const db = bootstrapDatabase()

    db.delete(courses).where(eq(courses.slug, draftSlug)).run()
    db.delete(courses).where(eq(courses.slug, soldOutSlug)).run()
  })

  test('GET /api/events lists only published events with parsed array fields', async ({ request }) => {
    const response = await request.get('/api/events')

    expect(response.status()).toBe(200)

    const body = await response.json()

    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.some((event: { slug: string }) => event.slug === draftSlug)).toBe(false)

    const opsEvent = body.data.find((event: { slug: string }) => event.slug === 'ops-foundations')

    expect(opsEvent).toBeTruthy()
    expect(Array.isArray(opsEvent.highlights)).toBe(true)
    expect(Array.isArray(opsEvent.takeaways)).toBe(true)
  })

  test('GET /api/events/:slug returns detail for a published slug', async ({ request }) => {
    const response = await request.get('/api/events/ops-foundations')

    expect(response.status()).toBe(200)

    const body = await response.json()

    expect(body.data.event.slug).toBe('ops-foundations')
    expect(Array.isArray(body.data.agenda)).toBe(true)
  })

  test('GET /api/events/:slug returns 404 for a draft (unpublished) event', async ({ request }) => {
    const response = await request.get(`/api/events/${draftSlug}`)

    expect(response.status()).toBe(404)

    const body = await response.json()

    expect(body.error.message).toBeTruthy()
  })

  test('GET /api/events/:slug returns 404 for an unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/does-not-exist')

    expect(response.status()).toBe(404)
  })

  test('POST /api/events/:slug/register creates a registration and rejects a duplicate', async ({ request }) => {
    const email = `pw-register-${Date.now()}@example.com`

    const created = await request.post('/api/events/ops-foundations/register', {
      data: { attendeeEmail: email, attendeeName: 'Playwright Tester' },
    })

    expect(created.status()).toBe(201)

    const createdBody = await created.json()

    expect(createdBody.data.confirmationCode).toMatch(/^NS-/)

    const duplicate = await request.post('/api/events/ops-foundations/register', {
      data: { attendeeEmail: email, attendeeName: 'Playwright Tester' },
    })

    expect(duplicate.status()).toBe(409)

    const db = bootstrapDatabase()

    db.delete(enrollments).where(eq(enrollments.learnerEmail, email.toLowerCase())).run()
  })

  test('POST /api/events/:slug/register returns 422 for invalid input', async ({ request }) => {
    const response = await request.post('/api/events/ops-foundations/register', {
      data: { attendeeEmail: 'not-an-email', attendeeName: 'A' },
    })

    expect(response.status()).toBe(422)
  })

  test('POST /api/events/:slug/register returns 404 for an unknown event', async ({ request }) => {
    const response = await request.post('/api/events/does-not-exist/register', {
      data: { attendeeEmail: 'nobody@example.com', attendeeName: 'Nobody Home' },
    })

    expect(response.status()).toBe(404)
  })

  test('POST /api/events/:slug/register returns 409 when the event is sold out', async ({ request }) => {
    const response = await request.post(`/api/events/${soldOutSlug}/register`, {
      data: { attendeeEmail: `pw-sold-out-${Date.now()}@example.com`, attendeeName: 'Sold Out Tester' },
    })

    expect(response.status()).toBe(409)
  })
})
