import { and, eq } from 'drizzle-orm'

import { bootstrapDatabase } from '@/db'
import { checkoutSessions, courses, enrollments } from '@/db/schema'
import { getEventExperience } from '@/lib/events'
import { getStripe } from '@/lib/stripe'

type CreateCheckoutSessionInput = {
  attendeeName: string
  attendeeEmail: string
  slug: string
}

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const db = bootstrapDatabase()

  const course = db
    .select()
    .from(courses)
    .where(and(eq(courses.slug, input.slug), eq(courses.status, 'published')))
    .get()

  if (!course) {
    throw new Error('This event is no longer available.')
  }

  const existingRegistrations = db
    .select()
    .from(enrollments)
    .where(eq(enrollments.courseId, course.id))
    .all()

  if (existingRegistrations.length >= course.seatCap) {
    throw new Error('This event is sold out.')
  }

  const normalizedEmail = input.attendeeEmail.trim().toLowerCase()
  const alreadyRegistered = existingRegistrations.some(
    (r) => r.learnerEmail.trim().toLowerCase() === normalizedEmail,
  )

  if (alreadyRegistered) {
    throw new Error('This attendee already has a confirmed registration.')
  }

  const experience = getEventExperience(input.slug)
  if (!experience) {
    throw new Error('Event details not found.')
  }

  const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: normalizedEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'myr',
          unit_amount: experience.price * 100,
          product_data: {
            name: experience.title,
            description: `1 attendee seat — ${experience.venue}`,
          },
        },
      },
    ],
    success_url: `${baseUrl}/events/${input.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/events/${input.slug}`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  })

  db.insert(checkoutSessions)
    .values({
      stripeSessionId: session.id,
      courseId: course.id,
      attendeeName: input.attendeeName.trim(),
      attendeeEmail: normalizedEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    .run()

  return { url: session.url! }
}

export function fulfillCheckoutSession(stripeSessionId: string) {
  const db = bootstrapDatabase()

  const session = db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.stripeSessionId, stripeSessionId))
    .get()

  if (!session) {
    throw new Error('Checkout session not found.')
  }

  if (session.status === 'completed') {
    return
  }

  const course = db.select().from(courses).where(eq(courses.id, session.courseId)).get()

  if (!course) {
    throw new Error('Course not found.')
  }

  const existingRegistrations = db
    .select()
    .from(enrollments)
    .where(eq(enrollments.courseId, course.id))
    .all()

  if (existingRegistrations.length >= course.seatCap) {
    throw new Error('This event is sold out.')
  }

  const alreadyRegistered = existingRegistrations.some(
    (r) => r.learnerEmail.trim().toLowerCase() === session.attendeeEmail,
  )

  if (alreadyRegistered) {
    throw new Error('This attendee already has a confirmed registration.')
  }

  const result = db
    .insert(enrollments)
    .values({
      courseId: course.id,
      learnerName: session.attendeeName,
      learnerEmail: session.attendeeEmail,
      status: 'Confirmed',
      progress: 0,
      enrolledAt: new Date().toISOString(),
    })
    .run()

  db.update(checkoutSessions)
    .set({ status: 'completed' })
    .where(eq(checkoutSessions.stripeSessionId, stripeSessionId))
    .run()

  return {
    confirmationCode: `NS-${course.id}-${String(Number(result.lastInsertRowid)).padStart(4, '0')}`,
  }
}

export function getCheckoutSessionForSuccess(stripeSessionId: string) {
  const db = bootstrapDatabase()

  const session = db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.stripeSessionId, stripeSessionId))
    .get()

  if (!session || session.status !== 'completed') {
    return null
  }

  const course = db.select().from(courses).where(eq(courses.id, session.courseId)).get()

  const enrollment = db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, session.courseId),
        eq(enrollments.learnerEmail, session.attendeeEmail),
      ),
    )
    .get()

  if (!enrollment) {
    return null
  }

  const confirmationCode = `NS-${session.courseId}-${String(enrollment.id).padStart(4, '0')}`

  return {
    attendeeName: session.attendeeName,
    attendeeEmail: session.attendeeEmail,
    courseTitle: course?.title ?? '',
    confirmationCode,
  }
}
