import { randomUUID } from 'node:crypto'

import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { eq, isNull } from 'drizzle-orm'

import { normalizeEmail } from '@/lib/organizer-auth'
import * as schema from './schema'

const courseSeed = [
  {
    id: 1,
    slug: 'ops-foundations',
    title: 'Operations Foundations',
    summary:
      'A practical onboarding track for support leads covering SOP design, queue health, and learner-facing incident response.',
    category: 'Operations',
    level: 'Beginner',
    durationHours: 18,
    seatCap: 35,
    completionRate: 76,
    instructorName: 'Aimee Santos',
    accent: '#0c7d69',
    createdAt: '2026-03-01T09:00:00.000Z',
  },
  {
    id: 2,
    slug: 'cohort-playbooks',
    title: 'Cohort Playbooks',
    summary:
      'Reusable delivery systems for cohort-based learning, from launch checklists to high-touch office hour rhythms.',
    category: 'Program Design',
    level: 'Intermediate',
    durationHours: 24,
    seatCap: 28,
    completionRate: 84,
    instructorName: 'Mira Tan',
    accent: '#d46f31',
    createdAt: '2026-03-04T09:00:00.000Z',
  },
  {
    id: 3,
    slug: 'analytics-for-academies',
    title: 'Analytics for Academies',
    summary:
      'Build a reporting stack for training programs with dashboards, completion signals, and executive-ready summaries.',
    category: 'Analytics',
    level: 'Advanced',
    durationHours: 30,
    seatCap: 22,
    completionRate: 69,
    instructorName: 'Rohan Patel',
    accent: '#1a4f8c',
    createdAt: '2026-03-07T09:00:00.000Z',
  },
]

const moduleSeed = [
  { id: 1, courseId: 1, title: 'Queue Fundamentals', summary: 'Build the support operating model.', position: 1, durationMinutes: 180 },
  { id: 2, courseId: 1, title: 'Service Recovery', summary: 'Respond to blockers without losing trust.', position: 2, durationMinutes: 210 },
  { id: 3, courseId: 2, title: 'Launch Architecture', summary: 'Design the cohort runbook and kickoff.', position: 1, durationMinutes: 240 },
  { id: 4, courseId: 2, title: 'Facilitation Systems', summary: 'Keep learners engaged between live sessions.', position: 2, durationMinutes: 240 },
  { id: 5, courseId: 3, title: 'Signal Design', summary: 'Map learner behavior into measurable signals.', position: 1, durationMinutes: 270 },
  { id: 6, courseId: 3, title: 'Decision Dashboards', summary: 'Turn activity into team decisions.', position: 2, durationMinutes: 300 },
]

const lessonSeed = [
  { id: 1, moduleId: 1, title: 'SLA map and ownership grid', lessonType: 'Workshop', position: 1, durationMinutes: 55, isPreview: true },
  { id: 2, moduleId: 1, title: 'Escalation paths for learner blockers', lessonType: 'Guide', position: 2, durationMinutes: 40, isPreview: false },
  { id: 3, moduleId: 1, title: 'Weekly queue calibration', lessonType: 'Template', position: 3, durationMinutes: 35, isPreview: false },
  { id: 4, moduleId: 2, title: 'High-emotion issue handling', lessonType: 'Scenario', position: 1, durationMinutes: 50, isPreview: true },
  { id: 5, moduleId: 2, title: 'Post-incident retrospectives', lessonType: 'Checklist', position: 2, durationMinutes: 45, isPreview: false },
  { id: 6, moduleId: 2, title: 'Recovery messaging kit', lessonType: 'Toolkit', position: 3, durationMinutes: 55, isPreview: false },
  { id: 7, moduleId: 3, title: 'Cohort kickoff blueprint', lessonType: 'Playbook', position: 1, durationMinutes: 60, isPreview: true },
  { id: 8, moduleId: 3, title: 'Enrollment pacing rules', lessonType: 'Guide', position: 2, durationMinutes: 45, isPreview: false },
  { id: 9, moduleId: 3, title: 'Risk flags before week one', lessonType: 'Template', position: 3, durationMinutes: 50, isPreview: false },
  { id: 10, moduleId: 4, title: 'Office hour operating system', lessonType: 'Workshop', position: 1, durationMinutes: 65, isPreview: false },
  { id: 11, moduleId: 4, title: 'Async feedback loops', lessonType: 'Guide', position: 2, durationMinutes: 55, isPreview: false },
  { id: 12, moduleId: 4, title: 'Community heartbeat rituals', lessonType: 'Checklist', position: 3, durationMinutes: 40, isPreview: true },
  { id: 13, moduleId: 5, title: 'Completion signal taxonomy', lessonType: 'Lecture', position: 1, durationMinutes: 70, isPreview: true },
  { id: 14, moduleId: 5, title: 'Defining healthy lag metrics', lessonType: 'Guide', position: 2, durationMinutes: 45, isPreview: false },
  { id: 15, moduleId: 5, title: 'Learner risk scoring', lessonType: 'Workshop', position: 3, durationMinutes: 60, isPreview: false },
  { id: 16, moduleId: 6, title: 'Executive dashboard structure', lessonType: 'Template', position: 1, durationMinutes: 80, isPreview: false },
  { id: 17, moduleId: 6, title: 'Curriculum experiment tracking', lessonType: 'Guide', position: 2, durationMinutes: 60, isPreview: false },
  { id: 18, moduleId: 6, title: 'Narratives for quarterly reviews', lessonType: 'Scenario', position: 3, durationMinutes: 55, isPreview: true },
]

const enrollmentSeed = [
  { id: 1, courseId: 1, learnerName: 'Jalen Brooks', learnerEmail: 'jalen@example.com', status: 'Active', progress: 64, enrolledAt: '2026-03-10T08:00:00.000Z' },
  { id: 2, courseId: 1, learnerName: 'Mia Ortega', learnerEmail: 'mia@example.com', status: 'Active', progress: 82, enrolledAt: '2026-03-11T09:15:00.000Z' },
  { id: 3, courseId: 1, learnerName: 'Samir Zain', learnerEmail: 'samir@example.com', status: 'At Risk', progress: 38, enrolledAt: '2026-03-12T10:30:00.000Z' },
  { id: 4, courseId: 2, learnerName: 'Nadia Lim', learnerEmail: 'nadia@example.com', status: 'Active', progress: 73, enrolledAt: '2026-03-08T11:00:00.000Z' },
  { id: 5, courseId: 2, learnerName: 'Victor Hale', learnerEmail: 'victor@example.com', status: 'Completed', progress: 100, enrolledAt: '2026-03-05T12:00:00.000Z' },
  { id: 6, courseId: 2, learnerName: 'Sofia Martin', learnerEmail: 'sofia@example.com', status: 'Active', progress: 67, enrolledAt: '2026-03-14T12:45:00.000Z' },
  { id: 7, courseId: 3, learnerName: 'Alicia Wong', learnerEmail: 'alicia@example.com', status: 'Active', progress: 52, enrolledAt: '2026-03-07T13:30:00.000Z' },
  { id: 8, courseId: 3, learnerName: 'Peter Khan', learnerEmail: 'peter@example.com', status: 'At Risk', progress: 29, enrolledAt: '2026-03-13T14:10:00.000Z' },
  { id: 9, courseId: 3, learnerName: 'Grace Tan', learnerEmail: 'grace@example.com', status: 'Completed', progress: 100, enrolledAt: '2026-03-01T16:20:00.000Z' },
]

const ticketSeed = [
  {
    id: 1,
    ticketNumber: 'TKT-0001',
    courseId: 1,
    subject: 'Learner cannot access week 2 assets',
    summary: 'Download links for the recovery kit return a 403 after enrollment.',
    category: 'Access',
    priority: 'High',
    status: 'new',
    requesterName: 'Mia Ortega',
    requesterEmail: 'mia@example.com',
    assigneeName: 'Support pod A',
    createdAt: '2026-03-24T08:10:00.000Z',
    updatedAt: '2026-03-24T09:00:00.000Z',
  },
  {
    id: 2,
    ticketNumber: 'TKT-0002',
    courseId: 2,
    subject: 'Need invoice for additional cohort seats',
    summary: 'Finance requested a formal invoice before approving five more seats.',
    category: 'Billing',
    priority: 'Medium',
    status: 'in_progress',
    requesterName: 'Victor Hale',
    requesterEmail: 'victor@example.com',
    assigneeName: 'Revenue ops',
    createdAt: '2026-03-22T07:45:00.000Z',
    updatedAt: '2026-03-25T10:30:00.000Z',
  },
  {
    id: 3,
    ticketNumber: 'TKT-0003',
    courseId: 3,
    subject: 'Dashboard export omits completion timestamps',
    summary: 'CSV export is missing the completion date field used in the board report.',
    category: 'Reporting',
    priority: 'High',
    status: 'waiting_on_learner',
    requesterName: 'Alicia Wong',
    requesterEmail: 'alicia@example.com',
    assigneeName: 'Data enablement',
    createdAt: '2026-03-20T12:15:00.000Z',
    updatedAt: '2026-03-26T11:05:00.000Z',
  },
  {
    id: 4,
    ticketNumber: 'TKT-0004',
    courseId: null,
    subject: 'Requesting enterprise onboarding workshop',
    summary: 'A customer success lead wants a private onboarding session for a new academy team.',
    category: 'General',
    priority: 'Low',
    status: 'resolved',
    requesterName: 'Dana Murphy',
    requesterEmail: 'dana@example.com',
    assigneeName: 'Launch desk',
    createdAt: '2026-03-18T15:30:00.000Z',
    updatedAt: '2026-03-27T13:20:00.000Z',
  },
]

const ticketMessageSeed = [
  { id: 1, ticketId: 1, authorName: 'Mia Ortega', authorRole: 'Learner', body: 'The module page loads, but every file link shows access denied.', createdAt: '2026-03-24T08:10:00.000Z' },
  { id: 2, ticketId: 1, authorName: 'Support pod A', authorRole: 'Support', body: 'We are reissuing the signed asset links and checking CDN permissions.', createdAt: '2026-03-24T09:00:00.000Z' },
  { id: 3, ticketId: 2, authorName: 'Victor Hale', authorRole: 'Customer', body: 'Please issue the quote before Friday so procurement can release budget.', createdAt: '2026-03-22T07:45:00.000Z' },
  { id: 4, ticketId: 2, authorName: 'Revenue ops', authorRole: 'Finance', body: 'Drafting the invoice now and confirming tax treatment for the additional seats.', createdAt: '2026-03-25T10:30:00.000Z' },
  { id: 5, ticketId: 3, authorName: 'Data enablement', authorRole: 'Support', body: 'Can you send the specific export range and cohort identifier you used?', createdAt: '2026-03-26T11:05:00.000Z' },
  { id: 6, ticketId: 4, authorName: 'Launch desk', authorRole: 'Support', body: 'Workshop scheduled. A facilitator brief was shared with the success team.', createdAt: '2026-03-27T13:20:00.000Z' },
]

function getDefaultOrganizerSeed() {
  return {
    email: normalizeEmail(
      process.env.ORGANIZER_EMAIL ?? 'organizer@eventku.local',
    ),
    name: process.env.ORGANIZER_NAME?.trim() || 'Eventku Organizer',
    password: process.env.ORGANIZER_PASSWORD ?? 'organizer123',
  }
}

async function ensureAuthUser(
  db: BetterSQLite3Database<typeof schema>,
  email: string,
  name: string,
  password: string,
) {
  const existing = db
    .select()
    .from(schema.authUser)
    .where(eq(schema.authUser.email, email))
    .get()

  if (existing) {
    return existing.id
  }

  // Use better-auth to create the user so the password is hashed correctly
  const { auth } = await import('@/lib/auth')
  const response = await auth.api.signUpEmail({
    body: { email, name, password },
  })

  return response.user.id
}

async function ensureDefaultOrganizer(
  db: BetterSQLite3Database<typeof schema>,
) {
  const defaults = getDefaultOrganizerSeed()

  await ensureAuthUser(db, defaults.email, defaults.name, defaults.password)

  const exactOrganizer = db
    .select()
    .from(schema.organizers)
    .where(eq(schema.organizers.email, defaults.email))
    .get()
  const existingOrganizer =
    exactOrganizer ??
    db
      .select()
      .from(schema.organizers)
      .orderBy(schema.organizers.id)
      .get()

  const organizerId = existingOrganizer
    ? existingOrganizer.id
    : Number(
        db
          .insert(schema.organizers)
          .values({
            email: defaults.email,
            name: defaults.name,
            passwordHash: randomUUID(), // placeholder; auth is handled by better-auth
            createdAt: new Date().toISOString(),
          })
          .run().lastInsertRowid,
      )

  if (existingOrganizer && (existingOrganizer.email !== defaults.email || existingOrganizer.name !== defaults.name)) {
    db
      .update(schema.organizers)
      .set({
        email: defaults.email,
        name: defaults.name,
      })
      .where(eq(schema.organizers.id, organizerId))
      .run()
  }

  db
    .update(schema.courses)
    .set({ organizerId })
    .where(isNull(schema.courses.organizerId))
    .run()
}

export async function ensureSeedData(
  db: BetterSQLite3Database<typeof schema>,
) {
  const existingCourses = db.select().from(schema.courses).limit(1).all()

  if (existingCourses.length === 0) {
    db.transaction((tx) => {
      tx.insert(schema.courses).values(courseSeed).run()
      tx.insert(schema.modules).values(moduleSeed).run()
      tx.insert(schema.lessons).values(lessonSeed).run()
      tx.insert(schema.enrollments).values(enrollmentSeed).run()
      tx.insert(schema.tickets).values(ticketSeed).run()
      tx.insert(schema.ticketMessages).values(ticketMessageSeed).run()
    })
  }

  await ensureDefaultOrganizer(db)
}
