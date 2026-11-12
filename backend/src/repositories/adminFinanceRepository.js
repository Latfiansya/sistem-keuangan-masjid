import crypto from 'node:crypto'
import { adminCategoryColorIds, getInitialAdminFinanceState } from '../data/adminFinance.js'

// Data access layer untuk data keuangan pengurus (in-memory sementara sebelum PostgreSQL).
export function createAdminFinanceRepository() {
  let state = getInitialAdminFinanceState()

  function getHistoricalTransactions() {
    return [
      ...structuredClone(state.historyTransactions),
      ...structuredClone(state.octoberTransactions),
      ...state.recentTransactions.map((transaction) => ({
        ...structuredClone(transaction),
        source: 'dashboard',
        mock: true,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  }

  function getActiveTransactions() {
    const deleted = new Set(state.deletedTransactionIds)
    return [
      ...getHistoricalTransactions(),
      ...structuredClone(state.sessionTransactions),
    ]
      .filter((transaction) => !deleted.has(transaction.id))
      .map((transaction) => ({
        ...transaction,
        ...(state.transactionChanges[transaction.id]
          ? structuredClone(state.transactionChanges[transaction.id])
          : {}),
      }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  }

  return {
    getAllowedColors() {
      return [...adminCategoryColorIds]
    },

    getStateSnapshot() {
      return {
        updatedDate: state.updatedDate,
        account: structuredClone(state.account),
        categories: structuredClone(state.categories),
        recentTransactions: structuredClone(state.recentTransactions),
        historicalTransactions: getHistoricalTransactions(),
        activeTransactions: getActiveTransactions(),
        sessionTransactions: structuredClone(state.sessionTransactions),
        transactionChanges: structuredClone(state.transactionChanges),
        deletedTransactionIds: [...state.deletedTransactionIds],
      }
    },

    findCategories() {
      return structuredClone(state.categories)
    },

    findCategoryById(id) {
      const found = state.categories.find((category) => category.id === id)
      return found ? structuredClone(found) : null
    },

    insertCategory({ label, color }) {
      const created = {
        id: `category-${crypto.randomUUID()}`,
        label,
        color,
        openingBalance: 0,
        income: 0,
        expense: 0,
      }
      state.categories = [...state.categories, created]
      return structuredClone(created)
    },

    updateCategoryById(id, { label, color }) {
      let updated = null
      state.categories = state.categories.map((item) => {
        if (item.id !== id) return item
        updated = { ...item, label, color }
        return updated
      })
      return updated ? structuredClone(updated) : null
    },

    deleteCategoryById(id) {
      const exists = state.categories.some((category) => category.id === id)
      if (!exists) return false
      state.categories = state.categories.filter((category) => category.id !== id)
      return true
    },

    findTransactionById(id) {
      const found = getActiveTransactions().find((transaction) => transaction.id === id)
      return found ? structuredClone(found) : null
    },

    insertTransaction(payload) {
      const created = {
        id: `trx-${crypto.randomUUID()}`,
        date: payload.date,
        categoryId: payload.categoryId,
        type: payload.type,
        description: payload.description,
        amount: payload.amount,
        personName: payload.personName,
        notes: payload.notes,
        showDonorNamePublic: payload.showDonorNamePublic,
        source: 'session',
        mock: true,
      }
      state.sessionTransactions = [created, ...state.sessionTransactions]
      return structuredClone(created)
    },

    updateTransactionById(id, changes) {
      const existing = getActiveTransactions().find((transaction) => transaction.id === id)
      if (!existing) return null
      state.transactionChanges = {
        ...state.transactionChanges,
        [id]: {
          date: changes.date,
          categoryId: changes.categoryId,
          description: changes.description,
          amount: changes.amount,
          personName: changes.personName,
          notes: changes.notes,
          showDonorNamePublic: changes.showDonorNamePublic,
          sessionEdited: true,
        },
      }
      return this.findTransactionById(id)
    },

    deleteTransactionById(id) {
      const existing = getActiveTransactions().find((transaction) => transaction.id === id)
      if (!existing) return false
      if (!state.deletedTransactionIds.includes(id)) {
        state.deletedTransactionIds = [...state.deletedTransactionIds, id]
      }
      return true
    },

    reset() {
      state = getInitialAdminFinanceState()
    },
  }
}

export const defaultAdminFinanceRepository = createAdminFinanceRepository()

