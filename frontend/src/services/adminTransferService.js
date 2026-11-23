import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

const MAX_AMOUNT = 999_999_999_999

// Saldo kategori saat ini; data API memakai closingBalance, data mock dihitung dari mutasi snapshot.
export function getCategoryBalance(category) {
  if (!category) return 0
  if (Number.isFinite(category.closingBalance)) return category.closingBalance
  return (category.openingBalance || 0) + (category.income || 0) - (category.expense || 0)
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function validateAdminTransfer(values, categories = []) {
  const errors = {}
  const from = categories.find((category) => category.id === values.fromCategoryId)
  const to = categories.find((category) => category.id === values.toCategoryId)
  if (!isValidIsoDate(values.date)) errors.date = 'Pilih tanggal transfer yang valid.'
  if (!from) errors.fromCategoryId = 'Pilih kategori dana asal.'
  if (!to) errors.toCategoryId = 'Pilih kategori dana tujuan.'
  else if (from && from.id === to.id) errors.toCategoryId = 'Kategori tujuan harus berbeda dari kategori asal.'
  const amount = Number(values.amount)
  if (!/^\d+$/.test(String(values.amount ?? '')) || !Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_AMOUNT) {
    errors.amount = 'Masukkan nominal transfer berupa angka Rupiah lebih dari 0.'
  } else if (from && amount > getCategoryBalance(from)) {
    errors.amount = `Nominal melebihi saldo ${from.label}.`
  }
  const note = String(values.note ?? '')
  if (note.trim().length > 255 || Array.from(note).some((character) => { const code = character.charCodeAt(0); return code === 127 || (code < 32 && ![9, 10, 13].includes(code)) })) {
    errors.note = 'Keterangan tidak valid atau melebihi 255 karakter.'
  }
  return errors
}

function toPayload(values) {
  return {
    fromCategoryId: values.fromCategoryId,
    toCategoryId: values.toCategoryId,
    amount: Number(values.amount),
    date: values.date,
    note: String(values.note ?? '').trim(),
  }
}

let mockTransfers = []
let mockSequence = 1

const sortTransfers = (items) => [...items].sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id), 'en', { numeric: true }))

export async function getAdminTransfers({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/transfers', { signal })
    if (!data || !Array.isArray(data.transfers)) throw new Error('Format data transfer dana API tidak sesuai kontrak.')
    return data.transfers
  }
  return structuredClone(sortTransfers(mockTransfers))
}

export async function createAdminTransfer(values, categories, { signal } = {}) {
  const payload = toPayload(values)
  if (dataSource !== 'mock') return apiRequest('/admin/transfers', { method: 'POST', body: payload, signal })
  const label = (id) => categories.find((category) => category.id === id)?.label || id
  const created = { id: `mock-${mockSequence++}`, ...payload, fromCategoryLabel: label(payload.fromCategoryId), toCategoryLabel: label(payload.toCategoryId), createdBy: 'Sesi mock' }
  mockTransfers.push(created)
  return structuredClone(created)
}

export async function deleteAdminTransfer(id, { signal } = {}) {
  if (dataSource !== 'mock') return apiRequest(`/admin/transfers/${encodeURIComponent(id)}`, { method: 'DELETE', signal })
  const before = mockTransfers.length
  mockTransfers = mockTransfers.filter((item) => item.id !== id)
  if (mockTransfers.length === before) throw new Error('Transfer dana tidak ditemukan.')
  return { deletedId: id }
}

// Khusus pengujian: mengosongkan transfer sesi mock.
export function resetMockTransfers() {
  mockTransfers = []
}
