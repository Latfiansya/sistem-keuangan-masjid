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
let getAdminProfile
let validateAdminProfile
let validateAdminProfilePhoto
let source
let App
before(async () => {
  server = await createTestServer('mock')
  ;({ getAdminProfile, validateAdminProfile, validateAdminProfilePhoto } = await server.ssrLoadModule('/src/services/adminProfileService.js'))
  ;({ mockPublicContent: source } = await server.ssrLoadModule('/src/mocks/publicContent.js'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
})
after(async () => { await server?.close() })

test('profil admin mengambil salinan field publik dan tidak mengarang nomor kontak', async () => {
  const before = structuredClone(source)
  const profile = await getAdminProfile()
  assert.deepEqual(profile, { name: source.name, description: source.heroDescription, address: source.address, contact: '' })
  profile.name = 'Nama untuk review'
  profile.description = 'Deskripsi baru'
  profile.address = 'Alamat baru'
  profile.contact = '+62 812 0000 0000'
  assert.deepEqual(source, before)
  assert.equal((await getAdminProfile()).name, before.name)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getAdminProfile({ signal: controller.signal }), { name: 'AbortError' })
})

test('validasi nama wajib dan kontak opsional mendukung format telepon yang lazim', () => {
  assert.match(validateAdminProfile({ name: '  ', contact: '' }).name, /wajib/)
  assert.match(validateAdminProfile({ name: 'Masjid\u0000', contact: '' }).name, /kontrol/)
  for (const contact of ['', '  ', '+62 812-0000-0000', '(0274) 123456', '0812.0000.0000']) {
    assert.deepEqual(validateAdminProfile({ name: 'Masjid Al-Hidayah', contact }), {})
  }
  for (const contact of ['nomor belum ada', '123', '1234567890123456', '0812+34567890', '0812\n34567890', '<script>']) {
    assert.match(validateAdminProfile({ name: 'Masjid', contact }).contact, /8–15 digit/)
  }
})

test('foto hanya menerima satu JPG/PNG/WebP dengan ekstensi dan MIME sesuai, tidak kosong dan maksimal 5 MB', () => {
  for (const [name, type] of [['foto.JPG', 'image/jpeg'], ['foto.jpeg', 'image/jpeg'], ['foto.png', 'image/png'], ['foto.webp', 'image/webp']]) {
    assert.equal(validateAdminProfilePhoto([new File(['gambar'], name, { type })]), '')
  }
  const png = (size) => new File([new Uint8Array(size)], 'foto.png', { type: 'image/png' })
  assert.equal(validateAdminProfilePhoto([png(5 * 1024 * 1024)]), '')
  assert.match(validateAdminProfilePhoto([png(5 * 1024 * 1024 + 1)]), /maksimal 5 MB/)
  assert.match(validateAdminProfilePhoto([png(0)]), /kosong/)
  assert.match(validateAdminProfilePhoto([]), /tepat satu/)
  assert.match(validateAdminProfilePhoto([png(1), png(1)]), /tepat satu/)
  for (const [name, type] of [['foto.svg', 'image/svg+xml'], ['foto.gif', 'image/gif'], ['foto.jpg.exe', 'image/jpeg'], ['jpg', 'image/jpeg'], ['foto.png', 'text/plain'], ['foto.jpg', 'image/png'], ['foto.webp', '']]) {
    assert.match(validateAdminProfilePhoto([new File(['data'], name, { type })]), /Format foto/)
  }
})

test('mode API belum tersedia tanpa request atau fallback, bukan penyimpanan permanen', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('HTTP tidak diharapkan.') }
  try {
    const service = await api.ssrLoadModule('/src/services/adminProfileService.js')
    await assert.rejects(service.getAdminProfile(), /Profil admin melalui API belum tersedia/)
    assert.equal(calls, 0)
    assert.equal(Object.keys(service).some((key) => /save|update|delete/i.test(key)), false)
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('route profil langsung memakai layout dan menu aktif dengan loading serta tombol simpan nonaktif', () => {
  for (const path of ['/admin/profil-masjid', '/admin/profil-masjid/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
    assert.match(html, /<h1>Profil Masjid<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/profil-masjid"/)
    assert.match(html, /Memuat profil masjid/)
    assert.match(html, /form="admin-profile-form" disabled=""/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form/)
  }
})
