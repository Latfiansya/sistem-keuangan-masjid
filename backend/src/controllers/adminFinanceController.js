import { defaultAdminFinanceService } from '../services/adminFinanceService.js'

// Presentation layer untuk dashboard, kategori dana, laporan keuangan, dan transaksi pengurus.
export function createAdminFinanceController(service = defaultAdminFinanceService) {
  return {
    async getDashboard(_req, res, next) {
      try {
        const data = await service.getDashboardSummary()
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
        const data = await service.createCategory(req.body)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateCategory(req, res, next) {
      try {
        const data = await service.updateCategory(req.params.id, req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async deleteCategory(req, res, next) {
      try {
        const data = await service.deleteCategory(req.params.id)
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
        const data = await service.createTransaction(req.body)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async updateTransaction(req, res, next) {
      try {
        const data = await service.updateTransaction(req.params.id, req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    async deleteTransaction(req, res, next) {
      try {
        const data = await service.deleteTransaction(req.params.id)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}
