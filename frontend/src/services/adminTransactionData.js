import { mockAdminFinanceHistory, mockAdminFinanceOctober } from '../mocks/adminFinanceReport.js'

export function getAdminHistoricalTransactions(dashboard) {
  if (Array.isArray(dashboard?.apiTransactions)) {
    return [...dashboard.apiTransactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  }
  return [
    ...structuredClone(mockAdminFinanceHistory),
    ...structuredClone(mockAdminFinanceOctober),
    ...dashboard.recentTransactions.map((transaction) => ({ ...transaction, source: 'dashboard', mock: true })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}

// Edit/hapus hanya menimpa pembacaan sesi pada mode mock; mode API memakai daftar dari backend.
export function getActiveAdminTransactions(dashboard) {
  if (Array.isArray(dashboard?.apiTransactions)) {
    return getAdminHistoricalTransactions(dashboard)
  }
  const deleted = new Set(dashboard.deletedTransactionIds || [])
  return [...getAdminHistoricalTransactions(dashboard), ...(dashboard.sessionTransactions || [])]
    .filter((transaction) => !deleted.has(transaction.id))
    .map((transaction) => ({ ...transaction, ...dashboard.transactionChanges?.[transaction.id] }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}
