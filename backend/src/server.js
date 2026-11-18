import app from './app.js'
import { checkDatabaseConnection, closeDefaultDatabasePool } from './config/database.js'
import { loadEnv } from './config/env.js'

const { port, host, apiBasePath, db } = loadEnv()

const server = app.listen(port, host, async (error) => {
  if (error) return
  console.log(`Backend berjalan di http://${host}:${port}${apiBasePath || '/'}`)

  try {
    const info = await checkDatabaseConnection()
    console.log(
      `Database PostgreSQL terhubung ke "${info.database_name}" (schema: ${db.schema})`
    )
  } catch (dbError) {
    console.warn(`Peringatan koneksi database PostgreSQL: ${dbError.message}`)
  }
})

server.on('error', (error) => {
  console.error('Backend gagal dijalankan:', error.message)
  process.exitCode = 1
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await closeDefaultDatabasePool()
    server.close(() => process.exit(0))
    server.closeAllConnections()
  })
}
