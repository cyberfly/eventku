import { test as setup } from '@playwright/test'

const authFile = 'tests/.auth/state.json'

setup('prepare storage state', async ({ page }) => {
  await page.context().storageState({ path: authFile })
})
