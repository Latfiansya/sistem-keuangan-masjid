import { mockReportAccess } from '../mocks/reportAccess.js'
import { mockReport } from '../mocks/report.js'
import { dataSource } from '../utils/env.js'
import { calculateReport, DEFAULT_REPORT_RANGE, validateReportRange } from '../utils/reportCalculations.js'

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

export async function getReport({ startDate = DEFAULT_REPORT_RANGE.startDate, endDate = DEFAULT_REPORT_RANGE.endDate, signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') throw new Error('Laporan keuangan melalui API belum tersedia. Gunakan mode mock untuk pengembangan.')
  const range = { startDate, endDate }
  validateReportRange(range)
  // Jeda singkat khusus mock agar status pemuatan dapat diperiksa.
  await new Promise((resolve) => setTimeout(resolve, 150))
  signal?.throwIfAborted()
  return calculateReport(structuredClone(mockReport), range)
}
