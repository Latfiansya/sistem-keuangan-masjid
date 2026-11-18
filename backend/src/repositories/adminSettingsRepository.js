import { getDefaultDatabasePool, withDatabaseTransaction } from '../config/database.js'
import { createHttpError } from '../utils/httpError.js'
import { mapPgErrorToHttpError, resolveAuditPenggunaId } from '../utils/financeMapping.js'
import { createAgendaRepository } from './agendaRepository.js'

// Data access layer profil masjid, agenda, dan pengaturan website pengurus menggunakan PostgreSQL.
export function createAdminSettingsRepository(db = getDefaultDatabasePool()) {
  const agendaRepository = createAgendaRepository(db)

  return {
    async getProfile() {
      const [profilRes, settingsRes] = await Promise.all([
        db.query(
          `SELECT id, nama_masjid, deskripsi, foto_path
           FROM keu_masjid.m_profil_masjid
           WHERE id = 1
           LIMIT 1`
        ),
        db.query(
          `SELECT id, alamat_lengkap, nomor_whatsapp
           FROM keu_masjid.m_pengaturan_website
           WHERE id = 1
           LIMIT 1`
        ),
      ])

      const profil = profilRes.rows[0]
      const settings = settingsRes.rows[0]

      return {
        name: profil?.nama_masjid || '',
        description: profil?.deskripsi || '',
        address: settings?.alamat_lengkap || '',
        contact: settings?.nomor_whatsapp || '',
        photoPath: profil?.foto_path || null,
      }
    },

    async saveProfile(nextProfile) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          await client.query(
            `INSERT INTO keu_masjid.m_profil_masjid (id, nama_masjid, deskripsi, created_by)
             VALUES (1, $1, $2, $3)
             ON CONFLICT (id) DO UPDATE
             SET nama_masjid = EXCLUDED.nama_masjid,
                 deskripsi = EXCLUDED.deskripsi,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $3`,
            [nextProfile.name, nextProfile.description, userId]
          )

          await client.query(
            `INSERT INTO keu_masjid.m_pengaturan_website (id, alamat_lengkap, nomor_whatsapp, created_by)
             VALUES (1, $1, $2, $3)
             ON CONFLICT (id) DO UPDATE
             SET alamat_lengkap = EXCLUDED.alamat_lengkap,
                 nomor_whatsapp = EXCLUDED.nomor_whatsapp,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $3`,
            [nextProfile.address || null, nextProfile.contact || null, userId]
          )

          return {
            name: nextProfile.name,
            description: nextProfile.description,
            address: nextProfile.address,
            contact: nextProfile.contact,
          }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async getAgenda() {
      return agendaRepository.findPublicAgenda()
    },

    async getDonationSettings() {
      return {
        qrisFile: null,
        qrisEnabled: false,
        bankName: '',
        accountNumber: '',
        accountName: '',
        bankEnabled: false,
        whatsappNumber: '',
        whatsappEnabled: false,
        messageTemplate: '',
        donationNote: '',
      }
    },

    async saveDonationSettings() {
      throw createHttpError(
        503,
        'SERVICE_UNAVAILABLE',
        'Tabel pengaturan donasi belum tersedia pada skema database saat ini.'
      )
    },

    async getWebsiteSettings() {
      const { rows } = await db.query(
        `SELECT id, laporan_publik_aktif, nomor_whatsapp, email_pengurus,
                alamat_lengkap, link_gmaps
         FROM keu_masjid.m_pengaturan_website
         WHERE id = 1
         LIMIT 1`
      )

      const row = rows[0]
      return {
        whatsapp: row?.nomor_whatsapp || '',
        email: row?.email_pengurus || '',
        address: row?.alamat_lengkap || '',
        mapsUrl: row?.link_gmaps || '',
        publicReportEnabled: row ? row.laporan_publik_aktif === true : true,
      }
    },

    async saveWebsiteSettings(nextSettings) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `INSERT INTO keu_masjid.m_pengaturan_website (
               id, nomor_whatsapp, email_pengurus, alamat_lengkap, link_gmaps, laporan_publik_aktif, created_by
             )
             VALUES (1, $1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE
             SET nomor_whatsapp = EXCLUDED.nomor_whatsapp,
                 email_pengurus = EXCLUDED.email_pengurus,
                 alamat_lengkap = EXCLUDED.alamat_lengkap,
                 link_gmaps = EXCLUDED.link_gmaps,
                 laporan_publik_aktif = EXCLUDED.laporan_publik_aktif,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $6
             RETURNING nomor_whatsapp, email_pengurus, alamat_lengkap, link_gmaps, laporan_publik_aktif`,
            [
              nextSettings.whatsapp || null,
              nextSettings.email || null,
              nextSettings.address || null,
              nextSettings.mapsUrl || null,
              nextSettings.publicReportEnabled,
              userId,
            ]
          )

          const row = res.rows[0]
          return {
            whatsapp: row.nomor_whatsapp || '',
            email: row.email_pengurus || '',
            address: row.alamat_lengkap || '',
            mapsUrl: row.link_gmaps || '',
            publicReportEnabled: row.laporan_publik_aktif === true,
          }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },
  }
}

export const defaultAdminSettingsRepository = createAdminSettingsRepository()
