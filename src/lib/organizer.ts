import { z } from 'zod'

export const courseCategoryOptions = [
  'Operations',
  'Program Design',
  'Analytics',
  'Support',
  'Leadership',
  'Technical Training',
] as const

export const courseLevelOptions = [
  'Beginner',
  'Intermediate',
  'Advanced',
] as const

export const courseStatusOptions = [
  'draft',
  'published',
] as const

export const courseFormatOptions = [
  'Virtual',
  'Hybrid',
  'In-person',
] as const

export const enrollmentStatusOptions = [
  'Active',
  'At Risk',
  'Completed',
] as const

export const organizerLoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const organizerCourseInput = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters.')
      .max(120, 'Title must be 120 characters or fewer.'),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters.')
      .max(80, 'Slug must be 80 characters or fewer.')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug can only contain lowercase letters, numbers, and hyphens.',
      ),
    summary: z
      .string()
      .min(20, 'Summary must be at least 20 characters.')
      .max(600, 'Summary must be 600 characters or fewer.'),
    category: z.enum(courseCategoryOptions),
    level: z.enum(courseLevelOptions),
    status: z.enum(courseStatusOptions),
    durationHours: z.coerce
      .number('Enter a duration in hours.')
      .int('Duration must be a whole number.')
      .min(1, 'Duration must be at least 1 hour.')
      .max(400, 'Duration must be 400 hours or fewer.'),
    seatCap: z.coerce
      .number('Enter a seat cap.')
      .int('Seat cap must be a whole number.')
      .min(1, 'Seat cap must be at least 1.')
      .max(10000, 'Seat cap must be 10,000 or fewer.'),
    completionRate: z.coerce
      .number('Enter a completion rate.')
      .int('Completion rate must be a whole number.')
      .min(0, 'Completion rate cannot be negative.')
      .max(100, 'Completion rate cannot exceed 100.'),
    instructorName: z
      .string()
      .min(2, 'Host name must be at least 2 characters.')
      .max(80, 'Host name must be 80 characters or fewer.'),
    accent: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Enter a valid hex color, e.g. #0c7d69.'),
    price: z.coerce
      .number('Enter a price.')
      .min(0, 'Price cannot be negative.')
      .max(100000, 'Price must be 100,000 or fewer.'),
    format: z.enum(courseFormatOptions),
    venue: z
      .string()
      .min(2, 'Venue must be at least 2 characters.')
      .max(120, 'Venue must be 120 characters or fewer.'),
    city: z
      .string()
      .min(2, 'City must be at least 2 characters.')
      .max(80, 'City must be 80 characters or fewer.'),
    audience: z
      .string()
      .min(5, 'Audience must be at least 5 characters.')
      .max(160, 'Audience must be 160 characters or fewer.'),
    heroNote: z
      .string()
      .min(5, 'Hero note must be at least 5 characters.')
      .max(160, 'Hero note must be 160 characters or fewer.'),
    hostBio: z
      .string()
      .min(20, 'Host bio must be at least 20 characters.')
      .max(600, 'Host bio must be 600 characters or fewer.'),
    startAt: z.string().min(1, 'Start date and time is required.'),
    endAt: z.string().min(1, 'End date and time is required.'),
    highlights: z
      .array(
        z
          .string()
          .min(3, 'Highlight must be at least 3 characters.')
          .max(140, 'Highlight must be 140 characters or fewer.'),
      )
      .min(1, 'Add at least one highlight.')
      .max(8, 'Highlights are capped at 8 items.'),
    takeaways: z
      .array(
        z
          .string()
          .min(3, 'Takeaway must be at least 3 characters.')
          .max(140, 'Takeaway must be 140 characters or fewer.'),
      )
      .min(1, 'Add at least one takeaway.')
      .max(8, 'Takeaways are capped at 8 items.'),
    featuredImage: z.string().max(300).nullable(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.startAt)
    const end = new Date(value.endAt)

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid start date and time.',
        path: ['startAt'],
      })
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid end date and time.',
        path: ['endAt'],
      })
    }

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end.getTime() <= start.getTime()
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'End must be after the start time.',
        path: ['endAt'],
      })
    }
  })

export type OrganizerLoginInput = z.infer<typeof organizerLoginInput>
export type OrganizerCourseInput = z.infer<typeof organizerCourseInput>

export const defaultCourseFormState: OrganizerCourseInput = {
  title: '',
  slug: '',
  summary: '',
  category: courseCategoryOptions[0],
  level: courseLevelOptions[0],
  status: 'draft',
  durationHours: 8,
  seatCap: 25,
  completionRate: 0,
  instructorName: '',
  accent: '#0c7d69',
  price: 129,
  format: courseFormatOptions[0],
  venue: '',
  city: '',
  audience: '',
  heroNote: '',
  hostBio: '',
  startAt: '',
  endAt: '',
  highlights: [''],
  takeaways: [''],
  featuredImage: null,
}

export function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function buildFieldErrors(issues: z.ZodIssue[]) {
  const errors: Record<string, string> = {}

  for (const issue of issues) {
    const key = issue.path.join('.')

    if (!errors[key]) {
      errors[key] = issue.message
    }
  }

  return errors
}
