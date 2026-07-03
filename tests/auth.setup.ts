import { test as setup } from '@playwright/test'

const AUTH_FILE = 'tests/.auth/state.json'

setup('authenticate as organizer', async ({ page }) => {
  await page.goto('/organizer/login')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Organizer email').fill('organizer@eventku.local')
  await page.getByLabel('Password').fill('organizer123')
  await page.getByRole('button', { name: 'Login' }).click()

  await page.waitForURL('/organizer')

  await page.context().storageState({ path: AUTH_FILE })
})
