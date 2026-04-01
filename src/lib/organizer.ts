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
  durationHours: z.coerce.number().int().min(1).max(400),
  seatCap: z.coerce.number().int().min(1).max(10000),
  completionRate: z.coerce.number().int().min(0).max(100),
  instructorName: z.string().min(2).max(80),
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
  durationHours: 8,
  seatCap: 25,
  completionRate: 0,
  instructorName: '',
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
