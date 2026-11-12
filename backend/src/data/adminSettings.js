import { getPublicContentData } from './publicContent.js'

// Data awal profil masjid, pengaturan donasi, dan pengaturan website pengurus.
export function getInitialAdminSettingsState() {
  const publicContent = getPublicContentData()
  const phone = publicContent.contact?.information?.find((item) => item.id === 'phone')
  const bank = publicContent.contact?.donation?.bank
  const location = publicContent.contact?.location

  return {
    profile: {
      name: publicContent.name,
      description: publicContent.heroDescription,
      address: publicContent.address,
      contact: phone?.verified && typeof phone.value === 'string' ? phone.value : '',
    },
    donationSettings: {
      qrisFile: null,
      qrisEnabled: false,
      bankName: bank?.verified ? bank.name || '' : '',
      accountNumber: bank?.verified ? bank.number || '' : '',
      accountName: bank?.verified ? bank.recipient || '' : '',
      bankEnabled: false,
      whatsappNumber: '',
      whatsappEnabled: false,
      messageTemplate:
        'Assalamu’alaikum Takmir Masjid Al-Hidayah, saya ingin mengonfirmasi donasi.\nNama: [Nama donatur];\nNomor WhatsApp: [Nomor WhatsApp];\nTanggal donasi: [Tanggal];\nNominal: [Nominal];\nMetode pembayaran: [Metode pembayaran];\nTerima kasih.',
      donationNote: 'Periksa nama penerima sebelum transfer dan simpan bukti donasi.',
    },
    websiteSettings: {
      whatsapp: '',
      email: '',
      address: publicContent.address,
      mapsUrl: location?.verified ? location.url || '' : '',
      publicReportEnabled: true,
    },
  }
}

