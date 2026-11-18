import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { createHttpError } from '../utils/httpError.js'
import {
  ALLOWED_CATEGORY_COLORS,
  mapCategoryApiId,
  mapPgErrorToHttpError,
  resolveAuditPenggunaId,
  resolveCategoryColor,
  resolveCategoryDbId,
  toRupiahInteger,
} from '../utils/financeMapping.js'

function buildInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AD'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function mapCategoryRow(row) {
  const dbId = Number(row.kategori_dana_id ?? row.id)
  const opening =
    toRupiahInteger(row.saldo_awal, 'Saldo awal') +
    toRupiahInteger(row.transfer_masuk ?? 0, 'Transfer masuk') -
    toRupiahInteger(row.transfer_keluar ?? 0, 'Transfer keluar')
  const income = toRupiahInteger(row.total_masuk ?? 0, 'Total masuk')
  const expense = toRupiahInteger(row.total_keluar ?? 0, 'Total keluar')
  const closingBalance =
    row.saldo_terkini !== undefined
      ? toRupiahInteger(row.saldo_terkini, 'Saldo akhir')
      : opening + income - expense

  return {
    dbId,
    id: mapCategoryApiId(dbId),
    label: row.nama_kategori,
    color: resolveCategoryColor(dbId, row.nama_kategori),
    openingBalance: opening,
    income,
    expense,
    closingBalance,
  }
}

// Data access layer keuangan pengurus menggunakan PostgreSQL (keu_masjid.*).
export function createAdminFinanceRepository(db = getDefaultDatabasePool()) {
  return {
    getAllowedColors() {
      return [...ALLOWED_CATEGORY_COLORS]
    },

    async getDashboardData() {
      const [userRes, saldoRes, recentRes, latestDateRes] = await Promise.all([
        db.query(
          `SELECT id, nama, email
           FROM keu_masjid.m_pengguna
           WHERE status = 'Aktif'
           ORDER BY id ASC
           LIMIT 1`
        ),
        db.query(
          `SELECT kategori_dana_id, nama_kategori, aktif, saldo_awal,
                  total_masuk, total_keluar, transfer_masuk, transfer_keluar, saldo_terkini
           FROM keu_masjid.v_saldo_kategori_dana
           WHERE aktif = true
           ORDER BY kategori_dana_id ASC`
        ),
        db.query(
          `SELECT id, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, jenis,
                  kategori_dana_id, uraian, nominal
           FROM keu_masjid.v_transaksi_lengkap
           ORDER BY tanggal DESC, id DESC
           LIMIT 5`
        ),
        db.query(
          `SELECT to_char(MAX(tanggal), 'YYYY-MM-DD') AS updated_date
           FROM keu_masjid.t_transaksi`
        ),
      ])

      const activeUser = userRes.rows[0]
      const account = activeUser
        ? {
            name: activeUser.nama,
            email: activeUser.email,
            initials: buildInitials(activeUser.nama),
          }
        : { name: 'Pengurus', email: '', initials: 'PG' }

      const categories = saldoRes.rows.map((row) => {
        const mapped = mapCategoryRow(row)
        return {
          id: mapped.id,
          label: mapped.label,
          color: mapped.color,
          openingBalance: mapped.openingBalance,
          income: mapped.income,
          expense: mapped.expense,
          closingBalance: mapped.closingBalance,
        }
      })

      const totals = categories.reduce(
        (sum, category) => ({
          openingBalance: sum.openingBalance + category.openingBalance,
          income: sum.income + category.income,
          expense: sum.expense + category.expense,
          closingBalance: sum.closingBalance + category.closingBalance,
        }),
        { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 }
      )

      const recentTransactions = recentRes.rows.map((row) => ({
        id: String(row.id),
        date: row.tanggal,
        categoryId: mapCategoryApiId(row.kategori_dana_id),
        type: row.jenis === 'MASUK' ? 'income' : 'expense',
        description: row.uraian,
        amount: toRupiahInteger(row.nominal, 'Nominal transaksi'),
      }))

      return {
        updatedDate: latestDateRes.rows[0]?.updated_date || new Date().toISOString().slice(0, 10),
        account,
        categories,
        totals,
        recentTransactions,
      }
    },

    async findCategories() {
      const { rows } = await db.query(
        `SELECT kategori_dana_id, nama_kategori, aktif, saldo_awal,
                total_masuk, total_keluar, transfer_masuk, transfer_keluar, saldo_terkini
         FROM keu_masjid.v_saldo_kategori_dana
         WHERE aktif = true
         ORDER BY kategori_dana_id ASC`
      )
      return rows.map(mapCategoryRow)
    },

    async findCategoryById(apiId) {
      const dbId = resolveCategoryDbId(apiId)
      if (!dbId) return null

      const { rows } = await db.query(
        `SELECT kategori_dana_id, nama_kategori, aktif, saldo_awal,
                total_masuk, total_keluar, transfer_masuk, transfer_keluar, saldo_terkini
         FROM keu_masjid.v_saldo_kategori_dana
         WHERE kategori_dana_id = $1
         LIMIT 1`,
        [dbId]
      )
      return rows[0] ? mapCategoryRow(rows[0]) : null
    },

    async insertCategory({ label }) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `INSERT INTO keu_masjid.m_kategori_dana (nama_kategori, saldo_awal, created_by)
             VALUES ($1, 0, $2)
             RETURNING id, nama_kategori, saldo_awal, saldo_terkini`,
            [label, userId]
          )
          return mapCategoryRow(res.rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async updateCategoryById(apiId, { label }) {
      const dbId = resolveCategoryDbId(apiId)
      if (!dbId) return null

      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `UPDATE keu_masjid.m_kategori_dana
             SET nama_kategori = $1,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $2
             WHERE id = $3
             RETURNING id`,
            [label, userId, dbId]
          )
          if (!res.rows[0]) return null

          const viewRes = await client.query(
            `SELECT kategori_dana_id, nama_kategori, aktif, saldo_awal,
                    total_masuk, total_keluar, transfer_masuk, transfer_keluar, saldo_terkini
             FROM keu_masjid.v_saldo_kategori_dana
             WHERE kategori_dana_id = $1
             LIMIT 1`,
            [dbId]
          )
          return viewRes.rows[0] ? mapCategoryRow(viewRes.rows[0]) : null
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async hasCategoryUsage(apiId) {
      const dbId = resolveCategoryDbId(apiId)
      if (!dbId) return false

      const res = await db.query(
        `SELECT (
           EXISTS (SELECT 1 FROM keu_masjid.t_transaksi WHERE kategori_dana_id = $1)
           OR EXISTS (
             SELECT 1 FROM keu_masjid.t_transfer_dana
             WHERE kategori_dana_asal_id = $1 OR kategori_dana_tujuan_id = $1
           )
         ) AS is_used`,
        [dbId]
      )
      return res.rows[0]?.is_used === true
    },

    async deleteCategoryById(apiId) {
      const dbId = resolveCategoryDbId(apiId)
      if (!dbId) return false

      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `DELETE FROM keu_masjid.m_kategori_dana WHERE id = $1 RETURNING id`,
            [dbId]
          )
          return Boolean(res.rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async getReportMetadata() {
      const [userRes, categories, coverageRes] = await Promise.all([
        db.query(
          `SELECT id, nama, email
           FROM keu_masjid.m_pengguna
           WHERE status = 'Aktif'
           ORDER BY id ASC
           LIMIT 1`
        ),
        this.findCategories(),
        db.query(
          `SELECT to_char(MIN(tanggal), 'YYYY-MM-DD') AS min_date,
                  to_char(MAX(tanggal), 'YYYY-MM-DD') AS max_date,
                  COUNT(*)::int AS total_count
           FROM keu_masjid.t_transaksi`
        ),
      ])

      const activeUser = userRes.rows[0]
      const account = activeUser
        ? {
            name: activeUser.nama,
            email: activeUser.email,
            initials: buildInitials(activeUser.nama),
          }
        : { name: 'Pengurus', email: '', initials: 'PG' }

      const minDate = coverageRes.rows[0]?.min_date || new Date().toISOString().slice(0, 10)
      const maxDate = coverageRes.rows[0]?.max_date || minDate
      const historicalTransactionCount = Number(coverageRes.rows[0]?.total_count ?? 0)

      return {
        updatedDate: maxDate,
        account,
        categories,
        coverage: { startDate: minDate, endDate: maxDate },
        historicalTransactionCount,
      }
    },

    async queryFinanceReport({ startDate, endDate, categoryApiId, type, query, page, pageSize }) {
      const metadata = await this.getReportMetadata()
      const whereParts = ['tanggal >= $1::date', 'tanggal <= $2::date']
      const params = [startDate, endDate]

      if (categoryApiId) {
        const dbCategoryId = resolveCategoryDbId(categoryApiId)
        if (!dbCategoryId) {
          throw createHttpError(400, 'BAD_REQUEST', 'Kategori filter tidak ditemukan.')
        }
        params.push(dbCategoryId)
        whereParts.push(`kategori_dana_id = $${params.length}`)
      }

      if (type) {
        params.push(type === 'income' ? 'MASUK' : 'KELUAR')
        whereParts.push(`jenis = $${params.length}`)
      }

      if (query) {
        params.push(`%${query}%`)
        whereParts.push(`uraian ILIKE $${params.length}`)
      }

      const whereSql = whereParts.join(' AND ')

      const summaryRes = await db.query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(SUM(CASE WHEN jenis = 'MASUK' THEN nominal ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN jenis = 'KELUAR' THEN nominal ELSE 0 END), 0) AS total_expense
         FROM keu_masjid.t_transaksi
         WHERE ${whereSql}`,
        params
      )

      const totalItems = Number(summaryRes.rows[0]?.count ?? 0)
      const summary = {
        count: totalItems,
        income: toRupiahInteger(summaryRes.rows[0]?.total_income ?? 0, 'Total pemasukan'),
        expense: toRupiahInteger(summaryRes.rows[0]?.total_expense ?? 0, 'Total pengeluaran'),
      }

      let pagination = null
      let limitValue = 1000
      let offsetValue = 0

      if (page !== undefined || pageSize !== undefined) {
        const isAll = String(pageSize).toLowerCase() === 'all'
        const resolvedSize = isAll ? Math.max(totalItems, 1) : Number(pageSize)
        const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / resolvedSize))
        const currentPage = Math.min(page, totalPages)
        offsetValue = isAll ? 0 : (currentPage - 1) * resolvedSize
        limitValue = resolvedSize

        pagination = {
          page: currentPage,
          pageSize: isAll ? 'all' : resolvedSize,
          totalItems,
          totalPages,
        }
      }

      const trxParams = [...params, limitValue, offsetValue]
      const trxRes = await db.query(
        `SELECT id, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, kategori_dana_id,
                jenis, uraian, nominal, created_by_nama
         FROM keu_masjid.t_transaksi
         WHERE ${whereSql}
         ORDER BY tanggal ASC, id ASC
         LIMIT $${trxParams.length - 1} OFFSET $${trxParams.length}`,
        trxParams
      )

      const startMonth = `${startDate.slice(0, 7)}-01`
      const endMonth = `${endDate.slice(0, 7)}-01`
      const recapRes = await db.query(
        `SELECT to_char(bulan, 'YYYY-MM') AS month_key,
                kategori_dana_id,
                nama_kategori,
                saldo_awal_bulan,
                total_masuk,
                total_keluar,
                saldo_akhir_bulan
         FROM keu_masjid.v_rekap_bulanan_per_dana
         WHERE bulan >= $1::date AND bulan <= $2::date
         ORDER BY bulan ASC, kategori_dana_id ASC`,
        [startMonth, endMonth]
      )

      const recapByMonth = new Map()
      for (const row of recapRes.rows) {
        if (!recapByMonth.has(row.month_key)) {
          recapByMonth.set(row.month_key, [])
        }
        recapByMonth.get(row.month_key).push({
          id: mapCategoryApiId(row.kategori_dana_id),
          label: row.nama_kategori,
          color: resolveCategoryColor(row.kategori_dana_id, row.nama_kategori),
          openingBalance: toRupiahInteger(row.saldo_awal_bulan, 'Saldo awal bulan'),
          income: toRupiahInteger(row.total_masuk, 'Pemasukan bulan'),
          expense: toRupiahInteger(row.total_keluar, 'Pengeluaran bulan'),
          closingBalance: toRupiahInteger(row.saldo_akhir_bulan, 'Saldo akhir bulan'),
        })
      }

      const monthlyRecap = [...recapByMonth.entries()].map(([month, monthCategories]) => ({
        month,
        categories: monthCategories,
        totals: monthCategories.reduce(
          (sum, cat) => ({
            openingBalance: sum.openingBalance + cat.openingBalance,
            income: sum.income + cat.income,
            expense: sum.expense + cat.expense,
            closingBalance: sum.closingBalance + cat.closingBalance,
          }),
          { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 }
        ),
      }))

      const transactions = trxRes.rows.map((row) => ({
        id: String(row.id),
        date: row.tanggal,
        categoryId: mapCategoryApiId(row.kategori_dana_id),
        type: row.jenis === 'MASUK' ? 'income' : 'expense',
        description: row.uraian,
        amount: toRupiahInteger(row.nominal, 'Nominal transaksi'),
        createdByName: row.created_by_nama || '',
      }))

      return {
        ...metadata,
        transactions,
        summary,
        monthlyRecap,
        pagination,
      }
    },

    async findTransactionById(rawId) {
      if (!/^\d+$/.test(String(rawId))) return null
      const trxId = Number(rawId)

      const { rows } = await db.query(
        `SELECT id, kategori_dana_id, kategori_transaksi_id, pengguna_id,
                jenis, nama_kategori, uraian, nominal,
                to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
                created_by_nama
         FROM keu_masjid.t_transaksi
         WHERE id = $1
         LIMIT 1`,
        [trxId]
      )

      const row = rows[0]
      if (!row) return null

      return {
        id: String(row.id),
        date: row.tanggal,
        categoryId: mapCategoryApiId(row.kategori_dana_id),
        type: row.jenis === 'MASUK' ? 'income' : 'expense',
        description: row.uraian,
        amount: toRupiahInteger(row.nominal, 'Nominal transaksi'),
        createdByName: row.created_by_nama || '',
      }
    },

    async insertTransaction(payload) {
      const dbCategoryId = resolveCategoryDbId(payload.categoryId)
      if (!dbCategoryId) {
        throw createHttpError(400, 'BAD_REQUEST', 'Pilih kategori dana yang tersedia.')
      }

      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const catRes = await client.query(
            `SELECT id, nama_kategori FROM keu_masjid.m_kategori_dana WHERE id = $1 LIMIT 1`,
            [dbCategoryId]
          )
          if (!catRes.rows[0]) {
            throw createHttpError(400, 'BAD_REQUEST', 'Kategori dana tidak ditemukan.')
          }

          const dbJenis = payload.type === 'income' ? 'MASUK' : 'KELUAR'
          const insertRes = await client.query(
            `INSERT INTO keu_masjid.t_transaksi (
               kategori_dana_id, pengguna_id, jenis, nama_kategori, uraian, nominal, tanggal, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)
             RETURNING id, kategori_dana_id, jenis, uraian, nominal, to_char(tanggal, 'YYYY-MM-DD') AS tanggal`,
            [
              dbCategoryId,
              userId,
              dbJenis,
              catRes.rows[0].nama_kategori,
              payload.description,
              payload.amount,
              payload.date,
              userId,
            ]
          )

          const row = insertRes.rows[0]
          return {
            id: String(row.id),
            date: row.tanggal,
            categoryId: mapCategoryApiId(row.kategori_dana_id),
            type: row.jenis === 'MASUK' ? 'income' : 'expense',
            description: row.uraian,
            amount: toRupiahInteger(row.nominal, 'Nominal transaksi'),
          }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async updateTransactionById(rawId, changes) {
      if (!/^\d+$/.test(String(rawId))) return null
      const trxId = Number(rawId)
      const dbCategoryId = resolveCategoryDbId(changes.categoryId)
      if (!dbCategoryId) {
        throw createHttpError(400, 'BAD_REQUEST', 'Pilih kategori dana yang tersedia.')
      }

      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const catRes = await client.query(
            `SELECT id, nama_kategori FROM keu_masjid.m_kategori_dana WHERE id = $1 LIMIT 1`,
            [dbCategoryId]
          )
          if (!catRes.rows[0]) {
            throw createHttpError(400, 'BAD_REQUEST', 'Kategori dana tidak ditemukan.')
          }

          const updateRes = await client.query(
            `UPDATE keu_masjid.t_transaksi
             SET kategori_dana_id = $1,
                 nama_kategori = $2,
                 uraian = $3,
                 nominal = $4,
                 tanggal = $5::date,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $6
             WHERE id = $7
             RETURNING id, kategori_dana_id, jenis, uraian, nominal, to_char(tanggal, 'YYYY-MM-DD') AS tanggal`,
            [
              dbCategoryId,
              catRes.rows[0].nama_kategori,
              changes.description,
              changes.amount,
              changes.date,
              userId,
              trxId,
            ]
          )

          const row = updateRes.rows[0]
          if (!row) return null

          return {
            id: String(row.id),
            date: row.tanggal,
            categoryId: mapCategoryApiId(row.kategori_dana_id),
            type: row.jenis === 'MASUK' ? 'income' : 'expense',
            description: row.uraian,
            amount: toRupiahInteger(row.nominal, 'Nominal transaksi'),
          }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async deleteTransactionById(rawId) {
      if (!/^\d+$/.test(String(rawId))) return false
      const trxId = Number(rawId)

      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `DELETE FROM keu_masjid.t_transaksi WHERE id = $1 RETURNING id`,
            [trxId]
          )
          return Boolean(res.rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },
  }
}

export const defaultAdminFinanceRepository = createAdminFinanceRepository()
