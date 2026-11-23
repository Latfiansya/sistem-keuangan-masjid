import assert from 'node:assert/strict'
import { test } from 'node:test'
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

const apiReceipt = { id: '3', number: 'KW/2026/11/0003', payer: 'Bapak Ahmad', purpose: 'Infaq pembangunan', method: 'Transfer', amount: 250000, date: '2026-11-23', status: 'Aktif', cancelledAt: null, transactionId: '901', categoryId: 'maintenance', categoryLabel: 'Kotak Pembangunan & Pemeliharaan', createdBy: 'Super Admin', createdAt: '2026-11-23T09:00:00' }

test('mode API memetakan kwitansi: metode Transfer Bank ↔ Transfer, tanggal dd/mm/yyyy ↔ ISO', async () => {
  const server = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined })
    const data = init.method === 'POST' ? apiReceipt : { receipts: [apiReceipt], totalCount: 1 }
    return new Response(JSON.stringify({ success: true, data }), { status: init.method === 'POST' ? 201 : 200 })
  }
  try {
    const service = await server.ssrLoadModule('/src/services/adminReceiptService.js')
    const [listed] = await service.getAdminReceipts()
    assert.deepEqual(listed, { id: '3', number: 'KW/2026/11/0003', payer: 'Bapak Ahmad', purpose: 'Infaq pembangunan', method: 'Transfer Bank', amount: '250000', date: '23/11/2026', categoryId: 'maintenance', categoryLabel: 'Kotak Pembangunan & Pemeliharaan', status: 'Aktif', cancelledAt: null })

    const created = await service.createAdminReceipt({ payer: ' Bapak Ahmad ', amount: '250000', purpose: ' Infaq pembangunan ', method: 'Transfer Bank', date: '23/11/2026', categoryId: 'maintenance' })
    assert.equal(created.number, 'KW/2026/11/0003')
    assert.deepEqual(calls.map((call) => [call.method, call.url]), [['GET', '/api/admin/receipts'], ['POST', '/api/admin/receipts']])
    assert.deepEqual(calls[1].body, { categoryId: 'maintenance', payer: 'Bapak Ahmad', purpose: 'Infaq pembangunan', method: 'Transfer', amount: 250000, date: '2026-11-23' })

    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })
    await assert.rejects(service.getAdminReceipts(), /tidak sesuai kontrak/)
  } finally { globalThis.fetch = originalFetch; await server.close() }
})

test('mode API mengedit dan membatalkan kwitansi lewat /api/admin/receipts/:id', async () => {
  const server = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    const body = init.body ? JSON.parse(init.body) : undefined
    calls.push({ url, method: init.method, body })
    const data = init.method === 'PUT'
      ? { ...apiReceipt, payer: 'Ibu Siti', method: 'QRIS' }
      : { receipt: { ...apiReceipt, status: 'Dibatalkan', cancelledAt: '2026-11-24T08:00:00', transactionId: body.withTransaction ? null : '901' }, deletedTransactionId: body.withTransaction ? '901' : null }
    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  }
  try {
    const service = await server.ssrLoadModule('/src/services/adminReceiptService.js')
    const updated = await service.updateAdminReceipt('3', { payer: 'Ibu Siti', amount: '250000', purpose: 'Infaq pembangunan', method: 'QRIS', date: '23/11/2026', categoryId: 'maintenance' })
    assert.equal(updated.number, 'KW/2026/11/0003')
    assert.equal(updated.payer, 'Ibu Siti')
    const onlyReceipt = await service.cancelAdminReceipt('3')
    assert.equal(onlyReceipt.receipt.status, 'Dibatalkan')
    assert.equal(onlyReceipt.receipt.number, 'KW/2026/11/0003')
    assert.equal(onlyReceipt.deletedTransactionId, null)
    assert.equal((await service.cancelAdminReceipt('3', { withTransaction: true })).deletedTransactionId, '901')
    assert.deepEqual(calls.map((call) => [call.method, call.url, call.body?.withTransaction]), [
      ['PUT', '/api/admin/receipts/3', undefined],
      ['POST', '/api/admin/receipts/3/cancel', false],
      ['POST', '/api/admin/receipts/3/cancel', true],
    ])
    assert.deepEqual(calls[0].body, { categoryId: 'maintenance', payer: 'Ibu Siti', purpose: 'Infaq pembangunan', method: 'QRIS', amount: 250000, date: '2026-11-23' })
  } finally { globalThis.fetch = originalFetch; await server.close() }
})

test('kategori dana wajib dipilih dari daftar, dan mode mock tidak memanggil server', async () => {
  const server = await createTestServer('mock')
  try {
    const service = await server.ssrLoadModule('/src/services/adminReceiptService.js')
    const categories = [{ id: 'mosque', label: 'Kas Masjid' }]
    assert.deepEqual(service.validateReceiptCategory({ categoryId: 'mosque' }, categories), {})
    assert.match(service.validateReceiptCategory({ categoryId: '' }, categories).categoryId, /kategori dana/)
    assert.match(service.validateReceiptCategory({ categoryId: 'friday' }, categories).categoryId, /kategori dana/)
    assert.deepEqual(await service.getAdminReceipts(), [])
    await assert.rejects(service.createAdminReceipt({}), /mode API/)
    await assert.rejects(service.updateAdminReceipt('1', {}), /mode API/)
    await assert.rejects(service.cancelAdminReceipt('1'), /mode API/)
    const { validateReceipt } = await server.ssrLoadModule('/src/utils/adminReceipt.js')
    const valid = { payer: 'Hamba Allah', amount: '1000', purpose: 'A'.repeat(255), method: 'Tunai', date: '23/11/2026' }
    assert.deepEqual(validateReceipt(valid), {})
    assert.ok(validateReceipt({ ...valid, purpose: 'A'.repeat(256) }).purpose)
  } finally { await server.close() }
})

test('halaman Kwitansi mode API menampilkan panel riwayat dan tetap menunggu kwitansi sebelum unduh', async () => {
  const server = await createTestServer('api')
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: ['/admin/kwitansi'] }, h(App)))
    assert.match(html, /<h1>Kwitansi<\/h1>/)
    assert.match(html, /Riwayat Kwitansi/)
    assert.match(html, /Memuat riwayat kwitansi/)
    assert.match(html, /Belum diterbitkan/)
    assert.match(html, /disabled=""[^>]*aria-describedby="admin-receipt-download-note"/)
  } finally { await server.close() }
})
