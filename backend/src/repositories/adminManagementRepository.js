import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { mapPgErrorToHttpError, resolveAuditPenggunaId } from '../utils/financeMapping.js'
import { createHttpError } from '../utils/httpError.js'

function buildInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AD'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatAccountRow(row) {
  return {
    id: String(row.id),
    initials: buildInitials(row.nama),
    name: row.nama,
    email: row.email,
    role: row.role,
    createdDate: row.created_date,
    active: row.status === 'Aktif',
  }
}

function handleAccountPgError(error) {
  if (error?.code === '23505') {
    return createHttpError(400, 'BAD_REQUEST', 'Email sudah terdaftar pada akun lain.')
  }
  if (error?.code === '23503') {
    return createHttpError(
      400,
      'BAD_REQUEST',
      'Akun ini sudah memiliki riwayat aktivitas atau transaksi sehingga tidak dapat dihapus. Nonaktifkan akun sebagai gantinya.'
    )
  }
  return mapPgErrorToHttpError(error)
}

function mapReportAccessRow(row) {
  if (!row) {
    return {
      active: false,
      publicReportEnabled: true,
      changedDate: null,
      changedTime: null,
      changedBy: null,
    }
  }

  return {
    active: row.has_code === true,
    publicReportEnabled: row.laporan_publik_aktif === true,
    changedDate: row.changed_date,
    changedTime: row.changed_time,
    changedBy: row.changed_by,
  }
}

const LOG_TYPE_LABELS = {
  Tambah: { type: 'add', label: 'Tambah data' },
  Edit: { type: 'edit', label: 'Edit data' },
  Hapus: { type: 'delete', label: 'Hapus data' },
}

// Data access layer untuk akun pengurus, status kode akses laporan, dan activity log dari PostgreSQL.
export function createAdminManagementRepository(db = getDefaultDatabasePool()) {
  return {
    async findUserForLoginByEmail(email) {
      const { rows } = await db.query(
        `SELECT id, nama, email, password, role, status
         FROM keu_masjid.m_pengguna
         WHERE lower(email) = lower($1)
         LIMIT 1`,
        [email]
      )
      return rows[0] ?? null
    },

    async findAccounts() {
      const { rows } = await db.query(
        `SELECT id, nama, email, role, status,
                to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS created_date
         FROM keu_masjid.m_pengguna
         ORDER BY id ASC`
      )

      return rows.map(formatAccountRow)
    },

    async findAccountById(id) {
      if (!/^\d+$/.test(String(id))) return null
      const { rows } = await db.query(
        `SELECT id, nama, email, role, status,
                to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS created_date
         FROM keu_masjid.m_pengguna
         WHERE id = $1
         LIMIT 1`,
        [Number(id)]
      )
      return rows[0] ? formatAccountRow(rows[0]) : null
    },

    async insertAccount({ name, email, passwordHash, role, active }, auditUserId = null) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const { rows } = await client.query(
            `INSERT INTO keu_masjid.m_pengguna (
               nama, email, password, role, status, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, nama, email, role, status,
                       to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS created_date`,
            [name, email, passwordHash, role, active ? 'Aktif' : 'Nonaktif', userId]
          )
          return formatAccountRow(rows[0])
        })
      } catch (error) {
        throw handleAccountPgError(error)
      }
    },

    async updateAccountById(id, { name, email, passwordHash, role, active }, auditUserId = null) {
      if (!/^\d+$/.test(String(id))) return null
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const { rows } = await client.query(
            `UPDATE keu_masjid.m_pengguna
             SET nama = $2,
                 email = $3,
                 password = COALESCE($4, password),
                 role = $5,
                 status = $6,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $7
             WHERE id = $1
             RETURNING id, nama, email, role, status,
                       to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS created_date`,
            [Number(id), name, email, passwordHash || null, role, active ? 'Aktif' : 'Nonaktif', userId]
          )
          return rows[0] ? formatAccountRow(rows[0]) : null
        })
      } catch (error) {
        throw handleAccountPgError(error)
      }
    },

    async updateAccountStatusById(id, active, auditUserId = null) {
      if (!/^\d+$/.test(String(id))) return null
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const { rows } = await client.query(
            `UPDATE keu_masjid.m_pengguna
             SET status = $2,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $3
             WHERE id = $1
             RETURNING id, nama, email, role, status,
                       to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS created_date`,
            [Number(id), active ? 'Aktif' : 'Nonaktif', userId]
          )
          return rows[0] ? formatAccountRow(rows[0]) : null
        })
      } catch (error) {
        throw handleAccountPgError(error)
      }
    },

    async deleteAccountById(id, auditUserId = null) {
      if (!/^\d+$/.test(String(id))) return false
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `DELETE FROM keu_masjid.m_pengguna WHERE id = $1 RETURNING id`,
            [Number(id)]
          )
          return res.rowCount > 0
        })
      } catch (error) {
        throw handleAccountPgError(error)
      }
    },

    async findReportAccessStatus() {
      const { rows } = await db.query(
        `SELECT (kode_akses_laporan IS NOT NULL AND btrim(kode_akses_laporan) <> '') AS has_code,
                laporan_publik_aktif,
                to_char(updated_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS changed_date,
                to_char(updated_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS changed_time,
                COALESCE(updated_by_nama, created_by_nama, 'Super Admin') AS changed_by
         FROM keu_masjid.m_pengaturan_website
         WHERE id = 1
         LIMIT 1`
      )

      return mapReportAccessRow(rows[0])
    },

    async saveReportAccessCode({ codeHash, publicReportEnabled }, auditUserId = null) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const { rows } = await client.query(
            `INSERT INTO keu_masjid.m_pengaturan_website (
               id, kode_akses_laporan, laporan_publik_aktif, created_by
             )
             VALUES (1, $1, COALESCE($2, true), $3)
             ON CONFLICT (id) DO UPDATE
             SET kode_akses_laporan = EXCLUDED.kode_akses_laporan,
                 laporan_publik_aktif = COALESCE($2, keu_masjid.m_pengaturan_website.laporan_publik_aktif),
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $3
             RETURNING (kode_akses_laporan IS NOT NULL AND btrim(kode_akses_laporan) <> '') AS has_code,
                       laporan_publik_aktif,
                       to_char(updated_at AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS changed_date,
                       to_char(updated_at AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS changed_time,
                       COALESCE(updated_by_nama, created_by_nama, 'Super Admin') AS changed_by`,
            [codeHash, publicReportEnabled ?? null, userId]
          )

          return mapReportAccessRow(rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async findActivityLogs({ admin, type, date, moduleName, query, limit = 200 } = {}) {
      const whereParts = []
      const params = []

      if (admin) {
        params.push(admin)
        whereParts.push(`p.nama = $${params.length}`)
      }
      if (date) {
        params.push(date)
        whereParts.push(`to_char(l.waktu AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') = $${params.length}`)
      }
      if (moduleName) {
        params.push(moduleName)
        whereParts.push(`l.modul = $${params.length}`)
      }
      if (type) {
        const dbJenis = type === 'add' ? 'Tambah' : type === 'edit' ? 'Edit' : type === 'delete' ? 'Hapus' : type
        params.push(dbJenis)
        whereParts.push(`l.jenis_aktivitas = $${params.length}`)
      }
      if (query) {
        params.push(`%${query}%`)
        whereParts.push(`(p.nama ILIKE $${params.length} OR l.deskripsi ILIKE $${params.length})`)
      }

      const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''
      params.push(limit)

      const [logsRes, totalRes] = await Promise.all([
        db.query(
          `SELECT l.id,
                  to_char(l.waktu AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') AS date,
                  to_char(l.waktu AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') AS time,
                  p.nama AS admin,
                  l.modul AS module,
                  l.jenis_aktivitas AS db_type,
                  l.deskripsi AS title
           FROM keu_masjid.t_activity_log l
           JOIN keu_masjid.m_pengguna p ON p.id = l.pengguna_id
           ${whereSql}
           ORDER BY l.waktu DESC, l.id DESC
           LIMIT $${params.length}`,
          params
        ),
        db.query(`SELECT COUNT(*)::int AS total_count FROM keu_masjid.t_activity_log`),
      ])

      const activities = logsRes.rows.map((row) => {
        const mappedType = LOG_TYPE_LABELS[row.db_type] ?? {
          type: String(row.db_type || '').toLowerCase(),
          label: row.db_type,
        }
        return {
          id: String(row.id),
          date: row.date,
          time: row.time,
          admin: row.admin,
          type: mappedType.type,
          typeLabel: mappedType.label,
          module: row.module,
          title: row.title,
          details: [],
        }
      })

      return {
        activities,
        totalCount: Number(totalRes.rows[0]?.total_count ?? activities.length),
      }
    },
  }
}

export const defaultAdminManagementRepository = createAdminManagementRepository()
