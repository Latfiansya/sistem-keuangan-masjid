import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export const adminProfilePhotoAccept = '.jpg,.jpeg,.png,.webp'
export const adminProfilePhotoMaxBytes = 5 * 1024 * 1024
export const adminProfileLogoMaxBytes = 2 * 1024 * 1024

// Pemeriksaan awal sebelum unggah; backend tetap memeriksa ulang isi, tipe, dan ukuran berkas.
function validateImageFile(files, { noun, maxBytes }) {
  if (files.length !== 1) return `Pilih tepat satu ${noun} masjid.`
  const file = files[0]
  const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
  const extension = file.name.match(/\.(jpe?g|png|webp)$/i)?.[1].toLowerCase()
  if (!Object.hasOwn(types, extension) || file.type !== types[extension]) return `Format ${noun} harus JPG, PNG atau WebP dengan tipe berkas yang sesuai.`
  if (!file.size) return `Berkas ${noun} kosong. Pilih gambar lain.`
  if (file.size > maxBytes) return `Ukuran ${noun} maksimal ${maxBytes / (1024 * 1024)} MB.`
  return ''
}

export function validateAdminProfilePhoto(files) {
  return validateImageFile(files, { noun: 'foto', maxBytes: adminProfilePhotoMaxBytes })
}

export function validateAdminProfileLogo(files) {
  return validateImageFile(files, { noun: 'logo', maxBytes: adminProfileLogoMaxBytes })
}

export async function getAdminProfile({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/profile', { signal })
    if (!data || typeof data.name !== 'string') {
      throw new Error('Format data profil admin API tidak sesuai kontrak.')
    }
    return data
  }
  const phone = mockPublicContent.contact.information.find((item) => item.id === 'phone')
  const statistic = (id) => mockPublicContent.statistics.find((item) => item.id === id)
  return {
    name: mockPublicContent.name,
    tagline: mockPublicContent.heroDescription,
    description: mockPublicContent.profile.introduction,
    location: mockPublicContent.profile.location,
    foundedYear: mockPublicContent.profile.foundedYear,
    buildingArea: statistic('area')?.amount ?? null,
    buildingAreaNote: statistic('area')?.description || '',
    capacity: statistic('capacity')?.amount ?? null,
    capacityNote: statistic('capacity')?.description || '',
    vision: mockPublicContent.vision,
    managementPeriod: mockPublicContent.profile.managementPeriod,
    address: mockPublicContent.address,
    contact: phone?.verified && typeof phone.value === 'string' ? phone.value : '',
  }
}

const toOptionalInteger = (value) => (value === '' || value === null || value === undefined ? null : Number(value))
const toText = (value) => String(value ?? '').trim()

export async function saveAdminProfile(values, { signal } = {}) {
  if (dataSource === 'mock') return { ...values }
  return apiRequest('/admin/profile', {
    method: 'PUT',
    body: {
      name: toText(values.name),
      tagline: toText(values.tagline),
      description: toText(values.description),
      location: toText(values.location),
      foundedYear: toOptionalInteger(values.foundedYear),
      buildingArea: toOptionalInteger(values.buildingArea),
      buildingAreaNote: toText(values.buildingAreaNote),
      capacity: toOptionalInteger(values.capacity),
      capacityNote: toText(values.capacityNote),
      vision: toText(values.vision),
      managementPeriod: toText(values.managementPeriod),
      address: toText(values.address),
      contact: toText(values.contact),
    },
    signal,
  })
}

function validateOptionalInteger(value, label, min, max) {
  if (value === '' || value === null || value === undefined) return ''
  const number = Number(value)
  return Number.isInteger(number) && number >= min && number <= max ? '' : `${label} harus berupa bilangan bulat ${min}–${max}.`
}

export function validateAdminProfile({ name, contact, foundedYear, buildingArea, capacity, managementPeriod }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Nama masjid wajib diisi.'
  else if (Array.from(name).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) errors.name = 'Nama masjid tidak boleh mengandung karakter kontrol.'
  // Urutan pemeriksaan mengikuti urutan field pada formulir agar fokus diarahkan ke error pertama.
  const fieldErrors = {
    foundedYear: validateOptionalInteger(foundedYear, 'Tahun berdiri', 1800, 2100),
    managementPeriod: String(managementPeriod ?? '').trim().length > 20 ? 'Periode pengurus maksimal 20 karakter, misalnya 2023–2026.' : '',
    buildingArea: validateOptionalInteger(buildingArea, 'Luas bangunan', 0, 1000000),
    capacity: validateOptionalInteger(capacity, 'Kapasitas jamaah', 0, 1000000),
  }
  for (const [key, message] of Object.entries(fieldErrors)) if (message) errors[key] = message
  const phone = (contact ?? '').trim()
  if (phone && (!/^\+?[\d ().-]+$/.test(phone) || !/^\d{8,15}$/.test(phone.replace(/\D/g, '')))) {
    errors.contact = 'Masukkan nomor telepon dengan 8–15 digit; tanda + di awal, spasi, kurung, titik atau tanda hubung diperbolehkan.'
  }
  return errors
}
