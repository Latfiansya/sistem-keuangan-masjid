import app from './app.js'

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '127.0.0.1'

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT harus berupa bilangan bulat antara 1 dan 65535.')
}

const server = app.listen(port, host, () => {
  console.log(`Backend berjalan di http://${host}:${port}`)
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
