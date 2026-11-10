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

// Batas integrasi login; belum mengirim kredensial sampai kontrak backend disepakati.
export async function loginAdmin(credentials, { signal } = {}) {
  signal?.throwIfAborted()
  const errors = validateAdminLogin(credentials)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])

  // Simulasi loading hanya di development, tanpa akun atau keberhasilan autentikasi mock.
  if (import.meta.env.DEV && dataSource === 'mock') {
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
