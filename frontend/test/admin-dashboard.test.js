import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'

const root = fileURLToPath(new URL('../', import.meta.url))
const createTestServer = (mode) => createServer({
  root, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode) },
})
let server
let getAdminDashboard
let Page
let App
before(async () => {
  server = await createTestServer('mock')
  ;({ getAdminDashboard } = await server.ssrLoadModule('/src/services/adminDashboardService.js'))
  ;({ default: Page } = await server.ssrLoadModule('/src/pages/AdminDashboardPage.jsx'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
})
after(async () => { await server?.close() })

const renderPage = (context) => renderToStaticMarkup(h(MemoryRouter, null, h(Routes, null,
  h(Route, { element: h(Outlet, { context }) }, h(Route, { index: true, element: h(Page) })),
)))

test('saldo dashboard sesuai referensi, tiap kategori dan total konsisten dalam integer Rupiah', async () => {
  const { categories, totals } = await getAdminDashboard()
  assert.deepEqual(totals, { openingBalance: 16864200, income: 1791500, expense: 1427500, closingBalance: 17228200 })
  assert.deepEqual(categories.map((row) => row.closingBalance), [12718200, 3654000, 856000])
  for (const row of [...categories, totals]) {
    for (const key of ['openingBalance', 'income', 'expense', 'closingBalance']) assert.ok(Number.isSafeInteger(row[key]))
    assert.equal(row.openingBalance + row.income - row.expense, row.closingBalance)
  }
})

test('lima transaksi terbaru valid dan hanya cuplikan dari mutasi kategori', async () => {
  const data = await getAdminDashboard()
  assert.equal(data.recentTransactions.length, 5)
  assert.equal(new Set(data.recentTransactions.map((item) => item.id)).size, 5)
  assert.equal(data.updatedDate, '2026-10-20')
  for (const [index, item] of data.recentTransactions.entries()) {
    assert.ok(data.categories.some((category) => category.id === item.categoryId))
    assert.ok(Number.isSafeInteger(item.amount) && item.amount > 0)
    assert.ok(['income', 'expense'].includes(item.type))
    assert.ok(item.date <= data.updatedDate)
    if (index) assert.ok(item.date <= data.recentTransactions[index - 1].date)
  }
  for (const category of data.categories) {
    for (const [type, key] of [['income', 'income'], ['expense', 'expense']]) {
      const sum = data.recentTransactions.filter((item) => item.categoryId === category.id && item.type === type).reduce((total, item) => total + item.amount, 0)
      assert.ok(sum <= category[key])
    }
  }
})

test('mock admin terisolasi dari mutasi dan mendukung pembatalan', async () => {
  const data = await getAdminDashboard()
  data.categories[0].openingBalance = 1
  data.recentTransactions.pop()
  data.account.name = 'Diubah'
  const fresh = await getAdminDashboard()
  assert.equal(fresh.categories[0].openingBalance, 13463200)
  assert.equal(fresh.recentTransactions.length, 5)
  assert.equal(fresh.account.name, 'Super Admin')
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getAdminDashboard({ signal: controller.signal }), { name: 'AbortError' })
})

test('mode API menampilkan error integrasi tanpa request atau fallback mock', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('HTTP tidak diharapkan.') }
  try {
    const service = await api.ssrLoadModule('/src/services/adminDashboardService.js')
    await assert.rejects(service.getAdminDashboard(), /Dashboard admin melalui API belum tersedia/)
    assert.equal(calls, 0)
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('dashboard menangani loading/error dan menampilkan tabel serta aksi nonaktif dari satu data', async () => {
  assert.match(renderPage({ dashboard: null, error: '' }), /role="status".*Memuat dashboard/)
  assert.match(renderPage({ dashboard: null, error: 'Gagal memuat.' }), /role="alert".*Gagal memuat/)
  const html = renderPage({ dashboard: await getAdminDashboard(), error: '' })
  assert.equal((html.match(/<table\b/g) || []).length, 2)
  assert.equal((html.match(/<button\b/g) || []).length, (html.match(/disabled=""/g) || []).length)
  assert.match(html, /Data contoh/)
  assert.match(html, /Saldo Awal \(Rp\)/)
  assert.match(html, /17\.228\.200/)
  assert.doesNotMatch(html, /realtime|<a\b|type="password"/)
})

test('route dashboard langsung memakai layout admin tanpa gate atau layout publik', () => {
  for (const route of ['/admin/dashboard', '/admin/dashboard/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.equal((html.match(/<main\b/g) || []).length, 1)
    assert.match(html, /admin-shell/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/dashboard"/)
    assert.match(html, /Memuat dashboard keuangan/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form|report-access-panel/)
  }
})
