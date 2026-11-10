import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

const root = fileURLToPath(new URL('../', import.meta.url))
const createTestServer = (mode, development = true) => createServer({
  root, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode), 'import.meta.env.DEV': JSON.stringify(development) },
})
let server
let service
let App
let Footer

before(async () => {
  server = await createTestServer('mock')
  service = await server.ssrLoadModule('/src/services/adminAuthService.js')
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: Footer } = await server.ssrLoadModule('/src/components/Footer.jsx'))
})
after(async () => { await server?.close() })

test('login menangani field wajib, format email dan karakter kontrol tanpa membatasi karakter sandi biasa', () => {
  for (const credentials of [undefined, {}, { email: ' ', password: ' ' }]) {
    assert.deepEqual(Object.keys(service.validateAdminLogin(credentials)), ['email', 'password'])
  }
  for (const email of ['bukan-email', 'nama@', '@contoh.test', 'nama @contoh.test', 'nama@contoh.test\u0000']) {
    assert.ok(service.validateAdminLogin({ email, password: 'nilai-uji' }).email)
  }
  assert.deepEqual(service.validateAdminLogin({ email: ' nama+uji@contoh.test ', password: " spasi & '<> tetap " }), {})
  assert.ok(service.validateAdminLogin({ email: 'nama@contoh.test', password: 'sandi\n' }).password)
})

test('service menolak input tidak valid dan tidak mengautentikasi kredensial apa pun', async () => {
  await assert.rejects(service.loginAdmin({}), /Email wajib diisi/)
  await assert.rejects(service.loginAdmin({ email: 'nama@contoh.test', password: '' }), /Password wajib diisi/)
  const credentials = { email: 'nama@contoh.test', password: 'hanya-data-uji' }
  const original = { ...credentials }
  await assert.rejects(service.loginAdmin(credentials), /Login pengurus belum tersedia/)
  assert.deepEqual(credentials, original)
})

test('simulasi development dapat dibatalkan sebelum dan selama loading', async () => {
  const credentials = { email: 'nama@contoh.test', password: 'hanya-data-uji' }
  const beforeRequest = new AbortController()
  beforeRequest.abort()
  await assert.rejects(service.loginAdmin(credentials, { signal: beforeRequest.signal }), { name: 'AbortError' })
  const duringRequest = new AbortController()
  const result = service.loginAdmin(credentials, { signal: duringRequest.signal })
  duringRequest.abort()
  await assert.rejects(result, { name: 'AbortError' })
})

test('mode API dan production menolak login tanpa HTTP atau fallback autentikasi mock', async () => {
  const originalFetch = globalThis.fetch
  let requests = 0
  globalThis.fetch = async () => { requests++; throw new Error('HTTP tidak diharapkan.') }
  try {
    for (const [mode, development] of [['api', true], ['mock', false], ['api', false]]) {
      const instance = await createTestServer(mode, development)
      try {
        const auth = await instance.ssrLoadModule('/src/services/adminAuthService.js')
        await assert.rejects(auth.loginAdmin({ email: 'nama@contoh.test', password: 'hanya-data-uji' }), /Login pengurus belum tersedia/)
      } finally { await instance.close() }
    }
    assert.equal(requests, 0)
  } finally { globalThis.fetch = originalFetch }
})

test('route login terpisah dari layout publik, field kosong dan tanpa fitur admin lain', () => {
  for (const route of ['/admin/login', '/admin/login/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.equal((html.match(/<main\b/g) || []).length, 1)
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.match(html, /Masuk Pengurus/)
    assert.match(html, /type="email"[^>]*required=""[^>]*value=""/)
    assert.match(html, /type="password"[^>]*required=""[^>]*value=""/)
    assert.match(html, /type="button"[^>]*aria-label="Tampilkan password"[^>]*aria-controls="admin-password"/)
    assert.match(html, /type="submit"/)
    assert.doesNotMatch(html, /<nav|<footer|public-layout|Lupa|Registrasi|superadmin@|demo123/)
  }
})

test('Footer publik mempertahankan tautan Masuk Pengurus menuju login', () => {
  const html = renderToStaticMarkup(h(MemoryRouter, null, h(Footer)))
  assert.match(html, /<a[^>]*href="\/admin\/login"[^>]*>.*?Masuk Pengurus<\/a>/)
  assert.match(html, /href="\/laporan-keuangan"/)
})
