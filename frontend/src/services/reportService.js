import { mockReport } from '../mocks/report.js'
import { mockReportAccess } from '../mocks/reportAccess.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'
import { calculateReport, DEFAULT_REPORT_RANGE, validateReportRange } from '../utils/reportCalculations.js'

export async function checkReportPassword(password, { signal } = {}) {
  signal?.throwIfAborted()
  if (typeof password !== 'string' || !password.trim()) throw new Error('Sandi wajib diisi.')
  if (dataSource !== 'mock') {
    const data = await apiRequest('/public/report/check-password', {
      method: 'POST',
      body: { password },
      signal,
    })
    if (typeof data?.valid !== 'boolean') {
      throw new Error('Format respons pemeriksaan sandi tidak sesuai kontrak.')
    }
    return { valid: data.valid }
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

export async function getReport({ startDate, endDate, signal } = {}) {
  signal?.throwIfAborted()
  const hasStart = startDate !== undefined
  const hasEnd = endDate !== undefined

  if (dataSource !== 'mock') {
    if (hasStart || hasEnd) {
      validateReportRange({ startDate: startDate ?? '', endDate: endDate ?? '' })
    }
    const query = hasStart && hasEnd
      ? `?${new URLSearchParams({ startDate, endDate }).toString()}`
      : ''
    const data = await apiRequest(`/public/finance/report${query}`, { signal })
    if (!data || !['ready', 'unavailable'].includes(data.status)) {
      throw new Error('Format data laporan keuangan API tidak sesuai kontrak.')
    }
    return {
      ...data,
      months: Array.isArray(data.months)
        ? data.months.map((item) => (typeof item === 'string' ? item : item.id))
        : [],
    }
  }

  const range = {
    startDate: startDate ?? DEFAULT_REPORT_RANGE.startDate,
    endDate: endDate ?? DEFAULT_REPORT_RANGE.endDate,
  }
  validateReportRange(range)
  // Jeda singkat khusus mock agar status pemuatan dapat diperiksa.
  await new Promise((resolve) => setTimeout(resolve, 150))
  signal?.throwIfAborted()
  return calculateReport(structuredClone(mockReport), range)
}
