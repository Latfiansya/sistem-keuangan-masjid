import { defaultTransferRepository } from '../repositories/transferRepository.js'
import { resolveCategoryDbId } from '../utils/financeMapping.js'
import { createHttpError } from '../utils/httpError.js'
import { hasControlChars, parseIsoCalendarDate, parseTransactionAmount } from './adminFinanceService.js'

function badRequest(message) {
  return createHttpError(400, 'BAD_REQUEST', message)
}

function validateTransferPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw badRequest('Payload transfer dana tidak valid.')
  }

  const fromDbId = resolveCategoryDbId(payload.fromCategoryId)
  const toDbId = resolveCategoryDbId(payload.toCategoryId)
  if (!fromDbId) throw badRequest('Pilih kategori dana asal.')
  if (!toDbId) throw badRequest('Pilih kategori dana tujuan.')
  if (fromDbId === toDbId) throw badRequest('Kategori dana asal dan tujuan harus berbeda.')

  if (parseIsoCalendarDate(payload.date) === null) {
    throw badRequest('Tanggal transfer harus berupa tanggal kalender yang valid (YYYY-MM-DD).')
  }

  const amount = parseTransactionAmount(payload.amount)
  if (amount === null) {
    throw badRequest('Nominal transfer harus berupa bilangan bulat Rupiah lebih dari 0.')
  }

  const note = payload.note ?? ''
  if (typeof note !== 'string' || note.trim().length > 255 || hasControlChars(note, true)) {
    throw badRequest('Keterangan transfer tidak valid atau melebihi 255 karakter.')
  }

  return {
    fromCategoryId: payload.fromCategoryId,
    toCategoryId: payload.toCategoryId,
    amount,
    date: payload.date,
    note: note.trim(),
  }
}

// Business logic layer transfer dana antar kategori; kecukupan saldo diperiksa oleh trigger database.
export function createTransferService(repository = defaultTransferRepository) {
  return {
    async list() {
      const transfers = await repository.findAll()
      return { transfers, totalCount: transfers.length }
    },

    async create(payload, auditUserId = null) {
      return repository.insert(validateTransferPayload(payload), auditUserId)
    },

    async remove(id, auditUserId = null) {
      const deleted = await repository.deleteById(id, auditUserId)
      if (!deleted) throw createHttpError(404, 'NOT_FOUND', 'Transfer dana tidak ditemukan.')
      return { deletedId: String(id) }
    },
  }
}

export const defaultTransferService = createTransferService()
