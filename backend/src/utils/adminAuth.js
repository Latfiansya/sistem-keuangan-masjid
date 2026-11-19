import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { verifyScryptPassword } from './passwordHash.js'

export const ADMIN_SESSION_COOKIE = 'masjid_admin_session'

function toBase64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function fromBase64Url(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

// Meng-hash password akun baru atau perubahan password dengan bcrypt cost 12.
export async function hashAccountPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12)
}

// Memverifikasi password akun pengurus terhadap hash bcrypt ($2a$/$2b$/$2y$) maupun scrypt$.
export async function verifyAccountPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== 'string' || typeof storedHash !== 'string' || !storedHash || storedHash === '!') {
    return false
  }
  if (storedHash.startsWith('scrypt$')) {
    return verifyScryptPassword(plainPassword, storedHash)
  }
  if (/^\$2[aby]\$\d{2}\$/.test(storedHash)) {
    const normalizedHash = storedHash.startsWith('$2y$')
      ? `$2b$${storedHash.slice(4)}`
      : storedHash
    return bcrypt.compare(plainPassword, normalizedHash)
  }
  return false
}

export function signAdminToken(user, secret, ttlMs = 8 * 60 * 60 * 1000) {
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET minimal 32 karakter diperlukan untuk menandatangani token.')
  }
  const now = Date.now()
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      sub: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + ttlMs) / 1000),
    })
  )
  const signingInput = `${header}.${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return {
    token: `${signingInput}.${signature}`,
    expiresAt: new Date(now + ttlMs).toISOString(),
  }
}

export function verifyAdminToken(token, secret) {
  if (typeof token !== 'string' || !secret || secret.length < 32) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [header, payload, signature] = parts
  const signingInput = `${header}.${payload}`
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const sigBuf = Buffer.from(signature, 'utf8')
  const expBuf = Buffer.from(expectedSig, 'utf8')
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload))
    if (!parsed?.sub || typeof parsed.exp !== 'number') return null
    if (parsed.exp * 1000 <= Date.now()) return null
    return {
      id: parsed.sub,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
    }
  } catch {
    return null
  }
}

export function parseCookies(cookieHeader = '') {
  const result = {}
  if (typeof cookieHeader !== 'string' || !cookieHeader) return result
  for (const part of cookieHeader.split(';')) {
    const eqIndex = part.indexOf('=')
    if (eqIndex <= 0) continue
    const key = part.slice(0, eqIndex).trim()
    const val = part.slice(eqIndex + 1).trim()
    if (key) {
      try {
        result[key] = decodeURIComponent(val)
      } catch {
        result[key] = val
      }
    }
  }
  return result
}

export function extractAdminToken(req) {
  const authHeader = req.headers?.authorization
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  const cookies = parseCookies(req.headers?.cookie)
  return cookies[ADMIN_SESSION_COOKIE] || ''
}
