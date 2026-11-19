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
let ContactPage
let Navbar
before(async () => {
  server = await createTestServer('mock')
  ;({ getPublicContent } = await server.ssrLoadModule('/src/services/publicContentService.js'))
  ;({ default: ContactPage } = await server.ssrLoadModule('/src/pages/ContactPage.jsx'))
  ;({ default: Navbar } = await server.ssrLoadModule('/src/components/Navbar.jsx'))
})
after(async () => { await server?.close() })

function renderPage(context) {
  const page = h(Route, { path: 'kontak', element: h(ContactPage) })
  const layout = h(Route, { element: h(Outlet, { context }) }, page)
  return renderToStaticMarkup(h(MemoryRouter, { initialEntries: ['/kontak'] }, h(Navbar), h(Routes, null, layout)))
}

test('Kontak langsung tersedia dengan menu aktif dan placeholder tanpa tujuan transaksi/peta', async () => {
  const content = await getPublicContent()
  const html = renderPage({ content, error: '' })
  assert.equal((html.match(/<h1\b/g) || []).length, 1)
  assert.equal((html.match(/class="contact-information-row"/g) || []).length, 3)
  assert.match(html, /aria-current="page"[^>]*class="nav-link is-active"[^>]*href="\/kontak"/)
  for (const text of ['Scan QRIS', 'Transfer Bank', 'Nama bank', 'Nomor rekening', 'Atas nama', 'Data belum dikonfirmasi']) assert.ok(html.includes(text))
  assert.match(html, /<button[^>]*disabled=""[^>]*>Buka Google Maps/)
  assert.doesNotMatch(html, /<iframe|href="https?:|href="tel:|href="https:\/\/wa|download=|qris-donasi/)
  assert.equal((html.match(/<img\b/g) || []).length, 1)
})

test('nilai QRIS, rekening dan kontak yang belum dikonfirmasi tidak ditampilkan', async () => {
  const content = await getPublicContent()
  content.contact.donation.qris.imageSrc = '/aset-uji-belum-disetujui.jpg'
  Object.assign(content.contact.donation.bank, { name: 'BANK_UJI_TERSEMBUNYI', number: 'REKENING_UJI_TERSEMBUNYI', recipient: 'PENERIMA_UJI_TERSEMBUNYI' })
  content.contact.information.forEach((item) => { item.value = 'KONTAK_UJI_TERSEMBUNYI'; item.note = 'CATATAN_UJI_TERSEMBUNYI' })
  const html = renderPage({ content, error: '' })
  assert.doesNotMatch(html, /aset-uji-belum-disetujui|UJI_TERSEMBUNYI/)
  const fresh = await getPublicContent()
  assert.equal(fresh.contact.donation.qris.imageSrc, null)
  assert.equal(fresh.contact.donation.bank.number, null)
})

test('Kontak menangani loading, error, data kosong dan bagian yang belum tersedia', async () => {
  assert.match(renderPage({ content: null, error: '' }), /role="status".*Memuat informasi kontak/)
  assert.match(renderPage({ content: null, error: 'Gagal memuat kontak.' }), /role="alert".*Gagal memuat kontak/)
  assert.match(renderPage({ content: {}, error: '' }), /Informasi kontak dan donasi belum tersedia/)
  const content = await getPublicContent()
  content.contact.donation = null
  content.contact.information = []
  const html = renderPage({ content, error: '' })
  assert.ok(html.includes('Informasi kontak belum tersedia.'))
  assert.ok(html.includes('Data belum dikonfirmasi'))
})

test('service Kontak tetap mendukung pembatalan dan mode API memanggil /api/public/content', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getPublicContent({ signal: controller.signal }), { name: 'AbortError' })
  const apiServer = await createTestServer('api')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url) => {
    if (url === '/api/public/agenda') {
      return new Response(JSON.stringify({ success: true, data: { description: '', groups: [] } }), { status: 200 })
    }
    return new Response(JSON.stringify({ success: false, error: { message: 'Gagal memuat konten.' } }), { status: 500 })
  }
  try {
    const service = await apiServer.ssrLoadModule('/src/services/publicContentService.js')
    await assert.rejects(service.getPublicContent(), /Gagal memuat konten/)
  } finally { globalThis.fetch = originalFetch; await apiServer.close() }
})
