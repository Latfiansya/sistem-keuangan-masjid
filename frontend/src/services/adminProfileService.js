import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export const adminProfilePhotoAccept = '.jpg,.jpeg,.png,.webp'
export const adminProfilePhotoMaxBytes = 5 * 1024 * 1024

// Pemeriksaan awal untuk preview lokal; validasi dan penyimpanan upload tetap tanggung jawab API backend.
export function validateAdminProfilePhoto(files) {
  if (files.length !== 1) return 'Pilih tepat satu foto masjid.'
  const file = files[0]
  const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
  const extension = file.name.match(/\.(jpe?g|png|webp)$/i)?.[1].toLowerCase()
  if (!Object.hasOwn(types, extension) || file.type !== types[extension]) return 'Format foto harus JPG, PNG atau WebP dengan tipe berkas yang sesuai.'
  if (!file.size) return 'Berkas foto kosong. Pilih gambar lain.'
  if (file.size > adminProfilePhotoMaxBytes) return 'Ukuran foto maksimal 5 MB.'
  return ''
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
  return {
    name: mockPublicContent.name,
    description: mockPublicContent.heroDescription,
    address: mockPublicContent.address,
    contact: phone?.verified && typeof phone.value === 'string' ? phone.value : '',
  }
}

export async function saveAdminProfile(values, { signal } = {}) {
  if (dataSource === 'mock') return { ...values }
  return apiRequest('/admin/profile', {
    method: 'PUT',
    body: {
      name: values.name,
      description: values.description || '',
      address: values.address || '',
      contact: values.contact || '',
    },
    signal,
  })
}

export function validateAdminProfile({ name, contact }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Nama masjid wajib diisi.'
  else if (Array.from(name).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) errors.name = 'Nama masjid tidak boleh mengandung karakter kontrol.'
  const phone = contact.trim()
  if (phone && (!/^\+?[\d ().-]+$/.test(phone) || !/^\d{8,15}$/.test(phone.replace(/\D/g, '')))) {
    errors.contact = 'Masukkan nomor telepon dengan 8–15 digit; tanda + di awal, spasi, kurung, titik atau tanda hubung diperbolehkan.'
  }
  return errors
}
