// Middleware header keamanan dasar dan CORS terkonfigurasi sesuai SOP.
export function createSecurityMiddleware({ corsOrigins = [] } = {}) {
  const allowedOriginSet = new Set(corsOrigins)

  return function securityMiddleware(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site')

    const origin = req.headers?.origin
    if (typeof origin === 'string' && allowedOriginSet.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

      if (req.method === 'OPTIONS') {
        res.status(204).end()
        return
      }
    }

    next()
  }
}
