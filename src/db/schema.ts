import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const organizers = sqliteTable(
  'organizers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    emailIndex: uniqueIndex('organizers_email_idx').on(table.email),
  }),
)

export const organizerSessions = sqliteTable(
  'organizer_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizerId: integer('organizer_id')
      .notNull()
      .references(() => organizers.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    tokenIndex: uniqueIndex('organizer_sessions_token_idx').on(table.token),
  }),
)

export const courses = sqliteTable(
  'courses',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    organizerId: integer('organizer_id').references(() => organizers.id, {
      onDelete: 'cascade',
    }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    category: text('category').notNull(),
    level: text('level').notNull(),
    status: text('status').notNull().default('published'),
    durationHours: integer('duration_hours').notNull(),
    seatCap: integer('seat_cap').notNull(),
    completionRate: integer('completion_rate').notNull(),
    instructorName: text('instructor_name').notNull(),
    accent: text('accent').notNull(),
    price: integer('price').notNull().default(129),
    format: text('format').notNull().default('Virtual'),
    venue: text('venue').notNull().default('Eventku Live'),
    city: text('city').notNull().default('Streaming worldwide'),
    audience: text('audience').notNull().default('Training teams and operators'),
    heroNote: text('hero_note').notNull().default('Live training event'),
    hostBio: text('host_bio').notNull().default(''),
    startAt: text('start_at').notNull().default('2026-01-01T00:00:00.000Z'),
    endAt: text('end_at').notNull().default('2026-01-01T01:00:00.000Z'),
    highlights: text('highlights').notNull().default('[]'),
    takeaways: text('takeaways').notNull().default('[]'),
    featuredImage: text('featured_image'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    slugIndex: uniqueIndex('courses_slug_idx').on(table.slug),
  }),
)

export const modules = sqliteTable('modules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  position: integer('position').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
})

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  moduleId: integer('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  lessonType: text('lesson_type').notNull(),
  position: integer('position').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  isPreview: integer('is_preview', { mode: 'boolean' }).notNull().default(false),
})

export const enrollments = sqliteTable('enrollments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  learnerName: text('learner_name').notNull(),
  learnerEmail: text('learner_email').notNull(),
  status: text('status').notNull(),
  progress: integer('progress').notNull(),
  enrolledAt: text('enrolled_at').notNull(),
})

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderNumber: text('order_number').notNull(),
    courseId: integer('course_id').references(() => courses.id, {
      onDelete: 'set null',
    }),
    enrollmentId: integer('enrollment_id').references(() => enrollments.id, {
      onDelete: 'cascade',
    }),
    attendeeName: text('attendee_name').notNull(),
    attendeeEmail: text('attendee_email').notNull(),
    amount: integer('amount').notNull(),
    status: text('status').notNull().default('confirmed'),
    createdAt: text('created_at').notNull(),
  },
  (table) => ({
    orderNumberIndex: uniqueIndex('orders_order_number_idx').on(table.orderNumber),
  }),
)

export const tickets = sqliteTable(
  'tickets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ticketNumber: text('ticket_number').notNull(),
    courseId: integer('course_id').references(() => courses.id, {
      onDelete: 'set null',
    }),
    subject: text('subject').notNull(),
    summary: text('summary').notNull(),
    category: text('category').notNull(),
    priority: text('priority').notNull(),
    status: text('status').notNull(),
    requesterName: text('requester_name').notNull(),
    requesterEmail: text('requester_email').notNull(),
    assigneeName: text('assignee_name'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => ({
    ticketNumberIndex: uniqueIndex('tickets_ticket_number_idx').on(table.ticketNumber),
  }),
)

export const ticketMessages = sqliteTable('ticket_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: integer('ticket_id')
    .notNull()
    .references(() => tickets.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
})

export const coursesRelations = relations(courses, ({ many, one }) => ({
  organizer: one(organizers, {
    fields: [courses.organizerId],
    references: [organizers.id],
  }),
  modules: many(modules),
  enrollments: many(enrollments),
  tickets: many(tickets),
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one }) => ({
  course: one(courses, {
    fields: [orders.courseId],
    references: [courses.id],
  }),
  enrollment: one(enrollments, {
    fields: [orders.enrollmentId],
    references: [enrollments.id],
  }),
}))

export const organizersRelations = relations(organizers, ({ many }) => ({
  courses: many(courses),
  sessions: many(organizerSessions),
}))

export const organizerSessionsRelations = relations(organizerSessions, ({ one }) => ({
  organizer: one(organizers, {
    fields: [organizerSessions.organizerId],
    references: [organizers.id],
  }),
}))

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}))

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}))

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  course: one(courses, {
    fields: [tickets.courseId],
    references: [courses.id],
  }),
  messages: many(ticketMessages),
}))

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
}))
