import { defaultAdminManagementRepository } from '../repositories/adminManagementRepository.js'
import { createHttpError } from '../utils/httpError.js'

function hasControlChars(value) {
  return [...String(value)].some((character) => {
    const code = character.codePointAt(0)
    return code < 32 || code === 127
  })
}

function groupActivitiesByDate(activities) {
  const groups = new Map()
  for (const activity of activities) {
    if (!groups.has(activity.date)) groups.set(activity.date, [])
    groups.get(activity.date).push(activity)
  }
  return [...groups]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

function resolveActivityTarget(activity) {
  const topic = `${activity.module || ''} ${activity.title || ''}`.toLowerCase()
  if (activity.type === 'code' || /kode (akses|gate)|sandi laporan/.test(topic)) {
    return '/admin/kode-akses-laporan'
  }
  if (['account', 'disable'].includes(activity.type) || /akun/.test(topic)) {
    return '/admin/kelola-akun'
  }
  if (/kategori/.test(topic)) return '/admin/kategori-dana'
  if (/profil/.test(topic)) return '/admin/profil-masjid'
  if (/agenda/.test(topic)) return '/admin/agenda'
  if (/donasi/.test(topic) && !/keuangan|transaksi/.test(activity.module?.toLowerCase() || '')) {
    return '/admin/donasi'
  }
  if (/kontak/.test(topic)) return '/admin/kontak-pengaturan'
  if (
    ['add', 'edit', 'delete'].includes(activity.type) &&
    /keuangan|transaksi|pemasukan|pengeluaran/.test(topic)
  ) {
    return '/admin/kelola-dana'
  }
  return '/admin/activity-log'
}

// Business logic layer untuk autentikasi stub, akun pengurus, status kode akses, dan activity log.
export function createAdminManagementService(repository = defaultAdminManagementRepository) {
  return {
    async loginAdmin(payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload login tidak valid.')
      }

      const { email, password } = payload
      if (typeof email !== 'string' || !email.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Email wajib diisi.')
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || hasControlChars(email)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Masukkan alamat email yang valid.')
      }

      if (typeof password !== 'string' || !password.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Password wajib diisi.')
      }
      if (hasControlChars(password)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Password tidak boleh mengandung karakter kontrol.')
      }

      // Autentikasi sesi/JWT pengurus menunggu penyepakatan mekanisme token/session lintas tim.
      throw createHttpError(
        503,
        'SERVICE_UNAVAILABLE',
        'Login pengurus belum tersedia. Silakan hubungi tim pengelola untuk informasi akses.'
      )
    },

    async logoutAdmin() {
      return { loggedOut: true }
    },

    async listAccounts(queryParams = {}) {
      const accounts = await repository.findAccounts()
      const rawQuery = queryParams.query
      if (rawQuery !== undefined && typeof rawQuery !== 'string') {
        throw createHttpError(400, 'BAD_REQUEST', 'Parameter pencarian akun tidak valid.')
      }

      const term = typeof rawQuery === 'string' ? rawQuery.trim().toLowerCase() : ''
      const filtered = term
        ? accounts.filter(
            (account) =>
              account.name.toLowerCase().includes(term) ||
              account.email.toLowerCase().includes(term)
          )
        : accounts

      return {
        accounts: filtered,
        totalCount: accounts.length,
        filteredCount: filtered.length,
      }
    },

    async getReportAccessStatus() {
      return repository.findReportAccessStatus()
    },

    async listActivityLogs(queryParams = {}) {
      const admin = typeof queryParams.admin === 'string' ? queryParams.admin.trim() : ''
      const type = typeof queryParams.type === 'string' ? queryParams.type.trim() : ''
      const date = typeof queryParams.date === 'string' ? queryParams.date.trim() : ''
      const moduleName = typeof queryParams.module === 'string' ? queryParams.module.trim() : ''
      const query = typeof queryParams.query === 'string' ? queryParams.query.trim() : ''

      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Format filter tanggal harus YYYY-MM-DD.')
      }

      const { activities, totalCount } = await repository.findActivityLogs({
        admin,
        type,
        date,
        moduleName,
        query,
      })

      const groups = groupActivitiesByDate(activities)
      const headerNotifications = [...activities]
        .sort(
          (a, b) =>
            `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`) || a.id.localeCompare(b.id)
        )
        .slice(0, 5)
        .map((activity) => ({
          id: activity.id,
          admin: activity.admin,
          title: activity.title,
          date: activity.date,
          time: activity.time,
          module: activity.module,
          to: resolveActivityTarget(activity),
        }))

      return {
        activities,
        groups,
        headerNotifications,
        totalCount,
        filteredCount: activities.length,
      }
    },
  }
}

export const defaultAdminManagementService = createAdminManagementService()
