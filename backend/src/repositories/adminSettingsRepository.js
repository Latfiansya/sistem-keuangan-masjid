import { getDefaultDatabasePool, withDatabaseClient, withDatabaseTransaction } from '../config/database.js'
import { createHttpError } from '../utils/httpError.js'
import { mapPgErrorToHttpError, resolveAuditPenggunaId } from '../utils/financeMapping.js'
import { createAgendaRepository } from './agendaRepository.js'
import {
  inspectDonationSchema,
  readDonationBankAccounts,
  syncDonationBankTable,
} from './donationBankRepository.js'

function toNullableNumber(value) {
  return value === null || value === undefined ? null : Number(value)
}

function formatProfile(profil, settings) {
  return {
    name: profil?.nama_masjid || '',
    tagline: profil?.tagline || '',
    description: profil?.deskripsi || '',
    location: profil?.lokasi || '',
    foundedYear: toNullableNumber(profil?.tahun_berdiri),
    buildingArea: toNullableNumber(profil?.luas_bangunan_m2),
    buildingAreaNote: profil?.keterangan_luas || '',
    capacity: toNullableNumber(profil?.kapasitas_jamaah),
    capacityNote: profil?.keterangan_kapasitas || '',
    vision: profil?.visi || '',
    managementPeriod: profil?.periode_pengurus || '',
    address: settings?.alamat_lengkap || '',
    contact: settings?.telepon || '',
    photoPath: profil?.foto_path || null,
    logoPath: profil?.logo_path || null,
  }
}

const PROFILE_COLUMNS = `nama_masjid, tagline, deskripsi, lokasi, tahun_berdiri, luas_bangunan_m2, keterangan_luas,
                kapasitas_jamaah, keterangan_kapasitas, visi, periode_pengurus, foto_path, logo_path`

function formatWebsiteSettings(row) {
  return {
    whatsapp: row?.nomor_whatsapp || '',
    email: row?.email_pengurus || '',
    address: row?.alamat_lengkap || '',
    mapsUrl: row?.link_gmaps || '',
    phone: row?.telepon || '',
    phoneNote: row?.keterangan_telepon || '',
    hours: row?.jam_operasional || '',
    mapLabel: row?.label_peta || '',
    publicReportEnabled: row ? row.laporan_publik_aktif === true : true,
  }
}

const WEBSITE_SETTINGS_COLUMNS = `laporan_publik_aktif, nomor_whatsapp, email_pengurus, alamat_lengkap, link_gmaps,
                telepon, keterangan_telepon, jam_operasional, label_peta`

// Data access layer profil masjid, agenda, donasi, dan pengaturan website pengurus menggunakan PostgreSQL.
export function createAdminSettingsRepository(db = getDefaultDatabasePool()) {
  const agendaRepository = createAgendaRepository(db)

  return {
    async getProfile() {
      const { profilRes, settingsRes } = await withDatabaseClient(db, async (client) => {
        const profilResult = await client.query(
          `SELECT ${PROFILE_COLUMNS}
           FROM keu_masjid.m_profil_masjid
           WHERE id = 1
           LIMIT 1`
        )
        const settingsResult = await client.query(
          `SELECT alamat_lengkap, telepon
           FROM keu_masjid.m_pengaturan_website
           WHERE id = 1
           LIMIT 1`
        )
        return { profilRes: profilResult, settingsRes: settingsResult }
      })

      return formatProfile(profilRes.rows[0], settingsRes.rows[0])
    },

    async saveProfile(nextProfile, auditUserId = null) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const profilRes = await client.query(
            `INSERT INTO keu_masjid.m_profil_masjid (
               id, nama_masjid, tagline, deskripsi, lokasi, tahun_berdiri, luas_bangunan_m2, keterangan_luas,
               kapasitas_jamaah, keterangan_kapasitas, visi, periode_pengurus, created_by
             )
             VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE
             SET nama_masjid = EXCLUDED.nama_masjid,
                 tagline = EXCLUDED.tagline,
                 deskripsi = EXCLUDED.deskripsi,
                 lokasi = EXCLUDED.lokasi,
                 tahun_berdiri = EXCLUDED.tahun_berdiri,
                 luas_bangunan_m2 = EXCLUDED.luas_bangunan_m2,
                 keterangan_luas = EXCLUDED.keterangan_luas,
                 kapasitas_jamaah = EXCLUDED.kapasitas_jamaah,
                 keterangan_kapasitas = EXCLUDED.keterangan_kapasitas,
                 visi = EXCLUDED.visi,
                 periode_pengurus = EXCLUDED.periode_pengurus,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $12
             RETURNING ${PROFILE_COLUMNS}`,
            [
              nextProfile.name,
              nextProfile.tagline || null,
              nextProfile.description || null,
              nextProfile.location || null,
              nextProfile.foundedYear,
              nextProfile.buildingArea,
              nextProfile.buildingAreaNote || null,
              nextProfile.capacity,
              nextProfile.capacityNote || null,
              nextProfile.vision || null,
              nextProfile.managementPeriod || null,
              userId,
            ]
          )

          const settingsRes = await client.query(
            `INSERT INTO keu_masjid.m_pengaturan_website (id, alamat_lengkap, telepon, created_by)
             VALUES (1, $1, $2, $3)
             ON CONFLICT (id) DO UPDATE
             SET alamat_lengkap = EXCLUDED.alamat_lengkap,
                 telepon = EXCLUDED.telepon,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $3
             RETURNING alamat_lengkap, telepon`,
            [nextProfile.address || null, nextProfile.contact || null, userId]
          )

          return formatProfile(profilRes.rows[0], settingsRes.rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async getAgenda() {
      return agendaRepository.findAdminAgenda()
    },

    async findAgendaById(id) {
      return agendaRepository.findAgendaById(id)
    },

    async insertAgenda(input, auditUserId = null) {
      return agendaRepository.insertAgenda(input, auditUserId)
    },

    async updateAgendaById(id, input, auditUserId = null) {
      return agendaRepository.updateAgendaById(id, input, auditUserId)
    },

    async deleteAgendaById(id, auditUserId = null) {
      return agendaRepository.deleteAgendaById(id, auditUserId)
    },

    async getDonationSettings() {
      const { row, accounts } = await withDatabaseClient(db, async (client) => {
        const settingsRes = await client.query(
          `SELECT id, qris_path, nomor_whatsapp
           FROM keu_masjid.m_pengaturan_website
           WHERE id = 1
           LIMIT 1`
        )
        const bankResult = await readDonationBankAccounts(client)
        return {
          row: settingsRes.rows[0] ?? null,
          accounts: bankResult.accounts,
        }
      })

      const qrisPath = row?.qris_path?.trim() || null
      const whatsappNumber = row?.nomor_whatsapp?.trim() || ''
      const first = accounts[0] ?? { bankName: '', accountNumber: '', accountName: '' }
      const second = accounts[1] ?? { bankName: '', accountNumber: '', accountName: '' }

      return {
        qrisFile: qrisPath,
        qrisEnabled: Boolean(qrisPath),
        bankAccounts: accounts.map(({ id, bankName, accountNumber, accountName }) => ({
          id,
          bankName,
          accountNumber,
          accountName,
        })),
        bankName: first.bankName,
        accountNumber: first.accountNumber,
        accountName: first.accountName,
        bankName2: second.bankName,
        accountNumber2: second.accountNumber,
        accountName2: second.accountName,
        bankEnabled: accounts.length > 0,
        whatsappNumber,
        whatsappEnabled: Boolean(whatsappNumber),
        messageTemplate:
          'Assalamu’alaikum Takmir Masjid Al-Hidayah, saya ingin mengonfirmasi donasi.\nNama: [Nama donatur];\nNomor WhatsApp: [Nomor WhatsApp];\nTanggal donasi: [Tanggal];\nNominal: [Nominal];\nMetode pembayaran: [Metode pembayaran];\nTerima kasih.',
        donationNote: 'Periksa nama penerima sebelum transfer dan simpan bukti donasi.',
      }
    },

    async saveDonationSettings(nextSettings, auditUserId = null) {
      const targetAccounts = Array.isArray(nextSettings.bankAccounts)
        ? nextSettings.bankAccounts
        : []

      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const { bankTable, hasLegacyBankColumns } = await inspectDonationSchema(client)
          let savedAccounts = []

          if (bankTable) {
            savedAccounts = await syncDonationBankTable(client, bankTable, targetAccounts, userId)
            const settingsRes = await client.query(
              `INSERT INTO keu_masjid.m_pengaturan_website (id, nomor_whatsapp, created_by)
               VALUES (1, $1, $2)
               ON CONFLICT (id) DO UPDATE
               SET nomor_whatsapp = EXCLUDED.nomor_whatsapp,
                   updated_at = CURRENT_TIMESTAMP,
                   updated_by = $2
               RETURNING qris_path, nomor_whatsapp`,
              [nextSettings.whatsappNumber || null, userId]
            )
            const row = settingsRes.rows[0]
            const first = savedAccounts[0] ?? { bankName: '', accountNumber: '', accountName: '' }
            const second = savedAccounts[1] ?? { bankName: '', accountNumber: '', accountName: '' }
            return {
              ...nextSettings,
              qrisFile: row?.qris_path || nextSettings.qrisFile || null,
              bankAccounts: savedAccounts.map(({ id, bankName, accountNumber, accountName }) => ({
                id,
                bankName,
                accountNumber,
                accountName,
              })),
              bankName: first.bankName,
              accountNumber: first.accountNumber,
              accountName: first.accountName,
              bankName2: second.bankName,
              accountNumber2: second.accountNumber,
              accountName2: second.accountName,
              whatsappNumber: row?.nomor_whatsapp || '',
            }
          }

          if (!hasLegacyBankColumns) {
            throw createHttpError(
              503,
              'SERVICE_UNAVAILABLE',
              'Tabel rekening donasi belum tersedia di database.'
            )
          }

          if (targetAccounts.length > 1) {
            throw createHttpError(
              503,
              'SERVICE_UNAVAILABLE',
              'Penyimpanan lebih dari 1 rekening membutuhkan tabel rekening donasi di database.'
            )
          }

          const firstInput = targetAccounts[0] ?? { bankName: '', accountNumber: '', accountName: '' }
          const res = await client.query(
            `INSERT INTO keu_masjid.m_pengaturan_website (
               id, bank_nama, bank_no_rekening, bank_atas_nama, nomor_whatsapp, created_by
             )
             VALUES (1, $1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE
             SET bank_nama = EXCLUDED.bank_nama,
                 bank_no_rekening = EXCLUDED.bank_no_rekening,
                 bank_atas_nama = EXCLUDED.bank_atas_nama,
                 nomor_whatsapp = EXCLUDED.nomor_whatsapp,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $5
             RETURNING qris_path, bank_nama, bank_no_rekening, bank_atas_nama, nomor_whatsapp`,
            [
              firstInput.bankName || null,
              firstInput.accountNumber || null,
              firstInput.accountName || null,
              nextSettings.whatsappNumber || null,
              userId,
            ]
          )

          const row = res.rows[0]
          const legacyAccount =
            row?.bank_nama && row?.bank_no_rekening && row?.bank_atas_nama
              ? [{
                  id: '1',
                  bankName: row.bank_nama,
                  accountNumber: row.bank_no_rekening,
                  accountName: row.bank_atas_nama,
                }]
              : []
          return {
            ...nextSettings,
            qrisFile: row?.qris_path || nextSettings.qrisFile || null,
            bankAccounts: legacyAccount,
            bankName: row?.bank_nama || '',
            accountNumber: row?.bank_no_rekening || '',
            accountName: row?.bank_atas_nama || '',
            bankName2: '',
            accountNumber2: '',
            accountName2: '',
            whatsappNumber: row?.nomor_whatsapp || '',
          }
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },

    async getWebsiteSettings() {
      const { rows } = await db.query(
        `SELECT ${WEBSITE_SETTINGS_COLUMNS}
         FROM keu_masjid.m_pengaturan_website
         WHERE id = 1
         LIMIT 1`
      )

      return formatWebsiteSettings(rows[0])
    },

    async saveWebsiteSettings(nextSettings, auditUserId = null) {
      try {
        return await withDatabaseTransaction(db, async (client) => {
          const userId = auditUserId ? Number(auditUserId) : await resolveAuditPenggunaId(client)
          await client.query("SELECT set_config('app.user_id', $1, true)", [String(userId)])

          const res = await client.query(
            `INSERT INTO keu_masjid.m_pengaturan_website (
               id, nomor_whatsapp, email_pengurus, alamat_lengkap, link_gmaps, laporan_publik_aktif,
               telepon, keterangan_telepon, jam_operasional, label_peta, created_by
             )
             VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE
             SET nomor_whatsapp = EXCLUDED.nomor_whatsapp,
                 email_pengurus = EXCLUDED.email_pengurus,
                 alamat_lengkap = EXCLUDED.alamat_lengkap,
                 link_gmaps = EXCLUDED.link_gmaps,
                 laporan_publik_aktif = EXCLUDED.laporan_publik_aktif,
                 telepon = EXCLUDED.telepon,
                 keterangan_telepon = EXCLUDED.keterangan_telepon,
                 jam_operasional = EXCLUDED.jam_operasional,
                 label_peta = EXCLUDED.label_peta,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $10
             RETURNING ${WEBSITE_SETTINGS_COLUMNS}`,
            [
              nextSettings.whatsapp || null,
              nextSettings.email || null,
              nextSettings.address || null,
              nextSettings.mapsUrl || null,
              nextSettings.publicReportEnabled,
              nextSettings.phone || null,
              nextSettings.phoneNote || null,
              nextSettings.hours || null,
              nextSettings.mapLabel || null,
              userId,
            ]
          )

          return formatWebsiteSettings(res.rows[0])
        })
      } catch (error) {
        throw mapPgErrorToHttpError(error)
      }
    },
  }
}

export const defaultAdminSettingsRepository = createAdminSettingsRepository()
