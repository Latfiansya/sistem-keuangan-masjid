import { mockAgenda } from '../mocks/agenda.js'
import { dataSource } from '../utils/env.js'

export async function getAgenda({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    throw new Error('Agenda melalui API belum tersedia. Gunakan mode mock untuk meninjau kegiatan.')
  }
  const agenda = structuredClone(mockAgenda)
  const count = (id) => agenda.groups.find((group) => group.id === id)?.items.length || 0
  return {
    ...agenda,
    counts: [
      { label: 'Total Kegiatan', value: agenda.groups.reduce((total, group) => total + group.items.length, 0) },
      { label: 'Rutin Mingguan', value: count('weekly') },
      { label: 'PHBI / Tahunan', value: count('yearly') },
    ],
  }
}
