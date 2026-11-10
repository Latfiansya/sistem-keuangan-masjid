import { mockAdminReportAccess } from '../mocks/adminReportAccess.js'
import { dataSource } from '../utils/env.js'

export async function getAdminReportAccessStatus({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') throw new Error('Status kode akses admin melalui API belum tersedia. Gunakan mode mock untuk meninjau tampilan.')
  return structuredClone(mockAdminReportAccess)
}
