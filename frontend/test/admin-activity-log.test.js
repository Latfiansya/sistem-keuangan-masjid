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
let App
let Page
before(async () => {
  server = await createTestServer('mock')
  service = await server.ssrLoadModule('/src/services/adminActivityLogService.js')
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
  ;({ default: Page } = await server.ssrLoadModule('/src/pages/AdminActivityLogPage.jsx'))
})
after(async () => { await server?.close() })

test('sembilan skenario contoh memuat jenis yang diperlukan, tanpa field kredensial dan salinannya terisolasi', async () => {
  const activities = await service.getAdminActivityLog()
  const before = structuredClone(activities)
  assert.equal(activities.length, 9)
  assert.equal(new Set(activities.map((activity) => activity.id)).size, 9)
  for (const type of ['add', 'edit', 'delete', 'code', 'account']) assert.ok(activities.some((activity) => activity.type === type))
  for (const activity of activities) {
    assert.deepEqual(Object.keys(activity).sort(), ['admin', 'date', 'details', 'id', 'module', 'time', 'title', 'type', 'typeLabel'])
    assert.match(activity.date, /^2026-06-\d{2}$/)
    assert.match(activity.time, /^\d{2}:\d{2}$/)
    for (const detail of activity.details) assert.ok(Object.keys(detail).every((key) => ['label', 'value', 'format', 'tone'].includes(key)))
  }
  activities[0].details[0].value = 0
  activities.pop()
  assert.deepEqual(await service.getAdminActivityLog(), before)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(service.getAdminActivityLog({ signal: controller.signal }), { name: 'AbortError' })
})

test('filter admin/jenis/tanggal/modul memakai AND dan pencarian nama/judul mengabaikan kapital/spasi luar', async () => {
  const activities = await service.getAdminActivityLog()
  const before = structuredClone(activities)
  const filter = (filters) => service.filterAdminActivities(activities, filters)
  assert.equal(filter({ admin: 'Ahmad' }).length, 3)
  assert.equal(filter({ type: 'account' }).length, 2)
  assert.equal(filter({ date: '2026-06-14' }).length, 2)
  assert.equal(filter({ module: 'Keuangan' }).length, 4)
  assert.equal(filter({ query: ' SITI ' }).length, 2)
  assert.equal(filter({ query: 'KONSUMSI' }).length, 1)
  assert.equal(filter({ admin: 'Ahmad', type: 'edit', date: '2026-06-14', module: 'Keuangan', query: 'konsumsi' })[0].id, 'demo-log-01')
  assert.deepEqual(filter({ admin: 'Siti', date: '2026-06-14' }), [])
  assert.deepEqual(filter({ query: 'tidak ada' }), [])
  assert.deepEqual(filter({ query: '<script>' }), [])
  assert.equal(filter({ query: '   ' }).length, 9)
  assert.deepEqual(activities, before)
})

test('tujuh kelompok tanggal terurut menurun, setiap item tepat satu kali dan urutan sumber per tanggal tetap', async () => {
  const activities = await service.getAdminActivityLog()
  const before = structuredClone(activities)
  const groups = service.groupAdminActivities(activities)
  assert.deepEqual(groups.map((group) => group.date), ['2026-06-14', '2026-06-13', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09', '2026-06-08'])
  assert.deepEqual(groups.map((group) => group.items.length), [2, 1, 1, 1, 2, 1, 1])
  for (const group of groups) assert.deepEqual(group.items, activities.filter((activity) => activity.date === group.date))
  assert.equal(groups.flatMap((group) => group.items).length, 9)
  assert.deepEqual(service.groupAdminActivities([]), [])
  assert.deepEqual(activities, before)
})

test('mode API mengambil activity log dari /api/admin/activity-logs tanpa fallback riwayat contoh', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ success: true, data: { activities: [{ id: '31', date: '2026-11-18', time: '18:49', admin: 'Migrasi Excel', type: 'add', typeLabel: 'Tambah data', module: 'Konten', title: 'Menambah data Agenda', details: [] }] } }), { status: 200 })
  }
  try {
    const apiService = await api.ssrLoadModule('/src/services/adminActivityLogService.js')
    const list = await apiService.getAdminActivityLog()
    assert.equal(list.length, 1)
    assert.equal(list[0].id, '31')
    assert.equal(calls[0].url, '/api/admin/activity-logs')
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('route/menu aktif dan copy riwayat permanen jelas, tanpa tombol atau form mutasi log', async () => {
  for (const path of ['/admin/activity-log', '/admin/activity-log/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
    assert.match(html, /<h1>Activity Log<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/activity-log"/)
    assert.match(html, /Memuat log aktivitas/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form/)
  }
  const html = renderToStaticMarkup(h(Page))
  assert.match(html, /RIWAYAT PERMANEN · TIDAK DAPAT DIHAPUS/)
  assert.match(html, /Saat ini hanya data contoh; integritas dan kelengkapan pencatatan belum ditegakkan/)
  assert.doesNotMatch(html, /APPEND-ONLY|PostgreSQL/)
  assert.equal((html.match(/<select\b/g) || []).length, 3)
  assert.doesNotMatch(html, /<button|<form|<dialog|type="password"/)

  const api = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"api"' } })
  try {
    const { default: ApiPage } = await api.ssrLoadModule('/src/pages/AdminActivityLogPage.jsx')
    const apiHtml = renderToStaticMarkup(h(ApiPage))
    assert.match(apiHtml, /RIWAYAT PERMANEN · TIDAK DAPAT DIHAPUS/)
    assert.doesNotMatch(apiHtml, /APPEND-ONLY|append-only|PostgreSQL|contoh|simulasi|mock/i)
  } finally { await api.close() }
})
