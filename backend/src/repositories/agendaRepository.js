import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { mapPgErrorToHttpError, resolveAuditPenggunaId } from '../utils/financeMapping.js'
import { createHttpError } from '../utils/httpError.js'

const GROUP_DEFINITIONS = [
  { id: 'weekly', frekuensi: 'Mingguan', title: 'Mingguan', subtitle: 'Kegiatan Rutin Setiap Pekan' },
  { id: 'monthly', frekuensi: 'Bulanan', title: 'Bulanan', subtitle: 'Pengajian Rutin Selapanan' },
  { id: 'yearly', frekuensi: 'Tahunan', title: 'Tahunan / PHBI', subtitle: 'Peringatan Hari Besar Islam' },
]

const FREKUENSI_TO_GROUP_ID = new Map(GROUP_DEFINITIONS.map((g) => [g.frekuensi, g.id]))

const AGENDA_SECTION_DESCRIPTION =
  'Rangkaian kegiatan ibadah, kajian rutin, dan peringatan hari besar Islam yang diselenggarakan untuk memakmurkan masjid.'

function formatAdminAgendaItem(row) {
  return {
    id: String(row.id),
    name: row.nama_kegiatan,
    frequency: FREKUENSI_TO_GROUP_ID.get(row.frekuensi) ?? 'weekly',
    schedule: row.waktu_pelaksanaan,
    description: row.keterangan || '',
    order: Number(row.urutan ?? 0),
    active: row.aktif === true,
  }
}

function handleAgendaPgError(error) {
  if (error?.code === '23505') {
    return createHttpError(400, 'BAD_REQUEST', 'Agenda dengan nama dan frekuensi tersebut sudah terdaftar.')
  }
  return mapPgErrorToHttpError(error)
}

// Data access layer agenda kegiatan dari tabel keu_masjid.m_agenda.
export function createAgendaRepository(db = getDefaultDatabasePool()) {
  return {
    async findPublicAgenda() {
      const { rows } = await db.query(
        `SELECT id, nama_kegiatan, frekuensi, waktu_pelaksanaan, keterangan, urutan
         FROM keu_masjid.m_agenda
         WHERE aktif = true
         ORDER BY urutan ASC, id ASC`
      )

      const itemsByFrekuensi = new Map(GROUP_DEFINITIONS.map((group) => [group.frekuensi, []]))
      for (const row of rows) {
        const bucket = itemsByFrekuensi.get(row.frekuensi)
        if (!bucket) continue
        bucket.push({
          id: String(row.id),
          name: row.nama_kegiatan,
          schedule: row.waktu_pelaksanaan,
          ...(row.keterangan ? { description: row.keterangan } : {}),
        })
      }

      return {
        description: AGENDA_SECTION_DESCRIPTION,
        groups: GROUP_DEFINITIONS.map(({ id, title, subtitle, frekuensi }) => ({
          id,
          title,
          subtitle,
          items: itemsByFrekuensi.get(frekuensi) ?? [],
        })),
      }
    },

    async findAdminAgenda() {
      const { rows } = await db.query(
        `SELECT id, nama_kegiatan, frekuensi, waktu_pelaksanaan, keterangan, urutan, aktif
         FROM keu_masjid.m_agenda
         ORDER BY urutan ASC, id ASC`
      )

      const itemsByFrekuensi = new Map(GROUP_DEFINITIONS.map((group) => [group.frekuensi, []]))
      for (const row of rows) {
        const bucket = itemsByFrekuensi.get(row.frekuensi)
        if (!bucket) continue
        bucket.push(formatAdminAgendaItem(row))
      }

      return {
        description: AGENDA_SECTION_DESCRIPTION,
        groups: GROUP_DEFINITIONS.map(({ id, title, subtitle, frekuensi }) => ({
          id,
          title,
          subtitle,
          items: itemsByFrekuensi.get(frekuensi) ?? [],
        })),
      }
    },

    async findAgendaById(id) {
      if (!/^\d+$/.test(String(id))) return null
      const { rows } = await db.query(
        `SELECT id, nama_kegiatan, frekuensi, waktu_pelaksanaan, keterangan, urutan, aktif
         FROM keu_masjid.m_agenda
         WHERE id = $1
         LIMIT 1`,
        [Number(id)]
      )
      return rows[0] ? formatAdminAgendaItem(rows[0]) : null
    },

    async insertAgenda({ name, frekuensi, schedule, description, order, active }, auditUserId = null) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const { rows } = await client.query(
            `INSERT INTO keu_masjid.m_agenda (
               nama_kegiatan, frekuensi, waktu_pelaksanaan, keterangan, urutan, aktif, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, nama_kegiatan, frekuensi, waktu_pelaksanaan, keterangan, urutan, aktif`,
            [name, frekuensi, schedule, description || null, order, active, userId]
          )
          return formatAdminAgendaItem(rows[0])
        })
      } catch (error) {
        throw handleAgendaPgError(error)
      }
    },

    async updateAgendaById(id, { name, frekuensi, schedule, description, order, active }, auditUserId = null) {
      if (!/^\d+$/.test(String(id))) return null
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const { rows } = await client.query(
            `UPDATE keu_masjid.m_agenda
             SET nama_kegiatan = $2,
                 frekuensi = $3,
                 waktu_pelaksanaan = $4,
                 keterangan = $5,
                 urutan = $6,
                 aktif = $7,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $8
             WHERE id = $1
             RETURNING id, nama_kegiatan, frekuensi, waktu_pelaksanaan, keterangan, urutan, aktif`,
            [Number(id), name, frekuensi, schedule, description || null, order, active, userId]
          )
          return rows[0] ? formatAdminAgendaItem(rows[0]) : null
        })
      } catch (error) {
        throw handleAgendaPgError(error)
      }
    },

    async deleteAgendaById(id, auditUserId = null) {
      if (!/^\d+$/.test(String(id))) return false
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `DELETE FROM keu_masjid.m_agenda WHERE id = $1 RETURNING id`,
            [Number(id)]
          )
          return res.rowCount > 0
        })
      } catch (error) {
        throw handleAgendaPgError(error)
      }
    },
  }
}

export const defaultAgendaRepository = createAgendaRepository()

export function findPublicAgenda() {
  return defaultAgendaRepository.findPublicAgenda()
}
