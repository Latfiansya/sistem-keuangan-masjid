import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { createAdminFinanceRepository } from '../src/repositories/adminFinanceRepository.js'
import { createTestRepositories } from './helpers/testRepositories.js'

describe('Endpoint keuangan, kategori, dan transaksi pengurus (/api/admin)', () => {
  let server
  let baseUrl

  before(async () => {
    const app = createApp({ repositories: createTestRepositories() })
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

  it('GET /api/admin/finance/report mengembalikan transaksi dan rekap bulanan dari repository', async () => {
    const response = await fetch(`${baseUrl}/finance/report`)
    assert.equal(response.status, 200)

    const body = await response.json()
    assert.equal(body.success, true)
    assert.equal(body.data.historicalTransactionCount, 5)
    assert.equal(body.data.transactions.length, 5)
    assert.deepEqual(body.data.summary, {
      count: 5,
      income: 520000,
      expense: 328500,
    })
    assert.equal(body.data.monthlyRecap.length, 1)
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
    assert.equal(octBody.data.transactions.length, 2)
    assert.equal(octBody.data.summary.income, 520000)
    assert.equal(octBody.data.summary.expense, 0)

    const pagedResponse = await fetch(
      `${baseUrl}/finance/report?type=income&page=1&pageSize=20`
    )
    assert.equal(pagedResponse.status, 200)
    const pagedBody = await pagedResponse.json()
    assert.equal(pagedBody.data.transactions.length, 2)
    assert.deepEqual(pagedBody.data.pagination, {
      page: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
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
    assert.equal(createdTrx.notes, 'Tunai melalui takmir')
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
    const detailTrx = (await detailRes.json()).data
    assert.equal(detailTrx.description, 'Infaq Buka Bersama')
    assert.equal(detailTrx.notes, 'Tunai melalui takmir')

    // Pastikan catatan keterangan juga tampil pada laporan versi admin
    const adminReportRes = await fetch(
      `${baseUrl}/finance/report?startDate=2026-10-18&endDate=2026-10-18`
    )
    assert.equal(adminReportRes.status, 200)
    const adminReportTrx = (await adminReportRes.json()).data.transactions.find(
      (item) => item.id === createdTrx.id
    )
    assert.equal(adminReportTrx?.notes, 'Tunai melalui takmir')

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
    assert.equal(editedTrx.description, 'Infaq Buka Bersama (Koreksi)')
    assert.equal(editedTrx.notes, 'Koreksi nominal')

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

  it('adminFinanceRepository menyertakan kolom keterangan (notes) pada query laporan, detail, INSERT, dan UPDATE', async () => {
    const queries = []
    const mockClient = {
      async query(sql, params = []) {
        queries.push({ sql, params })
        if (sql.includes('FROM keu_masjid.m_pengguna')) {
          return { rows: [{ id: 1, nama: 'Super Admin', email: 'superadmin@masjid.id' }] }
        }
        if (sql.includes('FROM keu_masjid.v_saldo_kategori_dana')) {
          return {
            rows: [
              {
                kategori_dana_id: 1,
                nama_kategori: 'Kas Masjid',
                aktif: true,
                saldo_awal: 0,
                total_masuk: 0,
                total_keluar: 0,
                transfer_masuk: 0,
                transfer_keluar: 0,
                saldo_terkini: 0,
              },
            ],
          }
        }
        if (sql.includes('MIN(tanggal)')) {
          return { rows: [{ min_date: '2026-10-01', max_date: '2026-10-20', total_count: 1 }] }
        }
        if (sql.includes('FROM keu_masjid.m_kategori_dana')) {
          return { rows: [{ id: 1, nama_kategori: 'Kas Masjid' }] }
        }
        if (sql.startsWith('INSERT INTO keu_masjid.t_transaksi')) {
          return {
            rows: [
              {
                id: 77,
                kategori_dana_id: 1,
                jenis: 'MASUK',
                uraian: 'Infaq Jumatan',
                nominal: 50000,
                keterangan: params[6],
                tanggal: '2026-10-18',
              },
            ],
          }
        }
        if (sql.startsWith('UPDATE keu_masjid.t_transaksi')) {
          return {
            rows: [
              {
                id: 77,
                kategori_dana_id: 1,
                jenis: 'MASUK',
                uraian: 'Infaq Jumatan Revisi',
                nominal: 75000,
                keterangan: params[4],
                tanggal: '2026-10-19',
              },
            ],
          }
        }
        return { rows: [] }
      },
      release() {},
    }
    const mockDb = {
      async connect() {
        return mockClient
      },
      async query(sql, params = []) {
        queries.push({ sql, params })
        if (sql.includes('SUM(CASE WHEN jenis')) {
          return { rows: [{ count: 1, total_income: 50000, total_expense: 0 }] }
        }
        if (sql.includes('WHERE id = $1')) {
          return {
            rows: [
              {
                id: 77,
                kategori_dana_id: 1,
                pengguna_id: 1,
                jenis: 'MASUK',
                nama_kategori: 'Kas Masjid',
                uraian: 'Infaq Jumatan',
                nominal: 50000,
                keterangan: 'Catatan detail transaksi',
                tanggal: '2026-10-18',
                created_by_nama: 'Super Admin',
              },
            ],
          }
        }
        if (sql.includes('FROM keu_masjid.t_transaksi') && sql.includes('LIMIT')) {
          return {
            rows: [
              {
                id: 77,
                tanggal: '2026-10-18',
                kategori_dana_id: 1,
                jenis: 'MASUK',
                uraian: 'Infaq Jumatan',
                nominal: 50000,
                keterangan: 'Catatan laporan admin',
                created_by_nama: 'Super Admin',
              },
            ],
          }
        }
        return { rows: [] }
      },
    }

    const repo = createAdminFinanceRepository(mockDb)
    const inserted = await repo.insertTransaction(
      {
        categoryId: 'mosque',
        type: 'income',
        description: 'Infaq Jumatan',
        amount: 50000,
        notes: 'Catatan awal',
        date: '2026-10-18',
      },
      1
    )
    assert.equal(inserted.notes, 'Catatan awal')

    const updated = await repo.updateTransactionById(
      77,
      {
        categoryId: 'mosque',
        description: 'Infaq Jumatan Revisi',
        amount: 75000,
        notes: 'Catatan edit',
        date: '2026-10-19',
      },
      1
    )
    assert.equal(updated.notes, 'Catatan edit')

    const detail = await repo.findTransactionById(77)
    assert.equal(detail.notes, 'Catatan detail transaksi')

    const report = await repo.queryFinanceReport({
      startDate: '2026-10-01',
      endDate: '2026-10-20',
    })
    assert.equal(report.transactions[0].notes, 'Catatan laporan admin')

    const sqlTexts = queries.map((item) => item.sql)
    assert.ok(sqlTexts.some((sql) => sql.includes('INSERT INTO keu_masjid.t_transaksi') && sql.includes('keterangan')))
    assert.ok(sqlTexts.some((sql) => sql.includes('UPDATE keu_masjid.t_transaksi') && sql.includes('keterangan = $5')))
    assert.ok(sqlTexts.some((sql) => sql.includes('WHERE id = $1') && sql.includes('keterangan')))
    assert.ok(sqlTexts.some((sql) => sql.includes('LIMIT') && sql.includes('keterangan')))
  })
})

