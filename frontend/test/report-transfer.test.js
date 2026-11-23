import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const transfer = {
  id: '1', date: '2026-02-01', amount: 300, note: '',
  fromCategoryId: 'mosque', fromCategoryLabel: 'Kas Masjid',
  toCategoryId: 'maintenance', toCategoryLabel: 'Kotak Pembangunan',
}

let server
let formatters
let reportService
let downloadService
let pagination
let BalanceSummary
before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
    define: { 'import.meta.env.VITE_DATA_SOURCE': '"api"' },
  })
  formatters = await server.ssrLoadModule('/src/utils/reportFormatters.js')
  reportService = await server.ssrLoadModule('/src/services/adminFinanceReportService.js')
  downloadService = await server.ssrLoadModule('/src/services/adminReportDownloadService.js')
  pagination = await server.ssrLoadModule('/src/utils/reportPagination.js')
  ;({ default: BalanceSummary } = await server.ssrLoadModule('/src/components/BalanceSummary.jsx'))
})
after(async () => { await server?.close() })

test('catatan transfer hanya muncul bila periode memuat transfer', () => {
  assert.equal(formatters.formatTransferNote([]), '')
  assert.equal(formatters.formatTransferNote(), '')
  const note = formatters.formatTransferNote([transfer])
  assert.match(note, /^Saldo akhir sudah termasuk transfer internal/)
  assert.match(note, /Kas Masjid → Kotak Pembangunan Rp 300 \(1 Februari 2026\)/)
})

test('selisih transfer per kategori mengikuti tanggal inklusif', () => {
  const { sumCategoryTransfers, filterTransfersInRange, dayBefore } = reportService
  assert.equal(sumCategoryTransfers([transfer], 'mosque'), -300)
  assert.equal(sumCategoryTransfers([transfer], 'maintenance'), 300)
  assert.equal(sumCategoryTransfers([transfer], 'friday'), 0)
  assert.equal(sumCategoryTransfers([transfer], 'mosque', { to: '2026-01-31' }), 0)
  assert.equal(sumCategoryTransfers([transfer], 'mosque', { from: '2026-02-01', to: '2026-02-01' }), -300)
  assert.equal(filterTransfersInRange([transfer], { startDate: '2026-02-02', endDate: '2026-02-28' }).length, 0)
  assert.equal(dayBefore('2026-03-01'), '2026-02-28')
})

// Dashboard API: saldo awal kategori sudah memuat seluruh transfer (saldo_awal ± transfer).
function buildApiReport() {
  return reportService.buildAdminFinanceReport({
    updatedDate: '2026-02-28',
    categories: [
      { id: 'mosque', label: 'Kas Masjid', color: 'green', openingBalance: 700, income: 0, expense: 0, closingBalance: 700 },
      { id: 'maintenance', label: 'Kotak Pembangunan', color: 'orange', openingBalance: 300, income: 0, expense: 0, closingBalance: 300 },
    ],
    apiTransactions: [],
    apiCoverage: { startDate: '2026-01-01', endDate: '2026-02-28' },
    apiTransfers: [transfer],
  })
}

test('rekap bulanan admin menghitung transfer pada bulan terjadinya, bukan sejak saldo awal', () => {
  const report = buildApiReport()
  assert.deepEqual(report.historyOpeningBalances, { mosque: 1000, maintenance: 0 })
  const [january, february] = reportService.buildAdminMonthlyRecap(report, report.coverage)
  const pick = (month, id) => month.categories.find((item) => item.id === id)
  assert.deepEqual([pick(january, 'mosque').openingBalance, pick(january, 'mosque').closingBalance], [1000, 1000])
  assert.deepEqual([pick(january, 'maintenance').openingBalance, pick(january, 'maintenance').closingBalance], [0, 0])
  assert.deepEqual([pick(february, 'mosque').openingBalance, pick(february, 'mosque').closingBalance], [1000, 700])
  assert.deepEqual([pick(february, 'maintenance').openingBalance, pick(february, 'maintenance').closingBalance], [0, 300])
  assert.equal(pick(february, 'mosque').income, 0)
  assert.equal(january.transfers.length, 0)
  assert.equal(february.transfers.length, 1)
  assert.equal(february.totals.closingBalance, january.totals.closingBalance)
})

test('dokumen unduhan admin memakai transfer sesuai tanggal dan menyertakan daftar transfer periode', () => {
  const report = buildApiReport()
  const doc = downloadService.buildAdminDownloadDocument(report, { startDate: '2026-02-01', endDate: '2026-02-28' }, ['monthly'])
  const pick = (id) => doc.categories.find((item) => item.id === id)
  assert.deepEqual([pick('mosque').openingBalance, pick('mosque').closingBalance], [1000, 700])
  assert.deepEqual([pick('maintenance').openingBalance, pick('maintenance').closingBalance], [0, 300])
  assert.equal(doc.transfers.length, 1)
  const january = downloadService.buildAdminDownloadDocument(report, { startDate: '2026-01-01', endDate: '2026-01-31' }, ['monthly'])
  assert.equal(january.transfers.length, 0)
  assert.equal(january.categories.find((item) => item.id === 'mosque').closingBalance, 1000)
})

test('resume saldo publik menampilkan catatan transfer dan kapasitas lembar A4 menyisakan ruang catatan', () => {
  const summary = {
    rows: [{ id: 'mosque', label: 'Kas Masjid', color: 'green', openingBalance: 1000, income: 0, expense: 0, closingBalance: 700 }],
    totals: { openingBalance: 1000, income: 0, expense: 0, closingBalance: 700 },
    transfers: [transfer],
  }
  for (const variant of ['screen', 'sheet']) {
    const html = renderToStaticMarkup(h(BalanceSummary, { summary, period: 'Februari 2026', variant }))
    assert.match(html, /class="financial-summary-transfer-note">Saldo akhir sudah termasuk transfer internal/)
  }
  const plain = renderToStaticMarkup(h(BalanceSummary, { summary: { ...summary, transfers: [] }, period: 'Februari 2026' }))
  assert.doesNotMatch(plain, /financial-summary-transfer-note/)
  assert.equal(pagination.getTransferNoteHeight([]), 0)
  assert.ok(pagination.getTransferNoteHeight([transfer]) > 0)
  assert.ok(pagination.getSheetCapacity(3, pagination.getTransferNoteHeight([transfer])).final <= pagination.getSheetCapacity(3).final)
})
