import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { mapPgErrorToHttpError, resolveAuditPenggunaId } from '../utils/financeMapping.js'

// Pemetaan bagian konten profil ke tabel dan kolom PostgreSQL (konstanta, bukan input pengguna).
export const PROFILE_CONTENT_SECTIONS = {
  missions: {
    table: 'm_misi_masjid',
    columns: { text: 'isi', order: 'urutan' },
  },
  programs: {
    table: 'm_program_masjid',
    columns: { title: 'judul', description: 'deskripsi', order: 'urutan', active: 'aktif' },
  },
  history: {
    table: 'm_sejarah_masjid',
    columns: {
      year: 'tahun',
      era: 'label_era',
      placeName: 'nama_tempat',
      title: 'judul',
      description: 'deskripsi',
      order: 'urutan',
    },
  },
  officers: {
    table: 'm_pengurus',
    columns: { name: 'nama', role: 'jabatan', note: 'keterangan', order: 'urutan', active: 'aktif' },
  },
}

const NUMERIC_FIELDS = new Set(['year', 'order'])

function getSection(section) {
  const definition = PROFILE_CONTENT_SECTIONS[section]
  if (!definition) throw new Error(`Bagian konten profil tidak dikenal: ${section}`)
  return definition
}

function formatRow(section, row) {
  const item = { id: String(row.id) }
  for (const [field, column] of Object.entries(getSection(section).columns)) {
    const value = row[column]
    if (field === 'active') item[field] = value === true
    else if (NUMERIC_FIELDS.has(field)) item[field] = Number(value ?? 0)
    else item[field] = value ?? ''
  }
  return item
}

function selectColumns(section) {
  return ['id', ...Object.values(getSection(section).columns)].join(', ')
}

function isValidId(id) {
  return /^\d+$/.test(String(id))
}

async function setAuditUser(client, auditUserId) {
  const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
  await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])
  return userId
}

// Data access layer misi, program, sejarah, dan pengurus masjid di schema keu_masjid.
export function createProfileContentRepository(db = getDefaultDatabasePool()) {
  return {
    async findAll() {
      const sections = Object.keys(PROFILE_CONTENT_SECTIONS)
      const results = await Promise.all(
        sections.map((section) =>
          db.query(
            `SELECT ${selectColumns(section)}
             FROM keu_masjid.${getSection(section).table}
             ORDER BY urutan ASC, id ASC`
          )
        )
      )
      return Object.fromEntries(
        sections.map((section, index) => [section, results[index].rows.map((row) => formatRow(section, row))])
      )
    },

    async findById(section, id) {
      if (!isValidId(id)) return null
      const { rows } = await db.query(
        `SELECT ${selectColumns(section)}
         FROM keu_masjid.${getSection(section).table}
         WHERE id = $1
         LIMIT 1`,
        [Number(id)]
      )
      return rows[0] ? formatRow(section, rows[0]) : null
    },

    async insert(section, values, auditUserId = null) {
      const { table, columns } = getSection(section)
      const fields = Object.keys(columns)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await setAuditUser(client, auditUserId)
          const columnList = [...fields.map((field) => columns[field]), 'created_by'].join(', ')
          const placeholders = [...fields, 'created_by'].map((_, index) => `$${index + 1}`).join(', ')
          const { rows } = await client.query(
            `INSERT INTO keu_masjid.${table} (${columnList})
             VALUES (${placeholders})
             RETURNING ${selectColumns(section)}`,
            [...fields.map((field) => values[field]), userId]
          )
          return formatRow(section, rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async updateById(section, id, values, auditUserId = null) {
      if (!isValidId(id)) return null
      const { table, columns } = getSection(section)
      const fields = Object.keys(columns)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await setAuditUser(client, auditUserId)
          const assignments = fields.map((field, index) => `${columns[field]} = $${index + 2}`)
          const { rows } = await client.query(
            `UPDATE keu_masjid.${table}
             SET ${assignments.join(', ')},
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $${fields.length + 2}
             WHERE id = $1
             RETURNING ${selectColumns(section)}`,
            [Number(id), ...fields.map((field) => values[field]), userId]
          )
          return rows[0] ? formatRow(section, rows[0]) : null
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async deleteById(section, id, auditUserId = null) {
      if (!isValidId(id)) return false
      const { table } = getSection(section)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          await setAuditUser(client, auditUserId)
          const res = await client.query(`DELETE FROM keu_masjid.${table} WHERE id = $1 RETURNING id`, [
            Number(id),
          ])
          return res.rowCount > 0
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },
  }
}

export const defaultProfileContentRepository = createProfileContentRepository()
