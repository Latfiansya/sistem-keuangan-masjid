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

test('Kelola Dana menangani loading/error dan menampilkan aksi nonaktif tanpa form atau halaman fiktif', async () => {
  assert.match(renderPage(FundsPage, { dashboard: null, error: '' }), /role="status".*Memuat data kelola dana/)
  assert.match(renderPage(FundsPage, { dashboard: null, error: 'Gagal memuat.' }), /role="alert".*Gagal memuat/)
  const html = renderPage(FundsPage, { dashboard: await getAdminDashboard(), error: '' })
  assert.match(html, /MANAJEMEN TRANSAKSI/)
  assert.match(html, /Kelola Transaksi/)
  assert.match(html, /Data contoh · Fitur transaksi belum tersedia/)
  assert.equal((html.match(/<button\b/g) || []).length, 3)
  assert.equal((html.match(/disabled=""/g) || []).length, 3)
  assert.equal((html.match(/<table\b/g) || []).length, 1)
  assert.equal((html.match(/<tbody><tr|<\/tr><tr/g) || []).length, 5)
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
