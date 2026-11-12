import { Router } from 'express'
import { createAdminFinanceController } from '../controllers/adminFinanceController.js'

export function createAdminRoutes({
  adminFinanceController = createAdminFinanceController(),
} = {}) {
  const router = Router()

  router.get('/dashboard', adminFinanceController.getDashboard)

  router.get('/categories', adminFinanceController.listCategories)
  router.post('/categories', adminFinanceController.createCategory)
  router.put('/categories/:id', adminFinanceController.updateCategory)
  router.delete('/categories/:id', adminFinanceController.deleteCategory)

  router.get('/finance/report', adminFinanceController.getFinanceReport)

  router.get('/transactions/:id', adminFinanceController.getTransactionById)
  router.post('/transactions', adminFinanceController.createTransaction)
  router.put('/transactions/:id', adminFinanceController.updateTransaction)
  router.delete('/transactions/:id', adminFinanceController.deleteTransaction)

  return router
}

export default createAdminRoutes()

