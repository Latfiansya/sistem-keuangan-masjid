import { createHttpError } from '../utils/httpError.js'

export function createRateLimiter({ windowMs = 60_000, maxAttempts = 10 } = {}) {
  const attempts = new Map()

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now()
    const key = req.ip || req.socket?.remoteAddress || 'unknown'

    if (attempts.size > 5000) {
      for (const [entryKey, record] of attempts.entries()) {
        if (record.resetAt <= now) attempts.delete(entryKey)
      }
    }

    const current = attempts.get(key)
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (current.count >= maxAttempts) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      res.set('Retry-After', String(retryAfterSeconds))
      return next(
        createHttpError(
          429,
          'TOO_MANY_REQUESTS',
          'Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.',
        ),
      )
    }

    current.count += 1
    return next()
  }
}

