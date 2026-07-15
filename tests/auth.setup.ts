import { test as setup } from '@playwright/test'

const STORAGE_STATE = 'tests/.auth/state.json'

setup('prepare storage state', async ({ page }) => {
  await page.context().storageState({ path: STORAGE_STATE })
})
