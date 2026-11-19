import { hashPassword } from '../utils/passwordHash.js'

const HASH_PATTERN = /^scrypt\$[0-9a-f]+\$[0-9a-f]+$/i
const VALID_SCHEMA_PATTERN = /^[a-z_][a-z0-9_]*$/i

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

function parseCorsOrigins(rawValue) {
  const value = rawValue ?? 'http://localhost:5173,http://127.0.0.1:5173'
  return Object.freeze(
    String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

function parseDatabaseConfig(source) {
  const rawUrl = source.DATABASE_URL?.trim() || ''
  let parsedUrl = null

  if (rawUrl) {
    try {
      parsedUrl = new URL(rawUrl)
    } catch {
      throw new Error('DATABASE_URL harus berupa URL koneksi PostgreSQL yang valid.')
    }
    if (!['postgresql:', 'postgres:'].includes(parsedUrl.protocol)) {
      throw new Error('DATABASE_URL harus menggunakan skema postgresql:// atau postgres://.')
    }
  }

  const rawPort = source.DB_PORT ?? (parsedUrl?.port || undefined)
  const dbPort = parsePositiveInteger(rawPort, 5432, 'DB_PORT')
  if (dbPort > 65535) {
    throw new Error('DB_PORT harus berupa bilangan bulat antara 1 dan 65535.')
  }

  const urlDatabase = parsedUrl ? parsedUrl.pathname.replace(/^\/+/, '') : ''
  const urlSchema = parsedUrl?.searchParams.get('schema')?.trim() || ''
  const schema = source.DB_SCHEMA?.trim() || (urlSchema && urlSchema !== 'public' ? urlSchema : 'keu_masjid')
  if (!VALID_SCHEMA_PATTERN.test(schema)) {
    throw new Error('DB_SCHEMA hanya boleh berisi huruf, angka, dan garis bawah.')
  }

  const sslmode = source.DB_SSLMODE?.trim() || parsedUrl?.searchParams.get('sslmode')?.trim() || 'prefer'

  return Object.freeze({
    url: rawUrl,
    connection: source.DB_CONNECTION?.trim() || 'pgsql',
    host: source.DB_HOST?.trim() || parsedUrl?.hostname || '127.0.0.1',
    port: dbPort,
    database: source.DB_DATABASE?.trim() || urlDatabase || 'db_keuangan_masjid_dev',
    username: source.DB_USERNAME?.trim() || (parsedUrl ? decodeURIComponent(parsedUrl.username) : 'postgres'),
    password: source.DB_PASSWORD ?? (parsedUrl ? decodeURIComponent(parsedUrl.password) : ''),
    schema,
    sslmode,
  })
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

  const corsOrigins = parseCorsOrigins(source.CORS_ORIGIN)
  const adminAuthRequired =
    nodeEnv === 'production' || source.ADMIN_AUTH_REQUIRED?.trim().toLowerCase() === 'true'
  const authSecret = source.AUTH_SECRET?.trim() || ''
  const authTokenTtlMs = parsePositiveInteger(
    source.AUTH_TOKEN_TTL_MS,
    8 * 60 * 60 * 1000,
    'AUTH_TOKEN_TTL_MS'
  )

  if (adminAuthRequired && authSecret.length < 32) {
    throw new Error('AUTH_SECRET wajib diisi minimal 32 karakter saat ADMIN_AUTH_REQUIRED aktif.')
  }

  const db = parseDatabaseConfig(source)

  return Object.freeze({
    port,
    host,
    nodeEnv,
    apiBasePath,
    jsonLimit,
    rateLimitWindowMs,
    rateLimitMax,
    reportPasswordHash,
    corsOrigins,
    adminAuthRequired,
    authSecret,
    authTokenTtlMs,
    db,
  })
}
