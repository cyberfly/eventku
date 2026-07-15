import { eq } from 'drizzle-orm'

import { bootstrapDatabase } from '../../src/db'
import { courses } from '../../src/db/schema'

export const QA_OPEN_EVENT_SLUG = 'qa-open-event'
export const QA_SOLD_OUT_EVENT_SLUG = 'qa-sold-out-event'
export const QA_DRAFT_EVENT_SLUG = 'qa-draft-event'

function upsertQaCourse(input: {
  slug: string
  title: string
  seatCap: number
  status?: 'draft' | 'published'
}) {
  const database = bootstrapDatabase()
  const status = input.status ?? 'published'
  const existing = database
    .select()
    .from(courses)
    .where(eq(courses.slug, input.slug))
    .get()

  if (existing) {
    database
      .update(courses)
      .set({ seatCap: input.seatCap, status })
      .where(eq(courses.id, existing.id))
      .run()

    return
  }

  database
    .insert(courses)
    .values({
      slug: input.slug,
      title: input.title,
      summary: 'Fixture event maintained for Playwright API coverage.',
      category: 'Operations',
      level: 'Beginner',
      status,
      durationHours: 4,
      seatCap: input.seatCap,
      completionRate: 0,
      instructorName: 'QA Fixture Host',
      accent: '#0c7d69',
      createdAt: new Date().toISOString(),
    })
    .run()
}

export function ensureQaFixtureEvents() {
  upsertQaCourse({ slug: QA_OPEN_EVENT_SLUG, title: 'QA Open Event', seatCap: 100000 })
  upsertQaCourse({ slug: QA_SOLD_OUT_EVENT_SLUG, title: 'QA Sold Out Event', seatCap: 0 })
  upsertQaCourse({
    slug: QA_DRAFT_EVENT_SLUG,
    title: 'QA Draft Event',
    status: 'draft',
    seatCap: 10,
  })
}
