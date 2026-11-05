import { mockHealth } from '../mocks/health.js'
import { apiBaseUrl, dataSource } from '../utils/env.js'

export async function getHealth({ signal } = {}) {
  if (dataSource === 'mock') return { ...mockHealth, source: 'mock' }

  let response
  try {
    response = await fetch(`${apiBaseUrl}/health`, { signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new Error('Tidak dapat terhubung ke API. Periksa apakah backend berjalan.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('Respons API bukan JSON yang valid.')
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message || 'Permintaan ke API gagal.')
  }
  if (payload.data?.status !== 'ok') {
    throw new Error('Format respons health API tidak sesuai kontrak.')
  }

  return { ...payload.data, source: 'api' }
}
