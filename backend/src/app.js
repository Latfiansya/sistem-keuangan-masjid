import express from 'express'
import { loadEnv, normalizeBasePath } from './config/env.js'
import { createReportController } from './controllers/reportController.js'
import { createRateLimiter } from './middlewares/rateLimiter.js'
import healthRoutes from './routes/healthRoutes.js'
import { createPublicRoutes } from './routes/publicRoutes.js'

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

  const app = express()
  const reportController = createReportController({ reportPasswordHash })
  const passwordRateLimiter = createRateLimiter({
    windowMs: rateLimitWindowMs,
    maxAttempts: rateLimitMax,
  })

  app.disable('x-powered-by')
  app.use(express.json({ limit: jsonLimit }))

  app.use(apiBasePath || '/', healthRoutes)
  app.use(`${apiBasePath}/public`, createPublicRoutes({ reportController, passwordRateLimiter }))

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
