import { getDefaultDatabasePool } from '../config/database.js'

// Data access layer konten publik dari tabel keu_masjid.m_profil_masjid dan keu_masjid.m_pengaturan_website.
export function createPublicContentRepository(db = getDefaultDatabasePool()) {
  return {
    async findPublicContent() {
      const [profilRes, settingsRes] = await Promise.all([
        db.query(
          `SELECT id, nama_masjid, deskripsi, foto_path, updated_at
           FROM keu_masjid.m_profil_masjid
           WHERE id = 1
           LIMIT 1`
        ),
        db.query(
          `SELECT id, laporan_publik_aktif, nomor_whatsapp, email_pengurus,
                  alamat_lengkap, link_gmaps, jam_operasional
           FROM keu_masjid.m_pengaturan_website
           WHERE id = 1
           LIMIT 1`
        ),
      ])

      const profil = profilRes.rows[0] ?? null
      const settings = settingsRes.rows[0] ?? null

      const addressValue = settings?.alamat_lengkap?.trim() || ''
      const phoneValue = settings?.nomor_whatsapp?.trim() || ''
      const hoursValue = settings?.jam_operasional?.trim() || ''
      const mapsUrl = settings?.link_gmaps?.trim() || ''

      return {
        name: profil?.nama_masjid || 'Masjid Al-Hidayah',
        address: addressValue,
        copyrightYear: new Date().getFullYear(),
        heroDescription: profil?.deskripsi || '',
        photoPath: profil?.foto_path || null,
        publicReportEnabled: settings?.laporan_publik_aktif ?? true,
        statistics: [],
        vision: '',
        missions: [],
        programs: [],
        profile: {
          foundedYear: null,
          location: addressValue,
          introduction: profil?.deskripsi || '',
          timeline: [],
          managementPeriod: '',
          members: [],
          contactTitle: 'Hubungi Takmir',
          contactDescription: '',
        },
        contact: {
          introduction: '',
          information: [
            {
              id: 'address',
              label: 'Alamat',
              verified: Boolean(addressValue),
              value: addressValue || null,
            },
            {
              id: 'phone',
              label: 'Telepon / WhatsApp',
              verified: Boolean(phoneValue),
              value: phoneValue || null,
            },
            {
              id: 'hours',
              label: 'Jam Operasional',
              verified: Boolean(hoursValue),
              value: hoursValue || null,
            },
          ],
          location: {
            verified: Boolean(mapsUrl),
            url: mapsUrl || null,
          },
          donation: {
            qris: {
              verified: false,
              imageSrc: null,
            },
            bank: {
              verified: false,
              name: null,
              number: null,
              recipient: null,
            },
          },
        },
      }
    },
  }
}

export const defaultPublicContentRepository = createPublicContentRepository()

export function findPublicContent() {
  return defaultPublicContentRepository.findPublicContent()
}
