import 'dotenv/config'

import { resolve } from 'node:path'

import Database from 'better-sqlite3'
import { inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'

import * as schema from '../../src/db/schema'

const databaseFile = resolve(
  process.cwd(),
  process.env.DB_FILE_NAME ?? './data/lms.sqlite',
)

const sqlite = new Database(databaseFile)
const testDb = drizzle(sqlite, { schema })

export function insertTestCourse(course: {
  slug: string
  status: 'draft' | 'published'
  seatCap: number
}) {
  const result = testDb
    .insert(schema.courses)
    .values({
      slug: course.slug,
      status: course.status,
      seatCap: course.seatCap,
      title: `Test event ${course.slug}`,
      summary: 'Fixture event created for Playwright API coverage.',
      category: 'Operations',
      level: 'Beginner',
      durationHours: 2,
      completionRate: 0,
      instructorName: 'Fixture Host',
      accent: '#0c7d69',
      createdAt: new Date().toISOString(),
    })
    .run()

  return Number(result.lastInsertRowid)
}

export function addTestEnrollment(courseId: number, email: string) {
  testDb
    .insert(schema.enrollments)
    .values({
      courseId,
      learnerName: 'Fixture Attendee',
      learnerEmail: email,
      status: 'Confirmed',
      progress: 0,
      enrolledAt: new Date().toISOString(),
    })
    .run()
}

export function deleteTestCourses(slugs: string[]) {
  const rows = testDb
    .select({ id: schema.courses.id })
    .from(schema.courses)
    .where(inArray(schema.courses.slug, slugs))
    .all()
  const ids = rows.map((row) => row.id)

  if (ids.length === 0) {
    return
  }

  testDb.delete(schema.enrollments).where(inArray(schema.enrollments.courseId, ids)).run()
  testDb.delete(schema.courses).where(inArray(schema.courses.id, ids)).run()
}
