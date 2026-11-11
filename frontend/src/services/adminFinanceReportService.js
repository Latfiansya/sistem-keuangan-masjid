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
