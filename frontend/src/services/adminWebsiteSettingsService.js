import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export async function getAdminWebsiteSettings({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/website-settings', { signal })
    if (!data || typeof data !== 'object') {
      throw new Error('Format pengaturan website API tidak sesuai kontrak.')
    }
    return data
  }
  return {
    whatsapp: '',
    email: '',
    address: mockPublicContent.address,
    mapsUrl: mockPublicContent.contact.location.verified ? mockPublicContent.contact.location.url || '' : '',
    publicReportEnabled: true,
  }
}

export async function saveAdminWebsiteSettings(values, { signal } = {}) {
  if (dataSource === 'mock') return { ...values }
  return apiRequest('/admin/website-settings', {
    method: 'PUT',
    body: {
      whatsapp: values.whatsapp || '',
      email: values.email || '',
      address: values.address || '',
      mapsUrl: values.mapsUrl || '',
      publicReportEnabled: values.publicReportEnabled === true,
    },
    signal,
  })
}

export function validateAdminWebsiteSettings({ whatsapp, email, mapsUrl }) {
  const errors = {}
  const phone = whatsapp.trim()
  if (phone && (!/^\+?[\d ().-]+$/.test(phone) || !/^\d{8,15}$/.test(phone.replace(/\D/g, '')))) errors.whatsapp = 'Masukkan nomor WhatsApp dengan 8–15 digit; gunakan tanda + hanya di awal.'
  if (email.trim() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || Array.from(email).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127))) errors.email = 'Masukkan alamat email yang valid.'
  if (mapsUrl.trim()) {
    try {
      const url = new URL(mapsUrl.trim())
      const googleMaps = ['google.com', 'www.google.com', 'google.co.id', 'www.google.co.id'].includes(url.hostname) && (url.pathname === '/maps' || url.pathname.startsWith('/maps/'))
      const mapsDomain = ['maps.google.com', 'maps.google.co.id'].includes(url.hostname)
      const shortLink = (url.hostname === 'maps.app.goo.gl' && url.pathname.length > 1) || (url.hostname === 'goo.gl' && url.pathname.startsWith('/maps/') && url.pathname.length > 6)
      if (url.protocol !== 'https:' || url.username || url.password || url.port || /\s/.test(mapsUrl.trim()) || !(googleMaps || mapsDomain || shortLink)) throw new Error('Tautan tidak sesuai.')
    } catch { errors.mapsUrl = 'Masukkan tautan HTTPS Google Maps yang valid, termasuk tautan maps.app.goo.gl.' }
  }
  return errors
}
