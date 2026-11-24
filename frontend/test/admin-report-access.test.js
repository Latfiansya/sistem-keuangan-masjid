import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

const createTestServer = (mode) => createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode) },
})
let server
let getAdminReportAccessStatus
let App
before(async () => {
  server = await createTestServer('mock')
  ;({ getAdminReportAccessStatus } = await server.ssrLoadModule('/src/services/adminReportAccessService.js'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
})
after(async () => { await server?.close() })

test('status hanya metadata contoh tanpa kode/hash/kredensial dan salinannya terisolasi', async () => {
  const metadata = await getAdminReportAccessStatus()
  assert.deepEqual(Object.keys(metadata).sort(), ['active', 'changedBy', 'changedDate', 'changedTime'])
  assert.equal(metadata.active, true)
  metadata.changedBy = 'Diubah lokal'
  metadata.active = false
  const fresh = await getAdminReportAccessStatus()
  assert.equal(fresh.changedBy, 'Super Admin')
  assert.equal(fresh.active, true)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getAdminReportAccessStatus({ signal: controller.signal }), { name: 'AbortError' })
})

test('mode API membaca dan memperbarui kode akses lewat /api/admin/report-access tanpa fallback mock', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ success: true, data: { active: init.method === 'PUT', publicReportEnabled: true, changedDate: '2026-11-19', changedTime: '18:00', changedBy: 'Super Admin' } }), { status: 200 })
  }
  try {
    const service = await api.ssrLoadModule('/src/services/adminReportAccessService.js')
    const status = await service.getAdminReportAccessStatus()
    assert.equal(status.active, false)
    const updated = await service.updateAdminReportAccess({ code: 'sandibaru123', publicReportEnabled: true })
    assert.equal(updated.active, true)
    assert.deepEqual(calls.map((c) => [c.init.method, c.url]), [['GET', '/api/admin/report-access'], ['PUT', '/api/admin/report-access']])
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('route dan penjelasan mengikuti UI gate M1.8b tanpa form, klaim enkripsi atau penguncian laporan', () => {
  for (const path of ['/admin/kode-akses-laporan', '/admin/kode-akses-laporan/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
    assert.match(html, /<h1>Kode Akses Laporan<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/kode-akses-laporan"/)
    assert.doesNotMatch(html, /Super Admin Only/)
    assert.match(html, /Memuat status kode akses contoh/)
    assert.match(html, /Tombol laporan di Beranda atau Footer membuka gate \(permintaan kode\)/)
    assert.match(html, /Setelah integrasi, sistem memeriksa kode yang dimasukkan pengunjung/)
    assert.match(html, /Akses langsung dan refresh <code>\/laporan-keuangan<\/code> tetap tanpa gate/)
    assert.match(html, /bukan autentikasi atau otorisasi laporan/)
    assert.match(html, /dikelola oleh pengurus terautentikasi \(Admin dan Super Admin\)/)
    assert.doesNotMatch(html, /<form|<input|<dialog|Terenkripsi|realtime|<code>\/laporan<\/code>/)
  }
})
