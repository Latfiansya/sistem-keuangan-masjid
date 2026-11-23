import express from 'express'
import { getDefaultDatabasePool } from './config/database.js'
import { loadEnv, normalizeBasePath } from './config/env.js'
import { createAdminFinanceController } from './controllers/adminFinanceController.js'
import { createAdminManagementController } from './controllers/adminManagementController.js'
import { createAdminSettingsController } from './controllers/adminSettingsController.js'
import { createHealthController } from './controllers/healthController.js'
import { createPublicController } from './controllers/publicController.js'
import { createReportController } from './controllers/reportController.js'
import { createTransferController } from './controllers/transferController.js'
import { createRateLimiter } from './middlewares/rateLimiter.js'
import { createRequireAdminAuth } from './middlewares/requireAdminAuth.js'
import { createSecurityMiddleware } from './middlewares/securityHeaders.js'
import { createAdminFinanceRepository } from './repositories/adminFinanceRepository.js'
import { createAdminManagementRepository } from './repositories/adminManagementRepository.js'
import { createAdminSettingsRepository } from './repositories/adminSettingsRepository.js'
import { createAgendaRepository } from './repositories/agendaRepository.js'
import { createFinanceReportRepository } from './repositories/financeReportRepository.js'
import { createPublicContentRepository } from './repositories/publicContentRepository.js'
import { createTransferRepository } from './repositories/transferRepository.js'
import { createAdminRoutes } from './routes/adminRoutes.js'
import { createHealthRoutes } from './routes/healthRoutes.js'
import { createPublicRoutes } from './routes/publicRoutes.js'
import { createAdminFinanceService } from './services/adminFinanceService.js'
import { createAdminManagementService } from './services/adminManagementService.js'
import { createAdminSettingsService } from './services/adminSettingsService.js'
import { createAgendaService } from './services/agendaService.js'
import { createPublicContentService } from './services/publicContentService.js'
import { createReportService } from './services/reportService.js'
import { createTransferService } from './services/transferService.js'

export function createApp(overrides = {}) {
  const config = loadEnv()
  const apiBasePath = overrides.apiBasePath !== undefined
    ? normalizeBasePath(overrides.apiBasePath)
    : config.apiBasePath
  const jsonLimit = overrides.jsonLimit ?? config.jsonLimit
  const reportPasswordHash = overrides.reportPasswordHash !== undefined
    ? overrides.reportPasswordHash
    : config.reportPasswordHash
  const rateLimitWindowMs = overrides.rateLimitWindowMs ?? config.rateLimitWindowMs
  const rateLimitMax = overrides.rateLimitMax ?? config.rateLimitMax
  const nodeEnv = overrides.nodeEnv ?? config.nodeEnv
  const corsOrigins = overrides.corsOrigins ?? config.corsOrigins
  const adminAuthRequired = overrides.adminAuthRequired ?? config.adminAuthRequired
  const authSecret = overrides.authSecret !== undefined ? overrides.authSecret : config.authSecret
  const authTokenTtlMs = overrides.authTokenTtlMs ?? config.authTokenTtlMs

  const dbPool = overrides.dbPool ?? getDefaultDatabasePool()
  const repos = overrides.repositories ?? {}

  const publicContentRepository = repos.publicContentRepository ?? createPublicContentRepository(dbPool)
  const agendaRepository = repos.agendaRepository ?? createAgendaRepository(dbPool)
  const financeReportRepository = repos.financeReportRepository ?? createFinanceReportRepository(dbPool)
  const adminFinanceRepository = repos.adminFinanceRepository ?? createAdminFinanceRepository(dbPool)
  const adminSettingsRepository = repos.adminSettingsRepository ?? createAdminSettingsRepository(dbPool)
  const adminManagementRepository = repos.adminManagementRepository ?? createAdminManagementRepository(dbPool)
  const transferRepository = repos.transferRepository ?? createTransferRepository(dbPool)

  const app = express()

  const healthController = createHealthController(dbPool)
  const publicContentService = createPublicContentService(publicContentRepository)
  const agendaService = createAgendaService(agendaRepository)
  const publicController = createPublicController({ publicContentService, agendaService })

  const reportService = createReportService(financeReportRepository)
  const reportController = createReportController({ reportPasswordHash, reportService })

  const passwordRateLimiter = createRateLimiter({
    windowMs: rateLimitWindowMs,
    maxAttempts: rateLimitMax,
  })
  const loginRateLimiter = createRateLimiter({
    windowMs: rateLimitWindowMs,
    maxAttempts: rateLimitMax,
  })

  const adminFinanceService = createAdminFinanceService(adminFinanceRepository)
  const adminFinanceController = createAdminFinanceController(adminFinanceService)
  const transferController = createTransferController(createTransferService(transferRepository))
  const adminSettingsService = createAdminSettingsService(adminSettingsRepository)
  const adminSettingsController = createAdminSettingsController(adminSettingsService)
  const adminManagementService = createAdminManagementService(adminManagementRepository, {
    authSecret,
    authTokenTtlMs,
  })
  const adminManagementController = createAdminManagementController(adminManagementService, {
    nodeEnv,
    authTokenTtlMs,
  })
  const requireAdminAuth = createRequireAdminAuth({ adminAuthRequired, authSecret })

  app.disable('x-powered-by')
  app.use(createSecurityMiddleware({ corsOrigins }))
  app.use(express.json({ limit: jsonLimit }))

  app.use(apiBasePath || '/', createHealthRoutes(healthController))
  app.use(
    `${apiBasePath}/public`,
    createPublicRoutes({ publicController, reportController, passwordRateLimiter })
  )
  app.use(
    `${apiBasePath}/admin`,
    createAdminRoutes({
      adminFinanceController,
      transferController,
      adminSettingsController,
      adminManagementController,
      loginRateLimiter,
      requireAdminAuth,
    })
  )

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route tidak ditemukan.' },
    })
  })

  // Empat parameter diperlukan agar Express mengenali middleware error.
  app.use((error, _req, res, _next) => {
    const isAppError = error?.isAppError === true
    const status = isAppError && error.status >= 400 && error.status < 600
      ? error.status
      : (error.status >= 400 && error.status < 500 ? error.status : 500)
    const code = isAppError
      ? error.code
      : (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST')
    const message = isAppError
      ? error.message
      : (status === 500 ? 'Terjadi kesalahan pada server.' : status === 413 ? 'Ukuran permintaan melebihi batas maksimum.' : 'Permintaan tidak valid.')

    if (!isAppError && status >= 500) {
      console.error('Kesalahan server:', error)
    } else if (isAppError && status >= 500) {
      console.warn('Peringatan konfigurasi server:', error.message)
    }

    res.status(status).json({ success: false, error: { code, message } })
  })

  return app
}

const app = createApp()
export default app
