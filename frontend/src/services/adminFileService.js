import { apiRequest, apiUpload } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export { resolveUploadedImage } from '../utils/uploadedImage.js'

export async function uploadAdminFile(target, file, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Unggah berkas hanya tersedia pada mode API.')
  return apiUpload(`/admin/files/${encodeURIComponent(target)}`, file, { signal })
}

export async function removeAdminFile(target, { signal } = {}) {
  if (dataSource === 'mock') throw new Error('Hapus berkas hanya tersedia pada mode API.')
  return apiRequest(`/admin/files/${encodeURIComponent(target)}`, { method: 'DELETE', signal })
}
