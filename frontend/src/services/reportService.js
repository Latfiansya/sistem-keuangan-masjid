import { mockReportAccess } from '../mocks/reportAccess.js'
import { dataSource } from '../utils/env.js'

export async function checkReportPassword(password, { signal } = {}) {
  signal?.throwIfAborted()
  if (typeof password !== 'string' || !password.trim()) throw new Error('Sandi wajib diisi.')
  if (dataSource !== 'mock') {
    throw new Error('Pemeriksaan sandi melalui API belum tersedia. Gunakan mode mock untuk pengembangan.')
  }

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, mockReportAccess.delayMs)
    function onAbort() {
      clearTimeout(timeout)
      reject(signal.reason)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
  return { valid: password === mockReportAccess.password }
}
