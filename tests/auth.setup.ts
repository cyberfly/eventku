import { test as setup } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const authFile = 'tests/.auth/state.json'

setup('authenticate', async ({ page }) => {
  mkdirSync(dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
