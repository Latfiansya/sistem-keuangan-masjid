import express from 'express'

const app = express()

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route tidak ditemukan.' },
  })
})

// Empat parameter diperlukan agar Express mengenali middleware error.
app.use((error, _req, res, _next) => {
  const status = error.status >= 400 && error.status < 500 ? error.status : 500
  const code = status === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'
  const message = status === 500
    ? 'Terjadi kesalahan pada server.'
    : 'Permintaan tidak valid.'

  if (status === 500) console.error('Kesalahan server:', error)

  res.status(status).json({ success: false, error: { code, message } })
})

export default app
