import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'

const root = fileURLToPath(new URL('../', import.meta.url))
const createTestServer = (mode) => createServer({
  root, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode) },
})
let server
let getPublicContent
let ProfilePage
let HomePage
before(async () => {
  server = await createTestServer('mock')
  ;({ getPublicContent } = await server.ssrLoadModule('/src/services/publicContentService.js'))
  ;({ default: ProfilePage } = await server.ssrLoadModule('/src/pages/ProfilePage.jsx'))
  ;({ default: HomePage } = await server.ssrLoadModule('/src/pages/HomePage.jsx'))
})
after(async () => { await server?.close() })

function renderPage(Page, context) {
  const page = h(Route, { index: true, element: h(Page) })
  const layout = h(Route, { element: h(Outlet, { context }) }, page)
  return renderToStaticMarkup(h(MemoryRouter, null, h(Routes, null, layout)))
}

test('Profil mengikuti periode final, tujuh pengurus dan linimasa sumber', async () => {
  const content = await getPublicContent()
  assert.equal(content.profile.managementPeriod, '2023–2025')
  assert.deepEqual(content.profile.timeline.map((event) => event.year), [1980, 2000])
  assert.deepEqual(content.profile.members.map((member) => member.name), [
    'Jiyamta, S.Pd', 'Tri Warjunadi', 'Sugiharto, S.KM, MPH', 'Drs.Puji Suharjoko',
    'Wawan Dwi Nugroho', 'Aditya Pratama Istawar', 'Ardi Hartono',
  ])
  const html = renderPage(ProfilePage, { content, error: '' })
  assert.equal((html.match(/class="profile-member"/g) || []).length, 7)
  assert.equal((html.match(/class="profile-timeline-row"/g) || []).length, 2)
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  assert.ok(html.includes('href="/kontak"'))
})

test('statistik dan visi-misi Beranda/Profil konsisten serta salinan terisolasi', async () => {
  const content = await getPublicContent()
  const context = { content, error: '' }
  const home = renderPage(HomePage, context)
  const profile = renderPage(ProfilePage, context)
  for (const statistic of content.statistics.filter((item) => item.amount)) {
    assert.equal(statistic.value, `${statistic.amount} ${statistic.unit}`)
    assert.ok(home.includes(statistic.value))
    assert.ok(profile.includes(`${statistic.amount}<small>${statistic.unit}</small>`))
  }
  assert.equal(content.profile.foundedYear, Number(content.statistics.find((item) => item.id === 'founded').value))
  for (const text of [content.vision, ...content.missions]) {
    assert.ok(home.includes(text))
    assert.ok(profile.includes(text))
  }
  content.profile.members.pop()
  assert.equal((await getPublicContent()).profile.members.length, 7)
})

test('Profil menangani loading, error, data kosong dan bagian belum tersedia', async () => {
  assert.match(renderPage(ProfilePage, { content: null, error: '' }), /role="status".*Memuat profil/)
  assert.match(renderPage(ProfilePage, { content: null, error: 'Gagal memuat profil.' }), /role="alert".*Gagal memuat/)
  assert.match(renderPage(ProfilePage, { content: { profile: null }, error: '' }), /Profil masjid belum tersedia/)
  const content = await getPublicContent()
  content.profile.members = []
  content.profile.timeline = []
  content.statistics = []
  content.vision = ''
  const html = renderPage(ProfilePage, { content, error: '' })
  for (const text of ['Informasi pengurus belum tersedia', 'Informasi sejarah belum tersedia', 'Informasi fasilitas belum tersedia', 'Visi dan misi belum tersedia']) assert.ok(html.includes(text))
})

test('mode API mengambil konten publik dan menormalisasi linimasa serta mendukung pembatalan', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getPublicContent({ signal: controller.signal }), { name: 'AbortError' })
  const apiServer = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    if (url === '/api/public/agenda') {
      return new Response(JSON.stringify({ success: true, data: { description: 'Agenda', groups: [] } }), { status: 200 })
    }
    return new Response(JSON.stringify({
      success: true,
      data: {
        name: 'Masjid API',
        profile: {
          foundedYear: 1980,
          location: 'Sorolaten',
          introduction: 'Intro',
          timeline: [{ year: 1980, era: 'Perintisan', mosqueName: 'Mushola Al Qodar', title: 'Awal', description: 'Desc' }],
          managementPeriod: '2023-2025',
          members: [],
        },
      },
    }), { status: 200 })
  }
  try {
    const service = await apiServer.ssrLoadModule('/src/services/publicContentService.js')
    const content = await service.getPublicContent()
    assert.deepEqual(calls.sort(), ['/api/public/agenda', '/api/public/content'])
    assert.equal(content.name, 'Masjid API')
    assert.equal(content.profile.timeline[0].name, 'Mushola Al Qodar')
  } finally { globalThis.fetch = originalFetch; await apiServer.close() }
})
