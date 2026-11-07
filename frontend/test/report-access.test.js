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
let App
let ReportAccessPanel
before(async () => {
  server = await createTestServer('mock')
  ;({ checkReportPassword } = await server.ssrLoadModule('/src/services/reportService.js'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: ReportAccessPanel } = await server.ssrLoadModule('/src/components/ReportAccessPanel.jsx'))
})
after(async () => { await server?.close() })

test('service menolak sandi kosong dan nilai bukan teks', async () => {
  for (const password of ['', '   ', null]) await assert.rejects(checkReportPassword(password), /Sandi wajib diisi/)
})

test('service menerima sandi demo khusus mock', async () => {
  assert.deepEqual(await checkReportPassword('demo123'), { valid: true })
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

test('mode API belum tersedia dan tidak memakai sandi mock sebagai validasi produksi', async () => {
  const apiServer = await createTestServer('api')
  try {
    const service = await apiServer.ssrLoadModule('/src/services/reportService.js')
    await assert.rejects(service.checkReportPassword('demo123'), /Pemeriksaan sandi melalui API belum tersedia/)
  } finally { await apiServer.close() }
})

test('route laporan langsung merender laporan tanpa gate atau layout publik', () => {
  for (const route of ['/laporan-keuangan', '/laporan-keuangan/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.equal((html.match(/<main\b/g) || []).length, 1)
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.match(html, /financial-report/)
    assert.match(html, /Memuat laporan keuangan/)
    assert.doesNotMatch(html, /<nav|<footer|type="password"|report-access-panel|demo123/)
  }
})

test('panel sandi reusable mempertahankan form dan keterangan netral', () => {
  const html = renderToStaticMarkup(h(ReportAccessPanel, { onAccessGranted() {} }))
  assert.match(html, /type="password"/)
  assert.match(html, /type="submit"/)
  assert.match(html, /Akses menggunakan sandi bersama/)
  assert.doesNotMatch(html, /aman.*terenkripsi|demo123/)
})
