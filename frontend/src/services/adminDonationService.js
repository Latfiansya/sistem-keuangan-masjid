import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export const adminDonationQrisAccept = '.png,.jpg,.jpeg'
export const adminDonationQrisMaxBytes = 2 * 1024 * 1024
export const MAX_DONATION_BANKS = 4

export function getBankSlotFieldKey(slotIndex, baseKey) {
  return slotIndex === 0 ? baseKey : `${baseKey}${slotIndex + 1}`
}

function emptyBankSlot(id = null) {
  return { id, bankName: '', accountNumber: '', accountName: '' }
}

function mapRawBankEntry(item) {
  return {
    id: item?.id ? String(item.id) : null,
    bankName: String(item?.bankName ?? item?.name ?? ''),
    accountNumber: String(item?.accountNumber ?? item?.number ?? ''),
    accountName: String(item?.accountName ?? item?.recipient ?? ''),
  }
}

export function getDonationBankSlots(values) {
  const fromArray = Array.isArray(values?.bankAccounts)
    ? values.bankAccounts.map(mapRawBankEntry)
    : []

  const hasLegacy0 = values && ('bankName' in values || 'accountNumber' in values || 'accountName' in values)
  const hasLegacy1 = values && ('bankName2' in values || 'accountNumber2' in values || 'accountName2' in values)

  const slot0 = hasLegacy0
    ? {
        id: fromArray[0]?.id ?? null,
        bankName: String(values.bankName ?? ''),
        accountNumber: String(values.accountNumber ?? ''),
        accountName: String(values.accountName ?? ''),
      }
    : (fromArray[0] ?? emptyBankSlot())

  const slot1 = hasLegacy1
    ? {
        id: fromArray[1]?.id ?? null,
        bankName: String(values.bankName2 ?? ''),
        accountNumber: String(values.accountNumber2 ?? ''),
        accountName: String(values.accountName2 ?? ''),
      }
    : (fromArray[1] ?? null)

  const slots = [slot0]
  if (slot1 && (fromArray.length >= 2 || slot1.bankName || slot1.accountNumber || slot1.accountName)) {
    slots.push(slot1)
  }
  for (let index = 2; index < fromArray.length; index += 1) {
    slots.push(fromArray[index])
  }

  return slots
}

export function withUpdatedDonationBankSlots(values, rawSlots) {
  const slots = rawSlots.map(mapRawBankEntry)
  const first = slots[0] ?? emptyBankSlot()
  const second = slots[1] ?? emptyBankSlot()
  return {
    ...values,
    bankAccounts: slots,
    bankName: first.bankName,
    accountNumber: first.accountNumber,
    accountName: first.accountName,
    bankName2: second.bankName,
    accountNumber2: second.accountNumber,
    accountName2: second.accountName,
  }
}

export function normalizeDonationReadinessReason(reason) {
  if (typeof reason !== 'string' || !reason) return reason
  return reason
    .replace(/^Siap ditampilkan dalam pratinjau simulasi\.$/i, 'Aktif dan siap ditampilkan pada halaman Kontak.')
    .replace(/^(\d+)\s+rekening siap ditampilkan dalam pratinjau simulasi\.$/i, '$1 rekening aktif dan siap ditampilkan pada halaman Kontak.')
    .replace(/dalam pratinjau simulasi/gi, 'pada halaman Kontak')
    .replace(/pratinjau simulasi/gi, 'halaman Kontak')
}

export function sanitizeAdminDonationReadiness(readiness) {
  if (!readiness || typeof readiness !== 'object') return readiness
  const next = { ...readiness }
  for (const key of ['qris', 'bank', 'whatsapp']) {
    if (next[key] && typeof next[key] === 'object' && typeof next[key].reason === 'string') {
      next[key] = { ...next[key], reason: normalizeDonationReadinessReason(next[key].reason) }
    }
  }
  return next
}

function normalizeAdminDonationValues(data) {
  const rawAccounts = Array.isArray(data?.bankAccounts) ? data.bankAccounts.map(mapRawBankEntry) : []
  const slots = rawAccounts.length
    ? rawAccounts
    : [
        ...(data?.bankName || data?.accountNumber || data?.accountName
          ? [{
              id: null,
              bankName: String(data.bankName ?? ''),
              accountNumber: String(data.accountNumber ?? ''),
              accountName: String(data.accountName ?? ''),
            }]
          : []),
        ...(data?.bankName2 || data?.accountNumber2 || data?.accountName2
          ? [{
              id: null,
              bankName: String(data.bankName2 ?? ''),
              accountNumber: String(data.accountNumber2 ?? ''),
              accountName: String(data.accountName2 ?? ''),
            }]
          : []),
      ]
  const first = slots[0] ?? emptyBankSlot()
  const second = slots[1] ?? emptyBankSlot()
  return {
    ...data,
    ...(data?.readiness ? { readiness: sanitizeAdminDonationReadiness(data.readiness) } : {}),
    bankAccounts: slots.slice(0, MAX_DONATION_BANKS),
    bankName: String(data?.bankName ?? first.bankName),
    accountNumber: String(data?.accountNumber ?? first.accountNumber),
    accountName: String(data?.accountName ?? first.accountName),
    bankName2: String(data?.bankName2 ?? second.bankName),
    accountNumber2: String(data?.accountNumber2 ?? second.accountNumber),
    accountName2: String(data?.accountName2 ?? second.accountName),
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
  const mockBanks = Array.isArray(donation.banks) && donation.banks.length
    ? donation.banks
    : [donation.bank, donation.bank2].filter(Boolean)
  const verifiedMock = mockBanks
    .filter((entry) => entry?.verified)
    .slice(0, MAX_DONATION_BANKS)
    .map((entry) => ({
      id: null,
      bankName: entry.name || '',
      accountNumber: entry.number || '',
      accountName: entry.recipient || '',
    }))
  return normalizeAdminDonationValues({
    qrisFile: null,
    qrisEnabled: false,
    bankAccounts: verifiedMock,
    bankEnabled: false,
    whatsappNumber: '',
    whatsappEnabled: false,
    messageTemplate: 'Assalamu’alaikum Takmir Masjid Al-Hidayah, saya ingin mengonfirmasi donasi.\nNama: [Nama donatur];\nNomor WhatsApp: [Nomor WhatsApp];\nTanggal donasi: [Tanggal];\nNominal: [Nominal];\nMetode pembayaran: [Metode pembayaran];\nTerima kasih.',
    donationNote: 'Periksa nama penerima sebelum transfer dan simpan bukti donasi.',
  })
}

export async function saveAdminDonationSettings(values, { signal } = {}) {
  if (dataSource === 'mock') return normalizeAdminDonationSettings(values)
  const slots = getDonationBankSlots(values)
    .slice(0, MAX_DONATION_BANKS)
    .map((slot) => ({
      id: slot.id ?? null,
      bankName: slot.bankName.trim(),
      accountNumber: slot.accountNumber.trim(),
      accountName: slot.accountName.trim(),
    }))
    .filter((slot) => slot.bankName || slot.accountNumber || slot.accountName)

  const first = slots[0] ?? emptyBankSlot()
  const second = slots[1] ?? emptyBankSlot()

  const saved = await apiRequest('/admin/donation-settings', {
    method: 'PUT',
    body: {
      bankAccounts: slots,
      bankName: first.bankName,
      accountNumber: first.accountNumber,
      accountName: first.accountName,
      bankName2: second.bankName,
      accountNumber2: second.accountNumber,
      accountName2: second.accountName,
      qrisEnabled: values.qrisEnabled === true,
      bankEnabled: values.bankEnabled === true,
      whatsappNumber: values.whatsappNumber || '',
      whatsappEnabled: values.whatsappEnabled === true,
      messageTemplate: values.messageTemplate || '',
      donationNote: values.donationNote || '',
    },
    signal,
  })
  const multiBankSupported = Boolean(saved && typeof saved === 'object' && Array.isArray(saved.bankAccounts))
  const bank2Supported = Boolean(multiBankSupported || (saved && typeof saved === 'object' && 'bankName2' in saved))
  const merged = normalizeAdminDonationValues({
    ...saved,
    ...(multiBankSupported ? {} : { bankAccounts: slots }),
    ...(bank2Supported
      ? {}
      : {
          bankName2: second.bankName,
          accountNumber2: second.accountNumber,
          accountName2: second.accountName,
        }),
  })
  return {
    ...normalizeAdminDonationSettings(merged),
    bank2BackendSupported: bank2Supported,
    multiBankBackendSupported: multiBankSupported,
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

function hasForbiddenControlChars(text, allowMultiline = false) {
  return [...text].some((character) => {
    const code = character.codePointAt(0)
    return code === 127 || (code < 32 && !(allowMultiline && [9, 10, 13].includes(code)))
  })
}

export function validateAdminDonationSettings(values) {
  const errors = {}
  const slots = getDonationBankSlots(values)

  if (slots.length > MAX_DONATION_BANKS) {
    errors.bankAccountsLimit = `Maksimal ${MAX_DONATION_BANKS} rekening donasi. Hapus salah satu rekening terlebih dahulu.`
  }

  for (let index = 0; index < Math.min(slots.length, MAX_DONATION_BANKS); index += 1) {
    const slot = slots[index]
    const slotSuffix = index === 0 ? '' : ` rekening ${index + 1}`
    const bankKey = getBankSlotFieldKey(index, 'bankName')
    const numberKey = getBankSlotFieldKey(index, 'accountNumber')
    const recipientKey = getBankSlotFieldKey(index, 'accountName')

    if (slot.bankName.length > 100 || hasForbiddenControlChars(slot.bankName, false)) {
      errors[bankKey] = `Nama bank${slotSuffix} tidak valid atau melebihi 100 karakter.`
    }
    if (slot.accountName.length > 160 || hasForbiddenControlChars(slot.accountName, false)) {
      errors[recipientKey] = `Atas nama${slotSuffix} tidak valid atau melebihi 160 karakter.`
    }
    const numberTrimmed = slot.accountNumber.trim()
    if (numberTrimmed && !/^\d{1,40}$/.test(numberTrimmed)) {
      errors[numberKey] = 'Nomor rekening harus berisi 1–40 digit, tanpa spasi atau tanda baca.'
    }

    // Rekening 2..4 (atau slot mana pun saat ada slot lain diisi) wajib 3 kolom jika diisi sebagian.
    const hasPartialExtra =
      (index > 0 || slots.length > 1) &&
      (slot.bankName.trim() || numberTrimmed || slot.accountName.trim())
    if (hasPartialExtra) {
      const labelNum = `rekening ${index + 1}`
      if (!slot.bankName.trim() && !errors[bankKey]) {
        errors[bankKey] = `Nama bank ${labelNum} wajib diisi jika ${labelNum} digunakan.`
      }
      if (!numberTrimmed && !errors[numberKey]) {
        errors[numberKey] = `Nomor ${labelNum} wajib diisi jika ${labelNum} digunakan.`
      }
      if (!slot.accountName.trim() && !errors[recipientKey]) {
        errors[recipientKey] = `Atas nama ${labelNum} wajib diisi jika ${labelNum} digunakan.`
      }
    }
  }

  for (const [key, label, limit] of [
    ['messageTemplate', 'Template pesan', 2000],
    ['donationNote', 'Catatan donasi', 1000],
  ]) {
    const value = String(values?.[key] ?? '')
    if (value.length > limit || hasForbiddenControlChars(value, true)) {
      errors[key] = `${label} tidak valid atau melebihi ${limit} karakter.`
    }
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
  const slots = getDonationBankSlots(values)

  const slotStatuses = slots.slice(0, MAX_DONATION_BANKS).map((slot, index) => {
    const name = slot.bankName.trim()
    const number = slot.accountNumber.trim()
    const recipient = slot.accountName.trim()
    const empty = !name && !number && !recipient
    const bankKey = getBankSlotFieldKey(index, 'bankName')
    const numberKey = getBankSlotFieldKey(index, 'accountNumber')
    const recipientKey = getBankSlotFieldKey(index, 'accountName')
    const complete = Boolean(name && number && recipient && !errors[bankKey] && !errors[numberKey] && !errors[recipientKey])
    return { index, name, number, recipient, empty, complete, partial: !empty && !complete }
  })

  const slot1 = slotStatuses[0]
  const partialExtraSlots = slotStatuses.slice(1).filter((slot) => slot.partial)
  const bank2Partial = partialExtraSlots.some((slot) => slot.index === 1)
  const hasAnyPartialSlot = !slot1?.complete || partialExtraSlots.length > 0
  const overLimit = slots.length > MAX_DONATION_BANKS

  const accounts = !hasAnyPartialSlot && !overLimit
    ? slotStatuses.filter((slot) => slot.complete).map(({ name, number, recipient }) => ({ name, number, recipient }))
    : []
  const bankComplete = accounts.length > 0

  const whatsappComplete = Boolean(String(values?.whatsappNumber ?? '').trim() && String(values?.messageTemplate ?? '').trim() && !errors.whatsappNumber && !errors.messageTemplate)
  const method = (complete, enabled, missing, readyReason, draftReason) => ({
    complete,
    enabled: complete && enabled === true,
    reason: !complete
      ? missing
      : enabled
        ? (readyReason || 'Aktif dan siap ditampilkan pada halaman Kontak.')
        : (draftReason || 'Data lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.'),
  })
  const qris = method(qrisComplete, values?.qrisEnabled, 'Gambar QRIS belum tersedia. Unggah gambar valid, lalu aktifkan visibilitas QRIS.')
  const bankMissing = overLimit
    ? `Maksimal ${MAX_DONATION_BANKS} rekening donasi. Hapus salah satu rekening terlebih dahulu.`
    : slot1?.complete && partialExtraSlots.length > 0
      ? `Rekening ${partialExtraSlots[0].index + 1} baru diisi sebagian. Lengkapi ketiga kolomnya atau hapus/kosongkan slot tersebut.`
      : 'Lengkapi Nama Bank, Nomor Rekening yang valid, dan Atas Nama pada Rekening 1 sebelum mengaktifkan transfer bank.'
  const bankReady = `${accounts.length} rekening aktif dan siap ditampilkan pada halaman Kontak.`
  const bankDraft = accounts.length > 1
    ? `${accounts.length} rekening lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.`
    : 'Data lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.'
  const bank = {
    ...method(bankComplete, values?.bankEnabled, bankMissing, bankReady, bankDraft),
    accounts,
    accountCount: accounts.length,
    maxAccounts: MAX_DONATION_BANKS,
    bank2Partial,
    hasPartialSlot: partialExtraSlots.length > 0,
    partialSlotNumbers: partialExtraSlots.map((slot) => slot.index + 1),
  }
  const whatsapp = method(whatsappComplete, values?.whatsappEnabled, 'Lengkapi nomor WhatsApp internasional yang valid dan template pesan konfirmasi.')
  return { qris, bank, whatsapp, paymentReadyCount: Number(qris.enabled) + Number(bank.enabled) }
}

export function normalizeAdminDonationSettings(values) {
  const readiness = getAdminDonationReadiness(values)
  return { ...values, qrisEnabled: readiness.qris.enabled, bankEnabled: readiness.bank.enabled, whatsappEnabled: readiness.whatsapp.enabled }
}
