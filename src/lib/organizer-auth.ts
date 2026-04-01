import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SCRYPT_KEYLEN = 64

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')

  return `${salt}:${derivedKey}`
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedKey] = passwordHash.split(':')

  if (!salt || !storedKey) {
    return false
  }

  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN)
  const storedBuffer = Buffer.from(storedKey, 'hex')

  if (storedBuffer.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedBuffer, derivedKey)
}

export function createSessionToken() {
  return randomBytes(32).toString('hex')
}
