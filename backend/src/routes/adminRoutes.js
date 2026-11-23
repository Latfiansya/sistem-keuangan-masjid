import express, { Router } from 'express'
import { createAdminFinanceController } from '../controllers/adminFinanceController.js'
import { createAdminManagementController } from '../controllers/adminManagementController.js'
import { createAdminSettingsController } from '../controllers/adminSettingsController.js'
import { createFileController } from '../controllers/fileController.js'
import { createProfileContentController } from '../controllers/profileContentController.js'
import { createRateLimiter } from '../middlewares/rateLimiter.js'
import { createRequireAdminAuth } from '../middlewares/requireAdminAuth.js'

export function createAdminRoutes({
  adminFinanceController = createAdminFinanceController(),
  adminSettingsController = createAdminSettingsController(),
  adminManagementController = createAdminManagementController(),
  profileContentController = createProfileContentController(),
  fileController = createFileController(),
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

  router.get('/transactions/:id', adminFinanceController.getTransactionById)
  router.post('/transactions', adminFinanceController.createTransaction)
  router.put('/transactions/:id', adminFinanceController.updateTransaction)
  router.delete('/transactions/:id', adminFinanceController.deleteTransaction)

  router.get('/profile', adminSettingsController.getProfile)
  router.put('/profile', adminSettingsController.updateProfile)

  // Unggah berkas dikirim sebagai body biner; batas 5 MB, batas per jenis diperiksa di service.
  const rawImageBody = express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '5mb' })
  router.put('/files/:target', rawImageBody, fileController.upload)
  router.delete('/files/:target', fileController.remove)

  router.get('/profile-content', profileContentController.list)
  router.post('/profile-content/:section', profileContentController.create)
  router.put('/profile-content/:section/:id', profileContentController.update)
  router.delete('/profile-content/:section/:id', profileContentController.remove)

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

