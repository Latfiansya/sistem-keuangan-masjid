import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mockAdminDashboard } from '../src/mocks/adminDashboard.js'
import { buildAdminFinanceReport } from '../src/services/adminFinanceReportService.js'
import { adminReportTypes, getAdminDownloadDefaults, validateAdminDownloadSettings, ADMIN_REPORT_PAGE, buildAdminDownloadDocument, getAdminDownloadDefaultRange, getAdminDownloadMonthRange, paginateAdminDownload, getAdminDownloadFilename, validateAdminDownloadSheets, createAdminReportDownload } from '../src/services/adminReportDownloadService.js'
import { createReportSheetsExport } from '../src/services/reportExportService.js'

const build = (dashboard = structuredClone(mockAdminDashboard)) => buildAdminFinanceReport(dashboard)
const october = { startDate: '2026-10-01', endDate: '2026-10-31' }

test('default bulan admin terbaru, rentang bulan lintas tahun dan validasi pilihan', () => {
  const report = build()
  assert.deepEqual(getAdminDownloadDefaultRange(report), october)
  assert.deepEqual(getAdminDownloadMonthRange('2025-12', '2026-03'), { startDate: '2025-12-01', endDate: '2026-03-31' })
  assert.deepEqual(getAdminDownloadMonthRange('2024-02', '2024-02'), { startDate: '2024-02-01', endDate: '2024-02-29' })
  assert.throws(() => getAdminDownloadMonthRange('2026-05', '2026-04'), /tidak boleh/)
  assert.throws(() => getAdminDownloadMonthRange('', '2026-04'), /tidak valid/)
  assert.throws(() => buildAdminDownloadDocument(report, october, []), /minimal satu/)
  assert.throws(() => buildAdminDownloadDocument(report, october, ['unknown']), /minimal satu/)
  report.transactions.push({ date: '2027-01-01' })
  assert.deepEqual(getAdminDownloadDefaultRange(report), { startDate: '2027-01-01', endDate: '2027-01-31' })
})

test('ringkasan Oktober tepat mengikuti 13 transaksi dan saldo snapshot tanpa memakai data publik', () => {
  const report = build(), before = structuredClone(report)
  const doc = buildAdminDownloadDocument(report, october, ['monthly'])
  assert.equal(doc.transactions.length, 13)
  assert.deepEqual(doc.totals, { openingBalance: 16864200, income: 1791500, expense: 1427500, closingBalance: 17228200 })
  assert.equal(doc.sections[0].rows.length, 4)
  assert.ok(doc.categories.every((item) => item.openingBalance + item.income - item.expense === item.closingBalance))
  assert.deepEqual(report, before)
})

test('tiga bagian mencakup semua 249 transaksi unik dan rekap sepuluh bulan dari data yang sama', () => {
  const report = build()
  const doc = buildAdminDownloadDocument(report, report.coverage, ['income', 'expense', 'monthly'])
  const incoming = doc.sections.find((section) => section.id === 'income').rows
  const outgoing = doc.sections.find((section) => section.id === 'expense').rows
  const months = doc.sections.find((section) => section.id === 'monthly').rows
  assert.equal(incoming.length, 141); assert.equal(outgoing.length, 108)
  assert.equal(new Set([...incoming, ...outgoing].map((row) => row.id)).size, 249)
  assert.equal(doc.totals.income, incoming.reduce((sum, row) => sum + row.amount, 0))
  assert.equal(doc.totals.expense, outgoing.reduce((sum, row) => sum + row.amount, 0))
  assert.equal(doc.totals.closingBalance, 17228200)
  assert.equal(months.length, 40)
  assert.deepEqual(months.at(-1).closingBalance, doc.totals.closingBalance)
  assert.ok(months.every((row) => row.openingBalance + row.income - row.expense === row.closingBalance))
})

test('perubahan sesi efektif masuk ekspor tanpa memutasi fixture atau angka snapshot', () => {
  const dashboard = structuredClone(mockAdminDashboard), before = structuredClone(dashboard)
  const original = build(dashboard).transactions.find((item) => item.date.startsWith('2026-10'))
  dashboard.transactionChanges = { [original.id]: { ...original, amount: original.amount + 1000, description: 'Perubahan sesi' } }
  dashboard.sessionTransactions = [{ id: 'session-download', categoryId: 'mosque', type: 'income', date: '2026-10-21', amount: 123456, description: 'Tambahan sesi', mock: true }]
  const doc = buildAdminDownloadDocument(build(dashboard), october, ['income', 'expense'])
  assert.equal(doc.totals.closingBalance, 17228200 + 123456 + (original.type === 'income' ? 1000 : -1000))
  assert.equal(doc.transactions.length, 14)
  assert.equal(doc.sessionChangeCount, 2)
  dashboard.deletedTransactionIds = ['session-download']
  assert.equal(buildAdminDownloadDocument(build(dashboard), october, ['income']).transactions.length, 13)
  assert.deepEqual(dashboard.totals, before.totals)
  assert.deepEqual(build().transactions.find((item) => item.id === original.id), original)
})

test('rentang kosong tidak mengarang transaksi, saldo diteruskan, saldo sebelum cakupan ditandai tidak tersedia', () => {
  const report = build()
  const empty = buildAdminDownloadDocument(report, getAdminDownloadMonthRange('2027-01', '2027-01'), ['income', 'expense', 'monthly'])
  assert.equal(empty.transactions.length, 0); assert.equal(empty.totals.income, 0); assert.equal(empty.totals.expense, 0)
  assert.equal(empty.totals.openingBalance, 17228200); assert.equal(empty.totals.closingBalance, 17228200)
  assert.ok(empty.sections.every((section) => section.rows.length === 0))
  const unknown = buildAdminDownloadDocument(report, getAdminDownloadMonthRange('2025-01', '2025-01'), ['monthly'])
  assert.equal(unknown.totals.openingBalance, null); assert.equal(unknown.totals.closingBalance, null)
  const dashboard = structuredClone(mockAdminDashboard)
  dashboard.sessionTransactions = [{ id: 'before-history', categoryId: 'mosque', date: '2025-12-10', type: 'income', description: 'Mock sebelum cakupan historis', amount: 1000 }]
  const earlier = buildAdminDownloadDocument(build(dashboard), getAdminDownloadMonthRange('2025-12', '2025-12'), ['monthly'])
  assert.equal(earlier.totals.openingBalance, null)
  assert.equal(earlier.totals.closingBalance, null)
  assert.equal(earlier.totals.income, 1000)
  assert.ok(earlier.sections[0].rows.every((row) => row.openingBalance === null && row.closingBalance === null))
})

test('pagination berdasarkan tinggi baris menjaga urutan dan baris utuh, termasuk kosong dan uraian panjang', () => {
  const doc = buildAdminDownloadDocument(build(), build().coverage, ['income', 'expense', 'monthly'])
  const measures = Object.fromEntries(doc.sections.map((section) => [section.id, { capacity: 700, heights: section.rows.map((_, index) => index % 2 ? 80 : 38) }]))
  const pages = paginateAdminDownload(doc, measures)
  assert.ok(pages.length > 3)
  for (const section of doc.sections) assert.deepEqual(pages.filter((page) => page.sectionId === section.id).flatMap((page) => page.rows), section.rows)
  assert.equal(pages.at(-1).number, pages.length)
  measures.income.heights[0] = 701
  assert.throws(() => paginateAdminDownload(doc, measures), /melebihi/)
  assert.throws(() => paginateAdminDownload(doc, {}), /belum siap/)
  const empty = buildAdminDownloadDocument(build(), getAdminDownloadMonthRange('2027-01', '2027-01'), ['income'])
  assert.equal(paginateAdminDownload(empty, { income: { capacity: 700, heights: [] } }).length, 1)
})

test('nama PDF/PNG/ZIP jelas dan ekspor menolak lembar hilang, stale atau dibatalkan', async () => {
  const doc = buildAdminDownloadDocument(build(), october, ['monthly'])
  const pages = paginateAdminDownload(doc, { monthly: { capacity: 700, heights: [40, 40, 40, 40] } })
  const sheets = pages.map((page) => ({ dataset: { section: page.sectionId }, matches: () => true, querySelector: () => null, querySelectorAll: () => page.rows.map((row) => ({ dataset: { exportRow: row.key } })) }))
  assert.doesNotThrow(() => validateAdminDownloadSheets(doc, pages, sheets))
  assert.match(getAdminDownloadFilename(doc, 'pdf', 1), /monthly-2026-10-01--2026-10-31\.pdf$/)
  assert.match(getAdminDownloadFilename(doc, 'png', 1), /\.png$/)
  assert.match(getAdminDownloadFilename(doc, 'png', 2), /\.zip$/)
  assert.throws(() => validateAdminDownloadSheets(doc, pages, []), /belum siap/)
  assert.throws(() => validateAdminDownloadSheets(doc, [{ ...pages[0], rows: [] }], sheets), /tidak sesuai/)
  await assert.rejects(createAdminReportDownload({ document: doc, pages, sheets, format: 'pdf', signal: AbortSignal.abort() }), { name: 'AbortError' })
  await assert.rejects(createReportSheetsExport({ sheets: [], layout: ADMIN_REPORT_PAGE, format: 'jpg' }), /tidak valid/)
})


test('pengaturan memakai tiga jenis, format tunggal dan mode periode eksklusif; tanggal inklusif', () => {
  const report = build()
  const defaults = getAdminDownloadDefaults(report)
  assert.deepEqual(adminReportTypes.map(type=>type.id), ['income','expense','monthly'])
  assert.deepEqual(defaults, { range: october, periodMode: 'months', preset: 'week', types: ['monthly'], format: 'pdf' })
  assert.doesNotThrow(()=>validateAdminDownloadSettings(defaults))
  for(const patch of [{format:'zip'},{format:''},{types:[]},{types:['summary']},{periodMode:'unknown'},{range:{startDate:'',endDate:'2026-10-15'}},{range:{startDate:'2026-10-16',endDate:'2026-10-15'}}]) assert.throws(()=>validateAdminDownloadSettings({...defaults,...patch}))
  const range={startDate:'2026-10-15',endDate:'2026-10-15'}
  const doc=buildAdminDownloadDocument(report,range,['income','expense','monthly'])
  const rows=report.transactions.filter(row=>row.date==='2026-10-15')
  assert.equal(doc.transactions.length,3)
  assert.deepEqual(doc.transactions,rows)
  assert.equal(doc.totals.income,rows.filter(row=>row.type==='income').reduce((sum,row)=>sum+row.amount,0))
  assert.equal(doc.totals.expense,rows.filter(row=>row.type==='expense').reduce((sum,row)=>sum+row.amount,0))
  assert.equal(doc.totals.closingBalance,doc.totals.openingBalance+doc.totals.income-doc.totals.expense)
})
