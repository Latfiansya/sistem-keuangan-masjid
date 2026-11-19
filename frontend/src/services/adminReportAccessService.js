import { mockAdminReportAccess } from '../mocks/adminReportAccess.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export async function getAdminReportAccessStatus({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/report-access', { signal })
    if (!data || typeof data.active !== 'boolean') {
      throw new Error('Format status kode akses API tidak sesuai kontrak.')
    }
    return data
  }
  return structuredClone(mockAdminReportAccess)
}

export async function updateAdminReportAccess({ code, publicReportEnabled }, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Perubahan kode akses hanya tersedia pada mode API.')
  return apiRequest('/admin/report-access', {
    method: 'PUT',
    body: {
      code,
      ...(typeof publicReportEnabled === 'boolean' ? { publicReportEnabled } : {}),
    },
    signal,
  })
}
