import { defaultReportService, verifyReportPassword } from '../services/reportService.js'

// Presentation layer untuk endpoint gate sandi bersama dan laporan keuangan publik.
export function createReportController({
  reportPasswordHash,
  reportService = defaultReportService,
}) {
  return {
    postCheckPassword(req, res, next) {
      try {
        const result = verifyReportPassword(req.body, reportPasswordHash)
        res.json({ success: true, data: result })
      } catch (error) {
        next(error)
      }
    },

    async getReport(req, res, next) {
      try {
        const report = await reportService.getFinanceReport(req.query)
        res.json({ success: true, data: report })
      } catch (error) {
        next(error)
      }
    },
  }
}
