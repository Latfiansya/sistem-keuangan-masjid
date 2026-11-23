import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const createTestServer = (mode) => createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode) },
})

const categories = [
  { id: 'mosque', label: 'Kas Masjid', closingBalance: 1000000 },
  { id: 'friday', label: "Kotak Jum'at Berkah", openingBalance: 100000, income: 50000, expense: 20000 },
]
const valid = { date: '2026-10-20', fromCategoryId: 'mosque', toCategoryId: 'friday', amount: '250000', note: '' }

let server
let service
before(async () => {
  server = await createTestServer('mock')
  service = await server.ssrLoadModule('/src/services/adminTransferService.js')
})
after(async () => { await server?.close() })

test('saldo kategori memakai closingBalance API atau mutasi snapshot mock', () => {
  assert.equal(service.getCategoryBalance(categories[0]), 1000000)
  assert.equal(service.getCategoryBalance(categories[1]), 130000)
  assert.equal(service.getCategoryBalance(undefined), 0)
})

test('validasi transfer: kategori berbeda, nominal positif, tidak melebihi saldo asal, tanggal valid', () => {
  assert.deepEqual(service.validateAdminTransfer(valid, categories), {})
  assert.match(service.validateAdminTransfer({ ...valid, toCategoryId: 'mosque' }, categories).toCategoryId, /berbeda/)
  assert.match(service.validateAdminTransfer({ ...valid, fromCategoryId: '' }, categories).fromCategoryId, /asal/)
  assert.match(service.validateAdminTransfer({ ...valid, amount: '0' }, categories).amount, /lebih dari 0/)
  assert.match(service.validateAdminTransfer({ ...valid, amount: '12.5' }, categories).amount, /lebih dari 0/)
  assert.match(service.validateAdminTransfer({ ...valid, amount: '1000001' }, categories).amount, /melebihi saldo Kas Masjid/)
  assert.match(service.validateAdminTransfer({ ...valid, fromCategoryId: 'friday', toCategoryId: 'mosque', amount: '130001' }, categories).amount, /melebihi saldo/)
  assert.match(service.validateAdminTransfer({ ...valid, date: '2026-02-30' }, categories).date, /tanggal/)
  assert.match(service.validateAdminTransfer({ ...valid, note: 'x'.repeat(256) }, categories).note, /255/)
})

test('mode mock mencatat dan menghapus transfer hanya selama sesi', async () => {
  service.resetMockTransfers()
  assert.deepEqual(await service.getAdminTransfers(), [])
  const created = await service.createAdminTransfer({ ...valid, note: '  Dana Jumat  ' }, categories)
  assert.equal(created.amount, 250000)
  assert.equal(created.note, 'Dana Jumat')
  assert.equal(created.toCategoryLabel, "Kotak Jum'at Berkah")
  await service.createAdminTransfer({ ...valid, date: '2026-10-25' }, categories)
  const list = await service.getAdminTransfers()
  assert.deepEqual(list.map((item) => item.date), ['2026-10-25', '2026-10-20'])
  await service.deleteAdminTransfer(created.id)
  assert.equal((await service.getAdminTransfers()).length, 1)
  await assert.rejects(service.deleteAdminTransfer(created.id), /tidak ditemukan/)
  service.resetMockTransfers()
})

test('mode API memanggil /api/admin/transfers dengan payload sesuai kontrak', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined })
    const data = init.method === 'GET' ? { transfers: [], totalCount: 0 } : init.method === 'DELETE' ? { deletedId: '7' } : { id: '7', ...JSON.parse(init.body) }
    return new Response(JSON.stringify({ success: true, data }), { status: 200 })
  }
  try {
    const apiService = await api.ssrLoadModule('/src/services/adminTransferService.js')
    assert.deepEqual(await apiService.getAdminTransfers(), [])
    await apiService.createAdminTransfer({ ...valid, note: ' Catatan ' }, categories)
    await apiService.deleteAdminTransfer('7')
    assert.deepEqual(calls.map((call) => [call.method, call.url]), [
      ['GET', '/api/admin/transfers'],
      ['POST', '/api/admin/transfers'],
      ['DELETE', '/api/admin/transfers/7'],
    ])
    assert.deepEqual(calls[1].body, { fromCategoryId: 'mosque', toCategoryId: 'friday', amount: 250000, date: '2026-10-20', note: 'Catatan' })
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })
    await assert.rejects(apiService.getAdminTransfers(), /tidak sesuai kontrak/)
  } finally { globalThis.fetch = originalFetch; await api.close() }
})
