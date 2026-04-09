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

export const courseLanguageOptions = [
  'English',
  'Bahasa Melayu',
  'Indonesian',
  'Mandarin',
] as const

export const courseDeliveryFormatOptions = [
  'Self-paced',
  'Live',
  'Cohort',
  'Blended',
] as const

const optionalDateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .or(z.literal(''))

export const organizerLoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const organizerCourseInput = z.object({
  title: z.string().min(3).max(120),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().min(20).max(600),
  category: z.enum(courseCategoryOptions),
  level: z.enum(courseLevelOptions),
  status: z.enum(courseStatusOptions),
  subtitle: z.string().max(140),
  language: z.enum(courseLanguageOptions),
  deliveryFormat: z.enum(courseDeliveryFormatOptions),
  location: z.string().max(120),
  timezone: z.string().max(80),
  durationHours: z.coerce.number().int().min(1).max(400),
  estimatedWeeklyHours: z.coerce.number().int().min(1).max(80),
  seatCap: z.coerce.number().int().min(1).max(10000),
  completionRate: z.coerce.number().int().min(0).max(100),
  priceUsd: z.coerce.number().min(0).max(100000),
  totalModules: z.coerce.number().int().min(0).max(1000),
  totalLessons: z.coerce.number().int().min(0).max(10000),
  instructorName: z.string().min(2).max(80),
  certificateIncluded: z.boolean(),
  featured: z.boolean(),
  prerequisites: z.string().max(500),
  learningOutcomes: z.string().max(1200),
  targetAudience: z.string().max(500),
  materialsIncluded: z.string().max(500),
  supportDetails: z.string().max(500),
  enrollmentStartDate: optionalDateInput,
  enrollmentEndDate: optionalDateInput,
  courseStartDate: optionalDateInput,
  courseEndDate: optionalDateInput,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
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
  subtitle: '',
  language: courseLanguageOptions[0],
  deliveryFormat: courseDeliveryFormatOptions[2],
  location: 'Virtual',
  timezone: 'Asia/Kuala_Lumpur',
  durationHours: 8,
  estimatedWeeklyHours: 4,
  seatCap: 25,
  completionRate: 0,
  priceUsd: 199,
  totalModules: 6,
  totalLessons: 24,
  instructorName: '',
  certificateIncluded: true,
  featured: false,
  prerequisites: '',
  learningOutcomes: '',
  targetAudience: '',
  materialsIncluded: '',
  supportDetails: '',
  enrollmentStartDate: '',
  enrollmentEndDate: '',
  courseStartDate: '',
  courseEndDate: '',
  accent: '#0c7d69',
}

export function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}
