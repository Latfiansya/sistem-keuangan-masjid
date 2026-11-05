const foundingYear = 1980
const buildingArea = 265
const capacity = 290

export const mockPublicContent = {
  name: 'Masjid Al-Hidayah',
  address: 'Dusun Sorolaten RT 04 RW 15, Sidokarto, Godean, Sleman, Yogyakarta.',
  copyrightYear: 2026,
  heroDescription: `Pusat ibadah, pembinaan umat, dan pemberdayaan masyarakat Dusun Sorolaten sejak ${foundingYear}.`,
  statistics: [
    { id: 'founded', label: 'Berdiri Sejak', value: String(foundingYear), icon: 'calendar' },
    { id: 'area', label: 'Luas Bangunan', value: `${buildingArea} m²`, amount: buildingArea, unit: 'm²', icon: 'expand', profileLabel: 'LUAS BANGUNAN', description: 'Berdiri di atas tanah wakaf warga Sorolaten, dilengkapi serambi, tempat wudhu, dan aula multifungsi.' },
    { id: 'capacity', label: 'Kapasitas', value: `${capacity} Jamaah`, amount: capacity, unit: 'Jamaah', icon: 'users', profileLabel: 'KAPASITAS RUANG', description: `Ruang sholat utama menampung ${capacity} jamaah dengan fasilitas ramah lansia dan difabel.` },
  ],
  vision: 'Menjadi Pusat Ibadah dan Pembinaan Masyarakat Sorolaten.',
  missions: [
    'Menyelenggarakan peribadatan berdasarkan Al-Qur’an dan Sunnah.',
    'Meningkatkan pemahaman syariat Islam masyarakat Sorolaten.',
    'Mempersiapkan generasi muda sebagai generasi Qur’ani yang tangguh.',
    'Berperan serta meningkatkan kesejahteraan masyarakat.',
  ],
  profile: {
    foundedYear: foundingYear,
    location: 'Sorolaten',
    introduction: 'Empat dekade berkhidmat — dari sebuah mushola kecil di tengah dusun, kini menjadi pusat ibadah dan pembinaan masyarakat Sorolaten.',
    timeline: [
      { year: foundingYear, era: 'Era Perintisan', name: 'Mushola Al Qodar', title: 'Awal Mula — Inisiatif Pemuda Dusun', description: 'Berdiri sebagai mushola kecil di atas tanah wakaf warga, dibangun secara swadaya oleh pemuda dan masyarakat Sorolaten sebagai tempat ibadah harian.' },
      { year: 2000, era: 'Era Pengembangan', name: 'Masjid Al-Hidayah', title: 'Diperluas & Berganti Nama', description: 'Seiring pertumbuhan jamaah, mushola dipugar menjadi masjid jami’ dan diresmikan dengan nama baru untuk melayani ibadah Jumat serta kegiatan pembinaan umat.' },
    ],
    managementPeriod: '2023–2025',
    members: [
      { initials: 'JM', role: 'KETUA', name: 'Jiyamta, S.Pd' },
      { initials: 'TW', role: 'PELINDUNG', name: 'Tri Warjunadi', note: '( Kepala Dukuh )' },
      { initials: 'SH', role: 'PENASEHAT', name: 'Sugiharto, S.KM, MPH', note: '( Ketua LPMD )' },
      { initials: 'PS', role: 'WAKIL KETUA', name: 'Drs.Puji Suharjoko' },
      { initials: 'WD', role: 'SEKRETARIS', name: 'Wawan Dwi Nugroho' },
      { initials: 'AP', role: 'WAKIL SEKRETARIS', name: 'Aditya Pratama Istawar' },
      { initials: 'AH', role: 'BENDAHARA', name: 'Ardi Hartono' },
    ],
    contactTitle: 'Ingin berkontribusi sebagai jamaah aktif?',
    contactDescription: 'Hubungi pengurus takmir untuk informasi keanggotaan, donasi, atau usulan kegiatan.',
  },
  programs: [
    { title: 'Masjid Inklusi', icon: 'heart', description: 'Lingkungan ibadah yang ramah anak, difabel, dan lansia, terintegrasi dengan fasilitas PAUD dan TPA.' },
    { title: 'Usaha Kesehatan', icon: 'health', description: 'Layanan pemeriksaan kesehatan rutin dan gratis bagi jamaah (tensi, gula darah, kolesterol) bersama tenaga medis.' },
    { title: 'Usaha Ekonomi', icon: 'economy', description: 'Mendorong kemandirian jamaah melalui tabungan majelis taklim, infaq modal UMKM, & penyelenggaraan pasar murah.' },
  ],
}
