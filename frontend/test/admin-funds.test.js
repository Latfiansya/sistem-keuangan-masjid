import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'

let server
let App
let FundsPage
let DashboardPage
let getAdminDashboard
let transactionService, categoryService, reportService
before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
    define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' },
  })
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: FundsPage } = await server.ssrLoadModule('/src/pages/AdminFundsPage.jsx'))
  ;({ default: DashboardPage } = await server.ssrLoadModule('/src/pages/AdminDashboardPage.jsx'))
  ;({ getAdminDashboard } = await server.ssrLoadModule('/src/services/adminDashboardService.js'))
  transactionService = await server.ssrLoadModule('/src/services/adminTransactionService.js')
  categoryService = await server.ssrLoadModule('/src/services/adminCategoryService.js')
  reportService = await server.ssrLoadModule('/src/services/adminFinanceReportService.js')
})
after(async () => { await server?.close() })

const renderPage = (Page, context) => renderToStaticMarkup(h(MemoryRouter, null, h(Routes, null,
  h(Route, { element: h(Outlet, { context }) }, h(Route, { index: true, element: h(Page) })),
)))

test('route Kelola Dana menggunakan judul dan menu aktif yang sesuai tanpa layout publik atau login', () => {
  for (const route of ['/admin/kelola-dana', '/admin/kelola-dana/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.match(html, /<h1>Kelola Dana Keuangan<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/kelola-dana"/)
    assert.match(html, /href="\/admin\/dashboard"/)
    assert.match(html, /Memuat data kelola dana/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form/)
  }
})

test('Kelola Dana menangani loading/error dan menampilkan dua pemicu form aktif dan Lihat Semua nonaktif', async () => {
  assert.match(renderPage(FundsPage, { dashboard: null, error: '' }), /role="status".*Memuat data kelola dana/)
  assert.match(renderPage(FundsPage, { dashboard: null, error: 'Gagal memuat.' }), /role="alert".*Gagal memuat/)
  const html = renderPage(FundsPage, { dashboard: await getAdminDashboard(), error: '' })
  assert.match(html, /MANAJEMEN TRANSAKSI/)
  assert.match(html, /Kelola Transaksi/)
  assert.match(html, /Simulasi sesi admin/)
  assert.equal((html.match(/<button\b/g) || []).length, 3)
  assert.equal((html.match(/disabled=""/g) || []).length, 1)
  assert.equal((html.match(/<table\b/g) || []).length, 1)
  assert.equal((html.match(/data-transaction-id=/g) || []).length, 5)
  assert.doesNotMatch(html, /<form|<input|<dialog|<a\b/)
})

test('Dashboard dan Kelola Dana merender tabel identik dari kategori dan transaksi yang sama', async () => {
  const context = { dashboard: await getAdminDashboard(), error: '' }
  const table = (Page) => renderPage(Page, context).match(/<section class="admin-panel admin-recent"[\s\S]*?<\/section>/)[0]
  assert.equal(table(FundsPage), table(DashboardPage))
  assert.match(table(FundsPage), /117\.000/)
  assert.match(table(FundsPage), /403\.000/)
  assert.equal((table(FundsPage).match(/class="admin-money-income"/g) || []).length, 2)
  assert.equal((table(FundsPage).match(/class="admin-money-expense"/g) || []).length, 3)
})


const validTransaction = { date: '2026-11-11', categoryId: 'mosque', description: ' Infaq kegiatan ', amount: '125000', personName: ' Nama Contoh ', showDonorNamePublic: false, notes: ' Catatan\nbaris kedua ' }

test('tanggal default transaksi memakai kalender lokal dan validasi memeriksa field wajib/tanggal/kategori/nominal', async () => {
  const { categories } = await getAdminDashboard()
  const { validateAdminTransaction, getLocalTransactionDate } = transactionService
  assert.equal(getLocalTransactionDate(new Date(2026, 0, 1, 0, 1)), '2026-01-01')
  assert.deepEqual(Object.keys(validateAdminTransaction({ date: '', categoryId: '', description: '', amount: '' }, categories, 'income')), ['date','categoryId','description','amount'])
  for (const date of ['2026-02-30', '0000-01-01', '2026-1-1']) assert.ok(validateAdminTransaction({ ...validTransaction, date }, categories, 'income').date)
  for (const date of ['2000-02-29', '2020-01-01', '2027-01-01']) assert.deepEqual(validateAdminTransaction({ ...validTransaction, date }, categories, 'income'), {})
  for (const amount of ['0', '-1', '1.5', '1e3', '100.000', '100,000', ' 10 ', '1000000000000']) assert.ok(validateAdminTransaction({ ...validTransaction, amount }, categories, 'income').amount)
  assert.deepEqual(validateAdminTransaction({ ...validTransaction, amount: '999999999999' }, categories, 'expense'), {})
  assert.ok(validateAdminTransaction({ ...validTransaction, categoryId: 'tidak-ada' }, categories, 'income').categoryId)
  assert.ok(validateAdminTransaction(validTransaction, categories, 'invalid').type)
})

test('teks dibatasi, keterangan multiline diterima dan field nama/keterangan tetap opsional', async () => {
  const { categories } = await getAdminDashboard()
  for (const [field, limit] of [['description',500],['personName',100],['notes',500]]) {
    assert.ok(transactionService.validateAdminTransaction({ ...validTransaction, [field]: 'x'.repeat(limit+1) }, categories, 'income')[field])
    assert.ok(transactionService.validateAdminTransaction({ ...validTransaction, [field]: 'contoh\u0000' }, categories, 'income')[field])
  }
  assert.deepEqual(transactionService.validateAdminTransaction({ ...validTransaction, personName: '', notes: '' }, categories, 'income'), {})
  assert.deepEqual(transactionService.validateAdminTransaction(validTransaction, categories, 'expense'), {})
})

test('simpan tambahan sesi immutable dengan ID unik; preferensi donatur hanya untuk pemasukan dan snapshot 249 transaksi tetap', async () => {
  const source = await getAdminDashboard()
  const original = structuredClone(source)
  const report = reportService.buildAdminFinanceReport(source)
  const first = transactionService.addMockAdminTransaction(source, { ...validTransaction, showDonorNamePublic: true }, 'income')
  const second = transactionService.addMockAdminTransaction(first, { ...validTransaction, description: 'Pembelian alat', showDonorNamePublic: true }, 'expense')
  assert.equal(second.sessionTransactions.length, 2)
  assert.notEqual(second.sessionTransactions[0].id, second.sessionTransactions[1].id)
  assert.ok(second.sessionTransactions.every((row) => row.mock === true && row.source === 'session' && row.id.startsWith('mock-session-transaction-') && row.amount === 125000))
  assert.equal(second.sessionTransactions[0].showDonorNamePublic, false)
  assert.equal(second.sessionTransactions[1].showDonorNamePublic, true)
  assert.equal(second.sessionTransactions[1].description, 'Infaq kegiatan')
  assert.equal(second.sessionTransactions[1].personName, 'Nama Contoh')
  assert.equal(second.sessionTransactions[1].notes, 'Catatan\nbaris kedua')
  assert.deepEqual(second.categories, source.categories)
  assert.deepEqual(second.totals, source.totals)
  assert.deepEqual(second.recentTransactions, source.recentTransactions)
  assert.deepEqual(reportService.buildAdminFinanceReport(second).transactions, report.transactions)
  assert.deepEqual(reportService.buildAdminMonthlyRecap(reportService.buildAdminFinanceReport(second)), reportService.buildAdminMonthlyRecap(report))
  assert.deepEqual(source, original)
  assert.deepEqual(await getAdminDashboard(), original)
  const recent = transactionService.getAdminRecentTransactions(second)
  assert.equal(recent.length, 7)
  assert.equal(new Set(recent.map((row) => row.id)).size, 7)
  assert.equal(recent[0].id, second.sessionTransactions[0].id)
  assert.deepEqual(transactionService.getAdminRecentTransactions(source), source.recentTransactions)
  const html = renderPage(FundsPage, { dashboard: second, error: '' })
  assert.match(html, /2 tambahan sesi mock.*Belum termasuk snapshot saldo/)
  assert.match(html, /Sesi mock/)
})

test('transaksi sesi memakai kategori bersama dan melindungi kategori baru dari hapus tanpa mengubah saldo', async () => {
  const source = await getAdminDashboard()
  const added = categoryService.saveMockAdminCategory(source, { name: 'Dana Baru', color: 'purple' })
  const id = added.categories.at(-1).id
  const state = transactionService.addMockAdminTransaction(added, { ...validTransaction, categoryId: id, personName: '', notes: '' }, 'expense')
  assert.equal(state.sessionTransactions[0].categoryId, id)
  assert.equal(state.sessionTransactions[0].showDonorNamePublic, false)
  assert.equal(categoryService.isAdminCategoryUsed(state, id), true)
  assert.throws(() => categoryService.deleteMockAdminCategory(state, id), /tidak dapat dihapus/)
  assert.equal(state.categories.at(-1).closingBalance, 0)
  assert.deepEqual(state.totals, source.totals)
  const deleted = categoryService.deleteMockAdminCategory(added, id)
  assert.throws(() => transactionService.addMockAdminTransaction(deleted, { ...validTransaction, categoryId: id }, 'income'), /kategori/)
})

test('mode API menolak simpan transaksi tanpa request atau fallback mock', async () => {
  const api = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"api"' } })
  try {
    const service = await api.ssrLoadModule('/src/services/adminTransactionService.js')
    const source = await getAdminDashboard()
    assert.throws(() => service.addMockAdminTransaction(source, validTransaction, 'income'), /sesi mock/)
  } finally { await api.close() }
})
