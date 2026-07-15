import { expect, test } from '@playwright/test'
import { inArray } from 'drizzle-orm'

import { bootstrapDatabase } from '../src/db'
import { courses, enrollments, lessons, modules } from '../src/db/schema'

const fixtureSlugs = [
  'api-published-event',
  'api-draft-event',
  'api-sold-out-event',
]

test.beforeAll(() => {
  const database = bootstrapDatabase()
  const existingCourses = database
    .select()
    .from(courses)
    .where(inArray(courses.slug, fixtureSlugs))
    .all()
  const courseIds = existingCourses.map((course) => course.id)

  if (courseIds.length > 0) {
    const moduleRows = database
      .select()
      .from(modules)
      .where(inArray(modules.courseId, courseIds))
      .all()
    const moduleIds = moduleRows.map((module) => module.id)

    if (moduleIds.length > 0) {
      database.delete(lessons).where(inArray(lessons.moduleId, moduleIds)).run()
    }

    database.delete(enrollments).where(inArray(enrollments.courseId, courseIds)).run()
    database.delete(modules).where(inArray(modules.courseId, courseIds)).run()
    database.delete(courses).where(inArray(courses.id, courseIds)).run()
  }

  const now = new Date().toISOString()
  const publishedCourseId = Number(
    database
      .insert(courses)
      .values(buildCourseFixture({
        seatCap: 5,
        slug: 'api-published-event',
        status: 'published',
        title: 'API Published Event',
      }))
      .run().lastInsertRowid,
  )
  database
    .insert(courses)
    .values(buildCourseFixture({
      seatCap: 5,
      slug: 'api-draft-event',
      status: 'draft',
      title: 'API Draft Event',
    }))
    .run()
  const soldOutCourseId = Number(
    database
      .insert(courses)
      .values(buildCourseFixture({
        seatCap: 1,
        slug: 'api-sold-out-event',
        status: 'published',
        title: 'API Sold Out Event',
      }))
      .run().lastInsertRowid,
  )
  const moduleId = Number(
    database
      .insert(modules)
      .values({
        courseId: publishedCourseId,
        durationMinutes: 90,
        position: 1,
        summary: 'API module summary.',
        title: 'API Module',
      })
      .run().lastInsertRowid,
  )
  database
    .insert(lessons)
    .values([
      {
        durationMinutes: 45,
        isPreview: true,
        lessonType: 'Workshop',
        moduleId,
        position: 1,
        title: 'API Lesson',
      },
    ])
    .run()
  database
    .insert(enrollments)
    .values([
      {
        courseId: soldOutCourseId,
        enrolledAt: now,
        learnerEmail: 'soldout@example.com',
        learnerName: 'Sold Out Attendee',
        progress: 0,
        status: 'Confirmed',
      },
    ])
    .run()
})

test('lists only published events with parsed arrays', async ({ request }) => {
  const response = await request.get('/api/events')

  expect(response.ok()).toBeTruthy()

  const events = await response.json()
  const publishedEvent = events.find((event: { slug: string }) => event.slug === 'api-published-event')

  expect(events.some((event: { slug: string }) => event.slug === 'api-draft-event')).toBe(false)
  expect(publishedEvent).toMatchObject({
    highlights: ['API highlight'],
    seatsRemaining: 5,
    slug: 'api-published-event',
    takeaways: ['API takeaway'],
    title: 'API Published Event',
  })
})

test('returns event detail and hides unknown or draft events', async ({ request }) => {
  const response = await request.get('/api/events/api-published-event')

  expect(response.ok()).toBeTruthy()

  const detail = await response.json()

  expect(detail.event).toMatchObject({
    highlights: ['API highlight'],
    lessonCount: 1,
    moduleCount: 1,
    slug: 'api-published-event',
    takeaways: ['API takeaway'],
  })
  expect(detail.agenda[0].sessions[0]).toMatchObject({
    title: 'API Lesson',
  })

  const missingResponse = await request.get('/api/events/not-a-real-event')
  const draftResponse = await request.get('/api/events/api-draft-event')

  await expectJsonError(missingResponse, 404)
  await expectJsonError(draftResponse, 404)
})

test('registers an attendee and rejects duplicate email', async ({ request }) => {
  const registration = {
    attendeeEmail: `api-attendee-${Date.now()}@example.com`,
    attendeeName: 'API Attendee',
  }
  const response = await request.post('/api/events/api-published-event/register', {
    data: registration,
  })

  expect(response.status()).toBe(201)
  expect(await response.json()).toMatchObject({
    confirmationCode: expect.stringMatching(/^NS-\d+-\d{4}$/),
  })

  const duplicateResponse = await request.post('/api/events/api-published-event/register', {
    data: registration,
  })

  await expectJsonError(duplicateResponse, 409)
})

test('validates request body and rejects sold-out registrations', async ({ request }) => {
  const invalidResponse = await request.post('/api/events/api-published-event/register', {
    data: {
      attendeeEmail: 'not-an-email',
      attendeeName: 'A',
    },
  })

  await expectJsonError(invalidResponse, 400)

  const soldOutResponse = await request.post('/api/events/api-sold-out-event/register', {
    data: {
      attendeeEmail: 'late-attendee@example.com',
      attendeeName: 'Late Attendee',
    },
  })

  await expectJsonError(soldOutResponse, 409)
})

function buildCourseFixture(input: {
  seatCap: number
  slug: string
  status: 'draft' | 'published'
  title: string
}) {
  return {
    accent: '#0c7d69',
    audience: 'API clients and integration testers',
    category: 'Operations',
    city: 'Kuala Lumpur',
    completionRate: 0,
    createdAt: '2026-07-15T00:00:00.000Z',
    durationHours: 2,
    endAt: '2026-08-01T04:00:00.000Z',
    format: 'Virtual',
    heroNote: 'API test event.',
    highlights: JSON.stringify(['API highlight']),
    hostBio: 'A host bio long enough for the event course validator shape.',
    instructorName: 'API Host',
    level: 'Beginner',
    price: 99,
    seatCap: input.seatCap,
    slug: input.slug,
    startAt: '2026-08-01T02:00:00.000Z',
    status: input.status,
    summary: `${input.title} summary for API route testing.`,
    takeaways: JSON.stringify(['API takeaway']),
    title: input.title,
    venue: 'Eventku API Room',
  }
}

async function expectJsonError(response: { json: () => Promise<unknown>; status: () => number }, status: number) {
  expect(response.status()).toBe(status)
  expect(await response.json()).toEqual({
    error: expect.any(String),
  })
}
