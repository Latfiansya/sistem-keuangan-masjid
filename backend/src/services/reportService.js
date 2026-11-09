import { findFinanceReportSource } from '../repositories/financeReportRepository.js'
import { createHttpError } from '../utils/httpError.js'
import { verifyScryptPassword } from '../utils/passwordHash.js'

const MAX_PASSWORD_LENGTH = 128
const MAX_RANGE_DAYS = 366

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function getInclusiveDaySpan(startDate, endDate) {
  const startMs = Date.parse(`${startDate}T00:00:00Z`)
  const endMs = Date.parse(`${endDate}T00:00:00Z`)
  return Math.floor((endMs - startMs) / 86_400_000) + 1
}

export function validateAndResolveReportRange(query = {}) {
  const { startDate, endDate } = query

  if (startDate === undefined && endDate === undefined) {
    const source = findFinanceReportSource()
    return { ...source.coverage }
  }

  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    throw createHttpError(400, 'BAD_REQUEST', 'Tanggal awal dan akhir harus diisi dengan tanggal yang valid.')
  }

  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Tanggal awal dan akhir harus diisi dengan tanggal yang valid.')
  }

  if (startDate > endDate) {
    throw createHttpError(400, 'BAD_REQUEST', 'Tanggal awal tidak boleh melebihi tanggal akhir.')
  }

  if (getInclusiveDaySpan(startDate, endDate) > MAX_RANGE_DAYS) {
    throw createHttpError(400, 'BAD_REQUEST', `Rentang tanggal laporan maksimal ${MAX_RANGE_DAYS} hari.`)
  }

  return { startDate, endDate }
}

// untuk pengecekan sandi gate laporan keuangan.
export function verifyReportPassword(body, expectedPasswordHash) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Permintaan tidak valid.')
  }

  const { password } = body
  if (typeof password !== 'string' || !password.trim()) {
    throw createHttpError(400, 'BAD_REQUEST', 'Sandi wajib diisi.')
  }

  if (password.length > MAX_PASSWORD_LENGTH || /[\u0000-\u001F\u007F]/.test(password)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Format sandi tidak valid.')
  }

  if (!expectedPasswordHash) {
    throw createHttpError(503, 'SERVICE_UNAVAILABLE', 'Pemeriksaan sandi laporan belum dikonfigurasi.')
  }

  return { valid: verifyScryptPassword(password, expectedPasswordHash) }
}

// untuk perhitungan laporan keuangan publik.
export function getFinanceReport(query) {
  const range = validateAndResolveReportRange(query)
  const data = findFinanceReportSource()

  const metadata = {
    name: data.name,
    coverage: { ...data.coverage },
    months: [...data.months],
    range,
  }

  if (range.startDate < data.coverage.startDate || range.endDate > data.coverage.endDate) {
    return {
      ...metadata,
      status: 'unavailable',
      transactions: [],
      summary: null,
      message: 'Data belum tersedia atau belum lengkap untuk rentang ini. Data contoh hanya mencakup 1–30 April 2026.',
    }
  }

  const categoryIds = new Set(data.categories.map((category) => category.id))
  for (const item of data.transactions) {
    if (typeof item.id !== 'string' || !item.id) {
      throw new Error('ID transaksi laporan harus berupa string.')
    }
    if (!Number.isSafeInteger(item.amount)) {
      throw new Error('Nominal transaksi harus berupa integer Rupiah.')
    }
    if (!['income', 'expense'].includes(item.type)) {
      throw new Error('Jenis transaksi laporan tidak valid.')
    }
    if (!categoryIds.has(item.categoryId)) {
      throw new Error('Kategori transaksi laporan belum tersedia.')
    }
  }

  const transactions = data.transactions
    .filter((item) => item.date >= range.startDate && item.date <= range.endDate)
    .map((item) => ({ ...item }))

  const rows = data.categories.map((category) => {
    if (!Number.isSafeInteger(category.openingBalance)) {
      throw new Error('Saldo awal laporan harus berupa integer Rupiah.')
    }

    let openingBalance = category.openingBalance
    let income = 0
    let expense = 0

    for (const item of data.transactions) {
      if (item.categoryId !== category.id) continue
      if (item.date < range.startDate) {
        openingBalance += item.type === 'income' ? item.amount : -item.amount
      } else if (item.date <= range.endDate) {
        if (item.type === 'income') income += item.amount
        else expense += item.amount
      }
    }

    return {
      id: category.id,
      label: category.label,
      color: category.color,
      openingBalance,
      income,
      expense,
      closingBalance: openingBalance + income - expense,
    }
  })

  const totals = rows.reduce(
    (sum, row) => ({
      openingBalance: sum.openingBalance + row.openingBalance,
      income: sum.income + row.income,
      expense: sum.expense + row.expense,
      closingBalance: sum.closingBalance + row.closingBalance,
    }),
    { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 },
  )

  return {
    ...metadata,
    status: 'ready',
    transactions,
    summary: { rows, totals },
  }
}

