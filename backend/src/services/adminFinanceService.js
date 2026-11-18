import { defaultAdminFinanceRepository } from '../repositories/adminFinanceRepository.js'
import { createHttpError } from '../utils/httpError.js'

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MAX_RANGE_DAYS = 366
const MS_PER_DAY = 24 * 60 * 60 * 1000
const MAX_AMOUNT = 999_999_999_999

function parseIsoCalendarDate(value) {
  if (typeof value !== 'string') return null
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year <= 0 || month < 1 || month > 12 || day < 1 || day > 31) return null

  const utcTime = Date.UTC(year, month - 1, day)
  const date = new Date(utcTime)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return utcTime
}

function validateCalendarRange(range) {
  const startDate = range?.startDate
  const endDate = range?.endDate
  if (!startDate || !endDate) {
    throw createHttpError(400, 'BAD_REQUEST', 'Rentang tanggal wajib mencantumkan tanggal awal dan akhir.')
  }

  const startMs = parseIsoCalendarDate(startDate)
  const endMs = parseIsoCalendarDate(endDate)
  if (startMs === null || endMs === null) {
    throw createHttpError(400, 'BAD_REQUEST', 'Format tanggal harus YYYY-MM-DD yang valid.')
  }
  if (startMs > endMs) {
    throw createHttpError(400, 'BAD_REQUEST', 'Tanggal awal tidak boleh melebihi tanggal akhir.')
  }

  const daySpan = Math.floor((endMs - startMs) / MS_PER_DAY) + 1
  if (daySpan > MAX_RANGE_DAYS) {
    throw createHttpError(400, 'BAD_REQUEST', `Rentang tanggal maksimal ${MAX_RANGE_DAYS} hari.`)
  }
}

function cleanCategoryName(name) {
  return String(name ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
}

function hasControlChars(value, allowMultiline = false) {
  return [...String(value)].some((character) => {
    const code = character.codePointAt(0)
    if (code === 127) return true
    if (code < 32) {
      return !(allowMultiline && (code === 9 || code === 10 || code === 13))
    }
    return false
  })
}

function parseTransactionAmount(rawAmount) {
  if (typeof rawAmount === 'number') {
    if (!Number.isSafeInteger(rawAmount) || rawAmount <= 0 || rawAmount > MAX_AMOUNT) {
      return null
    }
    return rawAmount
  }
  if (typeof rawAmount === 'string') {
    if (!/^\d{1,12}$/.test(rawAmount)) return null
    const parsed = Number(rawAmount)
    if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > MAX_AMOUNT) return null
    return parsed
  }
  return null
}

function validateTransactionPayload(payload, categories, fixedType) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Payload transaksi tidak valid.')
  }

  const type = fixedType ?? payload.type
  if (!['income', 'expense'].includes(type)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Jenis transaksi harus berupa income atau expense.')
  }

  if (parseIsoCalendarDate(payload.date) === null) {
    throw createHttpError(400, 'BAD_REQUEST', 'Pilih tanggal transaksi yang valid.')
  }

  if (
    typeof payload.categoryId !== 'string' ||
    !categories.some((category) => category.id === payload.categoryId)
  ) {
    throw createHttpError(400, 'BAD_REQUEST', 'Pilih kategori dana yang tersedia.')
  }

  const textFields = [
    ['description', 'Uraian', 255, true, false],
    ['personName', 'Nama', 100, false, false],
    ['notes', 'Keterangan', 500, false, true],
  ]

  for (const [field, label, limit, required, allowMultiline] of textFields) {
    const rawValue = payload[field]
    if (rawValue !== undefined && typeof rawValue !== 'string') {
      throw createHttpError(400, 'BAD_REQUEST', `${label} tidak valid.`)
    }
    const value = typeof rawValue === 'string' ? rawValue : ''
    if (required && !value.trim()) {
      throw createHttpError(400, 'BAD_REQUEST', `${label} wajib diisi.`)
    }
    if (value.length > limit || hasControlChars(value, allowMultiline)) {
      throw createHttpError(400, 'BAD_REQUEST', `${label} tidak valid atau melebihi ${limit} karakter.`)
    }
  }

  const amount = parseTransactionAmount(payload.amount)
  if (amount === null) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      'Masukkan rupiah bulat positif, maksimal 999.999.999.999, tanpa desimal.'
    )
  }

  return {
    type,
    date: payload.date,
    categoryId: payload.categoryId,
    description: payload.description.trim(),
    amount,
    personName: typeof payload.personName === 'string' ? payload.personName.trim() : '',
    notes: typeof payload.notes === 'string' ? payload.notes.trim() : '',
    showDonorNamePublic: type === 'income' && payload.showDonorNamePublic === true,
  }
}

function summarizeCategoryTotals(categories) {
  return categories.reduce(
    (sum, category) => ({
      openingBalance: sum.openingBalance + category.openingBalance,
      income: sum.income + category.income,
      expense: sum.expense + category.expense,
      closingBalance: sum.closingBalance + category.closingBalance,
    }),
    { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 }
  )
}

// Business logic layer untuk pengelolaan keuangan, kategori, dan transaksi pengurus.
export function createAdminFinanceService(repository = defaultAdminFinanceRepository) {
  return {
    async getDashboardSummary() {
      return repository.getDashboardData()
    },

    async listCategories() {
      const categories = await repository.findCategories()
      return {
        categories: categories.map(({ dbId: _dbId, ...rest }) => rest),
        totals: summarizeCategoryTotals(categories),
        allowedColors: repository.getAllowedColors(),
      }
    },

    async createCategory(payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload kategori tidak valid.')
      }

      const rawName = payload.name ?? payload.label
      if (typeof rawName !== 'string') {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori wajib diisi.')
      }

      const label = cleanCategoryName(rawName)
      if (!label) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori wajib diisi.')
      }
      if (label.length > 100 || hasControlChars(rawName, false)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Gunakan nama maksimal 100 karakter tanpa karakter kontrol.'
        )
      }

      const categories = await repository.findCategories()
      if (categories.some((item) => cleanCategoryName(item.label).toLowerCase() === label.toLowerCase())) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori sudah digunakan.')
      }

      const allowedColors = repository.getAllowedColors()
      if (payload.color !== undefined && (typeof payload.color !== 'string' || !allowedColors.includes(payload.color))) {
        throw createHttpError(400, 'BAD_REQUEST', 'Pilih salah satu warna kategori.')
      }

      const created = await repository.insertCategory({ label, color: payload.color })
      const { dbId: _dbId, ...rest } = created
      return rest
    },

    async updateCategory(id, payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload kategori tidak valid.')
      }

      const existing = await repository.findCategoryById(id)
      if (!existing) {
        throw createHttpError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.')
      }

      const rawName = payload.name ?? payload.label
      if (typeof rawName !== 'string') {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori wajib diisi.')
      }

      const label = cleanCategoryName(rawName)
      if (!label) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori wajib diisi.')
      }
      if (label.length > 100 || hasControlChars(rawName, false)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Gunakan nama maksimal 100 karakter tanpa karakter kontrol.'
        )
      }

      const categories = await repository.findCategories()
      if (
        categories.some(
          (item) =>
            item.id !== existing.id &&
            cleanCategoryName(item.label).toLowerCase() === label.toLowerCase()
        )
      ) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori sudah digunakan.')
      }

      const allowedColors = repository.getAllowedColors()
      if (payload.color !== undefined && (typeof payload.color !== 'string' || !allowedColors.includes(payload.color))) {
        throw createHttpError(400, 'BAD_REQUEST', 'Pilih salah satu warna kategori.')
      }

      const updated = await repository.updateCategoryById(id, { label, color: payload.color })
      if (!updated) {
        throw createHttpError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.')
      }
      const { dbId: _dbId, ...rest } = updated
      return rest
    },

    async deleteCategory(id) {
      const category = await repository.findCategoryById(id)
      if (!category) {
        throw createHttpError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.')
      }

      const hasBalance = ['openingBalance', 'income', 'expense', 'closingBalance'].some(
        (key) => category[key] !== 0
      )
      const isUsed = await repository.hasCategoryUsage(id)

      if (hasBalance || isUsed) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Kategori yang digunakan transaksi atau memiliki saldo tidak dapat dihapus.'
        )
      }

      await repository.deleteCategoryById(id)
      return { deletedId: category.id }
    },

    async getFinanceReport(queryParams = {}) {
      const metadata = await repository.getReportMetadata()
      const hasStart = queryParams.startDate !== undefined && queryParams.startDate !== ''
      const hasEnd = queryParams.endDate !== undefined && queryParams.endDate !== ''

      if (hasStart !== hasEnd) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Parameter startDate dan endDate harus disertakan bersama.'
        )
      }

      const filterRange = hasStart && hasEnd
        ? { startDate: String(queryParams.startDate), endDate: String(queryParams.endDate) }
        : metadata.coverage

      validateCalendarRange(filterRange)

      const categoryId = typeof queryParams.categoryId === 'string' ? queryParams.categoryId.trim() : ''
      if (categoryId && !metadata.categories.some((item) => item.id === categoryId)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Kategori filter tidak ditemukan.')
      }

      const type = typeof queryParams.type === 'string' ? queryParams.type.trim() : ''
      if (type && !['income', 'expense'].includes(type)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Jenis transaksi filter harus income atau expense.')
      }

      const searchTerm = typeof queryParams.query === 'string' ? queryParams.query.trim() : ''

      let page
      let pageSize
      if (queryParams.page !== undefined || queryParams.pageSize !== undefined) {
        const rawPageSize = queryParams.pageSize ?? '20'
        const isAll = String(rawPageSize).toLowerCase() === 'all'
        const parsedSize = isAll ? 'all' : Number(rawPageSize)
        if (!isAll && (!Number.isInteger(parsedSize) || ![20, 30, 50].includes(parsedSize))) {
          throw createHttpError(400, 'BAD_REQUEST', 'Ukuran halaman harus 20, 30, 50, atau all.')
        }

        const requestedPage = queryParams.page !== undefined ? Number(queryParams.page) : 1
        if (!Number.isInteger(requestedPage) || requestedPage < 1) {
          throw createHttpError(400, 'BAD_REQUEST', 'Nomor halaman harus bilangan bulat positif.')
        }
        page = requestedPage
        pageSize = parsedSize
      }

      const reportResult = await repository.queryFinanceReport({
        startDate: filterRange.startDate,
        endDate: filterRange.endDate,
        categoryApiId: categoryId,
        type,
        query: searchTerm,
        page,
        pageSize,
      })

      const categories = reportResult.categories.map(({ dbId: _dbId, ...rest }) => rest)
      const month = reportResult.updatedDate.slice(0, 7)

      return {
        updatedDate: reportResult.updatedDate,
        account: reportResult.account,
        month,
        range: filterRange,
        coverage: reportResult.coverage,
        categories,
        totals: summarizeCategoryTotals(categories),
        historicalTransactionCount: reportResult.historicalTransactionCount,
        transactions: reportResult.transactions,
        summary: reportResult.summary,
        monthlyRecap: reportResult.monthlyRecap,
        ...(reportResult.pagination ? { pagination: reportResult.pagination } : {}),
      }
    },

    async getTransactionById(id) {
      const transaction = await repository.findTransactionById(id)
      if (!transaction) {
        throw createHttpError(404, 'NOT_FOUND', 'Transaksi tidak ditemukan.')
      }
      return transaction
    },

    async createTransaction(payload) {
      const categories = await repository.findCategories()
      const validated = validateTransactionPayload(payload, categories)
      return repository.insertTransaction(validated)
    },

    async updateTransaction(id, payload) {
      const existing = await repository.findTransactionById(id)
      if (!existing) {
        throw createHttpError(404, 'NOT_FOUND', 'Transaksi tidak ditemukan.')
      }

      const categories = await repository.findCategories()
      const validated = validateTransactionPayload(payload, categories, existing.type)
      const updated = await repository.updateTransactionById(id, validated)
      if (!updated) {
        throw createHttpError(404, 'NOT_FOUND', 'Transaksi tidak ditemukan.')
      }
      return updated
    },

    async deleteTransaction(id) {
      const deleted = await repository.deleteTransactionById(id)
      if (!deleted) {
        throw createHttpError(404, 'NOT_FOUND', 'Transaksi tidak ditemukan.')
      }
      return { deletedId: String(id) }
    },
  }
}

export const defaultAdminFinanceService = createAdminFinanceService()
