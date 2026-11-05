import { mockPublicContent } from '../mocks/publicContent.js'
import { dataSource } from '../utils/env.js'

export async function getPublicContent({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    throw new Error('Konten publik melalui API belum tersedia. Gunakan mode mock untuk meninjau Beranda.')
  }
  return structuredClone(mockPublicContent)
}
