import { getFinanceReport, verifyReportPassword } from '../services/reportService.js'

// untuk endpoint gate sandi bersama dan laporan keuangan publik.
export function createReportController({ reportPasswordHash }) {
  return {
    postCheckPassword(req, res) {
      const result = verifyReportPassword(req.body, reportPasswordHash)
      res.json({ success: true, data: result })
    },

    getReport(req, res) {
      const report = getFinanceReport(req.query)
      res.json({ success: true, data: report })
    },
  }
}

