import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const ORGANIZER_EMAIL = 'organizer@eventku.local'
const ORGANIZER_PASSWORD = 'organizer123'

type CourseFormFixture = {
  title: string
  slug: string
  subtitle: string
  summary: string
  category: string
  level: string
  status: string
  language: string
  deliveryFormat: string
  location: string
  timezone: string
  durationHours: string
  estimatedWeeklyHours: string
  totalModules: string
  totalLessons: string
  seatCap: string
  completionRate: string
  priceUsd: string
  instructorName: string
  enrollmentStartDate: string
  enrollmentEndDate: string
  courseStartDate: string
  courseEndDate: string
  certificateIncluded: boolean
  featured: boolean
  accent: string
  prerequisites: string
  learningOutcomes: string
  targetAudience: string
  materialsIncluded: string
  supportDetails: string
}

function buildCourseFormFixture(uniqueSuffix: number): CourseFormFixture {
  return {
    title: `Automation Course ${uniqueSuffix}`,
    slug: `automation-course-${uniqueSuffix}`,
    subtitle: 'A complete end-to-end coverage pass for the organizer course form.',
    summary:
      'This automated course record covers every create-course field so the organizer workflow is validated end to end.',
    category: 'Analytics',
    level: 'Advanced',
    status: 'published',
    language: 'Bahasa Melayu',
    deliveryFormat: 'Live',
    location: 'Kuala Lumpur Training Center',
    timezone: 'Asia/Singapore',
    durationHours: '16',
    estimatedWeeklyHours: '6',
    totalModules: '8',
    totalLessons: '32',
    seatCap: '40',
    completionRate: '68',
    priceUsd: '499',
    instructorName: 'Jane Doe',
    enrollmentStartDate: '2026-05-01',
    enrollmentEndDate: '2026-05-20',
    courseStartDate: '2026-06-01',
    courseEndDate: '2026-07-15',
    certificateIncluded: false,
    featured: true,
    accent: '#d97706',
    prerequisites:
      'Learners should already understand dashboards, spreadsheet basics, and common reporting workflows.',
    learningOutcomes:
      'Build reporting cadences, diagnose operational bottlenecks, and communicate decisions with cleaner metrics.',
    targetAudience:
      'Operations managers, program leads, and analytics specialists responsible for training performance.',
    materialsIncluded:
      'Templates, reporting worksheets, class recordings, and a reusable metric review checklist.',
    supportDetails:
      'Weekly live office hours, async instructor feedback, and a moderated discussion channel.',
  }
}

async function loginAsOrganizer(page: Page) {
  await page.goto('/organizer/login')
  // Wait for React to hydrate before interacting — otherwise the native form
  // submit fires before event.preventDefault() is registered.
  await page.waitForLoadState('networkidle')

  if (page.url().endsWith('/organizer/login')) {
    await expect(page.getByLabel('Organizer email')).toHaveValue(ORGANIZER_EMAIL)
    await expect(page.getByLabel('Password')).toHaveValue(ORGANIZER_PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()
  }

  await page.waitForURL('/organizer')
}

async function fillCourseForm(page: Page, fixture: CourseFormFixture) {
  const textFields = [
    ['Course title', fixture.title],
    ['URL slug', fixture.slug],
    ['Subtitle', fixture.subtitle],
    ['Summary', fixture.summary],
    ['Location', fixture.location],
    ['Timezone', fixture.timezone],
    ['Instructor name', fixture.instructorName],
    ['Prerequisites', fixture.prerequisites],
    ['Learning outcomes', fixture.learningOutcomes],
    ['Target audience', fixture.targetAudience],
    ['Materials included', fixture.materialsIncluded],
    ['Support details', fixture.supportDetails],
  ] as const

  for (const [label, value] of textFields) {
    await page.getByLabel(label).fill(value)
  }

  const selectFields = [
    ['Category', fixture.category],
    ['Level', fixture.level],
    ['Status', fixture.status],
    ['Language', fixture.language],
    ['Delivery format', fixture.deliveryFormat],
  ] as const

  for (const [label, value] of selectFields) {
    await page.getByLabel(label).selectOption(value)
  }

  const numberFields = [
    ['Duration (hours)', fixture.durationHours],
    ['Weekly hours', fixture.estimatedWeeklyHours],
    ['Total modules', fixture.totalModules],
    ['Total lessons', fixture.totalLessons],
    ['Seat cap', fixture.seatCap],
    ['Completion rate', fixture.completionRate],
    ['Price (USD)', fixture.priceUsd],
  ] as const

  for (const [label, value] of numberFields) {
    await page.getByLabel(label).fill(value)
  }

  const dateFields = [
    ['Enrollment opens', fixture.enrollmentStartDate],
    ['Enrollment closes', fixture.enrollmentEndDate],
    ['Course starts', fixture.courseStartDate],
    ['Course ends', fixture.courseEndDate],
  ] as const

  for (const [label, value] of dateFields) {
    await page.getByLabel(label).fill(value)
  }

  const checkboxFields = [
    ['Certificate included', fixture.certificateIncluded],
    ['Featured course', fixture.featured],
  ] as const

  for (const [label, shouldBeChecked] of checkboxFields) {
    const checkbox = page.getByLabel(label)
    await checkbox.setChecked(shouldBeChecked)
  }

  await page.getByLabel('Accent color').fill('#1d4ed8')
  await expect(page.getByLabel('Preview color hex')).toHaveValue('#1d4ed8')
  await page.getByLabel('Preview color hex').fill(fixture.accent)
  await expect(page.getByLabel('Accent color')).toHaveValue(fixture.accent)
}

async function expectCourseFormValues(page: Page, fixture: CourseFormFixture) {
  const textFieldExpectations = [
    ['Course title', fixture.title],
    ['URL slug', fixture.slug],
    ['Subtitle', fixture.subtitle],
    ['Summary', fixture.summary],
    ['Location', fixture.location],
    ['Timezone', fixture.timezone],
    ['Instructor name', fixture.instructorName],
    ['Prerequisites', fixture.prerequisites],
    ['Learning outcomes', fixture.learningOutcomes],
    ['Target audience', fixture.targetAudience],
    ['Materials included', fixture.materialsIncluded],
    ['Support details', fixture.supportDetails],
    ['Preview color hex', fixture.accent],
  ] as const

  for (const [label, value] of textFieldExpectations) {
    await expect(page.getByLabel(label)).toHaveValue(value)
  }

  const selectExpectations = [
    ['Category', fixture.category],
    ['Level', fixture.level],
    ['Status', fixture.status],
    ['Language', fixture.language],
    ['Delivery format', fixture.deliveryFormat],
  ] as const

  for (const [label, value] of selectExpectations) {
    await expect(page.getByLabel(label)).toHaveValue(value)
  }

  const numberFieldExpectations = [
    ['Duration (hours)', fixture.durationHours],
    ['Weekly hours', fixture.estimatedWeeklyHours],
    ['Total modules', fixture.totalModules],
    ['Total lessons', fixture.totalLessons],
    ['Seat cap', fixture.seatCap],
    ['Completion rate', fixture.completionRate],
    ['Price (USD)', fixture.priceUsd],
  ] as const

  for (const [label, value] of numberFieldExpectations) {
    await expect(page.getByLabel(label)).toHaveValue(value)
  }

  const dateFieldExpectations = [
    ['Enrollment opens', fixture.enrollmentStartDate],
    ['Enrollment closes', fixture.enrollmentEndDate],
    ['Course starts', fixture.courseStartDate],
    ['Course ends', fixture.courseEndDate],
  ] as const

  for (const [label, value] of dateFieldExpectations) {
    await expect(page.getByLabel(label)).toHaveValue(value)
  }

  const checkboxExpectations = [
    ['Certificate included', fixture.certificateIncluded],
    ['Featured course', fixture.featured],
  ] as const

  for (const [label, isChecked] of checkboxExpectations) {
    const checkbox = page.getByLabel(label)

    if (isChecked) {
      await expect(checkbox).toBeChecked()
    } else {
      await expect(checkbox).not.toBeChecked()
    }
  }

  await expect(page.getByLabel('Accent color')).toHaveValue(fixture.accent)
}

test.describe('Create new course', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOrganizer(page)
    await page.goto('/organizer/new')
    await page.waitForLoadState('networkidle')
  })

  test('fills every create-course field, submits, and persists the values', async ({
    page,
  }) => {
    const fixture = buildCourseFormFixture(Date.now())

    await fillCourseForm(page, fixture)
    await page.getByRole('button', { name: 'Create course' }).click()

    await page.waitForURL(/\/organizer\/courses\/\d+/)
    expect(page.url()).toMatch(/\/organizer\/courses\/\d+/)
    await expect(page.getByRole('heading', { name: fixture.title })).toBeVisible()
    await expectCourseFormValues(page, fixture)
  })

  test('fills every create-course field and waits for manual submission', async ({
    page,
  }) => {
    const fixture = buildCourseFormFixture(Date.now())

    await fillCourseForm(page, fixture)
    await expect(page.getByRole('button', { name: 'Create course' })).toBeVisible()
    await page.pause()
  })

  test('shows the form with correct default values', async ({ page }) => {
    await expect(page.getByRole('spinbutton', { name: 'Duration (hours)' })).toHaveValue('8')
    await expect(page.getByRole('spinbutton', { name: 'Weekly hours' })).toHaveValue('4')
    await expect(page.getByRole('spinbutton', { name: 'Seat cap' })).toHaveValue('25')
    await expect(page.getByRole('spinbutton', { name: 'Price (USD)' })).toHaveValue('199')
    await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('draft')
    await expect(page.getByRole('checkbox', { name: 'Certificate included' })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: 'Featured course' })).not.toBeChecked()
    await expect(page.getByRole('textbox', { name: 'Location' })).toHaveValue('Virtual')
    await expect(page.getByRole('textbox', { name: 'Timezone' })).toHaveValue('Asia/Kuala_Lumpur')
  })

  test('slug auto-generates from the course title', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Course title' }).fill('My Awesome Course')
    await expect(page.getByRole('textbox', { name: 'URL slug' })).toHaveValue('my-awesome-course')
  })
})
