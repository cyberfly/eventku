import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import { test as setup } from '@playwright/test'

const authFile = 'tests/.auth/state.json'

setup('create empty browser storage state', async () => {
  mkdirSync(dirname(authFile), { recursive: true })
  writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
})
