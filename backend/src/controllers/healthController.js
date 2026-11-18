import { checkDatabaseConnection, getDefaultDatabasePool } from '../config/database.js'
import { createHttpError } from '../utils/httpError.js'

// untuk pemeriksaan kesehatan layanan API.
export function getHealth(_req, res) {
  res.json({ success: true, data: { status: 'ok' } })
}

export function createHealthController(dbPool = getDefaultDatabasePool()) {
  return {
    getHealth,
    async getDatabaseHealth(_req, res, next) {
      try {
        const info = await checkDatabaseConnection(dbPool)
        res.json({
          success: true,
          data: {
            status: 'ok',
            database: info.database_name,
            schema: info.schema_name,
          },
        })
      } catch {
        next(
          createHttpError(
            503,
            'SERVICE_UNAVAILABLE',
            'Database PostgreSQL belum dapat dihubungi.'
          )
        )
      }
    },
  }
}
