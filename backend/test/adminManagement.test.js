import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { createTestRepositories } from './helpers/testRepositories.js'

describe('Endpoint autentikasi, akun pengurus, kode akses laporan, dan activity log (/api/admin)', () => {
  let server
  let baseUrl

  before(async () => {
    const app = createApp({
      rateLimitMax: 3,
      rateLimitWindowMs: 60_000,
      authSecret: 'rahasia-pengujian-minimal-32-karakter-aman',
      repositories: createTestRepositories(),
    })
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

  it('POST /api/admin/auth/login memvalidasi input, mengembalikan 200 + token saat valid, dan membatasi brute force (429)', async () => {
    const badEmailRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bukan-email', password: 'rahasia' }),
    })
    assert.equal(badEmailRes.status, 400)

    const emptyPassRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@masjid.id', password: '   ' }),
    })
    assert.equal(emptyPassRes.status, 400)

    // Percobaan ke-3 dengan kredensial valid mengembalikan 200 + token + cookie sesi
    const okRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@masjid.id', password: 'password123' }),
    })
    assert.equal(okRes.status, 200)
    const okBody = await okRes.json()
    assert.equal(typeof okBody.data.token, 'string')
    assert.equal(okBody.data.user.email, 'superadmin@masjid.id')

    // Percobaan ke-4 melebihi batas rateLimitMax (3) -> 429 TOO_MANY_REQUESTS
    const rateLimitedRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@masjid.id', password: 'password123' }),
    })
    assert.equal(rateLimitedRes.status, 429)

    const logoutRes = await fetch(`${baseUrl}/auth/logout`, { method: 'POST' })
    assert.equal(logoutRes.status, 200)
    assert.equal((await logoutRes.json()).data.loggedOut, true)
  })

  it('GET /api/admin/accounts mengembalikan 4 akun contoh dan mendukung pencarian nama/email', async () => {
    const res = await fetch(`${baseUrl}/accounts`)
    assert.equal(res.status, 200)
    const data = (await res.json()).data
    assert.equal(data.totalCount, 4)
    assert.equal(data.accounts.length, 4)
    assert.equal(Object.hasOwn(data.accounts[0], 'password'), false)

    const searchRes = await fetch(`${baseUrl}/accounts?query=%20siti%20`)
    assert.equal(searchRes.status, 200)
    const searchData = (await searchRes.json()).data
    assert.equal(searchData.filteredCount, 1)
    assert.equal(searchData.accounts[0].email, 'siti@masjid.id')
  })

  it('GET /api/admin/report-access mengembalikan metadata status kode akses tanpa membocorkan kode/hash', async () => {
    const res = await fetch(`${baseUrl}/report-access`)
    assert.equal(res.status, 200)
    const data = (await res.json()).data
    assert.deepEqual(data, {
      active: true,
      publicReportEnabled: true,
      changedDate: '2026-06-10',
      changedTime: '09:00',
      changedBy: 'Super Admin',
    })
  })

  it('GET /api/admin/activity-logs mengembalikan daftar aktivitas, grup tanggal, notifikasi header, dan mendukung filter', async () => {
    const res = await fetch(`${baseUrl}/activity-logs`)
    assert.equal(res.status, 200)
    const data = (await res.json()).data
    assert.equal(data.totalCount, 2)
    assert.equal(data.activities.length, 2)
    assert.equal(data.groups.length, 2)
    assert.equal(data.headerNotifications.length, 2)
    assert.equal(data.groups[0].date, '2026-06-14')

    const filteredRes = await fetch(
      `${baseUrl}/activity-logs?admin=Ahmad&type=edit&module=Keuangan&date=2026-06-14&query=transaksi`
    )
    assert.equal(filteredRes.status, 200)
    const filteredData = (await filteredRes.json()).data
    assert.equal(filteredData.filteredCount, 1)
    assert.equal(filteredData.activities[0].id, '1')

    const badDateRes = await fetch(`${baseUrl}/activity-logs?date=14-06-2026`)
    assert.equal(badDateRes.status, 400)
  })

  it('CRUD /api/admin/accounts mengelola akun pengurus tanpa membocorkan password', async () => {
    // Password kurang dari 8 karakter -> 400
    const shortPassRes = await fetch(`${baseUrl}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bendahara Baru', email: 'bendahara@masjid.id', password: '123' }),
    })
    assert.equal(shortPassRes.status, 400)

    // Tambah akun baru -> 201
    const createRes = await fetch(`${baseUrl}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bendahara Takmir',
        email: 'Bendahara@Masjid.id',
        password: 'RahasiaBendahara123',
        role: 'Admin',
      }),
    })
    assert.equal(createRes.status, 201)
    const created = (await createRes.json()).data
    assert.equal(created.email, 'bendahara@masjid.id')
    assert.equal(Object.hasOwn(created, 'password'), false)

    // Email duplikat -> 400
    const dupRes = await fetch(`${baseUrl}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplikat',
        email: 'bendahara@masjid.id',
        password: 'PasswordLain123',
      }),
    })
    assert.equal(dupRes.status, 400)

    // Update akun -> 200
    const updateRes = await fetch(`${baseUrl}/accounts/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bendahara Utama', role: 'Admin' }),
    })
    assert.equal(updateRes.status, 200)
    assert.equal((await updateRes.json()).data.name, 'Bendahara Utama')

    // Nonaktifkan lalu hapus -> 200
    const statusRes = await fetch(`${baseUrl}/accounts/${created.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    assert.equal(statusRes.status, 200)
    assert.equal((await statusRes.json()).data.active, false)

    const delRes = await fetch(`${baseUrl}/accounts/${created.id}`, { method: 'DELETE' })
    assert.equal(delRes.status, 200)
    assert.equal((await delRes.json()).data.deletedId, created.id)
  })

  it('PUT /api/admin/report-access memperbarui kode akses dan langsung berlaku di gate publik', async () => {
    const shortRes = await fetch(`${baseUrl}/report-access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '123' }),
    })
    assert.equal(shortRes.status, 400)

    const updateRes = await fetch(`${baseUrl}/report-access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'masjid-2026-aman', publicReportEnabled: true }),
    })
    assert.equal(updateRes.status, 200)
    const updated = (await updateRes.json()).data
    assert.equal(updated.active, true)
    assert.equal(Object.hasOwn(updated, 'code'), false)

    const apiRoot = baseUrl.replace(/\/admin$/, '')
    const checkOk = await fetch(`${apiRoot}/public/report/check-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'masjid-2026-aman' }),
    })
    assert.equal(checkOk.status, 200)
    assert.deepEqual((await checkOk.json()).data, { valid: true })

    const checkWrong = await fetch(`${apiRoot}/public/report/check-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'sandi-lama-salah' }),
    })
    assert.equal(checkWrong.status, 200)
    assert.deepEqual((await checkWrong.json()).data, { valid: false })
  })
})

