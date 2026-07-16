import { eq } from 'drizzle-orm'
import { expect, test } from '@playwright/test'

import { bootstrapDatabase } from '@/db'
import { courses, organizers } from '@/db/schema'

test.use({ storageState: { cookies: [], origins: [] } })

const eventSlug = `pw-order-event-${Date.now()}`
const attendeeEmail = `pw-order-${Date.now()}@example.com`
const attendeeName = 'Playwright Order Buyer'

test.describe('order module', () => {
  test.beforeAll(() => {
    const db = bootstrapDatabase()
    const organizer = db.select().from(organizers).limit(1).all()[0]

    db.insert(courses)
      .values({
        slug: eventSlug,
        title: 'Playwright Order Event',
        summary: 'Event used to exercise the order creation flow end to end.',
        category: 'Test',
        level: 'Beginner',
        status: 'published',
        durationHours: 1,
        seatCap: 5,
        completionRate: 0,
        instructorName: 'Playwright',
        accent: '#000000',
        organizerId: organizer?.id ?? null,
        price: 199,
        createdAt: new Date().toISOString(),
      })
      .run()
  })

  test.afterAll(() => {
    const db = bootstrapDatabase()

    db.delete(courses).where(eq(courses.slug, eventSlug)).run()
  })

  test('purchasing an event seat creates an order visible on the organizer orders page', async ({ page }) => {
    await page.goto(`/events/${eventSlug}`)
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Who is attending?').fill(attendeeName)
    await page.getByPlaceholder('name@example.com').fill(attendeeEmail)
    await page.getByRole('button', { name: 'Purchase seat' }).click()

    const successMessage = page.locator('.form-success')
    await expect(successMessage).toContainText('Order confirmed. Reference EK-')

    const orderReference = (await successMessage.textContent())?.match(/Reference (EK-[\w-]+)\./)?.[1]
    expect(orderReference).toBeTruthy()

    await page.goto('/organizer/login')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL('/organizer')

    await page.goto('/organizer/orders')

    const orderRow = page.locator('.support-row', { hasText: orderReference! })
    await expect(orderRow).toContainText(attendeeName)
    await expect(orderRow).toContainText(attendeeEmail)
    await expect(orderRow).toContainText('RM 199')
    await expect(orderRow).toContainText('confirmed')
  })

  test('the organizer orders page redirects to login when signed out', async ({ page }) => {
    await page.goto('/organizer/orders')
    await page.waitForURL('/organizer/login')
  })
})
