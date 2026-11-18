import { Router } from 'express'
import { createAdminFinanceController } from '../controllers/adminFinanceController.js'
import { createAdminManagementController } from '../controllers/adminManagementController.js'
import { createAdminSettingsController } from '../controllers/adminSettingsController.js'
import { createRateLimiter } from '../middlewares/rateLimiter.js'

export function createAdminRoutes({
  adminFinanceController = createAdminFinanceController(),
  adminSettingsController = createAdminSettingsController(),
  adminManagementController = createAdminManagementController(),
  loginRateLimiter = createRateLimiter(),
} = {}) {
  const router = Router()

  router.post('/auth/login', loginRateLimiter, adminManagementController.login)
  router.post('/auth/logout', adminManagementController.logout)

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

  router.get('/profile', adminSettingsController.getProfile)
  router.put('/profile', adminSettingsController.updateProfile)

  router.get('/agenda', adminSettingsController.getAgenda)

  router.get('/donation-settings', adminSettingsController.getDonationSettings)
  router.put('/donation-settings', adminSettingsController.updateDonationSettings)

  router.get('/website-settings', adminSettingsController.getWebsiteSettings)
  router.put('/website-settings', adminSettingsController.updateWebsiteSettings)

  router.get('/accounts', adminManagementController.listAccounts)
  router.get('/report-access', adminManagementController.getReportAccess)
  router.get('/activity-logs', adminManagementController.listActivityLogs)

  return router
}

export default createAdminRoutes()

