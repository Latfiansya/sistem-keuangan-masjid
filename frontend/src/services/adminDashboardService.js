import { mockAdminDashboard } from '../mocks/adminDashboard.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export async function getAdminDashboard({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/dashboard', { signal })
    if (!data || !Array.isArray(data.categories) || !data.totals) {
      throw new Error('Format data dashboard admin API tidak sesuai kontrak.')
    }
    return data
  }
  const source = structuredClone(mockAdminDashboard)
  const categories = source.categories.map((category) => ({
    ...category,
    closingBalance: category.openingBalance + category.income - category.expense,
  }))
  const totals = categories.reduce((sum, category) => ({
    openingBalance: sum.openingBalance + category.openingBalance,
    income: sum.income + category.income,
    expense: sum.expense + category.expense,
    closingBalance: sum.closingBalance + category.closingBalance,
  }), { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 })
  return { ...source, categories, totals }
}
