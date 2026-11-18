import { defaultAdminManagementService } from '../services/adminManagementService.js'

// Presentation layer untuk autentikasi pengurus, kelola akun, status kode akses, dan activity log.
export function createAdminManagementController(service = defaultAdminManagementService) {
  return {
    async login(req, res, next) {
      try {
        const data = await service.loginAdmin(req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async logout(_req, res, next) {
      try {
        const data = await service.logoutAdmin()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async listAccounts(req, res, next) {
      try {
        const data = await service.listAccounts(req.query)
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
