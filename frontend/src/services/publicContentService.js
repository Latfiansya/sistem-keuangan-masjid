import { mockPublicContent } from '../mocks/publicContent.js'
import { getAgenda } from './agendaService.js'
import { dataSource } from '../utils/env.js'

export async function getPublicContent({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    throw new Error('Konten publik melalui API belum tersedia. Gunakan mode mock untuk meninjau halaman publik.')
  }
  return { ...structuredClone(mockPublicContent), agenda: await getAgenda({ signal }) }
}
