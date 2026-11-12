import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'

describe('Endpoint keuangan, kategori, dan transaksi pengurus (/api/admin)', () => {
  let server
  let baseUrl

  before(async () => {
    const app = createApp()
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    const address = server.address()
    baseUrl = `http://127.0.0.1:${address.port}/api/admin`
  })

  after(async () => {
    if (!server) return
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('GET /api/admin/dashboard mengembalikan ringkasan saldo, kategori, dan 5 transaksi terbaru', async () => {
    const response = await fetch(`${baseUrl}/dashboard`)
    assert.equal(response.status, 200)

    const body = await response.json()
    assert.equal(body.success, true)
    assert.equal(body.data.updatedDate, '2026-10-20')
    assert.equal(body.data.categories.length, 3)
    assert.deepEqual(body.data.totals, {
      openingBalance: 16864200,
      income: 1791500,
      expense: 1427500,
      closingBalance: 17228200,
    })
    assert.equal(body.data.recentTransactions.length, 5)
  })

  it('GET /api/admin/finance/report mengembalikan 249 transaksi historis dan rekap 10 bulan yang terekonsiliasi', async () => {
    const response = await fetch(`${baseUrl}/finance/report`)
    assert.equal(response.status, 200)

    const body = await response.json()
    assert.equal(body.success, true)
    assert.equal(body.data.historicalTransactionCount, 249)
    assert.equal(body.data.transactions.length, 249)
    assert.deepEqual(body.data.historyOpeningBalances, {
      mosque: 1497500,
      friday: 2088000,
      maintenance: 3484000,
    })
    assert.deepEqual(body.data.summary, {
      count: 249,
      income: 74941200,
      expense: 64782500,
    })
    assert.equal(body.data.monthlyRecap.length, 10)
    const octoberRecap = body.data.monthlyRecap.at(-1)
    assert.equal(octoberRecap.month, '2026-10')
    assert.equal(octoberRecap.totals.closingBalance, 17228200)
  })

  it('GET /api/admin/finance/report mendukung filter periode, jenis, kategori, pencarian, dan pagination', async () => {
    const octResponse = await fetch(
      `${baseUrl}/finance/report?startDate=2026-10-01&endDate=2026-10-20&type=income`
    )
    assert.equal(octResponse.status, 200)
    const octBody = await octResponse.json()
    assert.equal(octBody.data.transactions.length, 6)
    assert.equal(octBody.data.summary.income, 1791500)
    assert.equal(octBody.data.summary.expense, 0)

    const pagedResponse = await fetch(
      `${baseUrl}/finance/report?type=income&page=1&pageSize=20`
    )
    assert.equal(pagedResponse.status, 200)
    const pagedBody = await pagedResponse.json()
    assert.equal(pagedBody.data.transactions.length, 20)
    assert.deepEqual(pagedBody.data.pagination, {
      page: 1,
      pageSize: 20,
      totalItems: 141,
      totalPages: 8,
    })

    const badRangeResponse = await fetch(
      `${baseUrl}/finance/report?startDate=2026-10-20&endDate=2026-10-01`
    )
    assert.equal(badRangeResponse.status, 400)
  })

  it('CRUD /api/admin/categories memvalidasi input, duplikasi, warna, dan proteksi hapus kategori', async () => {
    const createRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '  Dana   Sosial  ', color: 'teal' }),
    })
    assert.equal(createRes.status, 201)
    const created = (await createRes.json()).data
    assert.equal(created.label, 'Dana Sosial')
    assert.equal(created.color, 'teal')
    assert.equal(created.closingBalance, 0)

    // Tolak duplikat nama tanpa membedakan huruf besar/kecil
    const dupRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'dana sosial', color: 'purple' }),
    })
    assert.equal(dupRes.status, 400)

    // Tolak warna di luar daftar allowlist
    const badColorRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Kategori Warna Salah', color: 'pink' }),
    })
    assert.equal(badColorRes.status, 400)

    // Edit kategori berhasil
    const updateRes = await fetch(`${baseUrl}/categories/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dana Sosial Warga', color: 'purple' }),
    })
    assert.equal(updateRes.status, 200)
    const updated = (await updateRes.json()).data
    assert.equal(updated.label, 'Dana Sosial Warga')
    assert.equal(updated.color, 'purple')

    // Tolak hapus kategori awal yang memiliki saldo dan transaksi
    const protectedDeleteRes = await fetch(`${baseUrl}/categories/mosque`, {
      method: 'DELETE',
    })
    assert.equal(protectedDeleteRes.status, 400)

    // Hapus kategori baru yang belum memiliki transaksi dan bersaldo nol berhasil
    const deleteRes = await fetch(`${baseUrl}/categories/${created.id}`, {
      method: 'DELETE',
    })
    assert.equal(deleteRes.status, 200)
  })

  it('CRUD /api/admin/transactions memvalidasi input, memperbarui laporan, dan melindungi kategori terpakai', async () => {
    // Buat kategori baru untuk diuji relasi transaksinya
    const catRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Kotak Ramadhan', color: 'gold' }),
    })
    const newCategory = (await catRes.json()).data

    // Tambah transaksi pemasukan
    const createIncomeRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'income',
        date: '2026-10-18',
        categoryId: newCategory.id,
        description: 'Infaq Buka Bersama',
        amount: '250000',
        personName: 'Hamba Allah',
        notes: 'Tunai melalui takmir',
        showDonorNamePublic: true,
      }),
    })
    assert.equal(createIncomeRes.status, 201)
    const createdTrx = (await createIncomeRes.json()).data
    assert.equal(createdTrx.amount, 250000)
    assert.equal(createdTrx.showDonorNamePublic, true)

    // Kategori baru kini memiliki transaksi aktif sehingga tidak boleh dihapus
    const blockedCatDelete = await fetch(`${baseUrl}/categories/${newCategory.id}`, {
      method: 'DELETE',
    })
    assert.equal(blockedCatDelete.status, 400)

    // Tolak transaksi dengan tanggal tidak valid atau nominal 13 digit
    const invalidTrxRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'expense',
        date: '2026-02-29',
        categoryId: 'mosque',
        description: 'Tanggal kabisat palsu',
        amount: 100000,
      }),
    })
    assert.equal(invalidTrxRes.status, 400)

    const tooLargeAmountRes = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'expense',
        date: '2026-10-18',
        categoryId: 'mosque',
        description: 'Nominal 13 digit',
        amount: '1000000000000',
      }),
    })
    assert.equal(tooLargeAmountRes.status, 400)

    // Lihat detail transaksi
    const detailRes = await fetch(`${baseUrl}/transactions/${createdTrx.id}`)
    assert.equal(detailRes.status, 200)
    assert.equal((await detailRes.json()).data.description, 'Infaq Buka Bersama')

    // Edit transaksi
    const editRes = await fetch(`${baseUrl}/transactions/${createdTrx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-10-19',
        categoryId: newCategory.id,
        description: 'Infaq Buka Bersama (Koreksi)',
        amount: 300000,
        personName: 'Hamba Allah',
        notes: 'Koreksi nominal',
        showDonorNamePublic: false,
      }),
    })
    assert.equal(editRes.status, 200)
    const editedTrx = (await editRes.json()).data
    assert.equal(editedTrx.amount, 300000)
    assert.equal(editedTrx.sessionEdited, true)

    // Hapus transaksi
    const deleteTrxRes = await fetch(`${baseUrl}/transactions/${createdTrx.id}`, {
      method: 'DELETE',
    })
    assert.equal(deleteTrxRes.status, 200)

    const afterDeleteDetail = await fetch(`${baseUrl}/transactions/${createdTrx.id}`)
    assert.equal(afterDeleteDetail.status, 404)

    // Setelah transaksi dihapus, kategori baru bisa dihapus kembali
    const cleanCatDelete = await fetch(`${baseUrl}/categories/${newCategory.id}`, {
      method: 'DELETE',
    })
    assert.equal(cleanCatDelete.status, 200)
  })
})

