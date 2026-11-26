import { getDefaultDatabasePool, withDatabaseClient } from '../config/database.js'
import {
  buildMapsUrlFromCoordinates,
  isValidGoogleMapsUrl,
  resolveGoogleMapsEmbedUrl,
} from '../utils/mapsLocation.js'
import { readDonationBankAccounts } from './donationBankRepository.js'

const PROGRAM_ICONS = ['heart', 'health', 'economy']

function resolveProgramIcon(title = '', index = 0) {
  const lower = String(title).toLowerCase()
  if (lower.includes('inklusi') || lower.includes('ibadah')) return 'heart'
  if (lower.includes('kesehatan')) return 'health'
  if (lower.includes('ekonomi')) return 'economy'
  return PROGRAM_ICONS[index % PROGRAM_ICONS.length]
}

function buildInitials(name = '') {
  const parts = String(name)
    .replace(/\b(drs|dr|s\.pd|s\.km|mph|h|hj)\b\.?/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'TM'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

// Data access layer konten publik dari tabel keu_masjid.* di PostgreSQL.
export function createPublicContentRepository(db = getDefaultDatabasePool()) {
  return {
    async findPublicContent() {
      const { profilRes, settingsRes, bankResult, misiRes, programRes, sejarahRes, pengurusRes } =
        await withDatabaseClient(db, async (client) => {
          const profilResult = await client.query(
            `SELECT id, nama_masjid, deskripsi, foto_path, lokasi, tagline,
                    tahun_berdiri, luas_bangunan_m2, keterangan_luas,
                    kapasitas_jamaah, keterangan_kapasitas, visi, periode_pengurus, logo_path
             FROM keu_masjid.m_profil_masjid
             WHERE id = 1
             LIMIT 1`
          )
          let settingsResult
          try {
            settingsResult = await client.query(
              `SELECT id, laporan_publik_aktif, nomor_whatsapp, email_pengurus,
                      alamat_lengkap, link_gmaps, jam_operasional,
                      telepon, keterangan_telepon, latitude, longitude, label_peta,
                      qris_path
               FROM keu_masjid.m_pengaturan_website
               WHERE id = 1
               LIMIT 1`
            )
          } catch (error) {
            if (error?.code !== '42703') throw error
            try {
              settingsResult = await client.query(
                `SELECT id, laporan_publik_aktif, nomor_whatsapp, email_pengurus,
                        alamat_lengkap, link_gmaps, qris_path
                 FROM keu_masjid.m_pengaturan_website
                 WHERE id = 1
                 LIMIT 1`
              )
            } catch (fallbackError) {
              if (fallbackError?.code !== '42703') throw fallbackError
              settingsResult = { rows: [] }
            }
          }
          const donationBankResult = await readDonationBankAccounts(client, settingsResult.rows[0] ?? null)
          const misiResult = await client.query(
            `SELECT id, isi, urutan
             FROM keu_masjid.m_misi_masjid
             ORDER BY urutan ASC, id ASC`
          )
          const programResult = await client.query(
            `SELECT id, judul, deskripsi, urutan
             FROM keu_masjid.m_program_masjid
             WHERE aktif = true
             ORDER BY urutan ASC, id ASC`
          )
          const sejarahResult = await client.query(
            `SELECT id, tahun, label_era, nama_tempat, judul, deskripsi, urutan
             FROM keu_masjid.m_sejarah_masjid
             ORDER BY urutan ASC, id ASC`
          )
          const pengurusResult = await client.query(
            `SELECT id, nama, jabatan, keterangan, foto_path, urutan
             FROM keu_masjid.m_pengurus
             WHERE aktif = true
             ORDER BY urutan ASC, id ASC`
          )
          return {
            profilRes: profilResult,
            settingsRes: settingsResult,
            bankResult: donationBankResult,
            misiRes: misiResult,
            programRes: programResult,
            sejarahRes: sejarahResult,
            pengurusRes: pengurusResult,
          }
        })

      const profil = profilRes.rows[0] ?? null
      const settings = settingsRes.rows[0] ?? null

      // Hash foto unggahan (bagian dari URL) agar frontend dapat mengenali foto bawaan dan tetap memakai overlay hero.
      const photoSha256 = /^\/api\/public\/files\/masjid-photo\/([0-9a-f]{64})$/.exec(profil?.foto_path || '')?.[1] || null

      const addressValue = settings?.alamat_lengkap?.trim() || ''
      const phoneValue =
        settings?.telepon?.trim() || settings?.nomor_whatsapp?.trim() || ''
      const phoneNote = settings?.keterangan_telepon?.trim() || null
      const hoursValue = settings?.jam_operasional?.trim() || ''
      const rawMapsUrl = settings?.link_gmaps?.trim() || ''
      const mapsUrl = isValidGoogleMapsUrl(rawMapsUrl)
        ? rawMapsUrl
        : buildMapsUrlFromCoordinates(settings?.latitude, settings?.longitude)
      const mapLabel = settings?.label_peta?.trim() || ''
      const mapsEmbedUrl = mapsUrl
        ? resolveGoogleMapsEmbedUrl({
            url: mapsUrl,
            latitude: settings?.latitude,
            longitude: settings?.longitude,
            address: addressValue,
            label: mapLabel,
          })
        : null

      const statistics = []
      if (profil?.tahun_berdiri) {
        statistics.push({
          id: 'founded',
          label: 'Tahun Berdiri',
          value: String(profil.tahun_berdiri),
          icon: 'calendar',
        })
      }
      if (profil?.luas_bangunan_m2) {
        statistics.push({
          id: 'area',
          label: 'Luas Tanah',
          value: `${profil.luas_bangunan_m2} m²`,
          amount: Number(profil.luas_bangunan_m2),
          unit: 'm²',
          profileLabel: 'Luas Bangunan',
          description: profil.keterangan_luas || '',
          icon: 'expand',
        })
      }
      if (profil?.kapasitas_jamaah) {
        statistics.push({
          id: 'capacity',
          label: 'Kapasitas',
          value: `${profil.kapasitas_jamaah} Jamaah`,
          amount: Number(profil.kapasitas_jamaah),
          unit: 'Jamaah',
          profileLabel: 'Kapasitas Jamaah',
          description: profil.keterangan_kapasitas || '',
          icon: 'users',
        })
      }

      const banks = (bankResult?.accounts || []).map((item) => ({
        verified: true,
        name: item.bankName,
        number: item.accountNumber,
        recipient: item.accountName,
      }))
      const emptyBank = { verified: false, name: null, number: null, recipient: null }
      const qrisSrc = settings?.qris_path?.trim() || null

      return {
        name: profil?.nama_masjid || 'Masjid Al-Hidayah',
        address: addressValue,
        copyrightYear: new Date().getFullYear(),
        heroDescription: profil?.tagline || profil?.deskripsi || '',
        photoPath: profil?.foto_path || null,
        photoSha256,
        logoPath: profil?.logo_path || null,
        publicReportEnabled: settings?.laporan_publik_aktif ?? true,
        statistics,
        vision: profil?.visi || '',
        missions: misiRes.rows.map((row) => row.isi),
        programs: programRes.rows.map((row, index) => ({
          title: row.judul,
          description: row.deskripsi,
          icon: resolveProgramIcon(row.judul, index),
        })),
        profile: {
          foundedYear: profil?.tahun_berdiri ? Number(profil.tahun_berdiri) : null,
          location: profil?.lokasi || addressValue,
          introduction: profil?.deskripsi || '',
          timeline: sejarahRes.rows.map((row) => ({
            year: Number(row.tahun),
            era: row.label_era || '',
            mosqueName: row.nama_tempat || '',
            title: row.judul,
            description: row.deskripsi || '',
          })),
          managementPeriod: profil?.periode_pengurus || '',
          members: pengurusRes.rows.map((row) => ({
            initials: buildInitials(row.nama),
            role: row.jabatan,
            name: row.nama,
            ...(row.keterangan ? { note: row.keterangan } : {}),
          })),
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
              note: phoneValue ? phoneNote : null,
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
            ...(mapsUrl && mapLabel ? { label: mapLabel } : {}),
            ...(mapsUrl && mapsEmbedUrl ? { embedUrl: mapsEmbedUrl } : {}),
          },
          donation: {
            qris: {
              verified: Boolean(qrisSrc),
              imageSrc: qrisSrc,
            },
            banks,
            bank: banks[0] ?? { ...emptyBank },
            bank2: banks[1] ?? { ...emptyBank },
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
