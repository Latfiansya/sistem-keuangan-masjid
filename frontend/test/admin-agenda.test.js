import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

test('route agenda admin memakai layout dan menu aktif, loading serta aksi tambah nonaktif', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
    define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' },
  })
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    for (const path of ['/admin/agenda', '/admin/agenda/']) {
      const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
      assert.match(html, /<h1>Agenda<\/h1>/)
      assert.match(html, /aria-current="page"[^>]*href="\/admin\/agenda"/)
      assert.match(html, /Memuat agenda masjid/)
      assert.match(html, /disabled="" title="Fitur tambah agenda belum tersedia"/)
      assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form|<form|<dialog/)
      assert.equal((html.match(/<main\b/g) || []).length, 1)
    }
  } finally { await server.close() }
})

test('mode API mengaktifkan tombol Tambah Agenda dan memanggil CRUD /api/admin/agenda', async () => {
  const api = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
    define: { 'import.meta.env.VITE_DATA_SOURCE': '"api"' },
  })
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({ success: true, data: { id: '1', name: 'Kajian', frequency: 'weekly', schedule: 'Rabu', description: '', order: 1, active: true } }), { status: 201 })
  }
  try {
    const { default: App } = await api.ssrLoadModule('/src/App.jsx')
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: ['/admin/agenda'] }, h(App)))
    assert.doesNotMatch(html, /title="Fitur tambah agenda belum tersedia"/)
    const service = await api.ssrLoadModule('/src/services/agendaService.js')
    const created = await service.createAdminAgenda({ name: 'Kajian', frequency: 'weekly', schedule: 'Rabu', order: 1, active: true })
    assert.equal(created.id, '1')
    assert.equal(calls[0].url, '/api/admin/agenda')
    assert.equal(calls[0].init.method, 'POST')
  } finally { globalThis.fetch = originalFetch; await api.close() }
})
