import { mockAdminActivityLog } from '../mocks/adminActivityLog.js'
import { dataSource } from '../utils/env.js'

export async function getAdminActivityLog({ signal } = {}) {
  signal?.throwIfAborted()
  if (dataSource !== 'mock') throw new Error('Activity Log melalui API belum tersedia. Gunakan mode mock untuk meninjau aktivitas contoh.')
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
