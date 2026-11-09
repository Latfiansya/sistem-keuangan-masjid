import { hashPassword } from '../utils/passwordHash.js'

const HASH_PATTERN = /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/i

export function normalizeBasePath(value) {
  const raw = (value ?? '/api').trim()
  if (!raw || raw === '/') return ''
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withLeadingSlash.replace(/\/+$/, '')
}

function parsePositiveInteger(rawValue, defaultValue, label) {
  const value = Number(rawValue ?? defaultValue)
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} harus berupa bilangan bulat positif.`)
  }
  return value
}

// Membaca konfigurasi runtime backend dari environment agar tidak hardcoded di route/app.
export function loadEnv(source = process.env) {
  const port = Number(source.PORT ?? 3000)
  const host = source.HOST?.trim() || '127.0.0.1'
  const nodeEnv = source.NODE_ENV?.trim() || 'development'
  const apiBasePath = normalizeBasePath(source.API_BASE_PATH)
  const jsonLimit = source.JSON_BODY_LIMIT?.trim() || '10kb'
  const rateLimitWindowMs = parsePositiveInteger(source.RATE_LIMIT_WINDOW_MS, 60_000, 'RATE_LIMIT_WINDOW_MS')
  const rateLimitMax = parsePositiveInteger(source.RATE_LIMIT_MAX, 10, 'RATE_LIMIT_MAX')

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT harus berupa bilangan bulat antara 1 dan 65535.')
  }

  let reportPasswordHash = source.REPORT_SHARED_PASSWORD_HASH?.trim() || ''
  if (reportPasswordHash && !HASH_PATTERN.test(reportPasswordHash)) {
    throw new Error('REPORT_SHARED_PASSWORD_HASH harus berformat scrypt$<salt>$<hash>.')
  }

  const rawDevPassword = source.REPORT_SHARED_PASSWORD
  if (!reportPasswordHash && typeof rawDevPassword === 'string' && rawDevPassword.trim()) {
    if (nodeEnv === 'production') {
      throw new Error('Di lingkungan production, gunakan REPORT_SHARED_PASSWORD_HASH dan jangan menyimpan sandi plaintext.')
    }
    reportPasswordHash = hashPassword(rawDevPassword)
  }

  return Object.freeze({
    port,
    host,
    nodeEnv,
    apiBasePath,
    jsonLimit,
    rateLimitWindowMs,
    rateLimitMax,
    reportPasswordHash,
  })
}
