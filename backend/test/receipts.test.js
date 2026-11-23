import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { buildReceiptNumber, getReceiptNumberPrefix, nextReceiptSequence } from '../src/utils/receiptNumber.js'
import { createTestRepositories } from './helpers/testRepositories.js'

describe('Kwitansi jamaah (/api/admin/receipts)', () => {
  let server
  let baseUrl
  const valid = { categoryId: 'mosque', payer: '  Bapak Ahmad  ', purpose: ' Infaq pembangunan ', method: 'Tunai', amount: 250000, date: '2026-11-23' }
  const post = (body) => fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

  before(async () => {
    const app = createApp({ repositories: createTestRepositories() })
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/receipts`
  })

  after(async () => {
    if (!server) return
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('format nomor sementara KW/tahun/bulan/urut dan urutan berlanjut per bulan', () => {
    assert.equal(getReceiptNumberPrefix('2026-11-23'), 'KW/2026/11/')
    assert.equal(buildReceiptNumber('2026-11-23', 7), 'KW/2026/11/0007')
    assert.equal(nextReceiptSequence([], 'KW/2026/11/'), 1)
    assert.equal(nextReceiptSequence(['KW/2026/11/0001', 'KW/2026/11/0003', 'KW/2026/10/0009', 'lain'], 'KW/2026/11/'), 4)
    assert.ok(buildReceiptNumber('2026-11-23', 9999).length <= 50)
  })

  it('POST mencatat pemasukan dan kwitansi bernomor, lalu GET menampilkan riwayat terbaru lebih dulu', async () => {
    const first = await post(valid)
    assert.equal(first.status, 201)
    const receipt = (await first.json()).data
    assert.equal(receipt.number, 'KW/2026/11/0001')
    assert.equal(receipt.payer, 'Bapak Ahmad')
    assert.equal(receipt.purpose, 'Infaq pembangunan')
    assert.equal(receipt.amount, 250000)
    assert.ok(receipt.transactionId)

    const second = (await (await post({ ...valid, method: 'QRIS', date: '2026-11-24' })).json()).data
    assert.equal(second.number, 'KW/2026/11/0002')
    const nextMonth = (await (await post({ ...valid, method: 'Transfer', date: '2026-12-01' })).json()).data
    assert.equal(nextMonth.number, 'KW/2026/12/0001')

    const list = (await (await fetch(baseUrl)).json()).data
    assert.equal(list.totalCount, 3)
    assert.deepEqual(list.receipts.map((item) => item.number), ['KW/2026/12/0001', 'KW/2026/11/0002', 'KW/2026/11/0001'])
  })

  it('memvalidasi kategori, metode, tanggal, nominal, dan panjang teks sesuai kolom database', async () => {
    assert.equal((await post({ ...valid, categoryId: '' })).status, 400)
    assert.equal((await post({ ...valid, categoryId: '999' })).status, 400)
    assert.equal((await post({ ...valid, method: 'Transfer Bank' })).status, 400)
    assert.equal((await post({ ...valid, date: '2026-02-30' })).status, 400)
    assert.equal((await post({ ...valid, amount: 0 })).status, 400)
    assert.equal((await post({ ...valid, amount: 10.5 })).status, 400)
    assert.equal((await post({ ...valid, payer: '   ' })).status, 400)
    assert.equal((await post({ ...valid, payer: 'a'.repeat(151) })).status, 400)
    assert.equal((await post({ ...valid, purpose: 'a'.repeat(256) })).status, 400)
    assert.equal((await post({ ...valid, purpose: 'Infaq\u0000' })).status, 400)
  })
})

describe('Edit dan batalkan kwitansi (/api/admin/receipts/:id)', () => {
  let server
  let baseUrl
  const valid = { categoryId: 'mosque', payer: 'Bapak Ahmad', purpose: 'Infaq pembangunan', method: 'Tunai', amount: 250000, date: '2026-11-23' }
  const send = (path, method, body) => fetch(`${baseUrl}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })

  before(async () => {
    const app = createApp({ repositories: createTestRepositories() })
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/receipts`
  })

  after(async () => {
    if (!server) return
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('PUT mengubah isi dan transaksi pemasukan tanpa mengubah nomor kwitansi', async () => {
    const created = (await (await send('', 'POST', valid)).json()).data
    assert.equal(created.status, 'Aktif')
    const res = await send(`/${created.id}`, 'PUT', { ...valid, payer: 'Ibu Siti', method: 'QRIS', amount: 300000, categoryId: 'friday', date: '2026-12-02' })
    assert.equal(res.status, 200)
    const updated = (await res.json()).data
    assert.equal(updated.number, created.number)
    assert.equal(updated.payer, 'Ibu Siti')
    assert.equal(updated.amount, 300000)
    assert.equal(updated.categoryLabel, "Kotak Jum'at Berkah")
    assert.equal((await send(`/${created.id}`, 'PUT', { ...valid, method: 'Cek' })).status, 400)
    assert.equal((await send('/9999', 'PUT', valid)).status, 404)
    assert.equal((await send('/abc', 'PUT', valid)).status, 404)
  })

  it('membatalkan kwitansi saja atau beserta pemasukannya; kwitansi tetap tersimpan dan tidak bisa diubah', async () => {
    const onlyReceipt = (await (await send('', 'POST', valid)).json()).data
    const cancelled = await send(`/${onlyReceipt.id}/cancel`, 'POST', {})
    assert.equal(cancelled.status, 200)
    const cancelledData = (await cancelled.json()).data
    assert.equal(cancelledData.receipt.status, 'Dibatalkan')
    assert.equal(cancelledData.receipt.transactionId, onlyReceipt.transactionId)
    assert.equal(cancelledData.deletedTransactionId, null)
    assert.equal((await send(`/${onlyReceipt.id}/cancel`, 'POST', {})).status, 409)
    assert.equal((await send(`/${onlyReceipt.id}`, 'PUT', valid)).status, 409)

    const withIncome = (await (await send('', 'POST', valid)).json()).data
    const both = (await (await send(`/${withIncome.id}/cancel`, 'POST', { withTransaction: true })).json()).data
    assert.equal(both.deletedTransactionId, withIncome.transactionId)
    assert.equal(both.receipt.transactionId, null)
    assert.equal(both.receipt.amount, withIncome.amount)

    const list = (await (await fetch(baseUrl)).json()).data.receipts
    assert.equal(list.find((item) => item.id === onlyReceipt.id).status, 'Dibatalkan')
    assert.equal((await send(`/${withIncome.id}/cancel`, 'POST', { withTransaction: 'ya' })).status, 400)
    assert.equal((await send('/9999/cancel', 'POST', {})).status, 404)
  })

  it('nomor kwitansi yang dibatalkan tidak dipakai ulang dan penolakan saldo diteruskan', async () => {
    const last = (await (await send('', 'POST', { ...valid, date: '2027-01-10' })).json()).data
    assert.equal(last.number, 'KW/2027/01/0001')
    await send(`/${last.id}/cancel`, 'POST', {})
    const next = (await (await send('', 'POST', { ...valid, date: '2027-01-11' })).json()).data
    assert.equal(next.number, 'KW/2027/01/0002')

    const blocked = (await (await send('', 'POST', { ...valid, purpose: 'saldo-terpakai' })).json()).data
    const rejected = await send(`/${blocked.id}/cancel`, 'POST', { withTransaction: true })
    assert.equal(rejected.status, 400)
    assert.match((await rejected.json()).error.message, /tidak mencukupi/)
  })
})
