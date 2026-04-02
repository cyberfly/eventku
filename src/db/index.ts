import 'dotenv/config'

import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

import { ensureSeedData } from './seed'
import * as schema from './schema'

const databaseFile = resolve(
  process.cwd(),
  process.env.DB_FILE_NAME ?? './data/lms.sqlite',
)

mkdirSync(dirname(databaseFile), { recursive: true })

const sqlite = new Database(databaseFile)
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite, { schema })

let isBootstrapped = false

export function bootstrapDatabase() {
  if (isBootstrapped) {
    return db
  }

  migrate(db, {
    migrationsFolder: resolve(process.cwd(), 'drizzle'),
  })

  isBootstrapped = true

  void ensureSeedData(db).catch(console.error)

  return db
}
