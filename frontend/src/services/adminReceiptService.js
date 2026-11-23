import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'
import { receiptDateFromIso, receiptDateToIso } from '../utils/adminReceipt.js'

// Label metode di formulir ↔ nilai yang diterima database (ck_t_kwitansi_metode, maks 10 karakter).
const METHOD_TO_API = { Tunai: 'Tunai', 'Transfer Bank': 'Transfer', QRIS: 'QRIS' }
const METHOD_FROM_API = { Tunai: 'Tunai', Transfer: 'Transfer Bank', QRIS: 'QRIS' }

// Mengubah kwitansi dari API ke bentuk yang dipakai pratinjau (tanggal dd/mm/yyyy, nominal string).
export function toReceiptView(receipt) {
  return {
    id: receipt.id,
    number: receipt.number,
    payer: receipt.payer,
    purpose: receipt.purpose,
    method: METHOD_FROM_API[receipt.method] || receipt.method,
    amount: String(receipt.amount),
    date: receiptDateFromIso(receipt.date),
    categoryId: receipt.categoryId,
    categoryLabel: receipt.categoryLabel,
    status: receipt.status,
    cancelledAt: receipt.cancelledAt,
  }
}

export function validateReceiptCategory(values, categories = []) {
  return categories.some((category) => category.id === values.categoryId) ? {} : { categoryId: 'Pilih kategori dana tempat pemasukan ini dicatat.' }
}

export async function getAdminReceipts({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource === 'mock') return []
  const data = await apiRequest('/admin/receipts', { signal })
  if (!data || !Array.isArray(data.receipts)) throw new Error('Format data kwitansi API tidak sesuai kontrak.')
  return data.receipts.map(toReceiptView)
}

function toReceiptPayload(values) {
  return {
    categoryId: values.categoryId,
    payer: String(values.payer || '').trim(),
    purpose: String(values.purpose || '').trim(),
    method: METHOD_TO_API[values.method] || values.method,
    amount: Number(values.amount),
    date: receiptDateToIso(values.date),
  }
}

export async function createAdminReceipt(values, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Penyimpanan kwitansi hanya tersedia pada mode API.')
  const created = await apiRequest('/admin/receipts', { method: 'POST', body: toReceiptPayload(values), signal })
  return toReceiptView(created)
}

// Mengubah kwitansi beserta transaksi pemasukannya; nomor kwitansi tetap.
export async function updateAdminReceipt(id, values, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Edit kwitansi hanya tersedia pada mode API.')
  const updated = await apiRequest(`/admin/receipts/${encodeURIComponent(id)}`, { method: 'PUT', body: toReceiptPayload(values), signal })
  return toReceiptView(updated)
}

// Kwitansi dibatalkan (tetap tersimpan, nomor tidak dipakai ulang); withTransaction=true ikut menghapus pemasukannya.
export async function cancelAdminReceipt(id, { withTransaction = false, signal } = {}) {
  if (dataSource === 'mock') throw new Error('Pembatalan kwitansi hanya tersedia pada mode API.')
  const result = await apiRequest(`/admin/receipts/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { withTransaction }, signal })
  return { receipt: toReceiptView(result.receipt), deletedTransactionId: result.deletedTransactionId }
}
