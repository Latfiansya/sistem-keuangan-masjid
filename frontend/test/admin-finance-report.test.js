import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { buildAdminFinanceReport, buildAdminMonthlyRecap, filterAdminFinanceTransactions, getAdminFinancePreset, summarizeAdminFinanceTransactions, validateAdminFinanceRange } from '../src/services/adminFinanceReportService.js'

let server, App, Page, DashboardPage, DownloadPage, getAdminDashboard
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' } })
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: Page } = await server.ssrLoadModule('/src/pages/AdminFinanceReportPage.jsx'))
  ;({ default: DownloadPage } = await server.ssrLoadModule('/src/pages/AdminReportDownloadPage.jsx'))
  ;({ default: DashboardPage } = await server.ssrLoadModule('/src/pages/AdminDashboardPage.jsx'))
  ;({ getAdminDashboard } = await server.ssrLoadModule('/src/services/adminDashboardService.js'))
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

test('empat preset memakai kalender lokal, bulan bergulir menjepit akhir bulan, dan rentang kosong tidak mengarang saldo', async () => {
  const report = buildAdminFinanceReport(await getAdminDashboard())
  const today = new Date(2026, 10, 11, 23, 30)
  for (const [preset, startDate] of [['week', '2026-11-05'], ['month', '2026-10-11'], ['quarter', '2026-08-11'], ['currentMonth', '2026-11-01']]) {
    const range = getAdminFinancePreset(preset, today)
    assert.deepEqual(range, { startDate, endDate: '2026-11-11' })
    validateAdminFinanceRange(report, range)
  }
  assert.deepEqual(getAdminFinancePreset('week', new Date(2026, 0, 3)), { startDate: '2025-12-28', endDate: '2026-01-03' })
  assert.equal(getAdminFinancePreset('month', new Date(2024, 2, 31)).startDate, '2024-02-29')
  assert.equal(getAdminFinancePreset('quarter', new Date(2026, 4, 31)).startDate, '2026-02-28')
  const range = getAdminFinancePreset('currentMonth', today)
  assert.deepEqual(filterAdminFinanceTransactions(report, { range }), [])
  assert.deepEqual(buildAdminMonthlyRecap(report, range), [])
  assert.deepEqual(buildAdminMonthlyRecap(report, { startDate: '2026-10-21', endDate: '2026-10-31' }), [])
  assert.throws(() => getAdminFinancePreset('unknown'))
  for (const range of [{ startDate: '', endDate: report.updatedDate }, { startDate: '2026-10-15', endDate: '2026-10-14' }, { startDate: '2026-02-31', endDate: report.updatedDate }]) assert.throws(() => validateAdminFinanceRange(report, range))
  assert.deepEqual(report.totals, { openingBalance: 16864200, income: 1791500, expense: 1427500, closingBalance: 17228200 })
})

test('route/menu benar, loading/error, tiga jenis laporan saja dan aksi mutasi nonaktif', async () => {
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
  assert.match(html, /Kas Masuk/)
  assert.match(html, /Kas Keluar/)
  assert.match(html, /Rekap Bulanan/)
  assert.doesNotMatch(html, /Laporan Bulanan|admin-report-tab-mosque|admin-report-tab-friday|<dialog/)
  assert.match(html, /bukan riwayat resmi.*Ringkasan saldo tetap snapshot/)
  assert.equal((html.match(/aria-label="Edit .*?\(belum tersedia\)"/g) || []).length, 13)
})

test('tabel resume laporan identik dengan Dashboard dan ID heading tidak ganda', async () => {
  const context = { dashboard: await getAdminDashboard(), error: '' }
  const balance = (Component) => renderPage(Component, context).match(/<table class="admin-balance-table">[\s\S]*?<\/table>/)[0]
  assert.equal(balance(Page), balance(DashboardPage))
  const html = renderPage(Page, context)
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size)
})

test('Kas Masuk dan Kas Keluar mencakup semua kategori tanpa kehilangan atau menduplikasi transaksi', async () => {
  const report = buildAdminFinanceReport(await getAdminDashboard())
  const before = structuredClone(report)
  const income = filterAdminFinanceTransactions(report, { range: report.coverage, type: 'income' })
  const expense = filterAdminFinanceTransactions(report, { range: report.coverage, type: 'expense' })
  assert.equal(income.length, 141)
  assert.equal(expense.length, 108)
  assert.equal(summarizeAdminFinanceTransactions(income).income, 74941200)
  assert.equal(summarizeAdminFinanceTransactions(expense).expense, 64782500)
  for (const [rows, type] of [[income, 'income'], [expense, 'expense']]) {
    assert.ok(rows.every((row) => row.type === type))
    assert.equal(new Set(rows.map((row) => row.categoryId)).size, 3)
  }
  assert.equal(new Set([...income, ...expense].map((row) => row.id)).size, 249)
  const search = filterAdminFinanceTransactions(report, { range: report.coverage, type: 'expense', query: ' LISTRIK ' })
  assert.ok(search.length > 0)
  assert.ok(search.every((row) => row.type === 'expense' && row.description.toLowerCase().includes('listrik')))
  assert.deepEqual(report, before)
})

test('rekap bulanan dihitung dari seluruh transaksi, membawa saldo dan mendukung rentang parsial/kosong', async () => {
  const report = buildAdminFinanceReport(await getAdminDashboard())
  const before = structuredClone(report)
  for (const range of [report.coverage, { startDate: '2026-01-15', endDate: '2026-02-18' }, { startDate: '2026-10-16', endDate: '2026-10-20' }]) {
    const months = buildAdminMonthlyRecap(report, range)
    const filtered = filterAdminFinanceTransactions(report, { range })
    assert.equal(months.reduce((sum, month) => sum + month.totals.count, 0), filtered.length)
    for (const [index, month] of months.entries()) {
      for (const category of month.categories) {
        const start = month.month === range.startDate.slice(0, 7) ? range.startDate : month.month + '-01'
        const prior = report.transactions.filter((row) => row.categoryId === category.id && row.date < start)
        const rows = filtered.filter((row) => row.categoryId === category.id && row.date.startsWith(month.month))
        const opening = report.historyOpeningBalances[category.id] + prior.reduce((sum, row) => sum + (row.type === 'income' ? row.amount : -row.amount), 0)
        assert.equal(category.openingBalance, opening)
        assert.equal(category.income, rows.filter((row) => row.type === 'income').reduce((sum, row) => sum + row.amount, 0))
        assert.equal(category.expense, rows.filter((row) => row.type === 'expense').reduce((sum, row) => sum + row.amount, 0))
        assert.equal(category.closingBalance, opening + category.income - category.expense)
        if (index) assert.equal(category.openingBalance, months[index - 1].categories.find((row) => row.id === category.id).closingBalance)
      }
      for (const key of ['openingBalance', 'income', 'expense', 'closingBalance']) assert.equal(month.totals[key], month.categories.reduce((sum, row) => sum + row[key], 0))
    }
  }
  const months = buildAdminMonthlyRecap(report)
  assert.equal(months.length, 10)
  assert.equal(months[0].totals.openingBalance, 7069500)
  assert.deepEqual(months.at(-1).totals, { ...report.totals, count: 13 })
  assert.throws(() => buildAdminMonthlyRecap(report, { startDate: '', endDate: report.updatedDate }))
  assert.deepEqual(report, before)
})


test('dua route unduhan menggunakan AdminLayout dan pengaturan memiliki tiga jenis/PDF awal tanpa modal', async () => {
  for(const [route,title]of [['/admin/laporan/unduh','Pengaturan Unduhan'],['/admin/laporan/unduh/pratinjau','Pratinjau &amp; Unduh Laporan']]){
    const html=renderToStaticMarkup(h(MemoryRouter,{initialEntries:[route]},h(App)))
    assert.ok(html.includes(`<h1>${title}</h1>`))
    assert.match(html,/aria-current="page"[^>]*href="\/admin\/laporan"/)
    assert.doesNotMatch(html,/public-layout|<dialog/)
  }
  const context={dashboard:await getAdminDashboard(),error:'',reportDownload:null,setReportDownload:()=>{}}
  const html=renderPage(DownloadPage,context)
  assert.equal((html.match(/type="checkbox"/g)||[]).length,3)
  assert.match(html,/name="downloadFormat"[^>]*checked=""[^>]*value="pdf"/)
  assert.match(html,/Rentang Tanggal/)
  assert.doesNotMatch(html,/Laporan Bulanan|<dialog|admin-download-page-count/)
  const invalid=renderPage(DownloadPage,{...context,reportDownload:{range:{startDate:'2026-10-01',endDate:'2026-10-31'},periodMode:'months',preset:'week',types:[],format:'pdf'}})
  assert.match(invalid,/role="alert"[^>]*>Pilih minimal satu/)
})
