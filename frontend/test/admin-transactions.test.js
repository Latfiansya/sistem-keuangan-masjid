import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { paginateAdminTransactions } from '../src/utils/adminPagination.js'
import { getActiveAdminTransactions, getAdminHistoricalTransactions } from '../src/services/adminTransactionData.js'
import { buildAdminFinanceReport, buildAdminMonthlyRecap, summarizeAdminFinanceTransactions } from '../src/services/adminFinanceReportService.js'

let server, getAdminDashboard, service, Page
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' } })
  ;({ getAdminDashboard } = await server.ssrLoadModule('/src/services/adminDashboardService.js'))
  service = await server.ssrLoadModule('/src/services/adminTransactionService.js')
  ;({ default: Page } = await server.ssrLoadModule('/src/pages/AdminTransactionPage.jsx'))
})
after(async () => { await server?.close() })
const values = { date: '2026-11-11', categoryId: 'mosque', description: 'Transaksi uji sesi', amount: '250000', personName: 'Nama Contoh', notes: 'Catatan\nopsional', showDonorNamePublic: true }

test('pagination 20/30/50/Semua mengikuti hasil filter, halaman kosong dan nomor di luar rentang', () => {
  const rows = Array.from({ length: 141 }, (_, id) => ({ id }))
  for (const size of [20, 30, 50]) {
    const first = paginateAdminTransactions(rows, 1, size)
    assert.equal(first.rows.length, size)
    assert.equal(first.start, 1)
    assert.equal(first.end, size)
    const last = paginateAdminTransactions(rows, 999, size)
    assert.equal(last.page, Math.ceil(141 / size))
    assert.equal(last.end, 141)
    assert.equal(last.rows.at(-1).id, 140)
    assert.equal(paginateAdminTransactions(rows, -1, size).page, 1)
  }
  assert.deepEqual(paginateAdminTransactions(rows, 99, 'all').rows, rows)
  assert.deepEqual(paginateAdminTransactions(rows, 99, 'all').pages, [])
  assert.deepEqual(paginateAdminTransactions([], 9).rows, [])
  assert.equal(paginateAdminTransactions([], 9).start, 0)
  assert.equal(paginateAdminTransactions([], 9).end, 0)
  const filtered = rows.filter((row) => row.id % 2 === 0)
  assert.deepEqual(paginateAdminTransactions(filtered, 2).rows, filtered.slice(20, 40))
})

test('nomor awal/tengah/akhir tanpa duplikat dan ellipsis hanya pada celah', () => {
  const rows = Array.from({ length: 201 }, (_, id) => ({ id }))
  assert.deepEqual(paginateAdminTransactions(rows, 1).pages, [1, 2, 3, '…', 11])
  assert.deepEqual(paginateAdminTransactions(rows, 6).pages, [1, '…', 5, 6, 7, '…', 11])
  assert.deepEqual(paginateAdminTransactions(rows, 11).pages, [1, '…', 9, 10, 11])
  assert.deepEqual(paginateAdminTransactions(rows.slice(0, 108)).pages, [1, 2, 3, 4, 5, 6])
  for (let page = 1; page <= 11; page++) {
    const pages = paginateAdminTransactions(rows, page).pages.filter(Number.isInteger)
    assert.equal(new Set(pages).size, pages.length)
    assert.ok(pages.every((number) => number >= 1 && number <= 11))
    assert.ok(pages.includes(page))
  }
})

test('edit dan hapus historis berupa lapisan sesi, ID stabil dan relasi kategori/nominal konsisten tanpa mengubah fixture/snapshot', async () => {
  const original = await getAdminDashboard()
  const before = structuredClone(original)
  const baseline = getAdminHistoricalTransactions(original)
  const first = service.editMockAdminTransaction(original, 'admin-trx-01', { ...values, amount: '217000', categoryId: 'friday' })
  const edited = getActiveAdminTransactions(first).find((row) => row.id === 'admin-trx-01')
  assert.equal(edited.type, 'income')
  assert.equal(edited.categoryId, 'friday')
  assert.equal(edited.amount, 217000)
  assert.equal(edited.sessionEdited, true)
  assert.equal(edited.showDonorNamePublic, true)
  assert.deepEqual(getAdminHistoricalTransactions(first), baseline)
  assert.deepEqual(original, before)
  assert.equal(service.getAdminRecentTransactions(first).find((row) => row.id === edited.id).amount, 217000)
  const report = buildAdminFinanceReport(first)
  assert.equal(report.transactions.length, 249)
  assert.equal(buildAdminMonthlyRecap(report).at(-1).totals.closingBalance, 17228200 + 100000)
  assert.deepEqual(report.totals, before.totals)
  const deleted = service.deleteMockAdminTransaction(first, edited.id)
  assert.equal(getActiveAdminTransactions(deleted).length, 248)
  assert.ok(!service.getAdminRecentTransactions(deleted).some((row) => row.id === edited.id))
  assert.equal(buildAdminMonthlyRecap(buildAdminFinanceReport(deleted)).at(-1).totals.closingBalance, 17228200 - 117000)
  assert.deepEqual(getAdminHistoricalTransactions(deleted), baseline)
  assert.deepEqual(deleted.totals, before.totals)
  assert.equal(getActiveAdminTransactions(await getAdminDashboard()).length, 249)
})

test('tambahan sesi, edit berulang, privasi pengeluaran dan hapus memakai satu data aktif di semua pembaca', async () => {
  const original = await getAdminDashboard()
  const added = service.addMockAdminTransaction(original, values, 'expense')
  const id = added.sessionTransactions[0].id
  const edited = service.editMockAdminTransaction(added, id, { ...values, amount: '75000' })
  const again = service.editMockAdminTransaction(edited, id, { ...values, amount: '50000' })
  assert.equal(getActiveAdminTransactions(again).find((row) => row.id === id).showDonorNamePublic, false)
  const report = buildAdminFinanceReport(again)
  assert.equal(report.transactions.length, 250)
  assert.equal(report.historicalTransactionCount, 249)
  assert.equal(buildAdminMonthlyRecap(report).at(-1).totals.closingBalance, 17228200 - 50000)
  const summary = summarizeAdminFinanceTransactions(report.transactions)
  const baseline = summarizeAdminFinanceTransactions(getAdminHistoricalTransactions(original))
  assert.equal(summary.expense, baseline.expense + 50000)
  const removed = service.deleteMockAdminTransaction(again, id)
  assert.deepEqual(getActiveAdminTransactions(removed), getActiveAdminTransactions(original))
  assert.equal(service.getAdminRecentTransactions(removed).length, 5)
  assert.deepEqual(removed.totals, original.totals)
})

test('validasi edit berbagi aturan tambah; ID hilang, kategori tak dikenal dan nominal tidak valid ditolak', async () => {
  const source = await getAdminDashboard()
  for (const overrides of [{ amount: '0' }, { amount: '1.5' }, { date: '2026-02-31' }, { categoryId: 'unknown' }, { description: ' ' }]) assert.throws(() => service.editMockAdminTransaction(source, 'admin-trx-01', { ...values, ...overrides }))
  assert.throws(() => service.editMockAdminTransaction(source, 'unknown', values), /tidak ditemukan/)
  assert.throws(() => service.deleteMockAdminTransaction(source, 'unknown'), /tidak ditemukan/)
  const removed = service.deleteMockAdminTransaction(source, 'admin-trx-01')
  assert.throws(() => service.deleteMockAdminTransaction(removed, 'admin-trx-01'), /tidak ditemukan/)
})

test('detail/edit URL langsung merender transaksi sebenarnya; pengeluaran tanpa kontrol privasi dan ID hilang memiliki jalan kembali', async () => {
  const dashboard = await getAdminDashboard()
  function render(id, edit = false) {
    const child = h(Route, { path: '/admin/laporan/transaksi/:id' + (edit ? '/edit' : ''), element: h(Page, { edit }) })
    const routes = h(Routes, null, h(Route, { element: h(Outlet, { context: { dashboard, error: '', setReportView: () => {} } }) }, child))
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [`/admin/laporan/transaksi/${id}${edit ? '/edit' : ''}`] }, routes))
  }

  assert.match(render('admin-trx-01'), /Infaq Pengajian Malam Kamis/)
  assert.match(render('admin-trx-02'), /Snack Pengajian Malam Kamis/)
  assert.match(render('admin-trx-01', true), /value="117.000"/)
  assert.match(render('admin-trx-01', true), /Tampilkan nama donatur/)
  assert.doesNotMatch(render('admin-trx-02', true), /Tampilkan nama donatur/)
  assert.match(render('unknown'), /Transaksi tidak ditemukan.*Kembali ke Laporan/)
})
