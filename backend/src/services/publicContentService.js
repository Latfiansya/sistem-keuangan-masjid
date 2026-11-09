import { findPublicContent } from '../repositories/publicContentRepository.js'

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
  const bankVerified = contact.donation?.bank?.verified === true

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
      bank: {
        verified: bankVerified,
        name: bankVerified ? contact.donation?.bank?.name ?? null : null,
        number: bankVerified ? contact.donation?.bank?.number ?? null : null,
        recipient: bankVerified ? contact.donation?.bank?.recipient ?? null : null,
      },
    },
  }
}

// untuk konten publik bersama tanpa menyertakan agenda.
export function getPublicContent() {
  const content = findPublicContent()
  return {
    ...content,
    contact: sanitizePublicContact(content.contact),
  }
}

