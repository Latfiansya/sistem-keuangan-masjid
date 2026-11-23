import { mockPublicContent } from '../mocks/publicContent.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

const orderField = { key: 'order', label: 'Urutan Tampil', type: 'integer', min: 0, max: 32767, defaultValue: 1 }
const activeField = { key: 'active', label: 'Tampilkan di website publik', type: 'boolean', defaultValue: true }

// Definisi bagian konten profil; batas panjang mengikuti kolom tabel keu_masjid dan validasi backend.
export const profileContentSections = [
  {
    id: 'missions',
    title: 'Misi',
    singular: 'Misi',
    description: 'Daftar misi yang tampil di bawah visi pada Beranda dan Profil.',
    fields: [{ key: 'text', label: 'Isi Misi', type: 'textarea', required: true, max: 255 }, orderField],
  },
  {
    id: 'programs',
    title: 'Program Kemakmuran',
    singular: 'Program',
    description: 'Kartu program yang tampil pada Beranda.',
    fields: [
      { key: 'title', label: 'Judul Program', type: 'text', required: true, max: 100 },
      { key: 'description', label: 'Deskripsi Program', type: 'textarea', required: true, max: 500 },
      orderField,
      activeField,
    ],
  },
  {
    id: 'history',
    title: 'Sejarah',
    singular: 'Sejarah',
    description: 'Linimasa sejarah masjid pada halaman Profil.',
    fields: [
      { key: 'year', label: 'Tahun', type: 'integer', required: true, min: 1800, max: 2100, defaultValue: '' },
      { key: 'era', label: 'Label Era', type: 'text', max: 50, placeholder: 'Contoh: Era Perintisan' },
      { key: 'placeName', label: 'Nama Tempat', type: 'text', max: 150, placeholder: 'Contoh: Mushola Al Qodar' },
      { key: 'title', label: 'Judul', type: 'text', required: true, max: 150 },
      { key: 'description', label: 'Deskripsi', type: 'textarea', max: 2000 },
      orderField,
    ],
  },
  {
    id: 'officers',
    title: 'Pengurus',
    singular: 'Pengurus',
    description: 'Susunan pengurus takmir pada halaman Profil.',
    fields: [
      { key: 'name', label: 'Nama Pengurus', type: 'text', required: true, max: 150 },
      { key: 'role', label: 'Jabatan', type: 'text', required: true, max: 50, placeholder: 'Contoh: BENDAHARA' },
      { key: 'note', label: 'Keterangan', type: 'text', max: 150, placeholder: 'Contoh: ( Kepala Dukuh )' },
      orderField,
      activeField,
    ],
  },
]

const sectionById = new Map(profileContentSections.map((section) => [section.id, section]))

function getSection(sectionId) {
  const section = sectionById.get(sectionId)
  if (!section) throw new Error('Bagian konten profil tidak dikenal.')
  return section
}

function hasControlChars(value, allowMultiline) {
  return Array.from(String(value)).some((character) => {
    const code = character.charCodeAt(0)
    if (code === 127) return true
    return code < 32 && !(allowMultiline && (code === 9 || code === 10 || code === 13))
  })
}

export function emptyProfileContentValues(sectionId) {
  return Object.fromEntries(getSection(sectionId).fields.map((field) => [field.key, field.defaultValue ?? '']))
}

export function validateProfileContent(sectionId, values = {}) {
  const errors = {}
  for (const field of getSection(sectionId).fields) {
    const value = values[field.key]
    if (field.type === 'text' || field.type === 'textarea') {
      const text = typeof value === 'string' ? value : ''
      if (field.required && !text.trim()) errors[field.key] = `${field.label} wajib diisi.`
      else if (text.trim().length > field.max || hasControlChars(text, field.type === 'textarea')) {
        errors[field.key] = `${field.label} tidak boleh mengandung karakter kontrol atau melebihi ${field.max} karakter.`
      }
    } else if (field.type === 'integer') {
      const empty = value === '' || value === null || value === undefined
      if (empty && field.required) errors[field.key] = `${field.label} wajib diisi.`
      else if (!empty && (!Number.isInteger(Number(value)) || Number(value) < field.min || Number(value) > field.max)) {
        errors[field.key] = `${field.label} harus berupa bilangan bulat ${field.min}–${field.max}.`
      }
    }
  }
  return errors
}

// Menyusun payload sesuai kontrak API: teks di-trim, angka dikonversi, boolean dipertahankan.
function toPayload(sectionId, values) {
  return Object.fromEntries(getSection(sectionId).fields.map((field) => {
    const value = values[field.key]
    if (field.type === 'integer') return [field.key, value === '' || value === null || value === undefined ? field.defaultValue ?? 0 : Number(value)]
    if (field.type === 'boolean') return [field.key, value !== false]
    return [field.key, String(value ?? '').trim()]
  }))
}

let mockState = null
let mockSequence = 1

// Data contoh untuk mode mock; perubahan hanya berlaku selama sesi halaman dan tidak menyentuh sumber mock.
function getMockState() {
  if (!mockState) {
    const source = structuredClone(mockPublicContent)
    const nextId = () => `mock-${mockSequence++}`
    mockState = {
      missions: source.missions.map((text, index) => ({ id: nextId(), text, order: index + 1 })),
      programs: source.programs.map((item, index) => ({ id: nextId(), title: item.title, description: item.description, order: index + 1, active: true })),
      history: source.profile.timeline.map((item, index) => ({ id: nextId(), year: item.year, era: item.era || '', placeName: item.name || item.mosqueName || '', title: item.title, description: item.description || '', order: index + 1 })),
      officers: source.profile.members.map((item, index) => ({ id: nextId(), name: item.name, role: item.role, note: item.note || '', order: index + 1, active: true })),
    }
  }
  return mockState
}

const sortItems = (items) => [...items].sort((a, b) => a.order - b.order || String(a.id).localeCompare(String(b.id), 'en', { numeric: true }))

export async function getAdminProfileContent({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/profile-content', { signal })
    if (!data || profileContentSections.some((section) => !Array.isArray(data[section.id]))) {
      throw new Error('Format konten profil API tidak sesuai kontrak.')
    }
    return data
  }
  const state = getMockState()
  return Object.fromEntries(profileContentSections.map((section) => [section.id, structuredClone(sortItems(state[section.id]))]))
}

export async function createAdminProfileContent(sectionId, values, { signal } = {}) {
  const payload = toPayload(sectionId, values)
  if (dataSource !== 'mock') {
    return apiRequest(`/admin/profile-content/${sectionId}`, { method: 'POST', body: payload, signal })
  }
  const created = { id: `mock-${mockSequence++}`, ...payload }
  getMockState()[sectionId].push(created)
  return structuredClone(created)
}

export async function updateAdminProfileContent(sectionId, id, values, { signal } = {}) {
  const payload = toPayload(sectionId, values)
  if (dataSource !== 'mock') {
    return apiRequest(`/admin/profile-content/${sectionId}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload, signal })
  }
  const target = getMockState()[sectionId].find((item) => item.id === id)
  if (!target) throw new Error('Data tidak ditemukan.')
  Object.assign(target, payload)
  return structuredClone(target)
}

export async function deleteAdminProfileContent(sectionId, id, { signal } = {}) {
  getSection(sectionId)
  if (dataSource !== 'mock') {
    return apiRequest(`/admin/profile-content/${sectionId}/${encodeURIComponent(id)}`, { method: 'DELETE', signal })
  }
  const state = getMockState()
  const before = state[sectionId].length
  state[sectionId] = state[sectionId].filter((item) => item.id !== id)
  if (state[sectionId].length === before) throw new Error('Data tidak ditemukan.')
  return { deletedId: id }
}

// Khusus pengujian: mengembalikan data mock ke kondisi awal.
export function resetMockProfileContent() {
  mockState = null
}
