import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { mapPgErrorToHttpError, resolveAuditPenggunaId } from '../utils/financeMapping.js'
import { createHttpError } from '../utils/httpError.js'

// Pemetaan target unggah ke kolom tabel yang menyimpannya (konstanta, bukan input pengguna).
// Skema mengikuti docs/sql/2026-11-23-gambar-di-kolom.sql.
export const FILE_TARGETS = {
  'masjid-photo': { table: 'm_profil_masjid', pathColumn: 'foto_path', contentColumn: 'foto_isi', mimeColumn: 'foto_mime', maxBytes: 5 * 1024 * 1024 },
  logo: { table: 'm_profil_masjid', pathColumn: 'logo_path', contentColumn: 'logo_isi', mimeColumn: 'logo_mime', maxBytes: 2 * 1024 * 1024 },
  qris: { table: 'm_pengaturan_website', pathColumn: 'qris_path', contentColumn: 'qris_isi', mimeColumn: 'qris_mime', maxBytes: 2 * 1024 * 1024 },
}

export const PUBLIC_FILE_PREFIX = '/api/public/files/'

// URL publik berbasis hash isi: berubah setiap gambar diganti sehingga aman di-cache lama.
export function buildPublicFilePath(target, sha256) {
  return `${PUBLIC_FILE_PREFIX}${target}/${sha256}`
}

function getTarget(target) {
  const definition = FILE_TARGETS[target]
  if (!definition) throw new Error(`Target unggah tidak dikenal: ${target}`)
  return definition
}

async function setAuditUser(client, auditUserId) {
  const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
  await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])
  return userId
}

// Data access layer berkas gambar website yang disimpan pada kolom *_isi tabel profil/pengaturan.
export function createFileRepository(db = getDefaultDatabasePool()) {
  return {
    // Isi biner hanya dibaca di sini; hanya dikembalikan bila URL yang diminta adalah URL gambar terkini.
    async findByTargetAndHash(target, sha256) {
      const { table, pathColumn, contentColumn, mimeColumn } = getTarget(target)
      const { rows } = await db.query(
        `SELECT ${contentColumn} AS content, ${mimeColumn} AS mime_type
         FROM keu_masjid.${table}
         WHERE id = 1 AND ${pathColumn} = $1 AND ${contentColumn} IS NOT NULL
         LIMIT 1`,
        [buildPublicFilePath(target, sha256)]
      )
      const row = rows[0]
      return row ? { mimeType: row.mime_type, size: row.content.length, sha256, content: row.content } : null
    },

    async saveForTarget(target, { mimeType, content, sha256 }, auditUserId = null) {
      const { table, pathColumn, contentColumn, mimeColumn } = getTarget(target)
      const path = buildPublicFilePath(target, sha256)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await setAuditUser(client, auditUserId)
          const updated = await client.query(
            `UPDATE keu_masjid.${table}
             SET ${pathColumn} = $1, ${contentColumn} = $2, ${mimeColumn} = $3,
                 updated_at = CURRENT_TIMESTAMP, updated_by = $4
             WHERE id = 1`,
            [path, content, mimeType, userId]
          )
          if (updated.rowCount === 0) {
            throw createHttpError(409, 'CONFLICT', 'Data profil/pengaturan website belum tersedia. Simpan data utamanya terlebih dahulu.')
          }
          return { path, mimeType, size: content.length }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async removeForTarget(target, auditUserId = null) {
      const { table, pathColumn, contentColumn, mimeColumn } = getTarget(target)
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await setAuditUser(client, auditUserId)
          await client.query(
            `UPDATE keu_masjid.${table}
             SET ${pathColumn} = NULL, ${contentColumn} = NULL, ${mimeColumn} = NULL,
                 updated_at = CURRENT_TIMESTAMP, updated_by = $1
             WHERE id = 1`,
            [userId]
          )
          return { path: null }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },
  }
}

export const defaultFileRepository = createFileRepository()
