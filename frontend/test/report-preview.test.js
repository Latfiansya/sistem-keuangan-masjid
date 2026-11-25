import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { mockReport } from '../src/mocks/report.js'
import { calculateReport } from '../src/utils/reportCalculations.js'
import { paginateReport, getSheetCapacity, REPORT_SHEET_LAYOUT } from '../src/utils/reportPagination.js'
import { formatReportRange, formatReportYear } from '../src/utils/reportFormatters.js'

let server
let getReport
let ReportPreview
let ReportFormatPicker
before(async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  server = await createServer({ root, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify('mock') } })
  ;({ getReport } = await server.ssrLoadModule('/src/services/reportService.js'))
  ;({ default: ReportPreview } = await server.ssrLoadModule('/src/components/ReportPreview.jsx'))
  ;({ default: ReportFormatPicker } = await server.ssrLoadModule('/src/components/ReportFormatPicker.jsx'))
})
after(async () => { await server?.close() })

test('laporan April dibagi berdasarkan geometri A4 dengan ringkasan hanya pada lembar terakhir', async () => {
  const report = await getReport()
  const pages = paginateReport(report)
  assert.ok(Math.abs(REPORT_SHEET_LAYOUT.width / REPORT_SHEET_LAYOUT.height - 297 / 210) < .001)
  assert.deepEqual(pages.map((page) => [page.income.length, page.expense.length, page.showSummary]), [[17, 21, false], [0, 12, true]])
  assert.ok(getSheetCapacity(1).final > getSheetCapacity(3).final)
  assert.deepEqual(pages.flatMap((page) => page.income).map((item) => item.id), report.transactions.filter((item) => item.type === 'income').map((item) => item.id))
  assert.deepEqual(pages.flatMap((page) => page.expense).map((item) => item.id), report.transactions.filter((item) => item.type === 'expense').map((item) => item.id))
})

test('jumlah halaman berubah untuk data kosong, batas kapasitas dan transaksi panjang tanpa kehilangan baris', () => {
  const capacity = getSheetCapacity(3)
  const results = new Set()
  for (const [incoming, outgoing] of [[0, 0], [1, 0], [capacity.final, 2], [capacity.final + 1, 0], [3, capacity.regular], [capacity.regular + 1, 1], [60, 100], [120, 4]]) {
    const data = structuredClone(mockReport)
    data.transactions = [['income', incoming], ['expense', outgoing]].flatMap(([type, count]) => Array.from({ length: count }, (_, index) => ({ id: `${type}-${index}`, date: '2026-04-03', type, description: `Uraian fixture panjang ${'uji '.repeat(100)}`, categoryId: 'mosque', amount: 1000 })))
    const report = calculateReport(data)
    const original = structuredClone(report)
    const pages = paginateReport(report)
    results.add(pages.length)
    assert.equal(pages.filter((page) => page.showSummary).length, 1)
    assert.ok(pages.at(-1).showSummary)
    for (const page of pages) {
      const limit = page.showSummary ? capacity.final : capacity.regular
      assert.ok(page.income.length <= limit && page.expense.length <= limit)
    }
    for (const type of ['income', 'expense']) {
      const ids = pages.flatMap((page) => page[type]).map((item) => item.id)
      assert.deepEqual(ids, report.transactions.filter((item) => item.type === type).map((item) => item.id))
      assert.equal(new Set(ids).size, ids.length)
    }
    if (pages[0].income.length) pages[0].income[0].amount = 0
    assert.deepEqual(report, original)
  }
  assert.ok(results.has(1))
  assert.ok([...results].some((count) => count > 2))
})

test('PDF dan PNG memakai lembar identik dengan semua nominal dan total dari service', async () => {
  const report = await getReport()
  const pages = paginateReport(report)
  const html = ['pdf', 'png'].map((format) => renderToStaticMarkup(h(ReportPreview, { report, pages, format })))
  const sheets = html.map((markup) => markup.match(/<article class="report-sheet"[\s\S]*?<\/article>/g))
  assert.equal(sheets[0].length, pages.length)
  assert.deepEqual(sheets[0], sheets[1])
  for (const markup of html) {
    assert.equal((markup.match(/data-transaction-id=/g) || []).length, 50)
    assert.equal((markup.match(/id="report-sheet-summary-heading"/g) || []).length, 1)
    for (const value of ['18.590.700', '10.665.500', '8.771.500', '20.484.700', 'Laporan keuangan resmi · diperbarui berkala', 'Masjid Al-Hidayah · Pemasukan']) assert.ok(markup.includes(value))
    assert.doesNotMatch(markup, /Data contoh pengembangan|bukan laporan produksi|simulasi|mock/i)
    assert.match(markup, /aria-describedby="report-export-status"/)
    assert.doesNotMatch(markup, /Ubah format/)
    assert.match(markup, /Kembali ke pilihan format/)
    const toolbar = markup.match(/class="report-preview-toolbar-actions"[\s\S]*?<\/div>/)?.[0]
    assert.equal((toolbar.match(/<button\b/g) || []).length, 1)
    assert.doesNotMatch(markup, /disabled=""/)
    assert.doesNotMatch(markup, /<canvas|<iframe|download=|blob:|berhasil diunduh/)
  }
})

test('periode kustom dan saldo awal terfilter dipertahankan, termasuk hari tanpa transaksi', async () => {
  const report = await getReport({ startDate: '2026-04-03', endDate: '2026-04-05' })
  const pages = paginateReport(report)
  assert.equal(pages.length, 1)
  const html = renderToStaticMarkup(h(ReportPreview, { report, pages, format: 'pdf' }))
  for (const value of ['3–5 April 2026', '15.445.700', '16.602.700']) assert.ok(html.includes(value))
  assert.equal((html.match(/data-transaction-id=/g) || []).length, 9)
  const empty = await getReport({ startDate: '2026-04-04', endDate: '2026-04-04' })
  const emptyPages = paginateReport(empty)
  assert.equal(emptyPages.length, 1)
  const emptyHtml = renderToStaticMarkup(h(ReportPreview, { report: empty, pages: emptyPages, format: 'png' }))
  assert.ok(emptyHtml.includes('16.815.700'))
  assert.ok(emptyHtml.includes('Tidak ada transaksi pemasukan'))
})

test('periode tidak lengkap tidak dapat menjadi pilihan format atau lembar pratinjau valid', async () => {
  const report = await getReport({ startDate: '2026-03-01', endDate: '2026-04-30' })
  const pages = paginateReport(report)
  assert.deepEqual(pages, [])
  for (const Component of [ReportPreview, ReportFormatPicker]) {
    const html = renderToStaticMarkup(h(Component, { report, pages, format: 'pdf' }))
    assert.match(html, /Pratinjau belum tersedia/)
    assert.doesNotMatch(html, /class="report-sheet"|type="radio"/)
  }
})

test('kartu memilih format yang diberikan dan informasi halaman selalu berasal dari pembagian aktual', async () => {
  const report = await getReport({ startDate: '2026-04-30', endDate: '2026-04-30' })
  const pages = paginateReport(report)
  for (const format of ['pdf', 'png']) {
    const html = renderToStaticMarkup(h(ReportFormatPicker, { report, pages, format }))
    const input = html.match(new RegExp(`<input[^>]*value="${format}"[^>]*>`))?.[0]
    assert.ok(input?.includes('checked=""'))
    assert.ok(html.includes('1 lembar'))
    assert.ok(html.includes('1 dokumen PDF · 1 halaman'))
    assert.ok(html.includes('1 gambar PNG · unduh langsung'))
  }
  assert.equal(formatReportRange(report.range), '30 April 2026')
  assert.equal(formatReportYear(report.range), '2026')
})
