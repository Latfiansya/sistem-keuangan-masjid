import app from './app.js'
import { loadEnv } from './config/env.js'

const { port, host, apiBasePath } = loadEnv()

const server = app.listen(port, host, (error) => {
  if (error) return
  console.log(`Backend berjalan di http://${host}:${port}${apiBasePath || '/'}`)
})

server.on('error', (error) => {
  console.error('Backend gagal dijalankan:', error.message)
  process.exitCode = 1
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
    server.closeAllConnections()
  })
}
