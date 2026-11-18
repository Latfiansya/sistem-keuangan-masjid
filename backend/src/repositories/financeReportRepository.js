import { getDefaultDatabasePool } from '../config/database.js'
import {
  mapCategoryApiId,
  resolveCategoryColor,
  toRupiahInteger,
} from '../utils/financeMapping.js'

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split('-')
  const monthIndex = Number(month) - 1
  const label = INDONESIAN_MONTHS[monthIndex]
  return label ? `${label} ${year}` : monthKey
}

function getMonthCalendarRange(monthKey) {
  const [year, month] = String(monthKey).split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    startDate: `${year}-${String(month).padStart(2, '0')}-01`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  }
}

// Data access layer laporan keuangan publik dari PostgreSQL (keu_masjid.*).
export function createFinanceReportRepository(db = getDefaultDatabasePool()) {
  return {
    async findFinanceReportMetadata() {
      const [profilRes, rangeRes, monthsRes, categoriesRes] = await Promise.all([
        db.query(`SELECT nama_masjid FROM keu_masjid.m_profil_masjid WHERE id = 1 LIMIT 1`),
        db.query(
          `SELECT to_char(date_trunc('month', MIN(tanggal)), 'YYYY-MM-DD') AS coverage_start,
                  to_char((date_trunc('month', MAX(tanggal)) + interval '1 month - 1 day')::date, 'YYYY-MM-DD') AS coverage_end,
                  to_char(MAX(tanggal), 'YYYY-MM') AS latest_month
           FROM keu_masjid.t_transaksi`
        ),
        db.query(
          `SELECT DISTINCT to_char(tanggal, 'YYYY-MM') AS month_key
           FROM keu_masjid.t_transaksi
           ORDER BY month_key ASC`
        ),
        db.query(
          `SELECT id, nama_kategori, saldo_awal
           FROM keu_masjid.m_kategori_dana
           WHERE aktif = true
           ORDER BY id ASC`
        ),
      ])

      const coverageStart = rangeRes.rows[0]?.coverage_start || null
      const coverageEnd = rangeRes.rows[0]?.coverage_end || null
      const latestMonth = rangeRes.rows[0]?.latest_month || null
      const defaultRange = latestMonth ? getMonthCalendarRange(latestMonth) : null

      return {
        name: profilRes.rows[0]?.nama_masjid || 'Masjid Al-Hidayah',
        coverage: coverageStart && coverageEnd
          ? { startDate: coverageStart, endDate: coverageEnd }
          : null,
        defaultRange,
        months: monthsRes.rows.map((row) => ({
          id: row.month_key,
          label: formatMonthLabel(row.month_key),
        })),
        categories: categoriesRes.rows.map((row) => ({
          dbId: Number(row.id),
          id: mapCategoryApiId(row.id),
          label: row.nama_kategori,
          color: resolveCategoryColor(row.id, row.nama_kategori),
          openingBalance: toRupiahInteger(row.saldo_awal, 'Saldo awal kategori'),
        })),
      }
    },

    async findFinanceReportForRange({ startDate, endDate }) {
      const metadata = await this.findFinanceReportMetadata()

      if (!metadata.coverage) {
        return {
          ...metadata,
          transactions: [],
          priorMutationsByCategory: new Map(),
        }
      }

      const [priorTrxRes, priorTransferInRes, priorTransferOutRes, rangeTrxRes] = await Promise.all([
        db.query(
          `SELECT kategori_dana_id,
                  COALESCE(SUM(CASE WHEN jenis = 'MASUK' THEN nominal ELSE 0 END), 0) AS total_masuk,
                  COALESCE(SUM(CASE WHEN jenis = 'KELUAR' THEN nominal ELSE 0 END), 0) AS total_keluar
           FROM keu_masjid.t_transaksi
           WHERE tanggal < $1::date
           GROUP BY kategori_dana_id`,
          [startDate]
        ),
        db.query(
          `SELECT kategori_dana_tujuan_id AS kategori_dana_id,
                  COALESCE(SUM(nominal), 0) AS total_transfer_masuk
           FROM keu_masjid.t_transfer_dana
           WHERE tanggal < $1::date
           GROUP BY kategori_dana_tujuan_id`,
          [startDate]
        ),
        db.query(
          `SELECT kategori_dana_asal_id AS kategori_dana_id,
                  COALESCE(SUM(nominal), 0) AS total_transfer_keluar
           FROM keu_masjid.t_transfer_dana
           WHERE tanggal < $1::date
           GROUP BY kategori_dana_asal_id`,
          [startDate]
        ),
        db.query(
          `SELECT id, kategori_dana_id, jenis, uraian, nominal,
                  to_char(tanggal, 'YYYY-MM-DD') AS tanggal
           FROM keu_masjid.t_transaksi
           WHERE tanggal >= $1::date AND tanggal <= $2::date
           ORDER BY tanggal ASC, id ASC`,
          [startDate, endDate]
        ),
      ])

      const priorMutationsByCategory = new Map()
      const ensurePrior = (dbId) => {
        if (!priorMutationsByCategory.has(dbId)) {
          priorMutationsByCategory.set(dbId, { net: 0 })
        }
        return priorMutationsByCategory.get(dbId)
      }

      for (const row of priorTrxRes.rows) {
        const entry = ensurePrior(Number(row.kategori_dana_id))
        entry.net +=
          toRupiahInteger(row.total_masuk, 'Total masuk sebelum periode') -
          toRupiahInteger(row.total_keluar, 'Total keluar sebelum periode')
      }
      for (const row of priorTransferInRes.rows) {
        const entry = ensurePrior(Number(row.kategori_dana_id))
        entry.net += toRupiahInteger(row.total_transfer_masuk, 'Total transfer masuk')
      }
      for (const row of priorTransferOutRes.rows) {
        const entry = ensurePrior(Number(row.kategori_dana_id))
        entry.net -= toRupiahInteger(row.total_transfer_keluar, 'Total transfer keluar')
      }

      const transactions = rangeTrxRes.rows.map((row) => ({
        id: String(row.id),
        date: row.tanggal,
        type: row.jenis === 'MASUK' ? 'income' : 'expense',
        description: row.uraian,
        categoryId: mapCategoryApiId(row.kategori_dana_id),
        amount: toRupiahInteger(row.nominal, 'Nominal transaksi'),
      }))

      return {
        ...metadata,
        priorMutationsByCategory,
        transactions,
      }
    },
  }
}

export const defaultFinanceReportRepository = createFinanceReportRepository()
