import { defaultAdminFinanceService } from '../services/adminFinanceService.js'

function buildInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'AD'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

// Presentation layer untuk dashboard, kategori dana, laporan keuangan, dan transaksi pengurus.
export function createAdminFinanceController(service = defaultAdminFinanceService) {
  return {
    async getDashboard(req, res, next) {
      try {
        const data = await service.getDashboardSummary()
        if (req.adminUser) {
          data.account = {
            id: req.adminUser.id,
            name: req.adminUser.name,
            email: req.adminUser.email,
            role: req.adminUser.role,
            initials: buildInitials(req.adminUser.name),
          }
        }
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async listCategories(_req, res, next) {
      try {
        const data = await service.listCategories()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async createCategory(req, res, next) {
      try {
        const data = await service.createCategory(req.body, req.adminUser?.id ?? null)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateCategory(req, res, next) {
      try {
        const data = await service.updateCategory(req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async deleteCategory(req, res, next) {
      try {
        const data = await service.deleteCategory(req.params.id, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async getFinanceReport(req, res, next) {
      try {
        const data = await service.getFinanceReport(req.query)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async getTransactionById(req, res, next) {
      try {
        const data = await service.getTransactionById(req.params.id)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async createTransaction(req, res, next) {
      try {
        const data = await service.createTransaction(req.body, req.adminUser?.id ?? null)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateTransaction(req, res, next) {
      try {
        const data = await service.updateTransaction(req.params.id, req.body, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async deleteTransaction(req, res, next) {
      try {
        const data = await service.deleteTransaction(req.params.id, req.adminUser?.id ?? null)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}
