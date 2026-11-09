import crypto from 'node:crypto'

const KEY_LENGTH = 64

export function hashPassword(password) {
  if (typeof password !== 'string' || !password.length) {
    throw new Error('Kata sandi untuk di-hash harus berupa string tidak kosong.')
  }
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `scrypt$${salt}$${derived}`
}

export function verifyScryptPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false

  const parts = storedHash.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false

  const [, salt, expectedHex] = parts
  if (!salt || !/^[0-9a-f]+$/i.test(expectedHex)) return false

  const expectedBuffer = Buffer.from(expectedHex, 'hex')
  const actualBuffer = crypto.scryptSync(password, salt, expectedBuffer.length)

  if (actualBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer)
}

