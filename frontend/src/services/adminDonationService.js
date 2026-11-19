import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export const adminDonationQrisAccept = '.png,.jpg,.jpeg'
export const adminDonationQrisMaxBytes = 2 * 1024 * 1024

export async function getAdminDonationSettings({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/donation-settings', { signal })
    if (!data || typeof data !== 'object') {
      throw new Error('Format pengaturan donasi API tidak sesuai kontrak.')
    }
    return data
  }
  const bank = mockPublicContent.contact.donation.bank
  return {
    qrisFile: null, qrisEnabled: false,
    bankName: bank.verified ? bank.name || '' : '',
    accountNumber: bank.verified ? bank.number || '' : '',
    accountName: bank.verified ? bank.recipient || '' : '', bankEnabled: false,
    whatsappNumber: '', whatsappEnabled: false,
    messageTemplate: 'Assalamu’alaikum Takmir Masjid Al-Hidayah, saya ingin mengonfirmasi donasi.\nNama: [Nama donatur];\nNomor WhatsApp: [Nomor WhatsApp];\nTanggal donasi: [Tanggal];\nNominal: [Nominal];\nMetode pembayaran: [Metode pembayaran];\nTerima kasih.',
    donationNote: 'Periksa nama penerima sebelum transfer dan simpan bukti donasi.',
  }
}

export async function saveAdminDonationSettings(values, { signal } = {}) {
  if (dataSource === 'mock') return normalizeAdminDonationSettings(values)
  return apiRequest('/admin/donation-settings', {
    method: 'PUT',
    body: {
      bankName: values.bankName || '',
      accountNumber: values.accountNumber || '',
      accountName: values.accountName || '',
      qrisEnabled: values.qrisEnabled === true,
      bankEnabled: values.bankEnabled === true,
      whatsappNumber: values.whatsappNumber || '',
      whatsappEnabled: values.whatsappEnabled === true,
      messageTemplate: values.messageTemplate || '',
      donationNote: values.donationNote || '',
    },
    signal,
  })
}

export function validateAdminDonationQris(files) {
  if (files.length !== 1) return 'Pilih tepat satu gambar QRIS.'
  const file = files[0]
  const extension = file.name.match(/\.(png|jpe?g)$/i)?.[1].toLowerCase()
  const types = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }
  if (!Object.hasOwn(types, extension) || file.type !== types[extension]) return 'Gambar QRIS harus PNG atau JPG dengan tipe berkas yang sesuai.'
  if (!file.size) return 'Berkas gambar kosong. Pilih gambar lain.'
  if (file.size > adminDonationQrisMaxBytes) return 'Ukuran gambar QRIS maksimal 2 MB.'
  return ''
}

// Pemeriksaan awal lokal. Backend wajib memeriksa ulang isi, tipe, ukuran dan jumlah berkas.
export async function readAdminDonationQris(files) {
  const error = validateAdminDonationQris(files)
  if (error) throw new Error(error)
  const header = new Uint8Array(await files[0].slice(0, 8).arrayBuffer())
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte)
  const jpeg = header[0] === 255 && header[1] === 216 && header[2] === 255
  if (!(files[0].type === 'image/png' ? png : jpeg)) throw new Error('Isi gambar QRIS tidak sesuai dengan format PNG atau JPG yang dipilih.')
  const url = URL.createObjectURL(files[0])
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Gambar kosong.')
    return files[0]
  } catch { throw new Error('Gambar QRIS rusak atau tidak dapat dibaca. Pilih PNG atau JPG yang valid.') }
  finally { URL.revokeObjectURL(url) }
}

export function validateAdminDonationSettings(values) {
  const errors = {}
  for (const [key, label, limit] of [['bankName', 'Nama bank', 100], ['accountName', 'Atas nama', 160], ['messageTemplate', 'Template pesan', 2000], ['donationNote', 'Catatan donasi', 1000]]) {
    const value = values[key]
    if (value.length > limit || [...value].some((character) => {
      const code = character.codePointAt(0)
      return code === 127 || (code < 32 && !(['messageTemplate', 'donationNote'].includes(key) && [9, 10, 13].includes(code)))
    })) errors[key] = `${label} tidak valid atau melebihi ${limit} karakter.`
  }
  if (values.accountNumber.trim() && !/^\d{1,40}$/.test(values.accountNumber.trim())) errors.accountNumber = 'Nomor rekening harus berisi 1–40 digit, tanpa spasi atau tanda baca.'
  if (values.whatsappNumber.trim() && !/^[1-9]\d{7,14}$/.test(values.whatsappNumber.trim())) errors.whatsappNumber = 'Gunakan nomor internasional 8–15 digit, tanpa +, spasi atau tanda baca; misalnya berawalan 628.'
  return errors
}

export function getAdminDonationReadiness(values) {
  const errors = validateAdminDonationSettings(values)
  const qrisComplete = Boolean(values.qrisFile)
  const bankComplete = Boolean(values.bankName.trim() && values.accountNumber.trim() && values.accountName.trim() && !errors.bankName && !errors.accountNumber && !errors.accountName)
  const whatsappComplete = Boolean(values.whatsappNumber.trim() && values.messageTemplate.trim() && !errors.whatsappNumber && !errors.messageTemplate)
  const method = (complete, enabled, missing) => ({ complete, enabled: complete && enabled === true, reason: !complete ? missing : enabled ? 'Siap ditampilkan dalam pratinjau simulasi.' : 'Data lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.' })
  const qris = method(qrisComplete, values.qrisEnabled, 'Gambar QRIS belum tersedia. Unggah gambar valid, lalu aktifkan visibilitas QRIS.')
  const bank = method(bankComplete, values.bankEnabled, 'Lengkapi Nama Bank, Nomor Rekening yang valid, dan Atas Nama sebelum mengaktifkan transfer bank.')
  const whatsapp = method(whatsappComplete, values.whatsappEnabled, 'Lengkapi nomor WhatsApp internasional yang valid dan template pesan konfirmasi.')
  return { qris, bank, whatsapp, paymentReadyCount: Number(qris.enabled) + Number(bank.enabled) }
}

export function normalizeAdminDonationSettings(values) {
  const readiness = getAdminDonationReadiness(values)
  return { ...values, qrisEnabled: readiness.qris.enabled, bankEnabled: readiness.bank.enabled, whatsappEnabled: readiness.whatsapp.enabled }
}
