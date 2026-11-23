import { Router } from 'express'
import { createAdminFinanceController } from '../controllers/adminFinanceController.js'
import { createAdminManagementController } from '../controllers/adminManagementController.js'
import { createAdminSettingsController } from '../controllers/adminSettingsController.js'
import { createRateLimiter } from '../middlewares/rateLimiter.js'
import { createRequireAdminAuth } from '../middlewares/requireAdminAuth.js'
import { createTransferController } from '../controllers/transferController.js'

export function createAdminRoutes({
  adminFinanceController = createAdminFinanceController(),
  transferController = createTransferController(),
  adminSettingsController = createAdminSettingsController(),
  adminManagementController = createAdminManagementController(),
  loginRateLimiter = createRateLimiter(),
  requireAdminAuth = createRequireAdminAuth(),
} = {}) {
  const router = Router()

  router.post('/auth/login', loginRateLimiter, adminManagementController.login)
  router.post('/auth/logout', adminManagementController.logout)

  router.use(requireAdminAuth)
  router.get('/auth/me', adminManagementController.me)

  router.get('/dashboard', adminFinanceController.getDashboard)

  router.get('/categories', adminFinanceController.listCategories)
  router.post('/categories', adminFinanceController.createCategory)
  router.put('/categories/:id', adminFinanceController.updateCategory)
  router.delete('/categories/:id', adminFinanceController.deleteCategory)

  router.get('/finance/report', adminFinanceController.getFinanceReport)

  router.get('/transfers', transferController.list)
  router.post('/transfers', transferController.create)
  router.delete('/transfers/:id', transferController.remove)

  router.get('/transactions/:id', adminFinanceController.getTransactionById)
  router.post('/transactions', adminFinanceController.createTransaction)
  router.put('/transactions/:id', adminFinanceController.updateTransaction)
  router.delete('/transactions/:id', adminFinanceController.deleteTransaction)

  router.get('/profile', adminSettingsController.getProfile)
  router.put('/profile', adminSettingsController.updateProfile)

  router.get('/agenda', adminSettingsController.getAgenda)
  router.post('/agenda', adminSettingsController.createAgenda)
  router.put('/agenda/:id', adminSettingsController.updateAgenda)
  router.delete('/agenda/:id', adminSettingsController.deleteAgenda)

  router.get('/donation-settings', adminSettingsController.getDonationSettings)
  router.put('/donation-settings', adminSettingsController.updateDonationSettings)

  router.get('/website-settings', adminSettingsController.getWebsiteSettings)
  router.put('/website-settings', adminSettingsController.updateWebsiteSettings)

  router.get('/accounts', adminManagementController.listAccounts)
  router.post('/accounts', adminManagementController.createAccount)
  router.put('/accounts/:id', adminManagementController.updateAccount)
  router.patch('/accounts/:id/status', adminManagementController.setAccountStatus)
  router.delete('/accounts/:id', adminManagementController.deleteAccount)
  router.get('/report-access', adminManagementController.getReportAccess)
  router.put('/report-access', adminManagementController.updateReportAccess)
  router.get('/activity-logs', adminManagementController.listActivityLogs)

  return router
}

export default createAdminRoutes()

