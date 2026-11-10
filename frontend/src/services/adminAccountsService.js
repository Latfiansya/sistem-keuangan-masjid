import { mockAdminAccounts } from '../mocks/adminAccounts.js'
import { dataSource } from '../utils/env.js'

export async function getAdminAccounts({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') throw new Error('Manajemen akun admin melalui API belum tersedia. Gunakan mode mock untuk meninjau daftar contoh.')
  return structuredClone(mockAdminAccounts)
}

export function filterAdminAccounts(accounts, query) {
  const term = query.trim().toLowerCase()
  return accounts.filter((account) => account.name.toLowerCase().includes(term) || account.email.toLowerCase().includes(term))
}
