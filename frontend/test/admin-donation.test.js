import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { mockPublicContent } from '../src/mocks/publicContent.js'

let server, service, App
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' } })
  service = await server.ssrLoadModule('/src/services/adminDonationService.js')
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
})
after(async () => { await server?.close() })

test('draf awal tidak mengarang data resmi, terisolasi dari Kontak publik dan boleh belum lengkap', async () => {
  const original = structuredClone(mockPublicContent)
  const values = await service.getAdminDonationSettings()
  assert.equal(values.bankName + values.accountNumber + values.accountName + values.whatsappNumber, '')
  assert.equal(values.qrisFile, null)
  assert.match(values.messageTemplate, /\[Nama donatur\]/)
  assert.deepEqual(service.validateAdminDonationSettings(values), {})
  assert.equal(service.getAdminDonationReadiness(values).paymentReadyCount, 0)
  values.bankName = 'Bank Simulasi'
  assert.equal((await service.getAdminDonationSettings()).bankName, '')
  assert.deepEqual(mockPublicContent, original)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(service.getAdminDonationSettings({ signal: controller.signal }), { name: 'AbortError' })
})

test('kelengkapan, visibilitas dan jumlah dua metode pembayaran konsisten; konfirmasi WhatsApp terpisah', async () => {
  const initial = await service.getAdminDonationSettings()
  const file = new File([new Uint8Array([137,80,78,71,13,10,26,10])], 'qris.png', { type: 'image/png' })
  let values = service.normalizeAdminDonationSettings({ ...initial, bankEnabled: true, qrisEnabled: true, whatsappEnabled: true })
  assert.equal(values.bankEnabled || values.qrisEnabled || values.whatsappEnabled, false)
  values = service.normalizeAdminDonationSettings({ ...initial, qrisFile: file, bankName: 'Bank Bebas Simulasi', accountNumber: '001234567890', accountName: 'Penerima Uji', whatsappNumber: '6281234567890', qrisEnabled: true, bankEnabled: true, whatsappEnabled: true })
  assert.equal(service.getAdminDonationReadiness(values).paymentReadyCount, 2)
  assert.equal(service.getAdminDonationReadiness(values).whatsapp.enabled, true)
  assert.equal(values.accountNumber, '001234567890')
  for (const key of ['bankName', 'accountNumber', 'accountName']) assert.equal(service.normalizeAdminDonationSettings({ ...values, [key]: ' ' }).bankEnabled, false)
  assert.equal(service.normalizeAdminDonationSettings({ ...values, qrisFile: null }).qrisEnabled, false)
  assert.equal(service.normalizeAdminDonationSettings({ ...values, messageTemplate: ' ' }).whatsappEnabled, false)
  assert.equal(service.normalizeAdminDonationSettings({ ...values, whatsappNumber: '08123456789' }).whatsappEnabled, false)
  const hidden = service.normalizeAdminDonationSettings({ ...values, bankEnabled: false })
  assert.equal(service.getAdminDonationReadiness(hidden).bank.complete, true)
  assert.equal(service.getAdminDonationReadiness(hidden).paymentReadyCount, 1)
})

test('validasi rekening, nomor internasional dan teks tidak membatasi bank tertentu; template multiline tetap literal', async () => {
  const initial = await service.getAdminDonationSettings()
  for (const value of ['abc', '123-456', '1e10', '123 456']) assert.ok(service.validateAdminDonationSettings({ ...initial, accountNumber: value }).accountNumber)
  for (const value of ['08123456789', '+6281234567890', '62 81234567890', '123', '0'.repeat(16)]) assert.ok(service.validateAdminDonationSettings({ ...initial, whatsappNumber: value }).whatsappNumber)
  assert.deepEqual(service.validateAdminDonationSettings({ ...initial, bankName: 'Bank Daerah Syariah & Koperasi', accountName: 'Masjid – Rekening Uji', whatsappNumber: '6281234567890', messageTemplate: 'Nama: [Nama donatur]\nNominal: [Nominal]' }), {})
  for (const key of ['bankName', 'accountName', 'messageTemplate', 'donationNote']) assert.ok(service.validateAdminDonationSettings({ ...initial, [key]: '\u0000' })[key])
})

test('gambar harus satu PNG/JPG sesuai MIME, tidak kosong dan maksimal dua MB; batas tepat diterima', () => {
  const make = (name, type, size = 10) => ({ name, type, size })
  assert.ok(service.validateAdminDonationQris([]))
  assert.ok(service.validateAdminDonationQris([make('q.png','image/png'), make('q.jpg','image/jpeg')]))
  for (const [name,type] of [['q.webp','image/webp'],['q.svg','image/svg+xml'],['q.jpg','image/png'],['q.png.exe','image/png']]) assert.ok(service.validateAdminDonationQris([make(name,type)]))
  assert.ok(service.validateAdminDonationQris([make('q.png','image/png',0)]))
  assert.ok(service.validateAdminDonationQris([make('q.png','image/png',2*1024*1024+1)]))
  assert.equal(service.validateAdminDonationQris([make('q.PNG','image/png',2*1024*1024)]),'')
  assert.equal(service.validateAdminDonationQris([make('q.JPEG','image/jpeg')]),'')
})

test('mode API memanggil /api/admin/donation-settings tanpa fallback mock; route Donasi memakai AdminLayout', async () => {
  for (const route of ['/admin/donasi', '/admin/donasi/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [route] }, h(App)))
    assert.match(html, /<h1>Donasi<\/h1>/)
    assert.match(html, /Pengaturan Donasi/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/donasi"/)
    assert.doesNotMatch(html, /public-footer|public-layout/)
  }
  const api = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"api"' } })
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    if (url === '/api/admin/donation-settings' && init.method === 'GET') {
      return new Response(JSON.stringify({ success: true, data: { qrisFile: '/images/qris-donasi.png', qrisEnabled: true, bankName: 'BSI', accountNumber: '123456', accountName: 'Masjid', bankEnabled: true, whatsappNumber: '', whatsappEnabled: false, messageTemplate: 'Halo', donationNote: 'Catatan' } }), { status: 200 })
    }
    return new Response(JSON.stringify({ success: false, error: { message: 'Unexpected' } }), { status: 404 })
  }
  try {
    const adapter = await api.ssrLoadModule('/src/services/adminDonationService.js')
    const settings = await adapter.getAdminDonationSettings()
    assert.equal(settings.qrisFile, '/images/qris-donasi.png')
    assert.equal(settings.bankName, 'BSI')
  } finally { globalThis.fetch = originalFetch; await api.close() }
})
