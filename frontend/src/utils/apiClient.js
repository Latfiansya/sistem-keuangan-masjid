import { apiBaseUrl } from './env.js'

/**
 * Helper permintaan HTTP JSON terpusat untuk mode API (`VITE_DATA_SOURCE=api`).
 * Otomatis menyertakan cookie sesi (`credentials: 'include'`) dan membaca envelope proyek.
 */
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  signal?.throwIfAborted()

  const headers = {}
  const init = {
    method,
    credentials: 'include',
    signal,
    headers,
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, init)
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw error
    throw new Error('Tidak dapat terhubung ke API. Periksa apakah backend berjalan.')
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('Respons API bukan JSON yang valid.')
  }

  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || 'Permintaan ke API gagal.')
    error.status = response.status
    error.code = payload?.error?.code || null
    throw error
  }

  return payload.data
}

/**
 * Mengunggah satu berkas gambar sebagai body biner (bukan multipart) ke API pengurus.
 */
export async function apiUpload(path, file, { signal } = {}) {
  signal?.throwIfAborted()
  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'PUT',
      credentials: 'include',
      signal,
      headers: { 'Content-Type': file.type },
      body: file,
    })
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw error
    throw new Error('Tidak dapat terhubung ke API. Periksa apakah backend berjalan.')
  }
  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error(response.status === 413 ? 'Ukuran berkas melebihi batas maksimum.' : 'Respons API bukan JSON yang valid.')
  }
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || 'Unggah berkas gagal.')
    error.status = response.status
    error.code = payload?.error?.code || null
    throw error
  }
  return payload.data
}
