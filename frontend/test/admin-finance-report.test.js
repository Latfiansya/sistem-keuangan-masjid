import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { buildAdminFinanceReport, filterAdminFinanceTransactions, getAdminFinancePreset, summarizeAdminFinanceTransactions, validateAdminFinanceRange } from '../src/services/adminFinanceReportService.js'

let server, App, Page, DashboardPage, getAdminDashboard, createAdminFinanceSummaryPng
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' } })
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: Page } = await server.ssrLoadModule('/src/pages/AdminFinanceReportPage.jsx'))
  ;({ default: DashboardPage } = await server.ssrLoadModule('/src/pages/AdminDashboardPage.jsx'))
  ;({ getAdminDashboard } = await server.ssrLoadModule('/src/services/adminDashboardService.js'))
  ;({ createAdminFinanceSummaryPng } = await server.ssrLoadModule('/src/services/adminFinanceExportService.js'))
})
after(async () => { await server?.close() })
const renderPage = (Component, context) => {
  const routes = h(Routes, null, h(Route, { element: h(Outlet, { context }) }, h(Route, { index: true, element: h(Component) })))
  return renderToStaticMarkup(h(MemoryRouter, null, routes))
}

test('fixture laporan terpisah mempertahankan snapshot dan lima cuplikan Dashboard tanpa mutasi', async () => {
  const dashboard = await getAdminDashboard()
  const before = structuredClone(dashboard)
  const report = buildAdminFinanceReport(dashboard)
  assert.equal(report.month, '2026-10')
  assert.deepEqual(report.range, { startDate: '2026-10-01', endDate: '2026-10-20' })
  assert.deepEqual(report.categories, dashboard.categories)
  assert.deepEqual(report.recentTransactions, dashboard.recentTransactions)
  assert.deepEqual(report.totals, { openingBalance: 16864200, income: 1791500, expense: 1427500, closingBalance: 17228200 })
  for (const row of report.categories) assert.equal(row.closingBalance, row.openingBalance + row.income - row.expense)
  assert.deepEqual(summarizeAdminFinanceTransactions(report.recentTransactions), { count: 5, income: 520000, expense: 328500 })
  assert.equal(report.transactions.length, 249)
  assert.deepEqual(summarizeAdminFinanceTransactions(filterAdminFinanceTransactions(report)), { count: 13, income: 1791500, expense: 1427500 })
  assert.deepEqual(dashboard, before)
  assert.deepEqual(await getAdminDashboard(), before)
})

test('249 transaksi mock unik, dua jenis di tiap kategori, rekonsiliasi bulanan dan saldo historis tanpa nilai negatif', async () => {
  const dashboard = await getAdminDashboard()
  const report = buildAdminFinanceReport(dashboard)
  assert.equal(new Set(report.transactions.map((row) => row.id)).size, 249)
  assert.equal(new Set(report.transactions.map((row) => [row.date, row.categoryId, row.type, row.description, row.amount].join('|'))).size, 249)
  assert.ok(report.transactions.every((row) => row.mock === true && ['reference', 'simulation', 'dashboard'].includes(row.source) && Number.isSafeInteger(row.amount) && row.amount > 0))
  assert.deepEqual(report.historyOpeningBalances, { mosque: 1497500, friday: 2088000, maintenance: 3484000 })
  for (const [category, count] of report.categories.map((row, index) => [row, [172, 38, 39][index]])) {
    const rows = report.transactions.filter((row) => row.categoryId === category.id)
    assert.equal(rows.length, count)
    assert.ok(rows.some((row) => row.type === 'income'))
    assert.ok(rows.some((row) => row.type === 'expense'))
    let running = report.historyOpeningBalances[category.id]
    for (const row of rows) {
      running += row.type === 'income' ? row.amount : -row.amount
      assert.ok(running >= 0, `${category.id}: ${row.date}`)
      validateAdminFinanceRange(report, { startDate: row.date, endDate: row.date })
    }
    assert.equal(running, category.closingBalance)
    const october = summarizeAdminFinanceTransactions(rows.filter((row) => row.date.startsWith('2026-10')))
    assert.equal(october.income, category.income)
    assert.equal(october.expense, category.expense)
    let closing = report.historyOpeningBalances[category.id]
    for (let month = 1; month <= 10; month++) {
      const prefix = `2026-${String(month).padStart(2, '0')}`
      const summary = summarizeAdminFinanceTransactions(rows.filter((row) => row.date.startsWith(prefix)))
      if (month === 10) assert.equal(closing, category.openingBalance)
      closing += summary.income - summary.expense
    }
    assert.equal(closing, category.closingBalance)
  }
  report.transactions[0].description = 'Perubahan pemanggil'
  assert.notEqual(buildAdminFinanceReport(dashboard).transactions[0].description, 'Perubahan pemanggil')
})

test('filter rentang/kategori/uraian lokal gabungan, trim/kapital, kosong, tanpa mutasi saldo atau transaksi', async () => {
  const report = buildAdminFinanceReport(await getAdminDashboard())
  const before = structuredClone(report)
  assert.equal(filterAdminFinanceTransactions(report, { categoryId: 'mosque' }).length, 10)
  assert.equal(filterAdminFinanceTransactions(report, { categoryId: 'friday' }).length, 1)
  assert.equal(filterAdminFinanceTransactions(report, { categoryId: 'maintenance', query: ' PEMBANGUNAN ' }).length, 2)
  assert.equal(filterAdminFinanceTransactions(report, { query: 'PENGAJIAN' }).length, 2)
  assert.equal(filterAdminFinanceTransactions(report, { range: { startDate: '2026-10-15', endDate: '2026-10-15' } }).length, 3)
  assert.equal(filterAdminFinanceTransactions(report, { range: { startDate: '2026-01-01', endDate: '2026-01-31' } }).length, 26)
  assert.deepEqual(filterAdminFinanceTransactions(report, { categoryId: 'mosque', query: 'pembangunan' }), [])
  assert.deepEqual(filterAdminFinanceTransactions(report, { query: '<script>' }), [])
  assert.deepEqual(summarizeAdminFinanceTransactions([]), { count: 0, income: 0, expense: 0 })
  assert.deepEqual(report, before)
})

test('preset mengacu tanggal snapshot dan validasi menolak tanggal kosong, terbalik, tidak valid atau di luar snapshot', async () => {
  const report = buildAdminFinanceReport(await getAdminDashboard())
  assert.deepEqual(getAdminFinancePreset(report, 'week'), { startDate: '2026-10-14', endDate: '2026-10-20' })
  assert.deepEqual(getAdminFinancePreset(report, 'month'), report.range)
  assert.equal(filterAdminFinanceTransactions(report, { range: getAdminFinancePreset(report, 'week') }).length, 4)
  assert.deepEqual(getAdminFinancePreset({ ...report, updatedDate: '2026-10-03' }, 'week'), { startDate: '2026-10-01', endDate: '2026-10-03' })
  assert.throws(() => getAdminFinancePreset(report, 'quarter'))
  for (const range of [{ startDate: '', endDate: report.updatedDate }, { startDate: '2026-10-15', endDate: '2026-10-14' }, { startDate: '2026-02-31', endDate: report.updatedDate }, { startDate: '2025-12-31', endDate: report.updatedDate }, { startDate: '2026-10-01', endDate: '2026-10-21' }]) assert.throws(() => validateAdminFinanceRange(report, range))
})

test('route/menu benar, loading/error, tiga tab kategori saja dan aksi mutasi nonaktif', async () => {
  for (const route of ['/admin/laporan', '/admin/laporan/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.match(html, /<h1>Laporan Keuangan<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/laporan"/)
    assert.match(html, /Memuat laporan keuangan admin/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form/)
  }
  assert.match(renderPage(Page, { dashboard: null, error: 'Integrasi belum tersedia.' }), /role="alert".*Integrasi belum tersedia/)
  const html = renderPage(Page, { dashboard: await getAdminDashboard(), error: '' })
  assert.equal((html.match(/role="tab"/g) || []).length, 3)
  assert.match(html, /Kas Masjid/)
  assert.match(html, /Kotak Jum&#x27;at Berkah/)
  assert.match(html, /Kotak Pembangunan &amp; Pemeliharaan/)
  assert.doesNotMatch(html, /Laporan Bulanan|Rekap Bulanan|Kas Keluar|<dialog/)
  assert.match(html, /bukan riwayat resmi.*Ringkasan saldo tetap snapshot/)
  assert.equal((html.match(/aria-label="Edit .*?\(belum tersedia\)"/g) || []).length, 185)
})

test('tabel resume laporan identik dengan Dashboard dan ID heading tidak ganda', async () => {
  const context = { dashboard: await getAdminDashboard(), error: '' }
  const balance = (Component) => renderPage(Component, context).match(/<table class="admin-balance-table">[\s\S]*?<\/table>/)[0]
  assert.equal(balance(Page), balance(DashboardPage))
  const html = renderPage(Page, context)
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size)
})

test('ekspor menolak lembar/tanggal belum siap dan signal abort tanpa membuat berkas', async () => {
  await assert.rejects(createAdminFinanceSummaryPng({ sheet: null, updatedDate: '2026-10-20' }), /belum siap/)
  await assert.rejects(createAdminFinanceSummaryPng({ sheet: null, updatedDate: '2026-02-31' }), /tanggal yang valid/)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(createAdminFinanceSummaryPng({ sheet: { matches: () => true }, updatedDate: '2026-10-20', signal: controller.signal }), { name: 'AbortError' })
})
