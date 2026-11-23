import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { createHttpError } from '../utils/httpError.js'
import {
  mapCategoryApiId,
  mapPgErrorToHttpError,
  resolveAuditPenggunaId,
  resolveCategoryDbId,
  toRupiahInteger,
} from '../utils/financeMapping.js'
import { buildReceiptNumber, getReceiptNumberPrefix, nextReceiptSequence } from '../utils/receiptNumber.js'

// Kwitansi aktif memakai nilai transaksi terkini; kwitansi dibatalkan (atau transaksinya terhapus) memakai salinan di t_kwitansi.
// Skema mengikuti docs/sql/2026-11-24-kwitansi-pembatalan.sql.
const RECEIPT_SELECT = `
  SELECT k.id, k.no_kwitansi, k.telah_terima_dari, k.untuk_pembayaran, k.metode_pembayaran,
         k.created_by_nama, to_char(k.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at,
         to_char(k.dibatalkan_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS dibatalkan_at,
         k.transaksi_id, to_char(COALESCE(t.tanggal, k.tanggal), 'YYYY-MM-DD') AS tanggal,
         COALESCE(t.nominal, k.nominal) AS nominal, t.kategori_dana_id, kd.nama_kategori
  FROM keu_masjid.t_kwitansi k
  LEFT JOIN keu_masjid.t_transaksi t ON t.id = k.transaksi_id
  LEFT JOIN keu_masjid.m_kategori_dana kd ON kd.id = t.kategori_dana_id`

function mapReceiptRow(row) {
  const cancelled = Boolean(row.dibatalkan_at) || row.transaksi_id === null
  return {
    id: String(row.id),
    number: row.no_kwitansi,
    payer: row.telah_terima_dari,
    purpose: row.untuk_pembayaran,
    method: row.metode_pembayaran,
    amount: toRupiahInteger(row.nominal, 'Nominal kwitansi'),
    date: row.tanggal,
    status: cancelled ? 'Dibatalkan' : 'Aktif',
    cancelledAt: row.dibatalkan_at || null,
    transactionId: row.transaksi_id === null ? null : String(row.transaksi_id),
    categoryId: row.kategori_dana_id === null ? null : mapCategoryApiId(row.kategori_dana_id),
    categoryLabel: row.nama_kategori || '',
    createdBy: row.created_by_nama || '',
    createdAt: row.created_at,
  }
}

async function setAuditUser(client, auditUserId) {
  const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
  await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])
  return userId
}

async function findActiveCategory(client, categoryDbId) {
  const category = await client.query(
    `SELECT id, nama_kategori FROM keu_masjid.m_kategori_dana WHERE id = $1 AND aktif = true LIMIT 1`,
    [categoryDbId]
  )
  if (!category.rows[0]) throw createHttpError(400, 'BAD_REQUEST', 'Kategori dana tidak ditemukan atau tidak aktif.')
  return category.rows[0]
}

// Mengunci baris kwitansi; kwitansi yang sudah dibatalkan tidak boleh diubah atau dibatalkan lagi.
async function lockActiveReceipt(client, id) {
  const found = await client.query(
    `SELECT transaksi_id, dibatalkan_at FROM keu_masjid.t_kwitansi WHERE id = $1 FOR UPDATE`,
    [id]
  )
  const row = found.rows[0]
  if (!row) return null
  if (row.dibatalkan_at || row.transaksi_id === null) {
    throw createHttpError(409, 'CONFLICT', 'Kwitansi sudah dibatalkan sehingga tidak dapat diubah.')
  }
  return row
}

// Data access layer kwitansi jamaah (keu_masjid.t_kwitansi) beserta transaksi pemasukannya.
export function createReceiptRepository(db = getDefaultDatabasePool()) {
  return {
    async findAll() {
      const { rows } = await db.query(`${RECEIPT_SELECT} ORDER BY k.id DESC`)
      return rows.map(mapReceiptRow)
    },

    // Mencatat pemasukan dan kwitansinya dalam satu transaksi database: keduanya tersimpan atau tidak sama sekali.
    async createWithIncome({ categoryId, payer, purpose, method, amount, date }, auditUserId = null) {
      const categoryDbId = resolveCategoryDbId(categoryId)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await setAuditUser(client, auditUserId)
          const category = await findActiveCategory(client, categoryDbId)

          // Kunci antrean penomoran agar dua kwitansi yang dibuat bersamaan tidak mendapat nomor sama.
          // Kwitansi dibatalkan tetap ikut dihitung sehingga nomornya tidak pernah dipakai ulang.
          await client.query(`SELECT pg_advisory_xact_lock(hashtext('keu_masjid.t_kwitansi.no_kwitansi'))`)
          const prefix = getReceiptNumberPrefix(date)
          const existing = await client.query(
            `SELECT no_kwitansi FROM keu_masjid.t_kwitansi WHERE no_kwitansi LIKE $1`,
            [`${prefix}%`]
          )
          const number = buildReceiptNumber(date, nextReceiptSequence(existing.rows.map((row) => row.no_kwitansi), prefix))

          const transaction = await client.query(
            `INSERT INTO keu_masjid.t_transaksi (
               kategori_dana_id, pengguna_id, jenis, nama_kategori, uraian, nominal, tanggal, created_by
             )
             VALUES ($1, $2, 'MASUK', $3, $4, $5, $6::date, $2)
             RETURNING id`,
            [categoryDbId, userId, category.nama_kategori, purpose, amount, date]
          )
          const receipt = await client.query(
            `INSERT INTO keu_masjid.t_kwitansi (
               transaksi_id, no_kwitansi, telah_terima_dari, untuk_pembayaran, metode_pembayaran, nominal, tanggal, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)
             RETURNING id`,
            [transaction.rows[0].id, number, payer, purpose, method, amount, date, userId]
          )
          const { rows } = await client.query(`${RECEIPT_SELECT} WHERE k.id = $1`, [receipt.rows[0].id])
          return mapReceiptRow(rows[0])
        })
      } catch (error) {
        if (error?.code === '23505') {
          throw createHttpError(409, 'CONFLICT', 'Nomor kwitansi bentrok dengan kwitansi lain. Silakan simpan ulang.')
        }
        throw mapPgErrorToHttpError(error)
      }
    },

    // Mengubah kwitansi aktif beserta transaksi pemasukannya; nomor kwitansi tidak pernah berubah setelah diterbitkan.
    async updateWithIncome(rawId, { categoryId, payer, purpose, method, amount, date }, auditUserId = null) {
      if (!/^\d+$/.test(String(rawId))) return null
      const categoryDbId = resolveCategoryDbId(categoryId)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await setAuditUser(client, auditUserId)
          const found = await lockActiveReceipt(client, Number(rawId))
          if (!found) return null
          const category = await findActiveCategory(client, categoryDbId)

          await client.query(
            `UPDATE keu_masjid.t_transaksi
             SET kategori_dana_id = $2, nama_kategori = $3, uraian = $4, nominal = $5, tanggal = $6::date,
                 updated_at = CURRENT_TIMESTAMP, updated_by = $7
             WHERE id = $1 AND jenis = 'MASUK'`,
            [found.transaksi_id, categoryDbId, category.nama_kategori, purpose, amount, date, userId]
          )
          await client.query(
            `UPDATE keu_masjid.t_kwitansi
             SET telah_terima_dari = $2, untuk_pembayaran = $3, metode_pembayaran = $4, nominal = $5, tanggal = $6::date,
                 updated_at = CURRENT_TIMESTAMP, updated_by = $7
             WHERE id = $1`,
            [Number(rawId), payer, purpose, method, amount, date, userId]
          )
          const { rows } = await client.query(`${RECEIPT_SELECT} WHERE k.id = $1`, [Number(rawId)])
          return mapReceiptRow(rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    // Membatalkan kwitansi (baris tetap tersimpan); opsional ikut menghapus transaksi pemasukannya.
    async cancelById(rawId, { withTransaction = false } = {}, auditUserId = null) {
      if (!/^\d+$/.test(String(rawId))) return null
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await setAuditUser(client, auditUserId)
          const found = await lockActiveReceipt(client, Number(rawId))
          if (!found) return null

          // Salinan nominal/tanggal diperbarui dari transaksi terkini sebelum transaksi mungkin dihapus.
          await client.query(
            `UPDATE keu_masjid.t_kwitansi k
             SET dibatalkan_at = CURRENT_TIMESTAMP, nominal = t.nominal, tanggal = t.tanggal,
                 updated_at = CURRENT_TIMESTAMP, updated_by = $2
             FROM keu_masjid.t_transaksi t
             WHERE k.id = $1 AND t.id = k.transaksi_id`,
            [Number(rawId), userId]
          )
          if (withTransaction) {
            // FK ON DELETE SET NULL: kwitansi tetap tersimpan dengan transaksi_id NULL.
            await client.query(`DELETE FROM keu_masjid.t_transaksi WHERE id = $1`, [found.transaksi_id])
          }
          const { rows } = await client.query(`${RECEIPT_SELECT} WHERE k.id = $1`, [Number(rawId)])
          return { receipt: mapReceiptRow(rows[0]), deletedTransactionId: withTransaction ? String(found.transaksi_id) : null }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },
  }
}

export const defaultReceiptRepository = createReceiptRepository()
