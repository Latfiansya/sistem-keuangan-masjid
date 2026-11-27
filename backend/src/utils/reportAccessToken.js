import crypto from 'node:crypto'
import { parseCookies } from './adminAuth.js'

export const REPORT_ACCESS_COOKIE = 'masjid_report_access'
export const DEFAULT_REPORT_ACCESS_TTL_MS = 8 * 60 * 60 * 1000

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

function signHmac(input, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(input)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

// Penanda singkat hash sandi agar penggantian kode akses otomatis menggugurkan sesi akses lama.
export function buildReportPasswordMarker(expectedPasswordHash = '') {
  if (!expectedPasswordHash) return ''
  return crypto.createHash('sha256').update(String(expectedPasswordHash)).digest('hex').slice(0, 16)
}

export function signReportAccessToken(
  secret,
  { ttlMs = DEFAULT_REPORT_ACCESS_TTL_MS, expectedPasswordHash = '' } = {}
) {
  if (!secret || secret.length < 32) {
    throw new Error('Secret minimal 32 karakter diperlukan untuk sesi akses laporan.')
  }
  const now = Date.now()
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      typ: 'report_access',
      ver: buildReportPasswordMarker(expectedPasswordHash),
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + ttlMs) / 1000),
    })
  )
  const signingInput = `${header}.${payload}`
  return `${signingInput}.${signHmac(signingInput, secret)}`
}

export function verifyReportAccessToken(token, secret, { expectedPasswordHash = '' } = {}) {
  if (typeof token !== 'string' || !token || !secret || secret.length < 32) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [header, payload, signature] = parts
  const expectedSig = signHmac(`${header}.${payload}`, secret)
  const sigBuf = Buffer.from(signature, 'utf8')
  const expBuf = Buffer.from(expectedSig, 'utf8')
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload))
    if (parsed?.typ !== 'report_access' || typeof parsed.exp !== 'number') return false
    if (parsed.exp * 1000 <= Date.now()) return false
    if (expectedPasswordHash && parsed.ver !== buildReportPasswordMarker(expectedPasswordHash)) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export function extractReportAccessToken(req) {
  const cookies = parseCookies(req?.headers?.cookie || '')
  if (cookies[REPORT_ACCESS_COOKIE]) return cookies[REPORT_ACCESS_COOKIE]
  return ''
}
