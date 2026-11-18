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

  it('POST /api/admin/auth/login memvalidasi input, mengembalikan 503 stub, dan membatasi brute force (429)', async () => {
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

    // Percobaan ke-3 dengan format valid mengembalikan 503 (stub sebelum kredensial DB siap)
    const stubRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@masjid.id', password: 'password123' }),
    })
    assert.equal(stubRes.status, 503)

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
})

