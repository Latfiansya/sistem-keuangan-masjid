import { createHttpError } from './httpError.js'

export const ALLOWED_CATEGORY_COLORS = [
  'red',
  'orange',
  'gold',
  'yellow',
  'lime',
  'green',
  'blue',
  'teal',
  'purple',
]

const CORE_CATEGORY_ID_TO_SLUG = new Map([
  [1, 'mosque'],
  [2, 'maintenance'],
  [3, 'friday'],
])

const CORE_SLUG_TO_CATEGORY_ID = new Map([
  ['mosque', 1],
  ['maintenance', 2],
  ['friday', 3],
])

const CORE_CATEGORY_COLORS = new Map([
  [1, 'green'],
  [2, 'orange'],
  [3, 'blue'],
])

export function mapCategoryApiId(dbId) {
  const numericId = Number(dbId)
  return CORE_CATEGORY_ID_TO_SLUG.get(numericId) ?? String(dbId)
}

export function resolveCategoryDbId(apiId) {
  if (typeof apiId === 'number') {
    return Number.isSafeInteger(apiId) && apiId > 0 ? apiId : null
  }
  if (typeof apiId !== 'string') return null
  const trimmed = apiId.trim()
  if (CORE_SLUG_TO_CATEGORY_ID.has(trimmed)) {
    return CORE_SLUG_TO_CATEGORY_ID.get(trimmed)
  }
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number(trimmed)
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

export function resolveCategoryColor(dbId, namaKategori = '') {
  const numericId = Number(dbId)
  if (CORE_CATEGORY_COLORS.has(numericId)) {
    return CORE_CATEGORY_COLORS.get(numericId)
  }
  const lower = String(namaKategori).toLowerCase()
  if (lower.includes('kas masjid')) return 'green'
  if (lower.includes('pembangunan') || lower.includes('pemeliharaan')) return 'orange'
  if (lower.includes('jum')) return 'blue'
  const index = Math.abs((Number.isFinite(numericId) ? numericId : 1) - 1) % ALLOWED_CATEGORY_COLORS.length
  return ALLOWED_CATEGORY_COLORS[index]
}

export function toRupiahInteger(value, fieldLabel = 'Nominal') {
  const parsed = Math.round(Number(value ?? 0))
  if (!Number.isSafeInteger(parsed)) {
    throw createHttpError(500, 'INTERNAL_SERVER_ERROR', `${fieldLabel} melebihi batas integer aman.`)
  }
  return parsed
}

export async function resolveAuditPenggunaId(client) {
  const activeRes = await client.query(
    `SELECT id FROM keu_masjid.m_pengguna WHERE status = 'Aktif' ORDER BY id ASC LIMIT 1`
  )
  if (activeRes.rows[0]?.id) return Number(activeRes.rows[0].id)

  const fallbackRes = await client.query(
    `SELECT id FROM keu_masjid.m_pengguna ORDER BY id ASC LIMIT 1`
  )
  if (fallbackRes.rows[0]?.id) return Number(fallbackRes.rows[0].id)

  throw createHttpError(
    503,
    'SERVICE_UNAVAILABLE',
    'Akun pencatat pada m_pengguna belum tersedia di database.'
  )
}

export function mapPgErrorToHttpError(error) {
  if (error?.isAppError) return error

  if (error?.code === '23514') {
    const msg = typeof error.message === 'string' && error.message.includes('Saldo kategori dana')
      ? error.message
      : 'Data melanggar batasan aturan database.'
    return createHttpError(400, 'BAD_REQUEST', msg)
  }
  if (error?.code === '23505') {
    return createHttpError(400, 'BAD_REQUEST', 'Data dengan nilai unik tersebut sudah terdaftar.')
  }
  if (error?.code === '23503') {
    return createHttpError(400, 'BAD_REQUEST', 'Data masih berelasi atau referensi tidak ditemukan.')
  }
  if (error?.code === '23001') {
    return createHttpError(400, 'BAD_REQUEST', 'Operasi ditolak karena aturan integritas data.')
  }

  return error
}
