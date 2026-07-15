import { test, expect } from '@playwright/test'

test.describe('Events API', () => {
  test('GET /api/events returns a list of published events', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(200)
    
    const events = await response.json()
    expect(Array.isArray(events)).toBeTruthy()
    // It should have at least one event in the test database
    expect(events.length).toBeGreaterThan(0)
    
    // Check if the event has expected fields
    expect(events[0]).toHaveProperty('slug')
    expect(events[0]).toHaveProperty('title')
  })

  test('GET /api/events/:eventSlug returns event details for valid slug', async ({ request }) => {
    // Assuming 'ops-foundations' is a seeded published event
    const response = await request.get('/api/events/ops-foundations')
    expect(response.status()).toBe(200)
    
    const detail = await response.json()
    expect(detail).toHaveProperty('event')
    expect(detail.event.slug).toBe('ops-foundations')
    expect(detail).toHaveProperty('agenda')
    expect(detail).toHaveProperty('attendeePreview')
  })

  test('GET /api/events/:eventSlug returns 404 for unknown slug', async ({ request }) => {
    const response = await request.get('/api/events/unknown-invalid-slug')
    expect(response.status()).toBe(404)
    
    const body = await response.json()
    expect(body.error).toBe('Event not found')
  })

  test('POST /api/events/:eventSlug/register works correctly', async ({ request }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`
    
    // First registration should succeed
    const response1 = await request.post('/api/events/ops-foundations/register', {
      data: {
        attendeeName: 'Test Attendee',
        attendeeEmail: uniqueEmail,
      }
    })
    expect(response1.status()).toBe(200)
    
    const body1 = await response1.json()
    expect(body1).toHaveProperty('confirmationCode')
    
    // Duplicate registration with same email should fail
    const response2 = await request.post('/api/events/ops-foundations/register', {
      data: {
        attendeeName: 'Test Attendee',
        attendeeEmail: uniqueEmail,
      }
    })
    expect(response2.status()).toBe(400)
    
    const body2 = await response2.json()
    expect(body2.error).toBe('This attendee already has a confirmed registration.')
  })
})
