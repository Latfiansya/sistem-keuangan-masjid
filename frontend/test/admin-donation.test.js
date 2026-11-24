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

test('dukungan dua rekening: 1 rekening lengkap, 2 rekening lengkap, dan validasi rekening 2 parsial', async () => {
  const initial = await service.getAdminDonationSettings()
  assert.equal(initial.bankName2 + initial.accountNumber2 + initial.accountName2, '')

  const oneAccount = {
    ...initial,
    bankName: 'BSI',
    accountNumber: '7123456789',
    accountName: 'Masjid Al-Hidayah',
    bankEnabled: true,
  }
  assert.deepEqual(service.validateAdminDonationSettings(oneAccount), {})
  const oneReadiness = service.getAdminDonationReadiness(oneAccount)
  assert.equal(oneReadiness.bank.complete, true)
  assert.equal(oneReadiness.bank.enabled, true)
  assert.equal(oneReadiness.bank.accountCount, 1)
  assert.equal(oneReadiness.bank.accounts.length, 1)

  const partialTwo = { ...oneAccount, bankName2: 'BPD DIY Syariah' }
  const partialErrors = service.validateAdminDonationSettings(partialTwo)
  assert.equal(partialErrors.bankName2, undefined)
  assert.ok(partialErrors.accountNumber2)
  assert.ok(partialErrors.accountName2)
  const partialReadiness = service.getAdminDonationReadiness(partialTwo)
  assert.equal(partialReadiness.bank.complete, false)
  assert.equal(partialReadiness.bank.bank2Partial, true)
  assert.equal(service.normalizeAdminDonationSettings(partialTwo).bankEnabled, false)

  const invalidNumberTwo = { ...oneAccount, bankName2: 'BPD DIY', accountNumber2: '123-abc', accountName2: 'Takmir' }
  assert.ok(service.validateAdminDonationSettings(invalidNumberTwo).accountNumber2)

  const twoAccounts = {
    ...oneAccount,
    bankName2: 'BPD DIY Syariah',
    accountNumber2: '8001122334',
    accountName2: 'Panitia Pembangunan',
  }
  assert.deepEqual(service.validateAdminDonationSettings(twoAccounts), {})
  const twoReadiness = service.getAdminDonationReadiness(twoAccounts)
  assert.equal(twoReadiness.bank.complete, true)
  assert.equal(twoReadiness.bank.enabled, true)
  assert.equal(twoReadiness.bank.accountCount, 2)
  assert.deepEqual(twoReadiness.bank.accounts, [
    { name: 'BSI', number: '7123456789', recipient: 'Masjid Al-Hidayah' },
    { name: 'BPD DIY Syariah', number: '8001122334', recipient: 'Panitia Pembangunan' },
  ])
})

test('dukungan hingga 4 rekening donasi, penolakan ke-5 saat penuh, dan hapus slot agar bisa diisi ulang', async () => {
  const initial = await service.getAdminDonationSettings()
  const fourAccounts = [
    { id: '1', bankName: 'BSI', accountNumber: '7123456789', accountName: 'Takmir Masjid' },
    { id: '2', bankName: 'BPD DIY Syariah', accountNumber: '8001122334', accountName: 'Panitia Pembangunan' },
    { id: '3', bankName: 'Bank Muamalat', accountNumber: '511000223344', accountName: 'Lazis Masjid' },
    { id: '4', bankName: 'BRI', accountNumber: '002901001234', accountName: 'Operasional Masjid' },
  ]
  const stateFour = service.withUpdatedDonationBankSlots(
    { ...initial, bankEnabled: true },
    fourAccounts
  )
  assert.deepEqual(service.validateAdminDonationSettings(stateFour), {})
  const readinessFour = service.getAdminDonationReadiness(stateFour)
  assert.equal(readinessFour.bank.complete, true)
  assert.equal(readinessFour.bank.enabled, true)
  assert.equal(readinessFour.bank.accountCount, 4)
  assert.equal(readinessFour.bank.maxAccounts, 4)

  // Saat 5 rekening dikirim (melebihi batas 4), validasi menolak
  const stateFive = {
    ...stateFour,
    bankAccounts: [
      ...fourAccounts,
      { id: null, bankName: 'BCA Syariah', accountNumber: '099887766554', accountName: 'Dana Sosial' },
    ],
  }
  const overErrors = service.validateAdminDonationSettings(stateFive)
  assert.ok(overErrors.bankAccountsLimit)
  assert.equal(service.getAdminDonationReadiness(stateFive).bank.complete, false)

  // Hapus Rekening 2 agar tersisa 3, lalu tambahkan rekening baru ke slot ke-4
  const afterRemove = service.withUpdatedDonationBankSlots(
    stateFour,
    fourAccounts.filter((_, index) => index !== 1)
  )
  assert.equal(service.getAdminDonationReadiness(afterRemove).bank.accountCount, 3)
  assert.equal(afterRemove.bankName2, 'Bank Muamalat')

  const afterReplaceFourth = service.withUpdatedDonationBankSlots(afterRemove, [
    ...service.getDonationBankSlots(afterRemove),
    { id: null, bankName: 'BCA Syariah', accountNumber: '099887766554', accountName: 'Dana Sosial' },
  ])
  assert.deepEqual(service.validateAdminDonationSettings(afterReplaceFourth), {})
  assert.equal(service.getAdminDonationReadiness(afterReplaceFourth).bank.accountCount, 4)
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
    assert.equal(settings.bankName2, '')
    assert.equal(settings.accountNumber2, '')
    assert.equal(settings.accountName2, '')
  } finally { globalThis.fetch = originalFetch; await api.close() }
})
