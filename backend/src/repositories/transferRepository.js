import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { createHttpError } from '../utils/httpError.js'
import {
  mapCategoryApiId,
  mapPgErrorToHttpError,
  resolveAuditPenggunaId,
  resolveCategoryDbId,
  toRupiahInteger,
} from '../utils/financeMapping.js'

const TRANSFER_SELECT = `
  SELECT t.id, to_char(t.tanggal, 'YYYY-MM-DD') AS tanggal,
         t.kategori_dana_asal_id, ka.nama_kategori AS asal_nama,
         t.kategori_dana_tujuan_id, kt.nama_kategori AS tujuan_nama,
         t.nominal, t.keterangan, t.created_by_nama
  FROM keu_masjid.t_transfer_dana t
  JOIN keu_masjid.m_kategori_dana ka ON ka.id = t.kategori_dana_asal_id
  JOIN keu_masjid.m_kategori_dana kt ON kt.id = t.kategori_dana_tujuan_id`

function mapTransferRow(row) {
  return {
    id: String(row.id),
    date: row.tanggal,
    fromCategoryId: mapCategoryApiId(row.kategori_dana_asal_id),
    fromCategoryLabel: row.asal_nama,
    toCategoryId: mapCategoryApiId(row.kategori_dana_tujuan_id),
    toCategoryLabel: row.tujuan_nama,
    amount: toRupiahInteger(row.nominal, 'Nominal transfer'),
    note: row.keterangan || '',
    createdBy: row.created_by_nama || '',
  }
}

// Daftar transfer pada rentang tanggal inklusif, untuk catatan transfer internal di laporan.
export async function findTransfersInRange(db, startDate, endDate) {
  const { rows } = await db.query(
    `${TRANSFER_SELECT}
     WHERE t.tanggal >= $1::date AND t.tanggal <= $2::date
     ORDER BY t.tanggal ASC, t.id ASC`,
    [startDate, endDate]
  )
  return rows.map(mapTransferRow)
}

// Data access layer transfer dana antar kategori (keu_masjid.t_transfer_dana).
// Saldo kategori diperbarui oleh trigger trg_t_transfer_dana_saldo dan dijaga tidak negatif oleh database.
export function createTransferRepository(db = getDefaultDatabasePool()) {
  return {
    async findAll() {
      const { rows } = await db.query(`${TRANSFER_SELECT} ORDER BY t.tanggal DESC, t.id DESC`)
      return rows.map(mapTransferRow)
    },

    async insert({ fromCategoryId, toCategoryId, amount, date, note }, auditUserId = null) {
      const fromDbId = resolveCategoryDbId(fromCategoryId)
      const toDbId = resolveCategoryDbId(toCategoryId)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const categories = await client.query(
            `SELECT id FROM keu_masjid.m_kategori_dana WHERE id = ANY($1::bigint[]) AND aktif = true`,
            [[fromDbId, toDbId]]
          )
          if (categories.rowCount !== 2) {
            throw createHttpError(400, 'BAD_REQUEST', 'Kategori dana asal atau tujuan tidak ditemukan atau tidak aktif.')
          }

          const inserted = await client.query(
            `INSERT INTO keu_masjid.t_transfer_dana (
               kategori_dana_asal_id, kategori_dana_tujuan_id, pengguna_id, nominal, tanggal, keterangan, created_by
             )
             VALUES ($1, $2, $3, $4, $5::date, $6, $3)
             RETURNING id`,
            [fromDbId, toDbId, userId, amount, date, note || null]
          )
          const { rows } = await client.query(`${TRANSFER_SELECT} WHERE t.id = $1`, [inserted.rows[0].id])
          return mapTransferRow(rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async deleteById(rawId, auditUserId = null) {
      if (!/^\d+$/.test(String(rawId))) return false
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])
          const res = await client.query(`DELETE FROM keu_masjid.t_transfer_dana WHERE id = $1 RETURNING id`, [
            Number(rawId),
          ])
          return res.rowCount > 0
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },
  }
}

export const defaultTransferRepository = createTransferRepository()
