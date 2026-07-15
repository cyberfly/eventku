import { expect, test } from '@playwright/test'
import { bootstrapDatabase } from '../src/db/index'
import { courses, enrollments } from '../src/db/schema'

test.describe('Events API endpoints', () => {
  const draftSlug = `test-draft-event-${Date.now()}`
  const soldOutSlug = `test-sold-out-event-${Date.now()}`

  test.beforeAll(async () => {
    const db = bootstrapDatabase()

    // Create a draft course to test status filtering
    await db
      .insert(courses)
      .values({
        slug: draftSlug,
        title: 'Draft Test Event',
        summary: 'Should not appear in API catalog or detail',
        category: 'Operations',
        level: 'Beginner',
        status: 'draft',
        durationHours: 5,
        seatCap: 10,
        completionRate: 0,
        instructorName: 'Test Instructor',
        accent: '#000000',
        price: 99,
        format: 'Virtual',
        venue: 'Test Venue',
        city: 'Test City',
        audience: 'Test Audience',
        heroNote: 'Test Note',
        hostBio: 'Test Bio',
        startAt: '2026-06-01T00:00:00.000Z',
        endAt: '2026-06-01T05:00:00.000Z',
        highlights: JSON.stringify(['Draft highlight']),
        takeaways: JSON.stringify(['Draft takeaway']),
        createdAt: new Date().toISOString(),
      })
      .run()

    // Create a sold-out published course
    const soldOutCourseId = Number(
      db
        .insert(courses)
        .values({
          slug: soldOutSlug,
          title: 'Sold Out Test Event',
          summary: 'Published event with 0 remaining seats',
          category: 'Operations',
          level: 'Beginner',
          status: 'published',
          durationHours: 2,
          seatCap: 1,
          completionRate: 100,
          instructorName: 'Test Instructor',
          accent: '#000000',
          price: 99,
          format: 'Virtual',
          venue: 'Test Venue',
          city: 'Test City',
          audience: 'Test Audience',
          heroNote: 'Test Note',
          hostBio: 'Test Bio',
          startAt: '2026-06-01T00:00:00.000Z',
          endAt: '2026-06-01T02:00:00.000Z',
          highlights: JSON.stringify(['Sold out highlight']),
          takeaways: JSON.stringify(['Sold out takeaway']),
          createdAt: new Date().toISOString(),
        })
        .run().lastInsertRowid,
    )

    // Fill the 1 available seat
    db.insert(enrollments)
      .values({
        courseId: soldOutCourseId,
        learnerName: 'Existing Attendee',
        learnerEmail: 'existing-attendee@example.com',
        status: 'Active',
        progress: 0,
        enrolledAt: new Date().toISOString(),
      })
      .run()
  })

  test('GET /api/events returns only published events', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)

    const catalog = await response.json()
    expect(Array.isArray(catalog)).toBe(true)
    expect(catalog.length).toBeGreaterThan(0)

    // Verify properties on an event card
    const firstCard = catalog[0]
    expect(firstCard).toHaveProperty('slug')
    expect(firstCard).toHaveProperty('title')
    expect(firstCard).toHaveProperty('price')
    expect(firstCard).toHaveProperty('seatsRemaining')
    expect(firstCard).toHaveProperty('attendeeCount')

    // Ensure draft event is NOT returned
    const draftFound = catalog.some((card: any) => card.slug === draftSlug)
    expect(draftFound).toBe(false)
  })

  test('GET /api/events/:slug returns 404 for unknown or draft slug', async ({
    request,
  }) => {
    // Unknown slug
    const resUnknown = await request.get('/api/events/unknown-slug-9999')
    expect(resUnknown.status()).toBe(404)
    expect(await resUnknown.json()).toEqual({ error: 'Event not found.' })

    // Draft slug
    const resDraft = await request.get(`/api/events/${draftSlug}`)
    expect(resDraft.status()).toBe(404)
    expect(await resDraft.json()).toEqual({ error: 'Event not found.' })
  })

  test('GET /api/events/:slug returns event details, agenda, and attendee preview for valid slug', async ({
    request,
  }) => {
    const response = await request.get('/api/events/ops-foundations')
    expect(response.status()).toBe(200)

    const detail = await response.json()
    expect(detail).toHaveProperty('event')
    expect(detail.event.title).toBe('Operations Foundations')
    expect(detail).toHaveProperty('agenda')
    expect(Array.isArray(detail.agenda)).toBe(true)
    expect(detail).toHaveProperty('attendeePreview')
    expect(Array.isArray(detail.attendeePreview)).toBe(true)
  })

  test('POST /api/events/:slug/register succeeds and returns 400 on duplicate email', async ({
    request,
  }) => {
    const testEmail = `new-attendee-${Date.now()}@example.com`
    const testName = 'New Attendee Test'

    // First registration should succeed
    const resCreate = await request.post('/api/events/ops-foundations/register', {
      data: {
        attendeeName: testName,
        attendeeEmail: testEmail,
      },
    })
    expect(resCreate.status()).toBe(201)
    const bodyCreate = await resCreate.json()
    expect(bodyCreate.confirmationCode).toMatch(/^NS-\d+-\d+$/)

    // Duplicate registration should return 400
    const resDuplicate = await request.post(
      '/api/events/ops-foundations/register',
      {
        data: {
          attendeeName: testName,
          attendeeEmail: testEmail,
        },
      },
    )
    expect(resDuplicate.status()).toBe(400)
    const bodyDuplicate = await resDuplicate.json()
    expect(bodyDuplicate.error).toBe(
      'This attendee already has a confirmed registration.',
    )
  })

  test('POST /api/events/:slug/register returns 400 when event is sold out', async ({
    request,
  }) => {
    const resSoldOut = await request.post(`/api/events/${soldOutSlug}/register`, {
      data: {
        attendeeName: 'Sold Out Candidate',
        attendeeEmail: `candidate-${Date.now()}@example.com`,
      },
    })
    expect(resSoldOut.status()).toBe(400)
    const bodySoldOut = await resSoldOut.json()
    expect(bodySoldOut.error).toBe('This event is sold out.')
  })

  test('POST /api/events/:slug/register returns 400 when validation fails', async ({
    request,
  }) => {
    const resInvalid = await request.post('/api/events/ops-foundations/register', {
      data: {
        attendeeName: 'A', // Too short (< 2)
        attendeeEmail: 'not-an-email',
      },
    })
    expect(resInvalid.status()).toBe(400)
    const bodyInvalid = await resInvalid.json()
    expect(bodyInvalid).toHaveProperty('error')
  })
})
