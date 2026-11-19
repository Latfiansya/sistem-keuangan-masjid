import { mockAgenda } from '../mocks/agenda.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

const hasControlChars = (value, allowMultiline = false) =>
  [...String(value ?? '')].some((character) => {
    const code = character.codePointAt(0)
    if (code === 127) return true
    if (code < 32) return !(allowMultiline && [9, 10, 13].includes(code))
    return false
  })

function withAgendaCounts(agenda) {
  const groups = Array.isArray(agenda?.groups) ? agenda.groups : []
  const count = (id) => groups.find((group) => group.id === id)?.items?.length || 0
  return {
    description: agenda?.description || '',
    groups,
    counts: [
      { label: 'Total Kegiatan', value: groups.reduce((total, group) => total + (group.items?.length || 0), 0) },
      { label: 'Rutin Mingguan', value: count('weekly') },
      { label: 'PHBI / Tahunan', value: count('yearly') },
    ],
  }
}

export async function getAgenda({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/public/agenda', { signal })
    if (!data || !Array.isArray(data.groups)) {
      throw new Error('Format data agenda API tidak sesuai kontrak.')
    }
    return withAgendaCounts(data)
  }
  return withAgendaCounts(structuredClone(mockAgenda))
}

export async function getAdminAgenda({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/agenda', { signal })
    if (!data || !Array.isArray(data.groups)) {
      throw new Error('Format data agenda admin API tidak sesuai kontrak.')
    }
    return data
  }
  return getAgenda({ signal })
}

export function validateAdminAgenda(values = {}) {
  const errors = {}
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  if (!name) errors.name = 'Nama kegiatan agenda wajib diisi.'
  else if (name.length > 150 || hasControlChars(values.name, false)) {
    errors.name = 'Nama kegiatan tidak boleh mengandung karakter kontrol atau melebihi 150 karakter.'
  }

  if (!['weekly', 'monthly', 'yearly'].includes(values.frequency)) {
    errors.frequency = 'Pilih frekuensi Mingguan, Bulanan, atau Tahunan.'
  }

  const schedule = typeof values.schedule === 'string' ? values.schedule.trim() : ''
  if (!schedule) errors.schedule = 'Waktu pelaksanaan agenda wajib diisi.'
  else if (schedule.length > 150 || hasControlChars(values.schedule, false)) {
    errors.schedule = 'Waktu pelaksanaan tidak boleh mengandung karakter kontrol atau melebihi 150 karakter.'
  }

  const description = typeof values.description === 'string' ? values.description : ''
  if (description.length > 1000 || hasControlChars(description, true)) {
    errors.description = 'Keterangan agenda tidak valid atau melebihi 1000 karakter.'
  }

  const order = Number(values.order ?? 0)
  if (!Number.isInteger(order) || order < 0 || order > 32767) {
    errors.order = 'Urutan harus berupa bilangan bulat 0–32767.'
  }

  return errors
}

export async function createAdminAgenda(values, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Tambah agenda hanya tersedia pada mode API.')
  return apiRequest('/admin/agenda', {
    method: 'POST',
    body: {
      name: String(values.name || '').trim(),
      frequency: values.frequency,
      schedule: String(values.schedule || '').trim(),
      description: String(values.description || '').trim(),
      order: Number(values.order ?? 0),
      active: values.active !== false,
    },
    signal,
  })
}

export async function updateAdminAgenda(id, values, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Edit agenda hanya tersedia pada mode API.')
  return apiRequest(`/admin/agenda/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: {
      name: String(values.name || '').trim(),
      frequency: values.frequency,
      schedule: String(values.schedule || '').trim(),
      description: String(values.description || '').trim(),
      order: Number(values.order ?? 0),
      active: values.active !== false,
    },
    signal,
  })
}

export async function deleteAdminAgenda(id, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Hapus agenda hanya tersedia pada mode API.')
  return apiRequest(`/admin/agenda/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal,
  })
}
