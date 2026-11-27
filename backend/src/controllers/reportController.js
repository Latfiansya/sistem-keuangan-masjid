import { defaultReportService } from '../services/reportService.js'
import {
  DEFAULT_REPORT_ACCESS_TTL_MS,
  extractReportAccessToken,
  REPORT_ACCESS_COOKIE,
} from '../utils/reportAccessToken.js'

// Presentation layer untuk endpoint gate sandi bersama dan laporan keuangan publik.
export function createReportController({
  reportPasswordHash,
  reportAccessSecret = '',
  nodeEnv = 'development',
  reportAccessTtlMs = DEFAULT_REPORT_ACCESS_TTL_MS,
  reportService = defaultReportService,
}) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: nodeEnv === 'production',
    path: '/',
  }

  return {
    async postCheckPassword(req, res, next) {
      try {
        const result = await reportService.authorizeReportAccess(
          req.body,
          reportPasswordHash,
          reportAccessSecret,
          reportAccessTtlMs
        )
        if (result.valid && result.token) {
          res.cookie(REPORT_ACCESS_COOKIE, result.token, {
            ...cookieOptions,
            maxAge: reportAccessTtlMs,
          })
        } else {
          res.clearCookie(REPORT_ACCESS_COOKIE, cookieOptions)
        }
        res.json({ success: true, data: { valid: result.valid } })
      } catch (error) {
        next(error)
      }
    },

    async getReport(req, res, next) {
      try {
        const token = extractReportAccessToken(req)
        await reportService.verifyReportAccessSession(token, reportAccessSecret, reportPasswordHash)
        const report = await reportService.getFinanceReport(req.query)
        res.json({ success: true, data: report })
      } catch (error) {
        next(error)
      }
    },
  }
}
