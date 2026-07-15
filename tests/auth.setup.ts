import { test as setup } from '@playwright/test'

const AUTH_FILE = 'tests/.auth/state.json'

setup('create empty storage state', async ({ page }) => {
  await page.context().storageState({ path: AUTH_FILE })
})
