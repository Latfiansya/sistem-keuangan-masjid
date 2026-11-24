import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export const adminDonationQrisAccept = '.png,.jpg,.jpeg'
export const adminDonationQrisMaxBytes = 2 * 1024 * 1024

function normalizeAdminDonationValues(data) {
  const firstBank = Array.isArray(data.bankAccounts) ? data.bankAccounts[0] : null
  const secondBank = Array.isArray(data.bankAccounts) ? data.bankAccounts[1] : null
  return {
    ...data,
    bankName: String(data.bankName ?? firstBank?.bankName ?? firstBank?.name ?? ''),
    accountNumber: String(data.accountNumber ?? firstBank?.accountNumber ?? firstBank?.number ?? ''),
    accountName: String(data.accountName ?? firstBank?.accountName ?? firstBank?.recipient ?? ''),
    bankName2: String(data.bankName2 ?? secondBank?.bankName ?? secondBank?.name ?? ''),
    accountNumber2: String(data.accountNumber2 ?? secondBank?.accountNumber ?? secondBank?.number ?? ''),
    accountName2: String(data.accountName2 ?? secondBank?.accountName ?? secondBank?.recipient ?? ''),
  }
}

export async function getAdminDonationSettings({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/donation-settings', { signal })
    if (!data || typeof data !== 'object') {
      throw new Error('Format pengaturan donasi API tidak sesuai kontrak.')
    }
    return normalizeAdminDonationValues(data)
  }
  const donation = mockPublicContent.contact.donation
  const bank1 = donation.banks?.[0] ?? donation.bank
  const bank2 = donation.banks?.[1] ?? donation.bank2
  return {
    qrisFile: null, qrisEnabled: false,
    bankName: bank1?.verified ? bank1.name || '' : '',
    accountNumber: bank1?.verified ? bank1.number || '' : '',
    accountName: bank1?.verified ? bank1.recipient || '' : '',
    bankName2: bank2?.verified ? bank2.name || '' : '',
    accountNumber2: bank2?.verified ? bank2.number || '' : '',
    accountName2: bank2?.verified ? bank2.recipient || '' : '',
    bankEnabled: false,
    whatsappNumber: '', whatsappEnabled: false,
    messageTemplate: 'Assalamu’alaikum Takmir Masjid Al-Hidayah, saya ingin mengonfirmasi donasi.\nNama: [Nama donatur];\nNomor WhatsApp: [Nomor WhatsApp];\nTanggal donasi: [Tanggal];\nNominal: [Nominal];\nMetode pembayaran: [Metode pembayaran];\nTerima kasih.',
    donationNote: 'Periksa nama penerima sebelum transfer dan simpan bukti donasi.',
  }
}

export async function saveAdminDonationSettings(values, { signal } = {}) {
  if (dataSource === 'mock') return normalizeAdminDonationSettings(values)
  const saved = await apiRequest('/admin/donation-settings', {
    method: 'PUT',
    body: {
      bankName: values.bankName || '',
      accountNumber: values.accountNumber || '',
      accountName: values.accountName || '',
      bankName2: values.bankName2 || '',
      accountNumber2: values.accountNumber2 || '',
      accountName2: values.accountName2 || '',
      qrisEnabled: values.qrisEnabled === true,
      bankEnabled: values.bankEnabled === true,
      whatsappNumber: values.whatsappNumber || '',
      whatsappEnabled: values.whatsappEnabled === true,
      messageTemplate: values.messageTemplate || '',
      donationNote: values.donationNote || '',
    },
    signal,
  })
  const bank2SupportedByBackend =
    Boolean(saved && typeof saved === 'object' && ('bankName2' in saved || Array.isArray(saved.bankAccounts)))
  const merged = normalizeAdminDonationValues({
    ...saved,
    ...(bank2SupportedByBackend
      ? {}
      : {
          bankName2: values.bankName2 || '',
          accountNumber2: values.accountNumber2 || '',
          accountName2: values.accountName2 || '',
        }),
  })
  return {
    ...normalizeAdminDonationSettings(merged),
    bank2BackendSupported: bank2SupportedByBackend,
  }
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
  for (const [key, label, limit] of [
    ['bankName', 'Nama bank', 100],
    ['accountName', 'Atas nama', 160],
    ['bankName2', 'Nama bank rekening 2', 100],
    ['accountName2', 'Atas nama rekening 2', 160],
    ['messageTemplate', 'Template pesan', 2000],
    ['donationNote', 'Catatan donasi', 1000],
  ]) {
    const value = String(values?.[key] ?? '')
    if (value.length > limit || [...value].some((character) => {
      const code = character.codePointAt(0)
      return code === 127 || (code < 32 && !(['messageTemplate', 'donationNote'].includes(key) && [9, 10, 13].includes(code)))
    })) errors[key] = `${label} tidak valid atau melebihi ${limit} karakter.`
  }
  const accountNumber = String(values?.accountNumber ?? '').trim()
  if (accountNumber && !/^\d{1,40}$/.test(accountNumber)) {
    errors.accountNumber = 'Nomor rekening harus berisi 1–40 digit, tanpa spasi atau tanda baca.'
  }
  const accountNumber2 = String(values?.accountNumber2 ?? '').trim()
  if (accountNumber2 && !/^\d{1,40}$/.test(accountNumber2)) {
    errors.accountNumber2 = 'Nomor rekening harus berisi 1–40 digit, tanpa spasi atau tanda baca.'
  }
  const bank2Name = String(values?.bankName2 ?? '').trim()
  const bank2Recipient = String(values?.accountName2 ?? '').trim()
  if (bank2Name || accountNumber2 || bank2Recipient) {
    if (!bank2Name && !errors.bankName2) errors.bankName2 = 'Nama bank rekening 2 wajib diisi jika rekening 2 digunakan.'
    if (!accountNumber2 && !errors.accountNumber2) errors.accountNumber2 = 'Nomor rekening 2 wajib diisi jika rekening 2 digunakan.'
    if (!bank2Recipient && !errors.accountName2) errors.accountName2 = 'Atas nama rekening 2 wajib diisi jika rekening 2 digunakan.'
  }
  const whatsappNumber = String(values?.whatsappNumber ?? '').trim()
  if (whatsappNumber && !/^[1-9]\d{7,14}$/.test(whatsappNumber)) {
    errors.whatsappNumber = 'Gunakan nomor internasional 8–15 digit, tanpa +, spasi atau tanda baca; misalnya berawalan 628.'
  }
  return errors
}

export function getAdminDonationReadiness(values) {
  const errors = validateAdminDonationSettings(values)
  const qrisComplete = Boolean(values?.qrisFile)
  const bank1Name = String(values?.bankName ?? '').trim()
  const bank1Number = String(values?.accountNumber ?? '').trim()
  const bank1Recipient = String(values?.accountName ?? '').trim()
  const bank1Complete = Boolean(bank1Name && bank1Number && bank1Recipient && !errors.bankName && !errors.accountNumber && !errors.accountName)

  const bank2Name = String(values?.bankName2 ?? '').trim()
  const bank2Number = String(values?.accountNumber2 ?? '').trim()
  const bank2Recipient = String(values?.accountName2 ?? '').trim()
  const bank2Empty = !bank2Name && !bank2Number && !bank2Recipient
  const bank2Complete = Boolean(bank2Name && bank2Number && bank2Recipient && !errors.bankName2 && !errors.accountNumber2 && !errors.accountName2)
  const bank2Partial = !bank2Empty && !bank2Complete

  const bankComplete = bank1Complete && (bank2Empty || bank2Complete)
  const accounts = bankComplete
    ? [
        { name: bank1Name, number: bank1Number, recipient: bank1Recipient },
        ...(bank2Complete ? [{ name: bank2Name, number: bank2Number, recipient: bank2Recipient }] : []),
      ]
    : []

  const whatsappComplete = Boolean(String(values?.whatsappNumber ?? '').trim() && String(values?.messageTemplate ?? '').trim() && !errors.whatsappNumber && !errors.messageTemplate)
  const method = (complete, enabled, missing, readyReason, draftReason) => ({
    complete,
    enabled: complete && enabled === true,
    reason: !complete
      ? missing
      : enabled
        ? (readyReason || 'Siap ditampilkan dalam pratinjau simulasi.')
        : (draftReason || 'Data lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.'),
  })
  const qris = method(qrisComplete, values?.qrisEnabled, 'Gambar QRIS belum tersedia. Unggah gambar valid, lalu aktifkan visibilitas QRIS.')
  const bankMissing = bank1Complete && bank2Partial
    ? 'Rekening 2 baru diisi sebagian. Lengkapi ketiga kolom Rekening 2 atau kosongkan seluruhnya.'
    : 'Lengkapi Nama Bank, Nomor Rekening yang valid, dan Atas Nama pada Rekening 1 sebelum mengaktifkan transfer bank.'
  const bankReady = accounts.length === 2
    ? '2 rekening siap ditampilkan dalam pratinjau simulasi.'
    : '1 rekening siap ditampilkan dalam pratinjau simulasi.'
  const bankDraft = accounts.length === 2
    ? '2 rekening lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.'
    : 'Data lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.'
  const bank = {
    ...method(bankComplete, values?.bankEnabled, bankMissing, bankReady, bankDraft),
    accounts,
    accountCount: accounts.length,
    bank2Partial,
  }
  const whatsapp = method(whatsappComplete, values?.whatsappEnabled, 'Lengkapi nomor WhatsApp internasional yang valid dan template pesan konfirmasi.')
  return { qris, bank, whatsapp, paymentReadyCount: Number(qris.enabled) + Number(bank.enabled) }
}

export function normalizeAdminDonationSettings(values) {
  const readiness = getAdminDonationReadiness(values)
  return { ...values, qrisEnabled: readiness.qris.enabled, bankEnabled: readiness.bank.enabled, whatsappEnabled: readiness.whatsapp.enabled }
}
