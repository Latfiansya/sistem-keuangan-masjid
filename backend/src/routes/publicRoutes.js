import { Router } from 'express'
import { createPublicController } from '../controllers/publicController.js'

export function createPublicRoutes({
  publicController = createPublicController(),
  reportController,
  passwordRateLimiter,
}) {
  const publicRoutes = Router()

  publicRoutes.get('/content', publicController.getContent)
  publicRoutes.get('/agenda', publicController.getAgenda)
  publicRoutes.post('/report/check-password', passwordRateLimiter, reportController.postCheckPassword)
  publicRoutes.get('/finance/report', reportController.getReport)

  return publicRoutes
}
