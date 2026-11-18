import { defaultAdminSettingsRepository } from '../repositories/adminSettingsRepository.js'
import { createHttpError } from '../utils/httpError.js'

function hasControlChars(value, allowMultiline = false) {
  return [...String(value)].some((character) => {
    const code = character.codePointAt(0)
    if (code === 127) return true
    if (code < 32) {
      return !(allowMultiline && (code === 9 || code === 10 || code === 13))
    }
    return false
  })
}

function isValidPhoneFormat(phone) {
  return /^\+?[\d ().-]+$/.test(phone) && /^\d{8,15}$/.test(phone.replace(/\D/g, ''))
}

function isValidGoogleMapsUrl(rawUrl) {
  if (/\s/.test(rawUrl)) return false
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) {
      return false
    }
    const googleMaps =
      ['google.com', 'www.google.com', 'google.co.id', 'www.google.co.id'].includes(url.hostname) &&
      (url.pathname === '/maps' || url.pathname.startsWith('/maps/'))
    const mapsDomain = ['maps.google.com', 'maps.google.co.id'].includes(url.hostname)
    const shortLink =
      (url.hostname === 'maps.app.goo.gl' && url.pathname.length > 1) ||
      (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/') && url.pathname.length > 6)
    return googleMaps || mapsDomain || shortLink
  } catch {
    return false
  }
}

function computeDonationReadiness(values) {
  const qrisComplete = Boolean(values.qrisFile)
  const bankComplete = Boolean(
    values.bankName.trim() && values.accountNumber.trim() && values.accountName.trim()
  )
  const whatsappComplete = Boolean(values.whatsappNumber.trim() && values.messageTemplate.trim())

  const buildMethodStatus = (complete, enabled, missingReason) => ({
    complete,
    enabled: complete && enabled === true,
    reason: !complete
      ? missingReason
      : enabled
        ? 'Siap ditampilkan dalam pratinjau simulasi.'
        : 'Data lengkap. Aktifkan toggle untuk menampilkannya dalam pratinjau.',
  })

  const qris = buildMethodStatus(
    qrisComplete,
    values.qrisEnabled,
    'Gambar QRIS belum tersedia. Unggah gambar valid, lalu aktifkan visibilitas QRIS.'
  )
  const bank = buildMethodStatus(
    bankComplete,
    values.bankEnabled,
    'Lengkapi Nama Bank, Nomor Rekening yang valid, dan Atas Nama sebelum mengaktifkan transfer bank.'
  )
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

// Business logic layer untuk profil masjid, agenda, donasi, dan pengaturan website pengurus.
export function createAdminSettingsService(repository = defaultAdminSettingsRepository) {
  return {
    async getProfile() {
      return repository.getProfile()
    },

    async updateProfile(payload) {
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

      const description = payload.description ?? ''
      if (typeof description !== 'string' || description.length > 1000 || hasControlChars(description, true)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Deskripsi singkat tidak valid atau melebihi 1000 karakter.')
      }

      const address = payload.address ?? ''
      if (typeof address !== 'string' || address.length > 255 || hasControlChars(address, true)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Alamat tidak valid atau melebihi 255 karakter.')
      }

      const contact = payload.contact ?? ''
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
        description,
        address,
        contact: trimmedContact,
      })
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

    async getDonationSettings() {
      const settings = await repository.getDonationSettings()
      const readiness = computeDonationReadiness(settings)
      return {
        ...settings,
        readiness,
      }
    },

    async updateDonationSettings(payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload pengaturan donasi tidak valid.')
      }

      const current = await repository.getDonationSettings()
      const textFields = [
        ['bankName', 'Nama bank', 100, false],
        ['accountName', 'Atas nama', 160, false],
        ['messageTemplate', 'Template pesan', 2000, true],
        ['donationNote', 'Catatan donasi', 1000, true],
      ]

      const nextValues = { ...current }

      for (const [key, label, limit, allowMultiline] of textFields) {
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
        if (typeof payload.accountNumber !== 'string') {
          throw createHttpError(400, 'BAD_REQUEST', 'Nomor rekening harus berupa string.')
        }
        const trimmedAccount = payload.accountNumber.trim()
        if (trimmedAccount && !/^\d{1,40}$/.test(trimmedAccount)) {
          throw createHttpError(
            400,
            'BAD_REQUEST',
            'Nomor rekening harus berisi 1–40 digit, tanpa spasi atau tanda baca.'
          )
        }
        nextValues.accountNumber = trimmedAccount
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

      const saved = await repository.saveDonationSettings(normalized)
      return {
        ...saved,
        readiness: computeDonationReadiness(saved),
      }
    },

    async getWebsiteSettings() {
      return repository.getWebsiteSettings()
    },

    async updateWebsiteSettings(payload) {
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

      return repository.saveWebsiteSettings({
        whatsapp: trimmedWhatsapp,
        email: trimmedEmail,
        address,
        mapsUrl: trimmedMapsUrl,
        publicReportEnabled,
      })
    },
  }
}

export const defaultAdminSettingsService = createAdminSettingsService()
