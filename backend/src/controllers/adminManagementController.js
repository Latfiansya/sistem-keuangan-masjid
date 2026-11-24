import { defaultAdminManagementService } from '../services/adminManagementService.js'
import { ADMIN_SESSION_COOKIE } from '../utils/adminAuth.js'
import { createHttpError } from '../utils/httpError.js'

function assertSuperAdminIfAuthenticated(req) {
  if (req.adminUser && req.adminUser.role !== 'Super Admin') {
    throw createHttpError(
      403,
      'FORBIDDEN',
      'Hanya Super Admin yang dapat mengelola akun pengurus.'
    )
  }
}

// Presentation layer untuk autentikasi pengurus, kelola akun, status kode akses, dan activity log.
export function createAdminManagementController(
  service = defaultAdminManagementService,
  { nodeEnv = 'development', authTokenTtlMs = 8 * 60 * 60 * 1000 } = {}
) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: nodeEnv === 'production',
    path: '/',
  }

  return {
    async login(req, res, next) {
      try {
        const data = await service.loginAdmin(req.body)
        res.cookie(ADMIN_SESSION_COOKIE, data.token, {
          ...cookieOptions,
          maxAge: authTokenTtlMs,
        })
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async logout(_req, res, next) {
      try {
        const data = await service.logoutAdmin()
        res.clearCookie(ADMIN_SESSION_COOKIE, cookieOptions)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    me(req, res, next) {
      try {
        res.status(200).json({ success: true, data: { user: req.adminUser } })
      } catch (error) {
        next(error)
      }
    },

    async listAccounts(req, res, next) {
      try {
        assertSuperAdminIfAuthenticated(req)
        const data = await service.listAccounts(req.query)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async createAccount(req, res, next) {
      try {
        assertSuperAdminIfAuthenticated(req)
        const data = await service.createAccount(req.body, req.adminUser?.id ?? null)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateAccount(req, res, next) {
      try {
        assertSuperAdminIfAuthenticated(req)
        const data = await service.updateAccount(req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async setAccountStatus(req, res, next) {
      try {
        assertSuperAdminIfAuthenticated(req)
        const data = await service.setAccountStatus(req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async deleteAccount(req, res, next) {
      try {
        assertSuperAdminIfAuthenticated(req)
        const data = await service.deleteAccount(req.params.id, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async getReportAccess(_req, res, next) {
      try {
        const data = await service.getReportAccessStatus()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateReportAccess(req, res, next) {
      try {
        const data = await service.updateReportAccess(req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async listActivityLogs(req, res, next) {
      try {
        const data = await service.listActivityLogs(req.query)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}
