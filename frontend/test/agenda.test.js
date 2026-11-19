import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'

const root = fileURLToPath(new URL('../', import.meta.url))
const createTestServer = (mode) => createServer({
  root,
  server: { middlewareMode: true, ws: false, hmr: false },
  appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode) },
})
let server
let getAgenda
let getPublicContent
let AgendaPage

before(async () => {
  server = await createTestServer('mock')
  ;({ getAgenda } = await server.ssrLoadModule('/src/services/agendaService.js'))
  ;({ getPublicContent } = await server.ssrLoadModule('/src/services/publicContentService.js'))
  ;({ default: AgendaPage } = await server.ssrLoadModule('/src/pages/AgendaPage.jsx'))
})
after(async () => { await server?.close() })

function renderAgenda(context) {
  const page = h(Route, { index: true, element: h(AgendaPage) })
  const layout = h(Route, { element: h(Outlet, { context }) }, page)
  return renderToStaticMarkup(h(MemoryRouter, null, h(Routes, null, layout)))
}

test('agenda menampilkan 5 mingguan, 2 bulanan, 5 tahunan dengan jadwal sumber', async () => {
  const agenda = await getAgenda()
  assert.deepEqual(agenda.groups.map((group) => group.items.length), [5, 2, 5])
  assert.deepEqual(agenda.counts.map((count) => count.value), [12, 5, 5])
  assert.equal(agenda.groups[0].items[4].schedule, 'Rabu Sore & Sabtu Sore')
  assert.equal(agenda.groups[1].items[0].schedule, 'Rabu Pon')
  assert.equal(agenda.groups[2].items[4].schedule, 'Bulan Rajab')
  const html = renderAgenda({ content: { agenda }, error: '' })
  assert.equal((html.match(/class="agenda-row"/g) || []).length, 12)
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
})

test('ringkasan Beranda memakai data Agenda yang sama dan salinan data terisolasi', async () => {
  const agenda = await getAgenda()
  const content = await getPublicContent()
  assert.deepEqual(content.agenda, agenda)
  agenda.groups[0].items.pop()
  assert.equal((await getPublicContent()).agenda.groups[0].items.length, 5)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getAgenda({ signal: controller.signal }), { name: 'AbortError' })
})

test('halaman Agenda menangani loading, error, dan daftar kosong', async () => {
  assert.match(renderAgenda({ content: null, error: '' }), /role="status".*Memuat agenda/)
  assert.match(renderAgenda({ content: null, error: 'Gagal memuat agenda.' }), /role="alert".*Gagal memuat/)
  const agenda = await getAgenda()
  agenda.groups.forEach((group) => { group.items = [] })
  agenda.counts.forEach((count) => { count.value = 0 })
  const html = renderAgenda({ content: { agenda }, error: '' })
  assert.match(html, /Belum ada agenda kegiatan/)
  assert.ok(!html.includes('class="agenda-row"'))
})

test('mode API mengambil agenda publik dari /api/public/agenda dan menghitung counts', async () => {
  const apiServer = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({
      success: true,
      data: {
        description: 'Agenda API',
        groups: [
          { id: 'weekly', title: 'Mingguan', subtitle: 'Rutin', items: [{ id: '1', name: 'Kajian', schedule: 'Rabu' }] },
          { id: 'monthly', title: 'Bulanan', subtitle: 'Selapanan', items: [] },
          { id: 'yearly', title: 'Tahunan', subtitle: 'PHBI', items: [{ id: '2', name: 'Syawalan', schedule: 'Syawal' }] },
        ],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    const service = await apiServer.ssrLoadModule('/src/services/agendaService.js')
    const agenda = await service.getAgenda()
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, '/api/public/agenda')
    assert.deepEqual(agenda.counts.map((c) => c.value), [2, 1, 1])
  } finally { globalThis.fetch = originalFetch; await apiServer.close() }
})
