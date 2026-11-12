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

function summarizeTransactions(transactions) {
  return transactions.reduce(
    (sum, transaction) => ({
      count: sum.count + 1,
      income: sum.income + (transaction.type === 'income' ? transaction.amount : 0),
      expense: sum.expense + (transaction.type === 'expense' ? transaction.amount : 0),
    }),
    { count: 0, income: 0, expense: 0 }
  )
}

function enrichCategoriesWithBalances(categories) {
  const enriched = categories.map((category) => ({
    ...category,
    closingBalance: category.openingBalance + category.income - category.expense,
  }))
  const totals = enriched.reduce(
    (sum, category) => ({
      openingBalance: sum.openingBalance + category.openingBalance,
      income: sum.income + category.income,
      expense: sum.expense + category.expense,
      closingBalance: sum.closingBalance + category.closingBalance,
    }),
    { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 }
  )
  return { categories: enriched, totals }
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

  if (typeof payload.categoryId !== 'string' || !categories.some((category) => category.id === payload.categoryId)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Pilih kategori dana yang tersedia.')
  }

  const textFields = [
    ['description', 'Uraian', 500, true, false],
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

function buildMonthlyRecap(categories, transactions, historyOpeningBalances, coverage, range) {
  validateCalendarRange(range)
  if (range.startDate > coverage.endDate || range.endDate < coverage.startDate) {
    return []
  }

  const months = []
  let month = [range.startDate, coverage.startDate].sort().at(-1).slice(0, 7)
  const lastMonth = [range.endDate, coverage.endDate].sort()[0].slice(0, 7)

  while (month <= lastMonth) {
    const startDate = [range.startDate, coverage.startDate, `${month}-01`].sort().at(-1)
    const monthCategories = categories.map((category) => {
      const rows = transactions.filter((transaction) => transaction.categoryId === category.id)
      const prior = summarizeTransactions(rows.filter((transaction) => transaction.date < startDate))
      const current = summarizeTransactions(
        rows.filter(
          (transaction) =>
            transaction.date >= startDate &&
            transaction.date <= range.endDate &&
            transaction.date.startsWith(month)
        )
      )
      const openingBalance = (historyOpeningBalances[category.id] ?? 0) + prior.income - prior.expense
      return {
        ...category,
        openingBalance,
        income: current.income,
        expense: current.expense,
        closingBalance: openingBalance + current.income - current.expense,
        count: current.count,
      }
    })

    const totals = monthCategories.reduce(
      (sum, category) => ({
        openingBalance: sum.openingBalance + category.openingBalance,
        income: sum.income + category.income,
        expense: sum.expense + category.expense,
        closingBalance: sum.closingBalance + category.closingBalance,
        count: sum.count + category.count,
      }),
      { openingBalance: 0, income: 0, expense: 0, closingBalance: 0, count: 0 }
    )

    months.push({ month, categories: monthCategories, totals })
    const [year, number] = month.split('-').map(Number)
    month = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, '0')}`
  }

  return months
}

// Business logic layer untuk pengelolaan keuangan, kategori, dan transaksi pengurus.
export function createAdminFinanceService(repository = defaultAdminFinanceRepository) {
  function buildBaseReportState() {
    const snapshot = repository.getStateSnapshot()
    const { categories, totals } = enrichCategoriesWithBalances(snapshot.categories)
    const month = snapshot.updatedDate.slice(0, 7)
    const range = { startDate: `${month}-01`, endDate: snapshot.updatedDate }
    const historical = snapshot.historicalTransactions
    const transactions = snapshot.activeTransactions

    const historyOpeningBalances = Object.fromEntries(
      categories.map((category) => {
        const prior = summarizeTransactions(
          historical.filter(
            (transaction) =>
              transaction.categoryId === category.id && transaction.date < range.startDate
          )
        )
        return [category.id, category.openingBalance - prior.income + prior.expense]
      })
    )

    const dates = transactions.map((transaction) => transaction.date)
    const coverage = {
      startDate: ['2026-01-01', ...dates].sort()[0],
      endDate: [snapshot.updatedDate, ...dates].sort().at(-1),
    }

    const sessionChangeCount =
      snapshot.sessionTransactions.length +
      Object.keys(snapshot.transactionChanges).length +
      snapshot.deletedTransactionIds.length

    return {
      updatedDate: snapshot.updatedDate,
      account: snapshot.account,
      month,
      range,
      coverage,
      categories,
      totals,
      historyOpeningBalances,
      historicalTransactionCount: historical.length,
      sessionChangeCount,
      transactions,
      recentBaseline: snapshot.recentTransactions,
      sessionTransactions: snapshot.sessionTransactions,
    }
  }

  return {
    getDashboardSummary() {
      const state = buildBaseReportState()
      const recentIds = new Set(state.recentBaseline.map((transaction) => transaction.id))
      const sessionOrder = new Map(
        state.sessionTransactions.map((transaction, index) => [transaction.id, index])
      )

      const recentTransactions = state.transactions
        .filter((transaction) => recentIds.has(transaction.id) || transaction.source === 'session')
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            (sessionOrder.get(a.id) ?? Infinity) - (sessionOrder.get(b.id) ?? Infinity)
        )

      return {
        updatedDate: state.updatedDate,
        account: state.account,
        categories: state.categories,
        totals: state.totals,
        recentTransactions,
      }
    },

    listCategories() {
      const state = buildBaseReportState()
      return {
        categories: state.categories,
        totals: state.totals,
        allowedColors: repository.getAllowedColors(),
      }
    },

    createCategory(payload) {
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

      const categories = repository.findCategories()
      if (categories.some((item) => cleanCategoryName(item.label).toLowerCase() === label.toLowerCase())) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori sudah digunakan.')
      }

      const allowedColors = repository.getAllowedColors()
      if (typeof payload.color !== 'string' || !allowedColors.includes(payload.color)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Pilih salah satu warna kategori.')
      }

      const created = repository.insertCategory({ label, color: payload.color })
      return {
        ...created,
        closingBalance: created.openingBalance + created.income - created.expense,
      }
    },

    updateCategory(id, payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload kategori tidak valid.')
      }

      const categories = repository.findCategories()
      if (!categories.some((item) => item.id === id)) {
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

      if (
        categories.some(
          (item) =>
            item.id !== id && cleanCategoryName(item.label).toLowerCase() === label.toLowerCase()
        )
      ) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama kategori sudah digunakan.')
      }

      const allowedColors = repository.getAllowedColors()
      if (typeof payload.color !== 'string' || !allowedColors.includes(payload.color)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Pilih salah satu warna kategori.')
      }

      const updated = repository.updateCategoryById(id, { label, color: payload.color })
      return {
        ...updated,
        closingBalance: updated.openingBalance + updated.income - updated.expense,
      }
    },

    deleteCategory(id) {
      const state = buildBaseReportState()
      const category = state.categories.find((item) => item.id === id)
      if (!category) {
        throw createHttpError(404, 'NOT_FOUND', 'Kategori tidak ditemukan.')
      }

      const hasBalance = ['openingBalance', 'income', 'expense', 'closingBalance'].some(
        (key) => category[key] !== 0
      )
      const hasTransactions = state.transactions.some(
        (transaction) => transaction.categoryId === id
      )

      if (hasBalance || hasTransactions) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Kategori yang digunakan transaksi atau memiliki saldo tidak dapat dihapus.'
        )
      }

      repository.deleteCategoryById(id)
      return { deletedId: id }
    },

    getFinanceReport(queryParams = {}) {
      const state = buildBaseReportState()
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
        : state.coverage

      validateCalendarRange(filterRange)

      const categoryId = typeof queryParams.categoryId === 'string' ? queryParams.categoryId.trim() : ''
      if (categoryId && !state.categories.some((item) => item.id === categoryId)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Kategori filter tidak ditemukan.')
      }

      const type = typeof queryParams.type === 'string' ? queryParams.type.trim() : ''
      if (type && !['income', 'expense'].includes(type)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Jenis transaksi filter harus income atau expense.')
      }

      const searchTerm = typeof queryParams.query === 'string' ? queryParams.query.trim().toLowerCase() : ''

      const filteredTransactions = state.transactions.filter(
        (transaction) =>
          transaction.date >= filterRange.startDate &&
          transaction.date <= filterRange.endDate &&
          (!categoryId || transaction.categoryId === categoryId) &&
          (!type || transaction.type === type) &&
          (!searchTerm || transaction.description.toLowerCase().includes(searchTerm))
      )

      const summary = summarizeTransactions(filteredTransactions)
      const monthlyRecap = buildMonthlyRecap(
        state.categories,
        state.transactions,
        state.historyOpeningBalances,
        state.coverage,
        filterRange
      )

      let paginatedTransactions = filteredTransactions
      let pagination = null

      if (queryParams.page !== undefined || queryParams.pageSize !== undefined) {
        const rawPageSize = queryParams.pageSize ?? '20'
        const isAll = String(rawPageSize).toLowerCase() === 'all'
        const pageSize = isAll ? Math.max(filteredTransactions.length, 1) : Number(rawPageSize)
        if (!isAll && (!Number.isInteger(pageSize) || ![20, 30, 50].includes(pageSize))) {
          throw createHttpError(400, 'BAD_REQUEST', 'Ukuran halaman harus 20, 30, 50, atau all.')
        }

        const requestedPage = queryParams.page !== undefined ? Number(queryParams.page) : 1
        if (!Number.isInteger(requestedPage) || requestedPage < 1) {
          throw createHttpError(400, 'BAD_REQUEST', 'Nomor halaman harus bilangan bulat positif.')
        }

        const totalItems = filteredTransactions.length
        const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize))
        const currentPage = Math.min(requestedPage, totalPages)
        const startIndex = isAll ? 0 : (currentPage - 1) * pageSize
        paginatedTransactions = isAll
          ? filteredTransactions
          : filteredTransactions.slice(startIndex, startIndex + pageSize)

        pagination = {
          page: currentPage,
          pageSize: isAll ? 'all' : pageSize,
          totalItems,
          totalPages,
        }
      }

      return {
        updatedDate: state.updatedDate,
        account: state.account,
        month: state.month,
        range: filterRange,
        defaultMonthRange: state.range,
        coverage: state.coverage,
        categories: state.categories,
        totals: state.totals,
        historyOpeningBalances: state.historyOpeningBalances,
        historicalTransactionCount: state.historicalTransactionCount,
        sessionChangeCount: state.sessionChangeCount,
        transactions: paginatedTransactions,
        summary,
        monthlyRecap,
        ...(pagination ? { pagination } : {}),
      }
    },

    getTransactionById(id) {
      const transaction = repository.findTransactionById(id)
      if (!transaction) {
        throw createHttpError(404, 'NOT_FOUND', 'Transaksi tidak ditemukan.')
      }
      return transaction
    },

    createTransaction(payload) {
      const categories = repository.findCategories()
      const validated = validateTransactionPayload(payload, categories)
      return repository.insertTransaction(validated)
    },

    updateTransaction(id, payload) {
      const existing = repository.findTransactionById(id)
      if (!existing) {
        throw createHttpError(404, 'NOT_FOUND', 'Transaksi tidak ditemukan.')
      }

      const categories = repository.findCategories()
      const validated = validateTransactionPayload(payload, categories, existing.type)
      return repository.updateTransactionById(id, validated)
    },

    deleteTransaction(id) {
      const deleted = repository.deleteTransactionById(id)
      if (!deleted) {
        throw createHttpError(404, 'NOT_FOUND', 'Transaksi tidak ditemukan.')
      }
      return { deletedId: id }
    },
  }
}

export const defaultAdminFinanceService = createAdminFinanceService()

