import { Router } from 'express'
import { createHealthController } from '../controllers/healthController.js'

export function createHealthRoutes(healthController = createHealthController()) {
  const healthRoutes = Router()

  healthRoutes.get('/health', healthController.getHealth)
  healthRoutes.get('/health/db', healthController.getDatabaseHealth)

  return healthRoutes
}

export default createHealthRoutes()
