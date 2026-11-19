import { mockAdminAccounts } from '../mocks/adminAccounts.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const hasControlChars = (value) =>
  [...String(value ?? '')].some((character) => {
    const code = character.codePointAt(0)
    return code < 32 || code === 127
  })

export async function getAdminAccounts({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/accounts', { signal })
    if (!data || !Array.isArray(data.accounts)) {
      throw new Error('Format data akun pengurus API tidak sesuai kontrak.')
    }
    return data.accounts
  }
  return structuredClone(mockAdminAccounts)
}

export function filterAdminAccounts(accounts, query) {
  const term = query.trim().toLowerCase()
  return accounts.filter((account) => account.name.toLowerCase().includes(term) || account.email.toLowerCase().includes(term))
}

export function validateAdminAccountForm(values = {}, { isEdit = false } = {}) {
  const errors = {}
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  if (!name) errors.name = 'Nama pengurus wajib diisi.'
  else if (name.length > 100 || hasControlChars(values.name)) {
    errors.name = 'Nama pengurus tidak boleh mengandung karakter kontrol atau melebihi 100 karakter.'
  }

  const email = typeof values.email === 'string' ? values.email.trim() : ''
  if (!email) errors.email = 'Email wajib diisi.'
  else if (!EMAIL_PATTERN.test(email) || email.length > 150 || hasControlChars(values.email)) {
    errors.email = 'Masukkan alamat email yang valid.'
  }

  const password = typeof values.password === 'string' ? values.password : ''
  if (!isEdit && !password.trim()) {
    errors.password = 'Password wajib diisi.'
  } else if (password && (password.length < 8 || password.length > 128 || hasControlChars(password))) {
    errors.password = 'Password minimal 8 karakter, maksimal 128 karakter, dan tanpa karakter kontrol.'
  }

  if (!['Admin', 'Super Admin'].includes(values.role)) {
    errors.role = 'Role akun harus Admin atau Super Admin.'
  }

  return errors
}

export async function createAdminAccount(values, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Operasi API akun hanya tersedia pada mode API.')
  return apiRequest('/admin/accounts', {
    method: 'POST',
    body: {
      name: String(values.name || '').trim(),
      email: String(values.email || '').trim().toLowerCase(),
      password: values.password,
      role: values.role,
      active: values.active !== false,
    },
    signal,
  })
}

export async function updateAdminAccount(id, values, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Operasi API akun hanya tersedia pada mode API.')
  const body = {
    name: String(values.name || '').trim(),
    email: String(values.email || '').trim().toLowerCase(),
    role: values.role,
    active: values.active !== false,
  }
  if (values.password) body.password = values.password
  return apiRequest(`/admin/accounts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body,
    signal,
  })
}

export async function setAdminAccountStatus(id, active, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Operasi API akun hanya tersedia pada mode API.')
  return apiRequest(`/admin/accounts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { active: active === true },
    signal,
  })
}

export async function deleteAdminAccount(id, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Operasi API akun hanya tersedia pada mode API.')
  return apiRequest(`/admin/accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal,
  })
}
