import { validateReportRange } from '../utils/reportCalculations.js'
import { mockAdminFinanceHistory, mockAdminFinanceOctober } from '../mocks/adminFinanceReport.js'

export function buildAdminFinanceReport(dashboard) {
  const month = dashboard.updatedDate.slice(0, 7)
  const range = { startDate: `${month}-01`, endDate: dashboard.updatedDate }
  const transactions = [
    ...structuredClone(mockAdminFinanceHistory),
    ...structuredClone(mockAdminFinanceOctober),
    ...dashboard.recentTransactions.map((transaction) => ({ ...transaction, source: 'dashboard', mock: true })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const historyOpeningBalances = Object.fromEntries(dashboard.categories.map((category) => {
    const prior = summarizeAdminFinanceTransactions(transactions.filter((transaction) => transaction.categoryId === category.id && transaction.date < range.startDate))
    return [category.id, category.openingBalance - prior.income + prior.expense]
  }))
  return { ...dashboard, month, range, coverage: { startDate: '2026-01-01', endDate: dashboard.updatedDate }, transactions, historyOpeningBalances }
}

export function getAdminFinancePreset(report, preset) {
  if (preset === 'month') return { ...report.range }
  if (preset !== 'week') throw new Error('Pilihan rentang cuplikan tidak tersedia.')
  const start = new Date(`${report.updatedDate}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 6)
  return { startDate: [start.toISOString().slice(0, 10), report.range.startDate].sort().at(-1), endDate: report.updatedDate }
}

export function validateAdminFinanceRange(report, range) {
  validateReportRange(range)
  if (range.startDate < report.coverage.startDate || range.endDate > report.coverage.endDate) throw new Error('Pilih rentang di dalam riwayat mock, sampai tanggal terakhir diperbarui.')
}

export function filterAdminFinanceTransactions(report, { range = report.range, categoryId = '', type = '', query = '' } = {}) {
  validateAdminFinanceRange(report, range)
  const term = query.trim().toLowerCase()
  return report.transactions.filter((transaction) => transaction.date >= range.startDate && transaction.date <= range.endDate && (!categoryId || transaction.categoryId === categoryId) && (!type || transaction.type === type) && (!term || transaction.description.toLowerCase().includes(term)))
}

export function buildAdminMonthlyRecap(report, range = report.coverage) {
  validateAdminFinanceRange(report, range)
  const months = []
  let month = range.startDate.slice(0, 7)
  while (month <= range.endDate.slice(0, 7)) {
    const startDate = month === range.startDate.slice(0, 7) ? range.startDate : `${month}-01`
    const categories = report.categories.map((category) => {
      const rows = report.transactions.filter((transaction) => transaction.categoryId === category.id)
      const prior = summarizeAdminFinanceTransactions(rows.filter((transaction) => transaction.date < startDate))
      const current = summarizeAdminFinanceTransactions(rows.filter((transaction) => transaction.date >= startDate && transaction.date <= range.endDate && transaction.date.startsWith(month)))
      const openingBalance = report.historyOpeningBalances[category.id] + prior.income - prior.expense
      return { ...category, openingBalance, income: current.income, expense: current.expense, closingBalance: openingBalance + current.income - current.expense, count: current.count }
    })
    const totals = categories.reduce((sum, category) => Object.fromEntries(Object.keys(sum).map((key) => [key, sum[key] + category[key]])), { openingBalance: 0, income: 0, expense: 0, closingBalance: 0, count: 0 })
    months.push({ month, categories, totals })
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
