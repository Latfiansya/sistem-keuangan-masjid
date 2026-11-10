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
