import { defaultAdminManagementRepository } from '../repositories/adminManagementRepository.js'
import { hashAccountPassword, signAdminToken, verifyAccountPassword } from '../utils/adminAuth.js'
import { createHttpError } from '../utils/httpError.js'
import { hashPassword } from '../utils/passwordHash.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_ROLES = ['Admin', 'Super Admin']

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

// Business logic layer untuk autentikasi pengurus, daftar akun, status kode akses, dan activity log.
export function createAdminManagementService(
  repository = defaultAdminManagementRepository,
  { authSecret = '', authTokenTtlMs = 8 * 60 * 60 * 1000 } = {}
) {
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

      if (
        typeof repository.findUserForLoginByEmail !== 'function' ||
        typeof authSecret !== 'string' ||
        authSecret.length < 32
      ) {
        throw createHttpError(
          503,
          'SERVICE_UNAVAILABLE',
          'Konfigurasi autentikasi server belum siap.'
        )
      }

      const account = await repository.findUserForLoginByEmail(email.trim())
      const passwordValid = account
        ? await verifyAccountPassword(password, account.password)
        : false

      if (!account || !passwordValid) {
        throw createHttpError(401, 'UNAUTHORIZED', 'Email atau password tidak sesuai.')
      }

      if (account.status !== 'Aktif') {
        throw createHttpError(403, 'FORBIDDEN', 'Akun pengurus sedang dinonaktifkan.')
      }

      const user = {
        id: String(account.id),
        name: account.nama,
        email: account.email,
        role: account.role,
      }
      const { token, expiresAt } = signAdminToken(user, authSecret, authTokenTtlMs)

      return { token, expiresAt, user }
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

    async createAccount(payload, auditUserId = null) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload akun pengurus tidak valid.')
      }

      const rawName = payload.name
      if (typeof rawName !== 'string' || !rawName.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama pengurus wajib diisi.')
      }
      const name = rawName.trim()
      if (name.length > 100 || hasControlChars(rawName)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Nama pengurus tidak boleh mengandung karakter kontrol atau melebihi 100 karakter.'
        )
      }

      if (typeof payload.email !== 'string' || !payload.email.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Email wajib diisi.')
      }
      const email = payload.email.trim().toLowerCase()
      if (!EMAIL_PATTERN.test(email) || email.length > 150 || hasControlChars(payload.email)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Masukkan alamat email yang valid.')
      }

      if (typeof payload.password !== 'string' || !payload.password.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Password wajib diisi.')
      }
      if (payload.password.length < 8 || payload.password.length > 128 || hasControlChars(payload.password)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Password minimal 8 karakter, maksimal 128 karakter, dan tanpa karakter kontrol.'
        )
      }

      const role = payload.role ?? 'Admin'
      if (!ALLOWED_ROLES.includes(role)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Role akun harus Admin atau Super Admin.')
      }

      const active = payload.active ?? true
      if (typeof active !== 'boolean') {
        throw createHttpError(400, 'BAD_REQUEST', 'Status aktif akun harus berupa boolean.')
      }

      const accounts = await repository.findAccounts()
      if (accounts.some((item) => item.email.toLowerCase() === email)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Email sudah terdaftar pada akun lain.')
      }

      const passwordHash = await hashAccountPassword(payload.password)
      return repository.insertAccount({ name, email, passwordHash, role, active }, auditUserId)
    },

    async updateAccount(id, payload, auditUserId = null) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload pembaruan akun tidak valid.')
      }

      const existing = await repository.findAccountById(id)
      if (!existing) {
        throw createHttpError(404, 'NOT_FOUND', 'Akun pengurus tidak ditemukan.')
      }

      const rawName = payload.name !== undefined ? payload.name : existing.name
      if (typeof rawName !== 'string' || !rawName.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Nama pengurus wajib diisi.')
      }
      const name = rawName.trim()
      if (name.length > 100 || hasControlChars(rawName)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Nama pengurus tidak boleh mengandung karakter kontrol atau melebihi 100 karakter.'
        )
      }

      const rawEmail = payload.email !== undefined ? payload.email : existing.email
      if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Email wajib diisi.')
      }
      const email = rawEmail.trim().toLowerCase()
      if (!EMAIL_PATTERN.test(email) || email.length > 150 || hasControlChars(rawEmail)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Masukkan alamat email yang valid.')
      }

      const role = payload.role !== undefined ? payload.role : existing.role
      if (!ALLOWED_ROLES.includes(role)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Role akun harus Admin atau Super Admin.')
      }

      const active = payload.active !== undefined ? payload.active : existing.active
      if (typeof active !== 'boolean') {
        throw createHttpError(400, 'BAD_REQUEST', 'Status aktif akun harus berupa boolean.')
      }

      if (auditUserId && String(auditUserId) === String(existing.id) && active === false) {
        throw createHttpError(400, 'BAD_REQUEST', 'Anda tidak dapat menonaktifkan akun Anda sendiri.')
      }

      const accounts = await repository.findAccounts()
      if (accounts.some((item) => item.id !== existing.id && item.email.toLowerCase() === email)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Email sudah terdaftar pada akun lain.')
      }

      let passwordHash
      if (payload.password !== undefined && payload.password !== '') {
        if (
          typeof payload.password !== 'string' ||
          payload.password.length < 8 ||
          payload.password.length > 128 ||
          hasControlChars(payload.password)
        ) {
          throw createHttpError(
            400,
            'BAD_REQUEST',
            'Password baru minimal 8 karakter, maksimal 128 karakter, dan tanpa karakter kontrol.'
          )
        }
        passwordHash = await hashAccountPassword(payload.password)
      }

      const updated = await repository.updateAccountById(
        id,
        { name, email, passwordHash, role, active },
        auditUserId
      )
      if (!updated) {
        throw createHttpError(404, 'NOT_FOUND', 'Akun pengurus tidak ditemukan.')
      }
      return updated
    },

    async setAccountStatus(id, payload, auditUserId = null) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || typeof payload.active !== 'boolean') {
        throw createHttpError(400, 'BAD_REQUEST', 'Status akun (active) harus berupa boolean.')
      }

      const existing = await repository.findAccountById(id)
      if (!existing) {
        throw createHttpError(404, 'NOT_FOUND', 'Akun pengurus tidak ditemukan.')
      }

      if (auditUserId && String(auditUserId) === String(existing.id) && payload.active === false) {
        throw createHttpError(400, 'BAD_REQUEST', 'Anda tidak dapat menonaktifkan akun Anda sendiri.')
      }

      const updated = await repository.updateAccountStatusById(id, payload.active, auditUserId)
      if (!updated) {
        throw createHttpError(404, 'NOT_FOUND', 'Akun pengurus tidak ditemukan.')
      }
      return updated
    },

    async deleteAccount(id, auditUserId = null) {
      const existing = await repository.findAccountById(id)
      if (!existing) {
        throw createHttpError(404, 'NOT_FOUND', 'Akun pengurus tidak ditemukan.')
      }

      if (auditUserId && String(auditUserId) === String(existing.id)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Anda tidak dapat menghapus akun Anda sendiri.')
      }

      const deleted = await repository.deleteAccountById(id, auditUserId)
      if (!deleted) {
        throw createHttpError(404, 'NOT_FOUND', 'Akun pengurus tidak ditemukan.')
      }
      return { deletedId: existing.id }
    },

    async updateReportAccess(payload, auditUserId = null) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw createHttpError(400, 'BAD_REQUEST', 'Payload kode akses laporan tidak valid.')
      }

      const rawCode = payload.code ?? payload.password
      if (typeof rawCode !== 'string' || !rawCode.trim()) {
        throw createHttpError(400, 'BAD_REQUEST', 'Kode akses baru wajib diisi.')
      }
      if (rawCode.length < 6 || rawCode.length > 128 || hasControlChars(rawCode)) {
        throw createHttpError(
          400,
          'BAD_REQUEST',
          'Kode akses minimal 6 karakter, maksimal 128 karakter, dan tanpa karakter kontrol.'
        )
      }

      if (payload.publicReportEnabled !== undefined && typeof payload.publicReportEnabled !== 'boolean') {
        throw createHttpError(400, 'BAD_REQUEST', 'Status visibilitas laporan publik harus berupa boolean.')
      }

      const codeHash = hashPassword(rawCode)
      return repository.saveReportAccessCode(
        { codeHash, publicReportEnabled: payload.publicReportEnabled },
        auditUserId
      )
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
