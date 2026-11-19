import { extractAdminToken, verifyAdminToken } from '../utils/adminAuth.js'
import { createHttpError } from '../utils/httpError.js'

// Middleware autentikasi admin: membaca Bearer token / cookie sesi dan menegakkan akses bila wajib.
export function createRequireAdminAuth({ adminAuthRequired = false, authSecret = '' } = {}) {
  return function requireAdminAuth(req, _res, next) {
    const token = extractAdminToken(req)
    const user = token ? verifyAdminToken(token, authSecret) : null

    if (user) {
      req.adminUser = user
      next()
      return
    }

    if (adminAuthRequired || req.path === '/auth/me') {
      next(
        createHttpError(
          401,
          'UNAUTHORIZED',
          'Sesi login pengurus tidak valid atau telah berakhir. Silakan masuk kembali.'
        )
      )
      return
    }

    req.adminUser = null
    next()
  }
}
