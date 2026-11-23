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
let getAdminWebsiteSettings
let validateAdminWebsiteSettings
let getAdminProfile
let source
let App
before(async () => {
  server = await createTestServer('mock')
  ;({ getAdminWebsiteSettings, validateAdminWebsiteSettings } = await server.ssrLoadModule('/src/services/adminWebsiteSettingsService.js'))
  ;({ getAdminProfile } = await server.ssrLoadModule('/src/services/adminProfileService.js'))
  ;({ mockPublicContent: source } = await server.ssrLoadModule('/src/mocks/publicContent.js'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
})
after(async () => { await server?.close() })

test('pengaturan memakai salinan alamat, kontak belum dikonfirmasi kosong dan tidak menyinkronkan publik/profil', async () => {
  const before = structuredClone(source)
  const initial = await getAdminWebsiteSettings()
  assert.deepEqual(initial, { whatsapp: '', email: '', address: source.address, mapsUrl: '', phone: '', phoneNote: '', hours: '', mapLabel: '', publicReportEnabled: true })
  const changed = await getAdminWebsiteSettings()
  changed.address = 'Alamat sementara'
  changed.whatsapp = '+62 812 0000 0000'
  changed.email = 'pengurus@contoh.test'
  changed.mapsUrl = 'https://maps.google.com/'
  changed.publicReportEnabled = false
  assert.deepEqual(await getAdminWebsiteSettings(), initial)
  assert.equal((await getAdminProfile()).address, before.address)
  assert.deepEqual(source, before)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getAdminWebsiteSettings({ signal: controller.signal }), { name: 'AbortError' })
})

test('validasi opsional WhatsApp, email dan HTTPS Google Maps menerima format lazim serta menolak input tidak sesuai', () => {
  const base = { whatsapp: '', email: '', mapsUrl: '' }
  assert.deepEqual(validateAdminWebsiteSettings(base), {})
  assert.deepEqual(validateAdminWebsiteSettings({ whatsapp: '+62 812-0000-0000', email: 'pengurus@contoh.test', mapsUrl: 'https://maps.google.com/?q=Sorolaten' }), {})
  for (const mapsUrl of ['https://www.google.com/maps', 'https://google.co.id/maps/place/Sorolaten', 'https://maps.google.co.id/', 'https://maps.app.goo.gl/contoh', 'https://goo.gl/maps/contoh']) {
    assert.deepEqual(validateAdminWebsiteSettings({ ...base, mapsUrl }), {})
  }
  for (const whatsapp of ['abc', '123', '1234567890123456', '0812+34567890', '0812\n34567890']) assert.match(validateAdminWebsiteSettings({ ...base, whatsapp }).whatsapp, /8–15 digit/)
  for (const email of ['salah', 'a@b', 'a b@contoh.test', 'a@contoh.test\u0000']) assert.match(validateAdminWebsiteSettings({ ...base, email }).email, /email yang valid/)
  for (const mapsUrl of ['bukan URL', 'javascript:alert(1)', 'http://maps.google.com/', 'https://contoh.test/maps', 'https://maps.google.com.contoh.test/', 'https://google.com/search', 'https://user:pass@maps.google.com/', 'https://maps.app.goo.gl/', 'https://maps.google.com/a b']) {
    assert.match(validateAdminWebsiteSettings({ ...base, mapsUrl }).mapsUrl, /HTTPS Google Maps/)
  }
})

test('validasi nomor telepon opsional menerima format lazim dan menolak digit yang kurang', () => {
  const base = { whatsapp: '', email: '', mapsUrl: '' }
  assert.deepEqual(validateAdminWebsiteSettings({ ...base, phone: '(0274) 123456' }), {})
  assert.deepEqual(validateAdminWebsiteSettings({ ...base, phone: '' }), {})
  assert.match(validateAdminWebsiteSettings({ ...base, phone: '123' }).phone, /8–15 digit/)
})

test('mode API mengambil dan menyimpan pengaturan ke /api/admin/website-settings tanpa fallback mock', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    if (init.method === 'PUT') {
      return new Response(JSON.stringify({ success: true, data: JSON.parse(init.body) }), { status: 200 })
    }
    return new Response(JSON.stringify({ success: true, data: { whatsapp: '628123456789', email: 'takmir@masjid.id', address: 'Sorolaten', mapsUrl: 'https://maps.google.com/?q=Sorolaten', publicReportEnabled: true } }), { status: 200 })
  }
  try {
    const service = await api.ssrLoadModule('/src/services/adminWebsiteSettingsService.js')
    const settings = await service.getAdminWebsiteSettings()
    assert.equal(settings.publicReportEnabled, true)
    const saved = await service.saveAdminWebsiteSettings({ ...settings, publicReportEnabled: false, phone: ' 0274 123456 ' })
    assert.equal(saved.publicReportEnabled, false)
    assert.equal('latitude' in saved, false)
    assert.equal(saved.phone, '0274 123456')
    assert.deepEqual(calls.map((c) => [c.init.method, c.url]), [['GET', '/api/admin/website-settings'], ['PUT', '/api/admin/website-settings']])
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('route langsung/trailing slash memakai menu dan judul Topbar yang benar dengan loading', () => {
  for (const path of ['/admin/kontak-pengaturan', '/admin/kontak-pengaturan/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
    assert.match(html, /<h1>Kontak &amp; Pengaturan Website<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/kontak-pengaturan"/)
    assert.match(html, /Memuat kontak dan pengaturan website/)
    assert.match(html, /form="admin-settings-form" disabled=""/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form/)
  }
})
