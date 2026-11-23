import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { createTestRepositories } from './helpers/testRepositories.js'

describe('Endpoint transfer dana antar kategori (/api/admin/transfers)', () => {
  let server
  let baseUrl

  const send = (path, method, body) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  const valid = { fromCategoryId: 'mosque', toCategoryId: 'friday', amount: 500000, date: '2026-10-20', note: '  Tambahan dana Jumat  ' }

  before(async () => {
    const app = createApp({ repositories: createTestRepositories() })
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/transfers`
  })

  after(async () => {
    if (!server) return
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('GET mengembalikan riwayat transfer terbaru lebih dulu', async () => {
    const res = await fetch(baseUrl)
    assert.equal(res.status, 200)
    const { data } = await res.json()
    assert.equal(data.totalCount, 1)
    assert.equal(data.transfers[0].fromCategoryId, 'mosque')
    assert.equal(data.transfers[0].amount, 753000)
  })

  it('POST memvalidasi kategori, nominal, tanggal, dan keterangan', async () => {
    assert.equal((await send('', 'POST', { ...valid, toCategoryId: 'mosque' })).status, 400)
    assert.equal((await send('', 'POST', { ...valid, fromCategoryId: '' })).status, 400)
    assert.equal((await send('', 'POST', { ...valid, amount: 0 })).status, 400)
    assert.equal((await send('', 'POST', { ...valid, amount: 1500.5 })).status, 400)
    assert.equal((await send('', 'POST', { ...valid, date: '2026-02-30' })).status, 400)
    assert.equal((await send('', 'POST', { ...valid, note: 'x'.repeat(256) })).status, 400)
    assert.equal((await send('', 'POST', { ...valid, toCategoryId: '999' })).status, 400)
  })

  it('POST menyimpan transfer, lalu DELETE menghapusnya', async () => {
    const created = await send('', 'POST', valid)
    assert.equal(created.status, 201)
    const transfer = (await created.json()).data
    assert.equal(transfer.note, 'Tambahan dana Jumat')
    assert.equal(transfer.toCategoryLabel, "Kotak Jum'at Berkah")

    const list = (await (await fetch(baseUrl)).json()).data
    assert.equal(list.transfers[0].id, transfer.id)

    const deleted = await send(`/${transfer.id}`, 'DELETE')
    assert.equal(deleted.status, 200)
    assert.deepEqual((await deleted.json()).data, { deletedId: transfer.id })
    assert.equal((await send(`/${transfer.id}`, 'DELETE')).status, 404)
  })

  it('meneruskan penolakan saldo tidak mencukupi dari database sebagai HTTP 400', async () => {
    const res = await send('', 'POST', { ...valid, fromCategoryId: 'friday', toCategoryId: 'mosque', amount: 900000 })
    assert.equal(res.status, 400)
    assert.match((await res.json()).error.message, /tidak mencukupi/)
  })
})
