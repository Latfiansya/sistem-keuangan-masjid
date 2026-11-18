import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import app, { createApp } from '../src/app.js'
import { loadEnv } from '../src/config/env.js'
import { createTestRepositories } from './helpers/testRepositories.js'

let server
let baseUrl

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test('health mengembalikan JSON sukses tanpa database', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok' } })
})

test('route yang tidak tersedia mengembalikan JSON 404', async () => {
  const response = await fetch(`${baseUrl}/api/tidak-tersedia`)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route tidak ditemukan.' },
  })
})

test('JSON tidak valid ditangani tanpa membocorkan stack trace', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  })
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    success: false,
    error: { code: 'BAD_REQUEST', message: 'Permintaan tidak valid.' },
  })
})

test('payload JSON melebihi batas 10 KB ditolak dengan HTTP 413', async () => {
  const oversized = JSON.stringify({ data: 'a'.repeat(12 * 1024) })
  const response = await fetch(`${baseUrl}/api/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: oversized,
  })
  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), {
    success: false,
    error: { code: 'BAD_REQUEST', message: 'Ukuran permintaan melebihi batas maksimum.' },
  })
})

test('API_BASE_PATH dapat dikonfigurasi untuk subdirectory tanpa hardcode root', async () => {
  const subApp = createApp({ apiBasePath: '/masjid/api/', repositories: createTestRepositories() })
  const subServer = await new Promise((resolve) => {
    const s = subApp.listen(0, '127.0.0.1', () => resolve(s))
  })
  const subBaseUrl = `http://127.0.0.1:${subServer.address().port}`

  try {
    const healthRes = await fetch(`${subBaseUrl}/masjid/api/health`)
    assert.equal(healthRes.status, 200)
    assert.deepEqual(await healthRes.json(), { success: true, data: { status: 'ok' } })

    const agendaRes = await fetch(`${subBaseUrl}/masjid/api/public/agenda`)
    assert.equal(agendaRes.status, 200)
    const agendaBody = await agendaRes.json()
    assert.equal(agendaBody.success, true)
    assert.equal(agendaBody.data.groups.length, 3)

    const rootHealthRes = await fetch(`${subBaseUrl}/api/health`)
    assert.equal(rootHealthRes.status, 404)
  } finally {
    await new Promise((resolve) => subServer.close(resolve))
  }
})

test('konfigurasi environment menolak PORT tidak valid', () => {
  assert.throws(() => loadEnv({ PORT: '0' }), /PORT/)
  assert.throws(() => loadEnv({ PORT: 'abc' }), /PORT/)
  assert.deepEqual(loadEnv({ API_BASE_PATH: 'masjid/api/' }).apiBasePath, '/masjid/api')
})
