const agendaData = {
  description: 'Seluruh kegiatan pengajian rutin Masjid Al-Hidayah Sorolaten, dikelompokkan berdasarkan frekuensi pelaksanaan.',
  groups: [
    {
      id: 'weekly',
      title: 'Mingguan',
      subtitle: 'Rutin setiap pekan',
      items: [
        { name: 'Majlis Dzikrullah Bapak-bapak', schedule: 'Rabu Malam' },
        { name: 'Pengajian Ibu-ibu', schedule: 'Kamis Malam' },
        { name: 'Tadarus Al-Qur’an Ibu-ibu', schedule: 'Selasa Malam' },
        { name: 'Pengajian FORMADA (Remaja Masjid)', schedule: 'Jum’at Malam' },
        { name: 'Taman Pengajian Al-Qur’an Anak-anak / TPA', schedule: 'Rabu Sore & Sabtu Sore' },
      ],
    },
    {
      id: 'monthly',
      title: 'Bulanan',
      subtitle: 'Rutin setiap bulan',
      items: [
        { name: 'Pengajian Akbar Warga Sorolaten', schedule: 'Rabu Pon' },
        { name: 'Pengajian Jama’ah Ibu-Ibu Warga Sorolaten dan sekitarnya', schedule: 'Jum’at Pahing' },
      ],
    },
    {
      id: 'yearly',
      title: 'Tahunan / PHBI',
      subtitle: 'Hari Besar Islam',
      items: [
        { name: 'Peringatan Nuzulul Qur’an', schedule: 'Bulan Ramadhan' },
        { name: 'Pengajian Syawalan', schedule: 'Bulan Syawal' },
        { name: 'Peringatan Tahun Baru Islam', schedule: 'Bulan Muharram / Shafar' },
        { name: 'Peringatan Maulid Nabi Muhammad SAW', schedule: 'Bulan Rabi’ul Awwal' },
        { name: 'Peringatan Isra’ Mi’raj Nabi Muhammad SAW', schedule: 'Bulan Rajab' },
      ],
    },
  ],
}

export function getAgendaData() {
  return structuredClone(agendaData)
}

