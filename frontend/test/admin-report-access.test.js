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

test('mode API menolak integrasi status tanpa HTTP atau fallback mock', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('HTTP tidak diharapkan.') }
  try {
    const service = await api.ssrLoadModule('/src/services/adminReportAccessService.js')
    await assert.rejects(service.getAdminReportAccessStatus(), /Status kode akses admin melalui API belum tersedia/)
    assert.equal(calls, 0)
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('route dan penjelasan mengikuti UI gate M1.8b tanpa form, klaim enkripsi atau penguncian laporan', () => {
  for (const path of ['/admin/kode-akses-laporan', '/admin/kode-akses-laporan/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
    assert.match(html, /<h1>Kode Akses Laporan<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/kode-akses-laporan"/)
    assert.match(html, /Super Admin Only/)
    assert.match(html, /Memuat status kode akses contoh/)
    assert.match(html, /Tombol laporan di Beranda atau Footer membuka gate \(permintaan kode\)/)
    assert.match(html, /Setelah integrasi, sistem memeriksa kode yang dimasukkan pengunjung/)
    assert.match(html, /Akses langsung dan refresh <code>\/laporan-keuangan<\/code> tetap tanpa gate/)
    assert.match(html, /bukan autentikasi atau otorisasi laporan/)
    assert.match(html, /Autentikasi Super Admin untuk mengelolanya terpisah/)
    assert.doesNotMatch(html, /<form|<input|<dialog|Terenkripsi|realtime|<code>\/laporan<\/code>/)
  }
})
