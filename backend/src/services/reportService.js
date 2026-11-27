import { defaultFinanceReportRepository } from '../repositories/financeReportRepository.js'
import { verifyAccountPassword } from '../utils/adminAuth.js'
import { createHttpError } from '../utils/httpError.js'
import { verifyScryptPassword } from '../utils/passwordHash.js'
import { signReportAccessToken, verifyReportAccessToken } from '../utils/reportAccessToken.js'

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

function extractValidPasswordInput(body) {
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

  return password
}

// untuk pengecekan sandi gate laporan keuangan.
export function verifyReportPassword(body, expectedPasswordHash) {
  const password = extractValidPasswordInput(body)

  if (!expectedPasswordHash) {
    throw createHttpError(503, 'SERVICE_UNAVAILABLE', 'Pemeriksaan sandi laporan belum dikonfigurasi.')
  }

  return { valid: verifyScryptPassword(password, expectedPasswordHash) }
}

// Business logic layer untuk laporan keuangan publik berbasis data PostgreSQL.
export function createReportService(repository = defaultFinanceReportRepository) {
  async function assertPublicReportEnabled() {
    if (typeof repository.findPublicReportEnabled === 'function') {
      const enabled = await repository.findPublicReportEnabled()
      if (!enabled) {
        throw createHttpError(
          403,
          'FORBIDDEN',
          'Laporan keuangan publik saat ini sedang dinonaktifkan oleh pengurus.'
        )
      }
    }
  }

  async function validateAndResolveReportRange(query = {}, metadata) {
    const { startDate, endDate } = query

    if (startDate === undefined && endDate === undefined) {
      return metadata.defaultRange ? { ...metadata.defaultRange } : null
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

  async function resolveExpectedPasswordHash(fallbackPasswordHash) {
    const dbHash =
      typeof repository.findReportAccessPasswordHash === 'function'
        ? await repository.findReportAccessPasswordHash()
        : ''
    return dbHash || fallbackPasswordHash || ''
  }

  return {
    verifyReportPassword,

    async checkPassword(body, fallbackPasswordHash) {
      const password = extractValidPasswordInput(body)
      await assertPublicReportEnabled()
      const expectedHash = await resolveExpectedPasswordHash(fallbackPasswordHash)

      if (!expectedHash) {
        throw createHttpError(503, 'SERVICE_UNAVAILABLE', 'Pemeriksaan sandi laporan belum dikonfigurasi.')
      }

      const valid = await verifyAccountPassword(password, expectedHash)
      return { valid }
    },

    async authorizeReportAccess(body, fallbackPasswordHash, accessSecret, ttlMs) {
      const password = extractValidPasswordInput(body)
      await assertPublicReportEnabled()
      const expectedHash = await resolveExpectedPasswordHash(fallbackPasswordHash)

      if (!expectedHash) {
        throw createHttpError(503, 'SERVICE_UNAVAILABLE', 'Pemeriksaan sandi laporan belum dikonfigurasi.')
      }

      const valid = await verifyAccountPassword(password, expectedHash)
      const token = valid
        ? signReportAccessToken(accessSecret, { ttlMs, expectedPasswordHash: expectedHash })
        : ''
      return { valid, token }
    },

    async verifyReportAccessSession(token, accessSecret, fallbackPasswordHash) {
      await assertPublicReportEnabled()
      const expectedHash = await resolveExpectedPasswordHash(fallbackPasswordHash)
      if (!expectedHash || !verifyReportAccessToken(token, accessSecret, { expectedPasswordHash: expectedHash })) {
        throw createHttpError(
          401,
          'REPORT_ACCESS_REQUIRED',
          'Masukkan kode akses laporan terlebih dahulu.'
        )
      }
    },

    async getFinanceReport(query = {}) {
      await assertPublicReportEnabled()
      const metadata = await repository.findFinanceReportMetadata()
      const range = await validateAndResolveReportRange(query, metadata)

      const baseInfo = {
        name: metadata.name,
        coverage: metadata.coverage ? { ...metadata.coverage } : null,
        months: [...metadata.months],
        range,
      }

      if (
        !metadata.coverage ||
        !range ||
        range.startDate < metadata.coverage.startDate ||
        range.endDate > metadata.coverage.endDate
      ) {
        return {
          ...baseInfo,
          status: 'unavailable',
          transactions: [],
          summary: null,
          message: metadata.coverage
            ? `Data belum tersedia atau belum lengkap untuk rentang ini. Cakupan database saat ini ${metadata.coverage.startDate} sampai ${metadata.coverage.endDate}.`
            : 'Belum ada data transaksi tercatat pada database.',
        }
      }

      const data = await repository.findFinanceReportForRange(range)
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

      const transactions = data.transactions.map((item) => ({ ...item }))
      // Transfer internal di dalam periode memindahkan saldo antar kategori tanpa dihitung sebagai pemasukan/pengeluaran.
      const transfers = (data.transfers ?? []).map((item) => ({
        date: item.date,
        fromCategoryId: item.fromCategoryId,
        fromCategoryLabel: item.fromCategoryLabel,
        toCategoryId: item.toCategoryId,
        toCategoryLabel: item.toCategoryLabel,
        amount: item.amount,
      }))

      const rows = data.categories.map((category) => {
        if (!Number.isSafeInteger(category.openingBalance)) {
          throw new Error('Saldo awal laporan harus berupa integer Rupiah.')
        }

        const priorMutation = data.priorMutationsByCategory?.get(category.dbId)?.net ?? 0
        const openingBalance = category.openingBalance + priorMutation
        let income = 0
        let expense = 0
        let transferNet = 0
        for (const transfer of transfers) {
          if (transfer.toCategoryId === category.id) transferNet += transfer.amount
          if (transfer.fromCategoryId === category.id) transferNet -= transfer.amount
        }

        for (const item of transactions) {
          if (item.categoryId !== category.id) continue
          if (item.type === 'income') income += item.amount
          else expense += item.amount
        }

        return {
          id: category.id,
          label: category.label,
          color: category.color,
          openingBalance,
          income,
          expense,
          closingBalance: openingBalance + income - expense + transferNet,
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
        ...baseInfo,
        status: 'ready',
        transactions,
        summary: { rows, totals, transfers },
      }
    },
  }
}

export const defaultReportService = createReportService()

export function getFinanceReport(query) {
  return defaultReportService.getFinanceReport(query)
}
