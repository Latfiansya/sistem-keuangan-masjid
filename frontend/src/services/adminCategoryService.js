import { adminCategoryColors } from '../utils/adminCategoryColors.js'
import { dataSource } from '../utils/env.js'
import { buildAdminFinanceReport } from './adminFinanceReportService.js'

const cleanName = (name) => String(name || '').normalize('NFKC').trim().replace(/\s+/gu, ' ')

export function validateAdminCategory(values, categories, id) {
  const errors = {}
  const name = cleanName(values.name)
  if (!name) errors.name = 'Nama kategori wajib diisi.'
  else if (name.length > 100 || [...String(values.name)].some((character) => character.codePointAt(0) < 32 || character.codePointAt(0) === 127)) errors.name = 'Gunakan nama maksimal 100 karakter tanpa karakter kontrol.'
  else if (categories.some((category) => category.id !== id && cleanName(category.label).toLowerCase() === name.toLowerCase())) errors.name = 'Nama kategori sudah digunakan.'
  if (!adminCategoryColors.some((color) => color.id === values.color)) errors.color = 'Pilih salah satu warna kategori.'
  return errors
}

function requireMock(dashboard) {
  if (dataSource !== 'mock' || !dashboard) throw new Error('Perubahan kategori hanya tersedia pada sesi mock.')
}

export function saveMockAdminCategory(dashboard, values, id) {
  requireMock(dashboard)
  const errors = validateAdminCategory(values, dashboard.categories, id)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  if (id && !dashboard.categories.some((category) => category.id === id)) throw new Error('Kategori tidak ditemukan.')
  const category = { label: cleanName(values.name), color: values.color }
  const categories = id
    ? dashboard.categories.map((item) => item.id === id ? { ...item, ...category } : item)
    : [...dashboard.categories, { id: `mock-category-${crypto.randomUUID()}`, ...category, openingBalance: 0, income: 0, expense: 0, closingBalance: 0 }]
  return { ...dashboard, categories }
}

export function isAdminCategoryUsed(dashboard, id) {
  const category = dashboard.categories.find((item) => item.id === id)
  return Boolean(category && (['openingBalance', 'income', 'expense', 'closingBalance'].some((key) => category[key] !== 0) || buildAdminFinanceReport(dashboard).transactions.some((transaction) => transaction.categoryId === id)))
}

export function deleteMockAdminCategory(dashboard, id) {
  requireMock(dashboard)
  if (!dashboard.categories.some((category) => category.id === id)) throw new Error('Kategori tidak ditemukan.')
  if (isAdminCategoryUsed(dashboard, id)) throw new Error('Kategori yang digunakan transaksi atau memiliki saldo tidak dapat dihapus.')
  return { ...dashboard, categories: dashboard.categories.filter((category) => category.id !== id) }
}
