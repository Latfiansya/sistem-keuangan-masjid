import { defaultAdminSettingsRepository } from '../repositories/adminSettingsRepository.js'
import { MAX_DONATION_BANKS } from '../repositories/donationBankRepository.js'
import { createHttpError } from '../utils/httpError.js'
import { isValidGoogleMapsUrl } from '../utils/mapsLocation.js'
import { hasControlChars } from '../utils/textValidation.js'

const AGENDA_FREQUENCY_MAP = new Map([
  ['weekly', { groupId: 'weekly', dbValue: 'Mingguan' }],
  ['mingguan', { groupId: 'weekly', dbValue: 'Mingguan' }],
  ['monthly', { groupId: 'monthly', dbValue: 'Bulanan' }],
  ['bulanan', { groupId: 'monthly', dbValue: 'Bulanan' }],
  ['yearly', { groupId: 'yearly', dbValue: 'Tahunan' }],
  ['tahunan', { groupId: 'yearly', dbValue: 'Tahunan' }],
])

function validateAgendaPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Payload agenda tidak valid.')
  }

  if (typeof payload.name !== 'string' || !payload.name.trim()) {
    throw createHttpError(400, 'BAD_REQUEST', 'Nama kegiatan agenda wajib diisi.')
  }
  const name = payload.name.trim()
  if (name.length > 150 || hasControlChars(payload.name, false)) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      'Nama kegiatan tidak boleh mengandung karakter kontrol atau melebihi 150 karakter.'
    )
  }

  const rawFreq = typeof (payload.frequency ?? payload.groupId) === 'string'
    ? (payload.frequency ?? payload.groupId).trim().toLowerCase()
    : ''
  const mappedFreq = AGENDA_FREQUENCY_MAP.get(rawFreq)
  if (!mappedFreq) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      'Frekuensi agenda harus weekly (Mingguan), monthly (Bulanan), atau yearly (Tahunan).'
    )
  }

  if (typeof payload.schedule !== 'string' || !payload.schedule.trim()) {
    throw createHttpError(400, 'BAD_REQUEST', 'Waktu pelaksanaan agenda wajib diisi.')
  }
  const schedule = payload.schedule.trim()
  if (schedule.length > 150 || hasControlChars(payload.schedule, false)) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      'Waktu pelaksanaan tidak boleh mengandung karakter kontrol atau melebihi 150 karakter.'
    )
  }

  const description = payload.description ?? ''
  if (typeof description !== 'string' || description.length > 1000 || hasControlChars(description, true)) {
    throw createHttpError(400, 'BAD_REQUEST', 'Keterangan agenda tidak valid atau melebihi 1000 karakter.')
  }

  const order = payload.order ?? 0
  if (!Number.isInteger(order) || order < 0 || order > 32767) {
    throw createHttpError(400, 'BAD_REQUEST', 'Urutan agenda harus berupa bilangan bulat 0–32767.')
  }

  const active = payload.active ?? true
  if (typeof active !== 'boolean') {
    throw createHttpError(400, 'BAD_REQUEST', 'Status aktif agenda harus berupa boolean.')
  }

  return {
    name,
    groupId: mappedFreq.groupId,
    frekuensi: mappedFreq.dbValue,
    schedule,
    description: description.trim(),
    order,
    active,
  }
}

function isDuplicateAgendaItem(agendaData, { name, groupId }, excludeId = null) {
  const targetGroup = agendaData?.groups?.find((group) => group.id === groupId)
  if (!targetGroup || !Array.isArray(targetGroup.items)) return false
  const normalizedName = name.toLowerCase()
  return targetGroup.items.some(
    (item) =>
      String(item.id) !== String(excludeId ?? '') &&
      String(item.name || '').trim().toLowerCase() === normalizedName
  )
}

// Teks opsional: dikembalikan dalam bentuk ter-trim; kosong berarti dihapus dari database.
function validateOptionalText(value, label, max, allowMultiline = false) {
  const text = value ?? ''
  if (typeof text !== 'string' || text.trim().length > max || hasControlChars(text, allowMultiline)) {
    throw createHttpError(400, 'BAD_REQUEST', `${label} tidak valid atau melebihi ${max} karakter.`)
  }
  return text.trim()
}

// Bilangan bulat opsional: null atau string kosong berarti belum diisi.
function validateOptionalInteger(value, label, min, max) {
  if (value === null || value === undefined || value === '') return null
  if (!Number.isInteger(value) || value < min || value > max) {
    throw createHttpError(400, 'BAD_REQUEST', `${label} harus berupa bilangan bulat ${min}–${max}.`)
  }
  return value
}

function isValidPhoneFormat(phone) {
  return /^\+?[\d ().-]+$/.test(phone) && /^\d{8,15}$/.test(phone.replace(/\D/g, ''))
}

function getLegacyBankAccountsFromValues(values) {
  const slots = [
    {
      bankName: String(values?.bankName ?? '').trim(),
      accountNumber: String(values?.accountNumber ?? '').trim(),
      accountName: String(values?.accountName ?? '').trim(),
    },
    {
      bankName: String(values?.bankName2 ?? '').trim(),
      accountNumber: String(values?.accountNumber2 ?? '').trim(),
      accountName: String(values?.accountName2 ?? '').trim(),
    },
  ]
  return slots.filter((item) => item.bankName && item.accountNumber && item.accountName)
}

function getEffectiveBankAccounts(values) {
  if (Array.isArray(values?.bankAccounts)) {
    return values.bankAccounts
      .map((item) => ({
        id: item?.id ? String(item.id) : null,
        bankName: String(item?.bankName ?? '').trim(),
        accountNumber: String(item?.accountNumber ?? '').trim(),
        accountName: String(item?.accountName ?? '').trim(),
      }))
      .filter((item) => item.bankName && item.accountNumber && item.accountName)
      .slice(0, MAX_DONATION_BANKS)
  }
  return getLegacyBankAccountsFromValues(values).slice(0, MAX_DONATION_BANKS)
}

function syncLegacyBankFields(values, bankAccounts) {
  const first = bankAccounts[0] ?? { bankName: '', accountNumber: '', accountName: '' }
  const second = bankAccounts[1] ?? { bankName: '', accountNumber: '', accountName: '' }
  return {
    ...values,
    bankAccounts,
    bankName: first.bankName,
    accountNumber: first.accountNumber,
    accountName: first.accountName,
    bankName2: second.bankName,
    accountNumber2: second.accountNumber,
    accountName2: second.accountName,
  }
}

function validateBankAccountEntry(entry, index) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw createHttpError(400, 'BAD_REQUEST', `Data rekening ${index + 1} tidak valid.`)
  }
  const slotLabel = `rekening ${index + 1}`
  if (entry.bankName !== undefined && typeof entry.bankName !== 'string') {
    throw createHttpError(400, 'BAD_REQUEST', `Nama bank ${slotLabel} tidak valid.`)
  }
  if (entry.accountName !== undefined && typeof entry.accountName !== 'string') {
    throw createHttpError(400, 'BAD_REQUEST', `Atas nama ${slotLabel} tidak valid.`)
  }

  const rawBankName = String(entry.bankName ?? '')
  if (rawBankName.length > 100 || hasControlChars(rawBankName, false)) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      `Nama bank ${slotLabel} tidak valid atau melebihi 100 karakter.`
    )
  }
  const rawAccountName = String(entry.accountName ?? '')
  if (rawAccountName.length > 160 || hasControlChars(rawAccountName, false)) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      `Atas nama ${slotLabel} tidak valid atau melebihi 160 karakter.`
    )
  }

  const bankName = rawBankName.trim()
  const accountNumber =
    entry.accountNumber !== undefined
      ? validateAccountNumberField(entry.accountNumber, `Nomor ${slotLabel}`)
      : ''
  const accountName = rawAccountName.trim()

  const filledCount = [bankName, accountNumber, accountName].filter(Boolean).length
  if (filledCount === 0) return null
  if (filledCount < 3) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      `Lengkapi Nama Bank, Nomor Rekening, dan Atas Nama pada Rekening ${index + 1}.`
    )
  }

  return {
    id: entry.id ? String(entry.id) : null,
    bankName,
    accountNumber,
    accountName,
  }
}

function computeDonationReadiness(values) {
  const qrisComplete = Boolean(values.qrisFile)
  const effectiveAccounts = getEffectiveBankAccounts(values)
  const bank2Name = String(values.bankName2 ?? '').trim()
  const bank2Number = String(values.accountNumber2 ?? '').trim()
  const bank2Recipient = String(values.accountName2 ?? '').trim()
  const bank2Empty = !bank2Name && !bank2Number && !bank2Recipient
  const bank2Complete = Boolean(bank2Name && bank2Number && bank2Recipient)

  const bankComplete =
    effectiveAccounts.length > 0 &&
    (Array.isArray(values?.bankAccounts) || bank2Empty || bank2Complete)

  const accounts = bankComplete
    ? effectiveAccounts.map((acc) => ({
        name: acc.bankName,
        number: acc.accountNumber,
        recipient: acc.accountName,
      }))
    : []
  const whatsappComplete = Boolean(String(values.whatsappNumber ?? '').trim() && String(values.messageTemplate ?? '').trim())

  const buildMethodStatus = (complete, enabled, missingReason, readyReason = 'Aktif dan siap ditampilkan pada halaman Kontak.') => ({
    complete,
    enabled: complete && enabled === true,
    reason: !complete
      ? missingReason
      : enabled
        ? readyReason
        : 'Data lengkap. Aktifkan toggle untuk menampilkannya pada halaman Kontak.',
  })

  const qris = buildMethodStatus(
    qrisComplete,
    values.qrisEnabled,
    'Gambar QRIS belum tersedia. Unggah gambar valid, lalu aktifkan visibilitas QRIS.'
  )
  const bank = {
    ...buildMethodStatus(
      bankComplete,
      values.bankEnabled,
      'Lengkapi Nama Bank, Nomor Rekening yang valid, dan Atas Nama sebelum mengaktifkan transfer bank.',
      `${accounts.length} rekening aktif dan siap ditampilkan pada halaman Kontak.`
    ),
    accounts,
    accountCount: accounts.length,
    maxAccounts: MAX_DONATION_BANKS,
  }
  const whatsapp = buildMethodStatus(
    whatsappComplete,
    values.whatsappEnabled,
    'Lengkapi nomor WhatsApp internasional yang valid dan template pesan konfirmasi.'
  )

  return {
    qris,
    bank,
    whatsapp,
    paymentReadyCount: Number(qris.enabled) + Number(bank.enabled),
  }
}

function validateAccountNumberField(rawValue, label = 'Nomor rekening') {
  if (typeof rawValue !== 'string') {
    throw createHttpError(400, 'BAD_REQUEST', `${label} harus berupa string.`)
  }
  const trimmed = rawValue.trim()
  if (trimmed && !/^\d{1,40}$/.test(trimmed)) {
    throw createHttpError(
      400,
      'BAD_REQUEST',
      `${label} harus berisi 1–40 digit, tanpa spasi atau tanda baca.`
    )
  }
  return trimmed
}

// Business logic layer untuk profil masjid, agenda, donasi, dan pengaturan website pengurus.
export function createAdminSettingsService(repository = defaultAdminSettingsRepository) {
  return {
    async getProfile() {
      return repository.getProfile()
    },

    async updateProfile(payload, auditUserId = null) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload profil masjid tidak valid.')
      }

      if (typeof payload.name !== 'string' || !payload.name.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama masjid wajib diisi.')
      }
      if (payload.name.length > 150 || hasControlChars(payload.name, false)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Nama masjid tidak boleh mengandung karakter kontrol atau melebihi 150 karakter.'
        )
      }

      // Field yang tidak dikirim mempertahankan nilai tersimpan agar klien lama tetap aman.
      const current = await repository.getProfile()
      const pick = (key) => (payload[key] !== undefined ? payload[key] : current[key])

      const description = pick('description') ?? ''
      if (typeof description !== 'string' || description.length > 1000 || hasControlChars(description, true)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Deskripsi singkat tidak valid atau melebihi 1000 karakter.')
      }

      const address = pick('address') ?? ''
      if (typeof address !== 'string' || address.length > 255 || hasControlChars(address, true)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Alamat tidak valid atau melebihi 255 karakter.')
      }

      const contact = pick('contact') ?? ''
      if (typeof contact !== 'string' || contact.length > 20 || hasControlChars(contact, false)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Kontak tidak valid atau melebihi 20 karakter.')
      }
      const trimmedContact = contact.trim()
      if (trimmedContact && !isValidPhoneFormat(trimmedContact)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Masukkan nomor telepon dengan 8–15 digit; tanda + di awal, spasi, kurung, titik atau tanda hubung diperbolehkan.'
        )
      }

      return repository.saveProfile({
        name: payload.name.trim(),
        tagline: validateOptionalText(pick('tagline'), 'Tagline', 255, true),
        description: description.trim(),
        location: validateOptionalText(pick('location'), 'Lokasi', 100),
        foundedYear: validateOptionalInteger(pick('foundedYear'), 'Tahun berdiri', 1800, 2100),
        buildingArea: validateOptionalInteger(pick('buildingArea'), 'Luas bangunan', 0, 1000000),
        buildingAreaNote: validateOptionalText(pick('buildingAreaNote'), 'Keterangan luas', 255, true),
        capacity: validateOptionalInteger(pick('capacity'), 'Kapasitas jamaah', 0, 1000000),
        capacityNote: validateOptionalText(pick('capacityNote'), 'Keterangan kapasitas', 255, true),
        vision: validateOptionalText(pick('vision'), 'Visi', 255, true),
        managementPeriod: validateOptionalText(pick('managementPeriod'), 'Periode pengurus', 20),
        address: address.trim(),
        contact: trimmedContact,
      }, auditUserId)
    },

    async getAgenda() {
      const agenda = await repository.getAgenda()
      const groups = Array.isArray(agenda.groups) ? agenda.groups : []
      const countById = Object.fromEntries(
        groups.map((group) => [group.id, Array.isArray(group.items) ? group.items.length : 0])
      )
      const total = Object.values(countById).reduce((sum, count) => sum + count, 0)

      return {
        description: agenda.description,
        groups,
        counts: {
          total,
          weekly: countById.weekly ?? 0,
          monthly: countById.monthly ?? 0,
          yearly: countById.yearly ?? 0,
        },
      }
    },

    async createAgenda(payload, auditUserId = null) {
      const validated = validateAgendaPayload(payload)
      const currentAgenda = await repository.getAgenda()
      if (isDuplicateAgendaItem(currentAgenda, validated)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Agenda dengan nama dan frekuensi tersebut sudah terdaftar.')
      }
      return repository.insertAgenda(validated, auditUserId)
    },

    async updateAgenda(id, payload, auditUserId = null) {
      const existing = await repository.findAgendaById(id)
      if (!existing) {
        throw createHttpError(404, 'NOT_FOUND', 'Agenda tidak ditemukan.')
      }

      const validated = validateAgendaPayload(payload)
      const currentAgenda = await repository.getAgenda()
      if (isDuplicateAgendaItem(currentAgenda, validated, existing.id)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Agenda dengan nama dan frekuensi tersebut sudah terdaftar.')
      }

      const updated = await repository.updateAgendaById(id, validated, auditUserId)
      if (!updated) {
        throw createHttpError(404, 'NOT_FOUND', 'Agenda tidak ditemukan.')
      }
      return updated
    },

    async deleteAgenda(id, auditUserId = null) {
      const deleted = await repository.deleteAgendaById(id, auditUserId)
      if (!deleted) {
        throw createHttpError(404, 'NOT_FOUND', 'Agenda tidak ditemukan.')
      }
      return { deletedId: String(id) }
    },

    async getDonationSettings() {
      const settings = await repository.getDonationSettings()
      const readiness = computeDonationReadiness(settings)
      return {
        ...settings,
        readiness,
      }
    },

    async updateDonationSettings(payload, auditUserId = null) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload pengaturan donasi tidak valid.')
      }

      const current = await repository.getDonationSettings()
      let nextValues = { ...current }

      for (const [key, label, limit, allowMultiline] of [
        ['messageTemplate', 'Template pesan', 2000, true],
        ['donationNote', 'Catatan donasi', 1000, true],
      ]) {
        if (payload[key] !== undefined) {
          if (typeof payload[key] !== 'string') {
            throw createHttpError(400, 'BAD_REQUEST', `${label} tidak valid.`)
          }
          if (payload[key].length > limit || hasControlChars(payload[key], allowMultiline)) {
            throw createHttpError(
              400,
              'BAD_REQUEST',
              `${label} tidak valid atau melebihi ${limit} karakter.`
            )
          }
          nextValues[key] = payload[key]
        }
      }

      if (payload.bankAccounts !== undefined) {
        if (!Array.isArray(payload.bankAccounts)) {
          throw createHttpError(400, 'BAD_REQUEST', 'Daftar rekening donasi harus berupa array.')
        }
        if (payload.bankAccounts.length > MAX_DONATION_BANKS) {
          throw createHttpError(
            400,
            'BAD_REQUEST',
            `Maksimal ${MAX_DONATION_BANKS} rekening donasi. Hapus salah satu rekening terlebih dahulu.`
          )
        }
        const validatedAccounts = []
        for (let index = 0; index < payload.bankAccounts.length; index += 1) {
          const item = validateBankAccountEntry(payload.bankAccounts[index], index)
          if (item) {
            validatedAccounts.push(item)
          }
        }
        nextValues = syncLegacyBankFields(nextValues, validatedAccounts)
      } else {
        const legacyTextFields = [
          ['bankName', 'Nama bank', 100, false],
          ['accountName', 'Atas nama', 160, false],
          ['bankName2', 'Nama bank rekening 2', 100, false],
          ['accountName2', 'Atas nama rekening 2', 160, false],
        ]

        for (const [key, label, limit, allowMultiline] of legacyTextFields) {
          if (payload[key] !== undefined) {
            if (typeof payload[key] !== 'string') {
              throw createHttpError(400, 'BAD_REQUEST', `${label} tidak valid.`)
            }
            if (payload[key].length > limit || hasControlChars(payload[key], allowMultiline)) {
              throw createHttpError(
                400,
                'BAD_REQUEST',
                `${label} tidak valid atau melebihi ${limit} karakter.`
              )
            }
            nextValues[key] = payload[key]
          }
        }

        if (payload.accountNumber !== undefined) {
          nextValues.accountNumber = validateAccountNumberField(payload.accountNumber, 'Nomor rekening')
        }
        if (payload.accountNumber2 !== undefined) {
          nextValues.accountNumber2 = validateAccountNumberField(payload.accountNumber2, 'Nomor rekening 2')
        }

        const bank1Name = String(nextValues.bankName ?? '').trim()
        const bank1Number = String(nextValues.accountNumber ?? '').trim()
        const bank1Recipient = String(nextValues.accountName ?? '').trim()
        const bank1Complete = Boolean(bank1Name && bank1Number && bank1Recipient)

        const bank2Name = String(nextValues.bankName2 ?? '').trim()
        const bank2Number = String(nextValues.accountNumber2 ?? '').trim()
        const bank2Recipient = String(nextValues.accountName2 ?? '').trim()
        const bank2FilledCount = [bank2Name, bank2Number, bank2Recipient].filter(Boolean).length
        if (bank2FilledCount > 0 && bank2FilledCount < 3) {
          throw createHttpError(
            400,
            'BAD_REQUEST',
            'Jika Rekening 2 digunakan, Nama Bank, Nomor Rekening, dan Atas Nama Rekening 2 wajib dilengkapi seluruhnya.'
          )
        }
        nextValues.bankName2 = bank2Name
        nextValues.accountNumber2 = bank2Number
        nextValues.accountName2 = bank2Recipient

        const currentTail = Array.isArray(current.bankAccounts) ? current.bankAccounts.slice(2) : []
        nextValues.bankAccounts = bank1Complete
          ? [
              {
                id: current.bankAccounts?.[0]?.id ?? null,
                bankName: bank1Name,
                accountNumber: bank1Number,
                accountName: bank1Recipient,
              },
              ...(bank2FilledCount === 3
                ? [{
                    id: current.bankAccounts?.[1]?.id ?? null,
                    bankName: bank2Name,
                    accountNumber: bank2Number,
                    accountName: bank2Recipient,
                  }]
                : []),
              ...currentTail,
            ].slice(0, MAX_DONATION_BANKS)
          : []
      }

      if (payload.whatsappNumber !== undefined) {
        if (typeof payload.whatsappNumber !== 'string') {
          throw createHttpError(400, 'BAD_REQUEST', 'Nomor WhatsApp harus berupa string.')
        }
        const trimmedWa = payload.whatsappNumber.trim()
        if (trimmedWa && !/^[1-9]\d{7,14}$/.test(trimmedWa)) {
          throw createHttpError(
            400,
            'BAD_REQUEST',
            'Gunakan nomor internasional 8–15 digit, tanpa +, spasi atau tanda baca; misalnya berawalan 628.'
          )
        }
        nextValues.whatsappNumber = trimmedWa
      }

      if (payload.qrisEnabled !== undefined) {
        nextValues.qrisEnabled = payload.qrisEnabled === true
      }
      if (payload.bankEnabled !== undefined) {
        nextValues.bankEnabled = payload.bankEnabled === true
      }
      if (payload.whatsappEnabled !== undefined) {
        nextValues.whatsappEnabled = payload.whatsappEnabled === true
      }

      const readiness = computeDonationReadiness(nextValues)
      const normalized = {
        ...nextValues,
        qrisEnabled: readiness.qris.enabled,
        bankEnabled: readiness.bank.enabled,
        whatsappEnabled: readiness.whatsapp.enabled,
      }

      const saved = await repository.saveDonationSettings(normalized, auditUserId)
      return {
        ...saved,
        readiness: computeDonationReadiness(saved),
      }
    },

    async getWebsiteSettings() {
      return repository.getWebsiteSettings()
    },

    async updateWebsiteSettings(payload, auditUserId = null) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload pengaturan website tidak valid.')
      }

      const current = await repository.getWebsiteSettings()
      const whatsapp = payload.whatsapp !== undefined ? payload.whatsapp : current.whatsapp
      const email = payload.email !== undefined ? payload.email : current.email
      const address = payload.address !== undefined ? payload.address : current.address
      const mapsUrl = payload.mapsUrl !== undefined ? payload.mapsUrl : current.mapsUrl
      const publicReportEnabled =
        payload.publicReportEnabled !== undefined
          ? payload.publicReportEnabled
          : current.publicReportEnabled

      if (typeof whatsapp !== 'string' || whatsapp.length > 20 || hasControlChars(whatsapp, false)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nomor WhatsApp tidak valid.')
      }
      const trimmedWhatsapp = whatsapp.trim()
      if (trimmedWhatsapp && !isValidPhoneFormat(trimmedWhatsapp)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Masukkan nomor WhatsApp dengan 8–15 digit; gunakan tanda + hanya di awal.'
        )
      }

      if (typeof email !== 'string' || email.length > 150 || hasControlChars(email, false)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Masukkan alamat email yang valid.')
      }
      const trimmedEmail = email.trim()
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Masukkan alamat email yang valid.')
      }

      if (typeof address !== 'string' || address.length > 255 || hasControlChars(address, true)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Alamat tidak valid atau melebihi 255 karakter.')
      }

      if (typeof mapsUrl !== 'string' || mapsUrl.length > 2048 || hasControlChars(mapsUrl, false)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Masukkan tautan HTTPS Google Maps yang valid, termasuk tautan maps.app.goo.gl.'
        )
      }
      const trimmedMapsUrl = mapsUrl.trim()
      if (trimmedMapsUrl && !isValidGoogleMapsUrl(trimmedMapsUrl)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Masukkan tautan HTTPS Google Maps yang valid, termasuk tautan maps.app.goo.gl.'
        )
      }

      if (typeof publicReportEnabled !== 'boolean') {
        throw createHttpError(400, 'BAD_REQUEST', 'Status visibilitas laporan publik harus berupa boolean.')
      }

      const pick = (key) => (payload[key] !== undefined ? payload[key] : current[key])
      const phone = validateOptionalText(pick('phone'), 'Nomor telepon', 20)
      if (phone && !isValidPhoneFormat(phone)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Masukkan nomor telepon dengan 8–15 digit; tanda + di awal, spasi, kurung, titik atau tanda hubung diperbolehkan.'
        )
      }

      return repository.saveWebsiteSettings({
        whatsapp: trimmedWhatsapp,
        email: trimmedEmail,
        address: address.trim(),
        mapsUrl: trimmedMapsUrl,
        phone,
        phoneNote: validateOptionalText(pick('phoneNote'), 'Keterangan telepon', 100),
        hours: validateOptionalText(pick('hours'), 'Jam operasional', 150),
        mapLabel: validateOptionalText(pick('mapLabel'), 'Label peta', 100),
        publicReportEnabled,
      }, auditUserId)
    },
  }
}

export const defaultAdminSettingsService = createAdminSettingsService()
