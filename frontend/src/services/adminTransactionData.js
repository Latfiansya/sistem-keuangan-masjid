import { mockAdminFinanceHistory, mockAdminFinanceOctober } from '../mocks/adminFinanceReport.js'

export function getAdminHistoricalTransactions(dashboard) {
  return [
    ...structuredClone(mockAdminFinanceHistory),
    ...structuredClone(mockAdminFinanceOctober),
    ...dashboard.recentTransactions.map((transaction) => ({ ...transaction, source: 'dashboard', mock: true })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}

// Edit/hapus hanya menimpa pembacaan sesi; fixture dan cuplikan snapshot tidak dimutasi.
export function getActiveAdminTransactions(dashboard) {
  const deleted = new Set(dashboard.deletedTransactionIds || [])
  return [...getAdminHistoricalTransactions(dashboard), ...(dashboard.sessionTransactions || [])]
    .filter((transaction) => !deleted.has(transaction.id))
    .map((transaction) => ({ ...transaction, ...dashboard.transactionChanges?.[transaction.id] }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}
