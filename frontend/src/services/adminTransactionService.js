import { dataSource } from '../utils/env.js'
import { getLocalReceiptDate, receiptDateFromIso, receiptDateToIso } from '../utils/adminReceipt.js'

export function getLocalTransactionDate(date = new Date()) {
  return receiptDateToIso(getLocalReceiptDate(date))
}

export function validateAdminTransaction(values, categories, type) {
  const errors = {}
  if (!['income', 'expense'].includes(type)) errors.type = 'Jenis transaksi tidak valid.'
  if (!receiptDateFromIso(values.date)) errors.date = 'Pilih tanggal transaksi yang valid.'
  if (!categories.some((category) => category.id === values.categoryId)) errors.categoryId = 'Pilih kategori dana yang tersedia.'
  for (const [field, label, limit, required] of [['description', 'Uraian', 500, true], ['personName', 'Nama', 100, false], ['notes', 'Keterangan', 500, false]]) {
    const value = typeof values[field] === 'string' ? values[field] : ''
    if (values[field] !== undefined && typeof values[field] !== 'string') errors[field] = `${label} tidak valid.`
    else if (required && !value.trim()) errors[field] = `${label} wajib diisi.`
    else if (value.length > limit || [...value].some((character) => {
      const code = character.codePointAt(0)
      return code === 127 || (code < 32 && !(field === 'notes' && [9, 10, 13].includes(code)))
    })) errors[field] = `${label} tidak valid atau melebihi ${limit} karakter.`
  }
  if (!/^\d{1,12}$/.test(values.amount) || Number(values.amount) <= 0) errors.amount = 'Masukkan rupiah bulat positif, maksimal 999.999.999.999, tanpa desimal.'
  return errors
}

export function addMockAdminTransaction(dashboard, values, type) {
  if (dataSource !== 'mock' || !dashboard) throw new Error('Tambah transaksi hanya tersedia dalam sesi mock.')
  const errors = validateAdminTransaction(values, dashboard.categories, type)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const transaction = {
    id: `mock-session-transaction-${crypto.randomUUID()}`,
    date: values.date, categoryId: values.categoryId, type,
    description: values.description.trim(), amount: Number(values.amount),
    personName: (values.personName || '').trim(), notes: (values.notes || '').trim(),
    showDonorNamePublic: type === 'income' && values.showDonorNamePublic === true,
    source: 'session', mock: true,
  }
  return { ...dashboard, sessionTransactions: [transaction, ...(dashboard.sessionTransactions || [])] }
}

export function getAdminRecentTransactions(dashboard) {
  return [...(dashboard.sessionTransactions || []), ...dashboard.recentTransactions].sort((a, b) => b.date.localeCompare(a.date))
}
