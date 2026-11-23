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
let service
let source
let App
before(async () => {
  server = await createTestServer('mock')
  service = await server.ssrLoadModule('/src/services/adminProfileContentService.js')
  ;({ mockPublicContent: source } = await server.ssrLoadModule('/src/mocks/publicContent.js'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
})
after(async () => { await server?.close() })

test('mode mock memuat salinan misi, program, sejarah, dan pengurus tanpa mengubah sumber mock', async () => {
  service.resetMockProfileContent()
  const before = structuredClone(source)
  const content = await service.getAdminProfileContent()
  assert.deepEqual(content.missions.map((item) => item.text), source.missions)
  assert.deepEqual(content.programs.map((item) => item.title), source.programs.map((item) => item.title))
  assert.deepEqual(content.history.map((item) => item.year), source.profile.timeline.map((item) => item.year))
  assert.deepEqual(content.officers.map((item) => item.role), source.profile.members.map((item) => item.role))
  content.missions[0].text = 'Diubah pemanggil'
  assert.notEqual((await service.getAdminProfileContent()).missions[0].text, 'Diubah pemanggil')
  assert.deepEqual(source, before)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(service.getAdminProfileContent({ signal: controller.signal }), { name: 'AbortError' })
})

test('mode mock mendukung tambah, edit, dan hapus selama sesi lalu bisa direset', async () => {
  service.resetMockProfileContent()
  const created = await service.createAdminProfileContent('officers', { name: '  Budi  ', role: 'ANGGOTA', note: '', order: '8', active: false })
  assert.equal(created.name, 'Budi')
  assert.equal(created.order, 8)
  assert.equal(created.active, false)
  let content = await service.getAdminProfileContent()
  assert.equal(content.officers.at(-1).id, created.id)

  await service.updateAdminProfileContent('officers', created.id, { ...created, role: 'BENDAHARA II', order: 0 })
  content = await service.getAdminProfileContent()
  assert.equal(content.officers[0].role, 'BENDAHARA II')

  await service.deleteAdminProfileContent('officers', created.id)
  content = await service.getAdminProfileContent()
  assert.equal(content.officers.length, source.profile.members.length)
  await assert.rejects(service.deleteAdminProfileContent('officers', created.id), /tidak ditemukan/)
  await assert.rejects(service.deleteAdminProfileContent('unknown', '1'), /tidak dikenal/)
  service.resetMockProfileContent()
})

test('validasi mengikuti field wajib dan batas kolom database tiap bagian', () => {
  assert.deepEqual(service.validateProfileContent('missions', { text: 'Misi baru', order: 1 }), {})
  assert.match(service.validateProfileContent('missions', { text: '  ', order: 1 }).text, /wajib/)
  assert.match(service.validateProfileContent('missions', { text: 'a'.repeat(256), order: 1 }).text, /255/)
  assert.match(service.validateProfileContent('programs', { title: 'Program', description: '' }).description, /wajib/)
  assert.match(service.validateProfileContent('history', { year: '', title: 'Judul' }).year, /wajib/)
  assert.match(service.validateProfileContent('history', { year: '1799', title: 'Judul' }).year, /1800–2100/)
  assert.match(service.validateProfileContent('officers', { name: 'Budi', role: 'a'.repeat(51) }).role, /50/)
  assert.match(service.validateProfileContent('officers', { name: 'Budi\u0000', role: 'KETUA' }).name, /kontrol/)
  assert.match(service.validateProfileContent('missions', { text: 'Misi', order: '-1' }).order, /0–32767/)
  assert.deepEqual(service.emptyProfileContentValues('history'), { year: '', era: '', placeName: '', title: '', description: '', order: 1 })
})

test('mode API memanggil CRUD /api/admin/profile-content dengan payload sesuai kontrak', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined })
    const data = init.method === 'GET'
      ? { missions: [], programs: [], history: [], officers: [] }
      : init.method === 'DELETE' ? { deletedId: '5' } : { id: '5', ...JSON.parse(init.body) }
    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  }
  try {
    const apiService = await api.ssrLoadModule('/src/services/adminProfileContentService.js')
    await apiService.getAdminProfileContent()
    await apiService.createAdminProfileContent('history', { year: '2010', era: ' ', placeName: '', title: ' Renovasi ', description: '', order: '' })
    await apiService.updateAdminProfileContent('programs', '5', { title: 'Program', description: 'Deskripsi', order: 2, active: false })
    await apiService.deleteAdminProfileContent('missions', '5')
    assert.deepEqual(calls.map((call) => [call.method, call.url]), [
      ['GET', '/api/admin/profile-content'],
      ['POST', '/api/admin/profile-content/history'],
      ['PUT', '/api/admin/profile-content/programs/5'],
      ['DELETE', '/api/admin/profile-content/missions/5'],
    ])
    assert.deepEqual(calls[1].body, { year: 2010, era: '', placeName: '', title: 'Renovasi', description: '', order: 1 })
    assert.deepEqual(calls[2].body, { title: 'Program', description: 'Deskripsi', order: 2, active: false })

    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: { missions: [] } }), { status: 200 })
    await assert.rejects(apiService.getAdminProfileContent(), /tidak sesuai kontrak/)
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('route Konten Profil memakai layout admin, menu aktif, dan status memuat', () => {
  for (const path of ['/admin/konten-profil', '/admin/konten-profil/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
    assert.match(html, /<h1>Konten Profil Masjid<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/konten-profil"/)
    assert.match(html, /Memuat konten profil/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form|<dialog/)
    assert.equal((html.match(/<main\b/g) || []).length, 1)
  }
})
