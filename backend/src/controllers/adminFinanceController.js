import { defaultAdminFinanceService } from '../services/adminFinanceService.js'

// Presentation layer untuk dashboard, kategori dana, laporan keuangan, dan transaksi pengurus.
export function createAdminFinanceController(service = defaultAdminFinanceService) {
  return {
    getDashboard(_req, res, next) {
      try {
        const data = service.getDashboardSummary()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    listCategories(_req, res, next) {
      try {
        const data = service.listCategories()
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    createCategory(req, res, next) {
      try {
        const data = service.createCategory(req.body)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    updateCategory(req, res, next) {
      try {
        const data = service.updateCategory(req.params.id, req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    deleteCategory(req, res, next) {
      try {
        const data = service.deleteCategory(req.params.id)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    getFinanceReport(req, res, next) {
      try {
        const data = service.getFinanceReport(req.query)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    getTransactionById(req, res, next) {
      try {
        const data = service.getTransactionById(req.params.id)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    createTransaction(req, res, next) {
      try {
        const data = service.createTransaction(req.body)
        res.status(201).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    updateTransaction(req, res, next) {
      try {
        const data = service.updateTransaction(req.params.id, req.body)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },

    deleteTransaction(req, res, next) {
      try {
        const data = service.deleteTransaction(req.params.id)
        res.status(200).json({ success: true, data })
      } catch (error) {
        next(error)
      }
    },
  }
}

