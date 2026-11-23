import { defaultReceiptRepository } from '../repositories/receiptRepository.js'
import { resolveCategoryDbId } from '../utils/financeMapping.js'
import { createHttpError } from '../utils/httpError.js'
import { hasControlChars, parseIsoCalendarDate, parseTransactionAmount } from './adminFinanceService.js'

// Nilai metode mengikuti check constraint ck_t_kwitansi_metode (maks 10 karakter).
export const RECEIPT_METHODS = ['Tunai', 'Transfer', 'QRIS']

function badRequest(message) {
  return createHttpError(400, 'BAD_REQUEST', message)
}

function validateText(value, label, max) {
  if (typeof value !== 'string' || !value.trim()) throw badRequest(`${label} wajib diisi.`)
  if (value.trim().length > max || hasControlChars(value, false)) {
    throw badRequest(`${label} tidak boleh mengandung karakter kontrol atau melebihi ${max} karakter.`)
  }
  return value.trim()
}

function validateReceiptPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw badRequest('Payload kwitansi tidak valid.')
  if (!resolveCategoryDbId(payload.categoryId)) throw badRequest('Pilih kategori dana untuk pemasukan ini.')
  if (!RECEIPT_METHODS.includes(payload.method)) throw badRequest('Metode pembayaran harus Tunai, Transfer, atau QRIS.')
  if (parseIsoCalendarDate(payload.date) === null) throw badRequest('Tanggal kwitansi harus berupa tanggal kalender yang valid (YYYY-MM-DD).')
  const amount = parseTransactionAmount(payload.amount)
  if (amount === null) throw badRequest('Nominal harus berupa bilangan bulat Rupiah lebih dari 0.')
  return {
    categoryId: payload.categoryId,
    payer: validateText(payload.payer, 'Nama pemberi pembayaran', 150),
    purpose: validateText(payload.purpose, 'Keterangan pembayaran', 255),
    method: payload.method,
    amount,
    date: payload.date,
  }
}

// Business logic layer kwitansi jamaah; setiap kwitansi sekaligus mencatat satu transaksi pemasukan.
export function createReceiptService(repository = defaultReceiptRepository) {
  return {
    async list() {
      const receipts = await repository.findAll()
      return { receipts, totalCount: receipts.length }
    },

    async create(payload, auditUserId = null) {
      return repository.createWithIncome(validateReceiptPayload(payload), auditUserId)
    },

    async update(id, payload, auditUserId = null) {
      const updated = await repository.updateWithIncome(id, validateReceiptPayload(payload), auditUserId)
      if (!updated) throw createHttpError(404, 'NOT_FOUND', 'Kwitansi tidak ditemukan.')
      return updated
    },

    // Kwitansi tidak dihapus, melainkan dibatalkan agar nomornya tidak dipakai ulang.
    async cancel(id, payload = {}, auditUserId = null) {
      const withTransaction = payload?.withTransaction ?? false
      if (typeof withTransaction !== 'boolean') throw badRequest('withTransaction harus berupa boolean.')
      const cancelled = await repository.cancelById(id, { withTransaction }, auditUserId)
      if (!cancelled) throw createHttpError(404, 'NOT_FOUND', 'Kwitansi tidak ditemukan.')
      return cancelled
    },
  }
}

export const defaultReceiptService = createReceiptService()
