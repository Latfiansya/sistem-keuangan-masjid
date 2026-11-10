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

test('kategori menangani loading/error dan menampilkan tiga kategori dengan tujuh aksi nonaktif', async () => {
  assert.match(renderPage(CategoriesPage, { dashboard: null, error: '' }), /role="status".*Memuat kategori dana/)
  assert.match(renderPage(CategoriesPage, { dashboard: null, error: 'Gagal memuat.' }), /role="alert".*Gagal memuat/)
  const html = renderPage(CategoriesPage, { dashboard: await getAdminDashboard(), error: '' })
  assert.equal((html.match(/<table\b/g) || []).length, 2)
  assert.equal((html.match(/<button\b/g) || []).length, 7)
  assert.equal((html.match(/disabled=""/g) || []).length, 7)
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
