import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mockReport } from '../src/mocks/report.js'
import { calculateReport } from '../src/utils/reportCalculations.js'
import { paginateReport } from '../src/utils/reportPagination.js'
import { createReportExport, getReportExportName, validateExportSheets } from '../src/services/reportExportService.js'

function sheetFixtures(pages) {
  return pages.map((page) => ({ matches: () => true, querySelectorAll: () => [...page.income, ...page.expense].map((item) => ({ dataset: { transactionId: item.id } })) }))
}

test('nama berkas mengikuti periode dan PNG jamak menjadi ZIP, PNG tunggal tetap PNG', () => {
  const range = { startDate: '2026-04-01', endDate: '2026-04-30' }
  const prefix = 'laporan-keuangan-masjid-al-hidayah-'
  assert.equal(getReportExportName(range, 'pdf', 2), `${prefix}2026-04.pdf`)
  assert.equal(getReportExportName(range, 'png', 2), `${prefix}2026-04.zip`)
  assert.equal(getReportExportName(range, 'png', 1), `${prefix}2026-04.png`)
  assert.equal(getReportExportName({ startDate: '2026-04-03', endDate: '2026-04-05' }, 'png', 1), `${prefix}2026-04-03--2026-04-05.png`)
  assert.throws(() => getReportExportName(range, 'jpg', 2), /tidak valid/)
  assert.throws(() => getReportExportName(range, 'pdf', 0), /tidak valid/)
})

test('ekspor menolak data tidak lengkap, lembar hilang, transaksi hilang atau berulang', async () => {
  const report = calculateReport(mockReport)
  const original = structuredClone(report)
  const pages = paginateReport(report)
  const sheets = sheetFixtures(pages)
  assert.doesNotThrow(() => validateExportSheets(report, pages, sheets))
  await assert.rejects(createReportExport({ report: calculateReport(mockReport, { startDate: '2026-03-01', endDate: '2026-04-30' }), pages: [], sheets: [], format: 'pdf' }), /belum lengkap/)
  assert.throws(() => validateExportSheets(report, pages, sheets.slice(1)), /belum siap/)
  assert.throws(() => validateExportSheets(report, pages, sheetFixtures(pages.toReversed())), /belum siap/)
  const incomplete = structuredClone(pages)
  incomplete[0].income.pop()
  assert.throws(() => validateExportSheets(report, incomplete, sheets), /tidak sesuai/)
  const duplicate = structuredClone(pages)
  duplicate[0].income[0] = duplicate[0].income[1]
  assert.throws(() => validateExportSheets(report, duplicate, sheets), /tidak sesuai/)
  const stale = structuredClone(pages)
  stale[0].income[0].amount = 0
  assert.throws(() => validateExportSheets(report, stale, sheets), /tidak sesuai/)
  assert.deepEqual(report, original)
})

test('ekspor yang dibatalkan tidak memulai render atau memerlukan lingkungan browser', async () => {
  const report = calculateReport(mockReport)
  const pages = paginateReport(report)
  let progress = 0
  await assert.rejects(createReportExport({ report, pages, sheets: sheetFixtures(pages), format: 'pdf', signal: AbortSignal.abort(), onProgress: () => progress++ }), { name: 'AbortError' })
  assert.equal(progress, 0)
})
