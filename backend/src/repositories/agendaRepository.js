import { getDefaultDatabasePool } from '../config/database.js'

const GROUP_DEFINITIONS = [
  { id: 'weekly', frekuensi: 'Mingguan', title: 'Mingguan', subtitle: 'Kegiatan Rutin Setiap Pekan' },
  { id: 'monthly', frekuensi: 'Bulanan', title: 'Bulanan', subtitle: 'Pengajian Rutin Selapanan' },
  { id: 'yearly', frekuensi: 'Tahunan', title: 'Tahunan / PHBI', subtitle: 'Peringatan Hari Besar Islam' },
]

const AGENDA_SECTION_DESCRIPTION =
  'Rangkaian kegiatan ibadah, kajian rutin, dan peringatan hari besar Islam yang diselenggarakan untuk memakmurkan masjid.'

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
  }
}

export const defaultAgendaRepository = createAgendaRepository()

export function findPublicAgenda() {
  return defaultAgendaRepository.findPublicAgenda()
}
