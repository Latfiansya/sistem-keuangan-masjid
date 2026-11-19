import { mockAdminActivityLog } from '../mocks/adminActivityLog.js'
import { apiRequest } from '../utils/apiClient.js'
import { dataSource } from '../utils/env.js'

export async function getAdminActivityLog({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') {
    const data = await apiRequest('/admin/activity-logs', { signal })
    if (!data || !Array.isArray(data.activities)) {
      throw new Error('Format data Activity Log API tidak sesuai kontrak.')
    }
    return data.activities
  }
  return structuredClone(mockAdminActivityLog)
}

export function filterAdminActivities(activities, { admin = '', type = '', date = '', module = '', query = '' } = {}) {
  const term = query.trim().toLowerCase()
  return activities.filter((activity) => (!admin || activity.admin === admin) && (!type || activity.type === type) && (!date || activity.date === date) && (!module || activity.module === module) && (!term || activity.admin.toLowerCase().includes(term) || activity.title.toLowerCase().includes(term)))
}

export function groupAdminActivities(activities) {
  const groups = new Map()
  for (const activity of activities) {
    if (!groups.has(activity.date)) groups.set(activity.date, [])
    groups.get(activity.date).push(activity)
  }
  return [...groups].sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => ({ date, items }))
}

export function getAdminActivityTarget(activity, transactions = []) {
  const topic = `${activity.module || ''} ${activity.title || ''}`.toLowerCase()
  if (typeof activity.transactionId === 'string' && transactions.some((transaction) => transaction.id === activity.transactionId)) return `/admin/laporan/transaksi/${encodeURIComponent(activity.transactionId)}`
  if (activity.type === 'code' || /kode (akses|gate)|sandi laporan/.test(topic)) return '/admin/kode-akses-laporan'
  if (['account', 'disable'].includes(activity.type) || /akun/.test(topic)) return '/admin/kelola-akun'
  if (/kategori/.test(topic)) return '/admin/kategori-dana'
  if (/profil/.test(topic)) return '/admin/profil-masjid'
  if (/agenda/.test(topic)) return '/admin/agenda'
  if (/donasi/.test(topic) && !/keuangan|transaksi/.test(activity.module?.toLowerCase() || '')) return '/admin/donasi'
  if (/kontak/.test(topic)) return '/admin/kontak-pengaturan'
  if (['add', 'edit', 'delete'].includes(activity.type) && /keuangan|transaksi|pemasukan|pengeluaran/.test(topic)) return '/admin/kelola-dana'
  return '/admin/activity-log'
}

export function getAdminHeaderActivities(activities, transactions = []) {
  return [...activities]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`) || a.id.localeCompare(b.id))
    .slice(0, 5)
    .map(({ id, admin, title, date, time, module, ...activity }) => ({ id, admin, title, date, time, module, to: getAdminActivityTarget({ ...activity, module, title }, transactions) }))
}
