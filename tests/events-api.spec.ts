import { expect, test } from '@playwright/test'
import Database from 'better-sqlite3'
import { resolve } from 'node:path'

const draftSlug = 'api-test-draft-event'
const soldOutSlug = 'api-test-sold-out-event'
const registrationEmail = `api-test-${Date.now()}@example.com`
let database: Database.Database

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  // Bootstrap migrations and seed data before adding isolated API fixtures.
  await request.get('/api/events')

  database = new Database(resolve(process.cwd(), process.env.DB_FILE_NAME ?? './data/lms.sqlite'))
  database.prepare('DELETE FROM courses WHERE slug IN (?, ?)').run(draftSlug, soldOutSlug)

  const insertCourse = database.prepare(`
    INSERT INTO courses (
      slug, title, summary, category, level, status, duration_hours, seat_cap,
      completion_rate, instructor_name, accent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertCourse.run(
    draftSlug,
    'Draft API Test Event',
    'A draft event fixture that must never be exposed by the public events API.',
    'Operations',
    'Beginner',
    'draft',
    1,
    2,
    0,
    'API Test Host',
    '#0c7d69',
    new Date().toISOString(),
  )

  const soldOutResult = insertCourse.run(
    soldOutSlug,
    'Sold Out API Test Event',
    'A published event fixture used to verify sold-out registration responses.',
    'Operations',
    'Beginner',
    'published',
    1,
    1,
    0,
    'API Test Host',
    '#0c7d69',
    new Date().toISOString(),
  )

  database.prepare(`
    INSERT INTO enrollments (
      course_id, learner_name, learner_email, status, progress, enrolled_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    Number(soldOutResult.lastInsertRowid),
    'Existing Attendee',
    'sold-out-fixture@example.com',
    'Confirmed',
    0,
    new Date().toISOString(),
  )
})

test.afterAll(() => {
  if (!database) return

  database.prepare('DELETE FROM enrollments WHERE learner_email = ?').run(registrationEmail)
  database.prepare('DELETE FROM courses WHERE slug IN (?, ?)').run(draftSlug, soldOutSlug)
  database.close()
})

test('lists only published events with parsed string lists', async ({ request }) => {
  const response = await request.get('/api/events')

  expect(response.status()).toBe(200)
  const events = await response.json()
  expect(Array.isArray(events)).toBe(true)
  expect(events.some((event: { slug: string }) => event.slug === draftSlug)).toBe(false)
  expect(events.some((event: { slug: string }) => event.slug === soldOutSlug)).toBe(true)
  expect(events.every((event: { highlights: unknown; takeaways: unknown }) =>
    Array.isArray(event.highlights) && Array.isArray(event.takeaways),
  )).toBe(true)
})

test('returns event detail and 404s for unknown or draft slugs', async ({ request }) => {
  const detail = await request.get('/api/events/ops-foundations')
  expect(detail.status()).toBe(200)
  await expect(detail.json()).resolves.toMatchObject({
    event: { slug: 'ops-foundations' },
    agenda: expect.any(Array),
    attendeePreview: expect.any(Array),
  })

  for (const slug of ['not-a-real-event', draftSlug]) {
    const response = await request.get(`/api/events/${slug}`)
    expect(response.status()).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Event not found.' })
  }
})

test('registers an attendee and rejects the duplicate email', async ({ request }) => {
  const registration = {
    attendeeName: 'API Test Attendee',
    attendeeEmail: registrationEmail,
  }
  const first = await request.post('/api/events/ops-foundations/register', {
    data: registration,
  })

  expect(first.status()).toBe(201)
  await expect(first.json()).resolves.toEqual({
    confirmationCode: expect.stringMatching(/^NS-1-\d{4,}$/),
  })

  const duplicate = await request.post('/api/events/ops-foundations/register', {
    data: registration,
  })
  expect(duplicate.status()).toBe(409)
  await expect(duplicate.json()).resolves.toEqual({
    error: 'This attendee already has a confirmed registration.',
  })
})

test('returns client errors for invalid input and sold-out events', async ({ request }) => {
  const invalid = await request.post('/api/events/ops-foundations/register', {
    data: { attendeeName: '', attendeeEmail: 'not-an-email' },
  })
  expect(invalid.status()).toBe(400)
  expect(await invalid.json()).toHaveProperty('error')

  const soldOut = await request.post(`/api/events/${soldOutSlug}/register`, {
    data: {
      attendeeName: 'Another Attendee',
      attendeeEmail: 'another-attendee@example.com',
    },
  })
  expect(soldOut.status()).toBe(409)
  await expect(soldOut.json()).resolves.toEqual({ error: 'This event is sold out.' })
})
