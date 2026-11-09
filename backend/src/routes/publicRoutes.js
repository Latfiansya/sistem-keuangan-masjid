import { Router } from 'express'
import { getAgenda, getContent } from '../controllers/publicController.js'

export function createPublicRoutes({ reportController, passwordRateLimiter }) {
  const publicRoutes = Router()

  publicRoutes.get('/content', getContent)
  publicRoutes.get('/agenda', getAgenda)
  publicRoutes.post('/report/check-password', passwordRateLimiter, reportController.postCheckPassword)
  publicRoutes.get('/finance/report', reportController.getReport)

  return publicRoutes
}
