import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { createTestRepositories } from './helpers/testRepositories.js'

describe('Keamanan HTTP, CORS, dan autentikasi sesi admin (/api/admin)', () => {
  let server
  let baseUrl
  let capturedAuditIds = []

  before(async () => {
    const repositories = createTestRepositories()
    const originalInsertCategory = repositories.adminFinanceRepository.insertCategory
    repositories.adminFinanceRepository.insertCategory = async (input, auditUserId = null) => {
      capturedAuditIds.push(auditUserId)
      return originalInsertCategory(input)
    }

    const app = createApp({
      rateLimitMax: 20,
      rateLimitWindowMs: 60_000,
      adminAuthRequired: true,
      authSecret: 'rahasia-pengujian-autentikasi-admin-minimal-32',
      corsOrigins: ['http://localhost:5173'],
      repositories,
    })

    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}/api`
  })

  after(async () => {
    if (!server) return
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('menyertakan header keamanan dasar dan CORS sesuai origin yang diizinkan', async () => {
    const preflightAllowed = await fetch(`${baseUrl}/health`, {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:5173' },
    })
    assert.equal(preflightAllowed.status, 204)
    assert.equal(preflightAllowed.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.equal(preflightAllowed.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(preflightAllowed.headers.get('x-frame-options'), 'DENY')

    const blockedOrigin = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://evil.example' },
    })
    assert.equal(blockedOrigin.status, 200)
    assert.equal(blockedOrigin.headers.get('access-control-allow-origin'), null)
  })

  it('menolak akses admin tanpa token ketika adminAuthRequired aktif', async () => {
    const dashRes = await fetch(`${baseUrl}/admin/dashboard`)
    assert.equal(dashRes.status, 401)

    const meRes = await fetch(`${baseUrl}/admin/auth/me`)
    assert.equal(meRes.status, 401)
  })

  it('menangani password salah (401), akun nonaktif (403), login valid (200), /auth/me, dan auditUserId', async () => {
    const wrongPassRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@masjid.id', password: 'salah' }),
    })
    assert.equal(wrongPassRes.status, 401)

    const inactiveRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'budi@masjid.id', password: 'password123' }),
    })
    assert.equal(inactiveRes.status, 403)

    const loginRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmad@masjid.id', password: 'password123' }),
    })
    assert.equal(loginRes.status, 200)

    const setCookie = loginRes.headers.get('set-cookie') || ''
    assert.match(setCookie, /masjid_admin_session=/)
    assert.match(setCookie, /HttpOnly/i)
    assert.match(setCookie, /SameSite=Lax/i)

    const { data } = await loginRes.json()
    assert.equal(data.user.id, '2')
    assert.equal(data.user.email, 'ahmad@masjid.id')

    const meWithBearer = await fetch(`${baseUrl}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    })
    assert.equal(meWithBearer.status, 200)
    assert.equal((await meWithBearer.json()).data.user.id, '2')

    const cookiePair = setCookie.split(';')[0]
    const meWithCookie = await fetch(`${baseUrl}/admin/auth/me`, {
      headers: { Cookie: cookiePair },
    })
    assert.equal(meWithCookie.status, 200)

    capturedAuditIds = []
    const createCatRes = await fetch(`${baseUrl}/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.token}`,
      },
      body: JSON.stringify({ label: 'Dana Uji Auth', color: 'teal' }),
    })
    assert.equal(createCatRes.status, 201)
    assert.deepEqual(capturedAuditIds, ['2'])
  })

  it('membatasi pengelolaan akun & kode akses hanya untuk Super Admin serta mencegah nonaktifkan diri sendiri', async () => {
    // Login sebagai Admin biasa (ahmad@masjid.id, role: 'Admin')
    const adminLoginRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ahmad@masjid.id', password: 'password123' }),
    })
    assert.equal(adminLoginRes.status, 200)
    const adminToken = (await adminLoginRes.json()).data.token

    const forbiddenAccountRes = await fetch(`${baseUrl}/admin/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: 'Akun Ditolak', email: 'tolak@masjid.id', password: 'Password123' }),
    })
    assert.equal(forbiddenAccountRes.status, 403)

    const forbiddenReportAccessRes = await fetch(`${baseUrl}/admin/report-access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ code: 'kode-ditolak-123' }),
    })
    assert.equal(forbiddenReportAccessRes.status, 403)

    // Login sebagai Super Admin (superadmin@masjid.id)
    const superLoginRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@masjid.id', password: 'password123' }),
    })
    assert.equal(superLoginRes.status, 200)
    const superBody = await superLoginRes.json()
    const superToken = superBody.data.token

    // Tidak boleh menonaktifkan atau menghapus akun diri sendiri
    const selfDisableRes = await fetch(`${baseUrl}/admin/accounts/${superBody.data.user.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({ active: false }),
    })
    assert.equal(selfDisableRes.status, 400)

    // Super Admin membuat akun baru lalu akun baru langsung bisa login
    const createAccountRes = await fetch(`${baseUrl}/admin/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({
        name: 'Sekretaris Baru',
        email: 'sekretaris@masjid.id',
        password: 'SekretarisPassword1',
        role: 'Admin',
      }),
    })
    assert.equal(createAccountRes.status, 201)

    const newLoginRes = await fetch(`${baseUrl}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sekretaris@masjid.id', password: 'SekretarisPassword1' }),
    })
    assert.equal(newLoginRes.status, 200)
  })

  it('mengembalikan 503 bila AUTH_SECRET belum dikonfigurasi saat login', async () => {
    const appNoSecret = createApp({
      authSecret: '',
      adminAuthRequired: false,
      repositories: createTestRepositories(),
    })
    const localServer = appNoSecret.listen(0, '127.0.0.1')
    await new Promise((resolve) => localServer.once('listening', resolve))
    try {
      const url = `http://127.0.0.1:${localServer.address().port}/api/admin/auth/login`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'superadmin@masjid.id', password: 'password123' }),
      })
      assert.equal(res.status, 503)
    } finally {
      await new Promise((resolve, reject) => {
        localServer.close((err) => (err ? reject(err) : resolve()))
      })
    }
  })
})
