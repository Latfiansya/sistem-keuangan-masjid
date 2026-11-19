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

test('mode mock menolak login tanpa HTTP; mode API memanggil /api/admin/auth/login', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({
      success: true,
      data: { token: 't', expiresAt: '2026-12-01', user: { id: '2', name: 'Super Admin', email: 'superadmin@masjid.id', role: 'Super Admin' } },
    }), { status: 200 })
  }
  try {
    const mockProd = await createTestServer('mock', false)
    try {
      const auth = await mockProd.ssrLoadModule('/src/services/adminAuthService.js')
      await assert.rejects(auth.loginAdmin({ email: 'nama@contoh.test', password: 'hanya-data-uji' }), /Login pengurus belum tersedia/)
      assert.equal(calls.length, 0)
    } finally { await mockProd.close() }

    for (const development of [true, false]) {
      const api = await createTestServer('api', development)
      try {
        const auth = await api.ssrLoadModule('/src/services/adminAuthService.js')
        const res = await auth.loginAdmin({ email: 'superadmin@masjid.id', password: 'password-uji' })
        assert.equal(res.user.role, 'Super Admin')
      } finally { await api.close() }
    }
    assert.equal(calls.length, 2)
    assert.equal(calls[0].url, '/api/admin/auth/login')
    assert.equal(calls[0].init.method, 'POST')
    assert.equal(calls[0].init.credentials, 'include')
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
