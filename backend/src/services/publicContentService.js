import { defaultPublicContentRepository } from '../repositories/publicContentRepository.js'

function sanitizeBankAccount(account) {
  const verified = account?.verified === true
  return {
    verified,
    name: verified ? account?.name ?? null : null,
    number: verified ? account?.number ?? null : null,
    recipient: verified ? account?.recipient ?? null : null,
  }
}

// Memastikan data kontak dan donasi yang belum terverifikasi tidak mengirim nilai aktif.
function sanitizePublicContact(contact) {
  if (!contact) return null

  const information = Array.isArray(contact.information)
    ? contact.information.map((item) => {
      const verified = item.verified === true
      const base = {
        id: item.id,
        label: item.label,
        verified,
        value: verified ? item.value ?? null : null,
      }
      if ('note' in item) {
        base.note = verified ? item.note ?? null : null
      }
      return base
    })
    : []

  const locationVerified = contact.location?.verified === true
  const qrisVerified = contact.donation?.qris?.verified === true

  const sanitizedBanks = Array.isArray(contact.donation?.banks)
    ? contact.donation.banks.map(sanitizeBankAccount).filter((item) => item.verified).slice(0, 4)
    : []
  const bank = sanitizedBanks[0] ?? sanitizeBankAccount(contact.donation?.bank)
  const bank2 = sanitizedBanks[1] ?? sanitizeBankAccount(contact.donation?.bank2)
  const banks = sanitizedBanks.length
    ? sanitizedBanks
    : [bank, bank2].filter((item) => item.verified)

  return {
    introduction: contact.introduction,
    information,
    location: {
      verified: locationVerified,
      url: locationVerified ? contact.location?.url ?? null : null,
    },
    donation: {
      qris: {
        verified: qrisVerified,
        imageSrc: qrisVerified ? contact.donation?.qris?.imageSrc ?? null : null,
      },
      banks,
      bank,
      bank2,
    },
  }
}

// Business logic layer untuk konten publik bersama tanpa menyertakan agenda.
export function createPublicContentService(repository = defaultPublicContentRepository) {
  return {
    async getPublicContent() {
      const content = await repository.findPublicContent()
      return {
        ...content,
        contact: sanitizePublicContact(content.contact),
      }
    },
  }
}

export const defaultPublicContentService = createPublicContentService()

export function getPublicContent() {
  return defaultPublicContentService.getPublicContent()
}
