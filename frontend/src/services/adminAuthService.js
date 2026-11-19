import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

const hasControlCharacters = (value) => Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)

export function validateAdminLogin({ email, password } = {}) {
  const errors = {}
  if (typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email wajib diisi.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || hasControlCharacters(email)) {
    errors.email = 'Masukkan alamat email yang valid.'
  }
  if (typeof password !== 'string' || !password.trim()) {
    errors.password = 'Password wajib diisi.'
  } else if (hasControlCharacters(password)) {
    errors.password = 'Password tidak boleh mengandung karakter kontrol.'
  }
  return errors
}

export async function loginAdmin(credentials, { signal } = {}) {
  signal?.throwIfAborted()
  const errors = validateAdminLogin(credentials)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])

  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/auth/login', {
      method: 'POST',
      body: { email: credentials.email.trim(), password: credentials.password },
      signal,
    })
    if (!data?.user) {
      throw new Error('Format respons login pengurus tidak sesuai kontrak.')
    }
    return data
  }

  // Simulasi loading hanya di development mode mock, tanpa akun atau keberhasilan autentikasi mock.
  if (import.meta.env.DEV) {
    await new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timeout)
        reject(signal.reason)
      }
      const timeout = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }, 500)
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }
  signal?.throwIfAborted()
  throw new Error('Login pengurus belum tersedia. Silakan hubungi tim pengelola untuk informasi akses.')
}

export async function logoutAdmin({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource === 'mock') return { loggedOut: true }
  return apiRequest('/admin/auth/logout', { method: 'POST', signal })
}

export async function getAdminSession({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource === 'mock') return null
  try {
    const data = await apiRequest('/admin/auth/me', { signal })
    return data?.user || null
  } catch (error) {
    if (error?.status === 401) return null
    throw error
  }
}
