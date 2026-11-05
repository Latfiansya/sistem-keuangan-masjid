import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import app from '../src/app.js'

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
