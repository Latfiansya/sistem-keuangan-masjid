import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

const root = fileURLToPath(new URL('../', import.meta.url))
const createTestServer = (mode) => createServer({
  root, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode) },
})
let server
let checkReportPassword
let getReport
let hasMockReportAccess
let resetMockReportAccess
let isReportAccessRequiredError
let App
let ReportAccessPanel
before(async () => {
  server = await createTestServer('mock')
  ;({
    checkReportPassword,
    getReport,
    hasMockReportAccess,
    resetMockReportAccess,
    isReportAccessRequiredError,
  } = await server.ssrLoadModule('/src/services/reportService.js'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: ReportAccessPanel } = await server.ssrLoadModule('/src/components/ReportAccessPanel.jsx'))
})
after(async () => { await server?.close() })

test('service menolak sandi kosong dan nilai bukan teks serta mengunci getReport sebelum kode diisi', async () => {
  resetMockReportAccess()
  assert.equal(hasMockReportAccess(), false)
  await assert.rejects(getReport(), { status: 401, code: 'REPORT_ACCESS_REQUIRED' })
  for (const password of ['', '   ', null]) await assert.rejects(checkReportPassword(password), /Sandi wajib diisi/)
})

test('service menerima sandi demo khusus mock dan membuka akses getReport sementara sesi', async () => {
  resetMockReportAccess()
  assert.deepEqual(await checkReportPassword('demo123'), { valid: true })
  assert.equal(hasMockReportAccess(), true)
  const report = await getReport()
  assert.equal(report.status, 'ready')
  resetMockReportAccess()
})

test('service menolak sandi salah tanpa mengubah kapital atau spasi', async () => {
  for (const password of ['salah', 'Demo123', ' demo123 ']) assert.deepEqual(await checkReportPassword(password), { valid: false })
})

test('pemeriksaan dapat dibatalkan sebelum maupun selama menunggu', async () => {
  const beforeRequest = new AbortController()
  beforeRequest.abort()
  await assert.rejects(checkReportPassword('demo123', { signal: beforeRequest.signal }), { name: 'AbortError' })
  const duringRequest = new AbortController()
  const result = checkReportPassword('demo123', { signal: duringRequest.signal })
  duringRequest.abort()
  await assert.rejects(result, { name: 'AbortError' })
})

test('mode API memanggil POST /api/public/report/check-password dan tidak memakai sandi mock', async () => {
  const apiServer = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    const body = JSON.parse(init.body)
    return new Response(JSON.stringify({ success: true, data: { valid: body.password === 'sandi-db' } }), { status: 200 })
  }
  try {
    const service = await apiServer.ssrLoadModule('/src/services/reportService.js')
    assert.deepEqual(await service.checkReportPassword('demo123'), { valid: false })
    assert.deepEqual(await service.checkReportPassword('sandi-db'), { valid: true })
    assert.equal(calls.length, 2)
    assert.equal(calls[0].url, '/api/public/report/check-password')
    assert.equal(calls[0].init.method, 'POST')
  } finally { globalThis.fetch = originalFetch; await apiServer.close() }
})

test('route laporan langsung menampilkan gate kode akses dan menolak masuk tanpa memasukkan kode', () => {
  resetMockReportAccess()
  for (const route of ['/laporan-keuangan', '/laporan-keuangan/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.equal((html.match(/<main\b/g) || []).length, 1)
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.match(html, /report-access-panel/)
    assert.match(html, /type="password"/)
    assert.match(html, /Kembali ke Beranda/)
    assert.doesNotMatch(html, /<nav|<footer|financial-report|financial-transactions-table|demo123/)
  }
  assert.equal(isReportAccessRequiredError({ status: 401 }), true)
  assert.equal(isReportAccessRequiredError({ code: 'REPORT_ACCESS_REQUIRED' }), true)
  assert.equal(isReportAccessRequiredError({ status: 500 }), false)
})

test('panel sandi reusable mempertahankan form dan keterangan netral', () => {
  const html = renderToStaticMarkup(h(ReportAccessPanel, { onAccessGranted() {} }))
  assert.match(html, /type="password"/)
  assert.match(html, /type="submit"/)
  assert.match(html, /Akses menggunakan sandi bersama/)
  assert.doesNotMatch(html, /aman.*terenkripsi|demo123/)
})

test('D-20: publicReportEnabled false menyembunyikan CTA Beranda dan tautan Footer, serta helper mendeteksi 403/404', async () => {
  const { isPublicReportEnabled, isPublicReportDisabledError, PUBLIC_REPORT_DISABLED_MESSAGE } = await server.ssrLoadModule('/src/services/reportService.js')
  const { default: HomePage } = await server.ssrLoadModule('/src/pages/HomePage.jsx')
  const { default: Footer } = await server.ssrLoadModule('/src/components/Footer.jsx')
  const { getPublicContent } = await server.ssrLoadModule('/src/services/publicContentService.js')
  const { Outlet, Route, Routes } = await import('react-router')

  // Default aman: undefined/null/true tetap dianggap aktif; hanya false eksplisit yang menonaktifkan
  assert.equal(isPublicReportEnabled(null), true)
  assert.equal(isPublicReportEnabled(undefined), true)
  assert.equal(isPublicReportEnabled({}), true)
  assert.equal(isPublicReportEnabled({ publicReportEnabled: true }), true)
  assert.equal(isPublicReportEnabled({ publicReportEnabled: false }), false)

  // Penanganan defensif error 403/404/PUBLIC_REPORT_DISABLED dari API laporan
  assert.equal(isPublicReportDisabledError({ status: 403 }), true)
  assert.equal(isPublicReportDisabledError({ status: 404 }), true)
  assert.equal(isPublicReportDisabledError({ status: 400, code: 'PUBLIC_REPORT_DISABLED' }), true)
  assert.equal(isPublicReportDisabledError({ status: 400, code: 'FORBIDDEN' }), true)
  assert.equal(isPublicReportDisabledError({ status: 500, code: 'INTERNAL_ERROR' }), false)
  assert.match(PUBLIC_REPORT_DISABLED_MESSAGE, /tidak ditampilkan oleh pengurus masjid/)

  const base = await getPublicContent()
  const renderHome = (content) => renderToStaticMarkup(h(
    MemoryRouter,
    { initialEntries: ['/'] },
    h(Routes, null, h(Route, { element: h(Outlet, { context: { content, error: '', openReportAccess() {} } }) }, h(Route, { index: true, element: h(HomePage) }))),
    h(Footer, { content, onReportAccess() {} })
  ))

  const htmlActive = renderHome({ ...base, publicReportEnabled: true })
  assert.match(htmlActive, /Transparansi &amp; Akuntabilitas Keuangan/)
  assert.match(htmlActive, /href="\/laporan-keuangan"/)

  const htmlHidden = renderHome({ ...base, publicReportEnabled: false })
  assert.doesNotMatch(htmlHidden, /Transparansi &amp; Akuntabilitas Keuangan/)
  assert.doesNotMatch(htmlHidden, /href="\/laporan-keuangan"/)
  assert.match(htmlHidden, /href="\/admin\/login"/)
})
