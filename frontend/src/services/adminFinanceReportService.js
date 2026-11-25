import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'
import { validateReportRange } from '../utils/reportCalculations.js'
import { getActiveAdminTransactions, getAdminHistoricalTransactions } from './adminTransactionData.js'

// Selisih bersih transfer untuk satu kategori pada rentang tanggal inklusif (batas kosong berarti tanpa batas).
export function sumCategoryTransfers(transfers = [], categoryId, { from = '', to = '' } = {}) {
  return transfers.reduce((net, item) => {
    if ((from && item.date < from) || (to && item.date > to)) return net
    if (item.toCategoryId === categoryId) net += item.amount
    if (item.fromCategoryId === categoryId) net -= item.amount
    return net
  }, 0)
}

export function filterTransfersInRange(transfers = [], { startDate, endDate }) {
  return transfers.filter((item) => item.date >= startDate && item.date <= endDate)
}

export const dayBefore = (date) => {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() - 1)
  return value.toISOString().slice(0, 10)
}

export async function getAdminFinanceReport({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource === 'mock') throw new Error('Laporan admin API hanya tersedia pada mode API.')
  const data = await apiRequest('/admin/finance/report', { signal })
  if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
    throw new Error('Format data laporan keuangan admin API tidak sesuai kontrak.')
  }
  return data
}

export function buildAdminFinanceReport(dashboard) {
  const month = dashboard.updatedDate.slice(0, 7)
  const range = { startDate: `${month}-01`, endDate: dashboard.updatedDate }
  if (Array.isArray(dashboard?.apiTransactions)) {
    const transactions = dashboard.apiTransactions
    const dates = transactions.map((transaction) => transaction.date)
    const coverage = dashboard.apiCoverage || {
      startDate: [dashboard.updatedDate, ...dates].sort()[0],
      endDate: [dashboard.updatedDate, ...dates].sort().at(-1),
    }
    const transfers = Array.isArray(dashboard.apiTransfers) ? dashboard.apiTransfers : []
    // Saldo awal dashboard API sudah memasukkan seluruh transfer; dikeluarkan agar transfer dihitung sesuai tanggalnya.
    const historyOpeningBalances = Object.fromEntries(
      dashboard.categories.map((category) => [category.id, category.openingBalance - sumCategoryTransfers(transfers, category.id)])
    )
    return {
      ...dashboard,
      month,
      range,
      coverage,
      transactions,
      transfers,
      historyOpeningBalances,
      historicalTransactionCount: dashboard.historicalTransactionCount ?? transactions.length,
      sessionChangeCount: 0,
    }
  }

  const historical = getAdminHistoricalTransactions(dashboard)
  const transactions = getActiveAdminTransactions(dashboard)
  const historyOpeningBalances = Object.fromEntries(dashboard.categories.map((category) => {
    const prior = summarizeAdminFinanceTransactions(historical.filter((transaction) => transaction.categoryId === category.id && transaction.date < range.startDate))
    return [category.id, category.openingBalance - prior.income + prior.expense]
  }))
  const dates = transactions.map((transaction) => transaction.date)
  const coverage = { startDate: ['2026-01-01', ...dates].sort()[0], endDate: [dashboard.updatedDate, ...dates].sort().at(-1) }
  const sessionChangeCount = (dashboard.sessionTransactions || []).length + Object.keys(dashboard.transactionChanges || {}).length + (dashboard.deletedTransactionIds || []).length
  return { ...dashboard, month, range, coverage, transactions, transfers: [], historyOpeningBalances, historicalTransactionCount: historical.length, sessionChangeCount }
}

export const ADMIN_REPORT_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// Menghitung rentang tanggal 01 s/d akhir bulan (28/29/30/31, mendukung tahun kabisat) untuk bulan 1..12.
export function getAdminFinanceMonthRange(monthNumber, year = new Date().getFullYear()) {
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new Error('Bulan harus berupa bilangan bulat 1–12.')
  }
  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error('Tahun tidak valid.')
  }
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const mm = String(monthNumber).padStart(2, '0')
  const dd = String(lastDay).padStart(2, '0')
  return { startDate: `${year}-${mm}-01`, endDate: `${year}-${mm}-${dd}` }
}

export function getAdminFinancePreset(preset, today = new Date()) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = new Date(end)
  if (preset === 'week') start.setDate(start.getDate() - 6)
  else if (preset === 'month' || preset === 'quarter') {
    const day = start.getDate()
    start.setDate(1)
    start.setMonth(start.getMonth() - (preset === 'quarter' ? 3 : 1))
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    start.setDate(Math.min(day, lastDay))
  } else if (preset === 'currentMonth') start.setDate(1)
  else throw new Error('Pilihan rentang tidak tersedia.')
  const localDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  return { startDate: localDate(start), endDate: localDate(end) }
}

export function validateAdminFinanceRange(_report, range) {
  validateReportRange(range)
}

export function filterAdminFinanceTransactions(report, { range = report.range, categoryId = '', type = '', query = '' } = {}) {
  validateAdminFinanceRange(report, range)
  const term = query.trim().toLowerCase()
  return report.transactions.filter((transaction) => transaction.date >= range.startDate && transaction.date <= range.endDate && (!categoryId || transaction.categoryId === categoryId) && (!type || transaction.type === type) && (!term || transaction.description.toLowerCase().includes(term)))
}

export function buildAdminMonthlyRecap(report, range = report.coverage) {
  validateAdminFinanceRange(report, range)
  if (range.startDate > report.coverage.endDate || range.endDate < report.coverage.startDate) return []
  const months = []
  let month = [range.startDate, report.coverage.startDate].sort().at(-1).slice(0, 7)
  const lastMonth = [range.endDate, report.coverage.endDate].sort()[0].slice(0, 7)
  while (month <= lastMonth) {
    const startDate = [range.startDate, report.coverage.startDate, `${month}-01`].sort().at(-1)
    const categories = report.categories.map((category) => {
      const rows = report.transactions.filter((transaction) => transaction.categoryId === category.id)
      const prior = summarizeAdminFinanceTransactions(rows.filter((transaction) => transaction.date < startDate))
      const current = summarizeAdminFinanceTransactions(rows.filter((transaction) => transaction.date >= startDate && transaction.date <= range.endDate && transaction.date.startsWith(month)))
      const monthEnd = [range.endDate, `${month}-31`].sort()[0]
      const openingBalance = report.historyOpeningBalances[category.id] + prior.income - prior.expense + sumCategoryTransfers(report.transfers, category.id, { to: dayBefore(startDate) })
      const transferNet = sumCategoryTransfers(report.transfers, category.id, { from: startDate, to: monthEnd })
      return { ...category, openingBalance, income: current.income, expense: current.expense, closingBalance: openingBalance + current.income - current.expense + transferNet, count: current.count }
    })
    const totals = categories.reduce((sum, category) => Object.fromEntries(Object.keys(sum).map((key) => [key, sum[key] + category[key]])), { openingBalance: 0, income: 0, expense: 0, closingBalance: 0, count: 0 })
    const monthStart = [range.startDate, report.coverage.startDate, `${month}-01`].sort().at(-1)
    const transfers = filterTransfersInRange(report.transfers, { startDate: monthStart, endDate: [range.endDate, `${month}-31`].sort()[0] })
    months.push({ month, categories, totals, transfers })
    const [year, number] = month.split('-').map(Number)
    month = number === 12 ? `${year + 1}-01` : `${year}-${String(number + 1).padStart(2, '0')}`
  }
  return months
}

export function summarizeAdminFinanceTransactions(transactions) {
  return transactions.reduce((sum, transaction) => ({
    count: sum.count + 1,
    income: sum.income + (transaction.type === 'income' ? transaction.amount : 0),
    expense: sum.expense + (transaction.type === 'expense' ? transaction.amount : 0),
  }), { count: 0, income: 0, expense: 0 })
}
