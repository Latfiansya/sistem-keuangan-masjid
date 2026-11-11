import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'

let server
let App
let CategoriesPage
let DashboardPage
let getAdminDashboard
let categoryService, colorUtils, reportService, ReportPage
before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
    define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' },
  })
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: CategoriesPage } = await server.ssrLoadModule('/src/pages/AdminCategoriesPage.jsx'))
  ;({ default: DashboardPage } = await server.ssrLoadModule('/src/pages/AdminDashboardPage.jsx'))
  ;({ getAdminDashboard } = await server.ssrLoadModule('/src/services/adminDashboardService.js'))
  categoryService = await server.ssrLoadModule('/src/services/adminCategoryService.js')
  colorUtils = await server.ssrLoadModule('/src/utils/adminCategoryColors.js')
  reportService = await server.ssrLoadModule('/src/services/adminFinanceReportService.js')
  ;({ default: ReportPage } = await server.ssrLoadModule('/src/pages/AdminFinanceReportPage.jsx'))
})
after(async () => { await server?.close() })
const renderPage = (Page, context) => renderToStaticMarkup(h(MemoryRouter, null, h(Routes, null,
  h(Route, { element: h(Outlet, { context }) }, h(Route, { index: true, element: h(Page) })),
)))

test('route Kategori Dana memiliki judul/menu aktif serta navigasi Dashboard dan Kelola Dana', () => {
  for (const route of ['/admin/kategori-dana', '/admin/kategori-dana/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.match(html, /<h1>Kategori Dana<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/kategori-dana"/)
    assert.match(html, /href="\/admin\/dashboard"/)
    assert.match(html, /href="\/admin\/kelola-dana"/)
    assert.match(html, /Memuat kategori dana/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form/)
  }
})

test('kategori menangani loading/error dan menampilkan tiga kategori dengan tujuh aksi mock aktif', async () => {
  assert.match(renderPage(CategoriesPage, { dashboard: null, error: '' }), /role="status".*Memuat kategori dana/)
  assert.match(renderPage(CategoriesPage, { dashboard: null, error: 'Gagal memuat.' }), /role="alert".*Gagal memuat/)
  const html = renderPage(CategoriesPage, { dashboard: await getAdminDashboard(), error: '' })
  assert.equal((html.match(/<table\b/g) || []).length, 2)
  assert.equal((html.match(/<button\b/g) || []).length, 7)
  assert.equal((html.match(/disabled=""/g) || []).length, 0)
  assert.equal((html.match(/aria-label="Edit kategori/g) || []).length, 3)
  assert.equal((html.match(/aria-label="Hapus kategori/g) || []).length, 3)
  assert.match(html, /Kotak Jum&#x27;at Berkah/)
  assert.match(html, /Kotak Pembangunan &amp; Pemeliharaan/)
  assert.match(html, /Saldo Awal \(Rp\)/)
  assert.doesNotMatch(html, /<form|<input|<dialog|<a\b/)
})

test('resume kategori dan Dashboard identik serta tidak mengubah mock atau nilai saldo', async () => {
  const dashboard = await getAdminDashboard()
  const before = structuredClone(dashboard)
  const context = { dashboard, error: '' }
  const balance = (Page) => renderPage(Page, context).match(/<table class="admin-balance-table">[\s\S]*?<\/table>/)[0]
  assert.equal(balance(CategoriesPage), balance(DashboardPage))
  assert.match(balance(CategoriesPage), /17\.228\.200/)
  assert.deepEqual(dashboard, before)
  assert.deepEqual(await getAdminDashboard(), before)
})


test('validasi kategori menolak nama kosong/duplikat ternormalisasi, karakter kontrol dan warna di luar sembilan pilihan', async () => {
  const { categories } = await getAdminDashboard()
  const { validateAdminCategory } = categoryService
  assert.equal(colorUtils.adminCategoryColors.length, 9)
  assert.equal(new Set(colorUtils.adminCategoryColors.map((color) => color.id)).size, 9)
  assert.deepEqual(Object.keys(validateAdminCategory({ name: '  ', color: '' }, categories)), ['name', 'color'])
  for (const name of [' kas   MASJID ', 'Ｋａｓ　Ｍａｓｊｉｄ']) assert.match(validateAdminCategory({ name, color: 'red' }, categories).name, /sudah digunakan/)
  for (const name of ['a'.repeat(101), 'Nama\u0000', 'Nama\nBaru']) assert.ok(validateAdminCategory({ name, color: 'green' }, categories).name)
  assert.ok(validateAdminCategory({ name: 'Dana Sosial', color: 'url(javascript:contoh)' }, categories).color)
  assert.deepEqual(validateAdminCategory({ name: ' Kas Masjid ', color: 'purple' }, categories, 'mosque'), {})
})

test('tambah/edit kategori mempertahankan ID, transaksi dan nilai saldo tanpa memutasi fixture', async () => {
  const source = await getAdminDashboard()
  const before = structuredClone(source)
  let state = source
  for (const color of colorUtils.adminCategoryColors) {
    state = categoryService.saveMockAdminCategory(state, { name: `  Dana   ${color.label}  `, color: color.id })
    const added = state.categories.at(-1)
    assert.match(added.id, /^mock-category-/)
    assert.equal(added.label, `Dana ${color.label}`)
    assert.equal(added.color, color.id)
    for (const key of ['openingBalance', 'income', 'expense', 'closingBalance']) assert.equal(added[key], 0)
    const style = colorUtils.adminCategoryColorStyle(added.color)
    assert.equal(style['--category-color'], color.text)
    assert.equal(style['--category-dot'], color.dot || color.swatch)
  }
  assert.equal(new Set(state.categories.map((category) => category.id)).size, 12)
  const edited = categoryService.saveMockAdminCategory(state, { name: 'Kas Utama', color: 'purple' }, 'mosque')
  assert.deepEqual(edited.categories[0], { ...source.categories[0], label: 'Kas Utama', color: 'purple' })
  assert.deepEqual(edited.totals, before.totals)
  assert.deepEqual(edited.recentTransactions, before.recentTransactions)
  assert.deepEqual(source, before)
  assert.deepEqual(await getAdminDashboard(), before)
  assert.throws(() => categoryService.saveMockAdminCategory(source, { name: '', color: '' }), /wajib/)
  assert.throws(() => categoryService.saveMockAdminCategory(source, { name: 'Baru', color: 'red' }, 'tidak-ada'), /tidak ditemukan/)
})

test('hapus melindungi seluruh riwayat termasuk Jumat tanpa cuplikan terbaru dan mengizinkan kategori mock kosong', async () => {
  const source = await getAdminDashboard()
  for (const category of source.categories) {
    assert.equal(categoryService.isAdminCategoryUsed(source, category.id), true)
    assert.throws(() => categoryService.deleteMockAdminCategory(source, category.id), /tidak dapat dihapus/)
  }
  const historyOnly = structuredClone(source)
  Object.assign(historyOnly.categories[1], { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 })
  assert.equal(historyOnly.recentTransactions.some((row) => row.categoryId === 'friday'), false)
  assert.equal(categoryService.isAdminCategoryUsed(historyOnly, 'friday'), true)
  assert.throws(() => categoryService.deleteMockAdminCategory(historyOnly, 'friday'), /tidak dapat dihapus/)
  const added = categoryService.saveMockAdminCategory(source, { name: 'Dana Baru', color: 'teal' })
  const id = added.categories.at(-1).id
  assert.equal(categoryService.isAdminCategoryUsed(added, id), false)
  assert.deepEqual(categoryService.deleteMockAdminCategory(added, id), source)
  const balanceOnly = structuredClone(added)
  balanceOnly.categories.at(-1).openingBalance = 1
  assert.throws(() => categoryService.deleteMockAdminCategory(balanceOnly, id), /tidak dapat dihapus/)
  assert.throws(() => categoryService.deleteMockAdminCategory(source, 'tidak-ada'), /tidak ditemukan/)
})

test('nama/warna bersama tampil di laporan tanpa mengubah 249 transaksi, saldo dan rekap bulanan', async () => {
  const source = await getAdminDashboard()
  const before = reportService.buildAdminFinanceReport(source)
  const edited = categoryService.saveMockAdminCategory(source, { name: 'Jumat Peduli', color: 'purple' }, 'friday')
  const state = categoryService.saveMockAdminCategory(edited, { name: 'Dana Tanpa Transaksi', color: 'yellow' })
  const report = reportService.buildAdminFinanceReport(state)
  assert.deepEqual(report.transactions, before.transactions)
  assert.deepEqual(report.totals, before.totals)
  const months = reportService.buildAdminMonthlyRecap(report)
  assert.equal(months.length, 10)
  assert.deepEqual(months.at(-1).totals, { ...source.totals, count: 13 })
  assert.ok(months.every((month) => month.categories.at(-1).closingBalance === 0))
  const html = renderPage(ReportPage, { dashboard: state, error: '' })
  assert.match(html, /Jumat Peduli/)
  assert.match(html, /--category-color:#974b7b/)
  assert.match(html, /admin-report-view--expense/)
  assert.match(html, /17\.228\.200/)
})

test('mode API menolak operasi mock kategori tanpa fallback atau endpoint baru', async () => {
  const api = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"api"' } })
  try {
    const service = await api.ssrLoadModule('/src/services/adminCategoryService.js')
    const state = await getAdminDashboard()
    assert.throws(() => service.saveMockAdminCategory(state, { name: 'Baru', color: 'red' }), /sesi mock/)
    assert.throws(() => service.deleteMockAdminCategory(state, 'mosque'), /sesi mock/)
  } finally { await api.close() }
})
