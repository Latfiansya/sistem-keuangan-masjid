import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { detectImageMime } from '../src/utils/imageFile.js'
import { createTestRepositories } from './helpers/testRepositories.js'

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)])
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32, 2)])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(32, 3)])
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

describe('Unggah dan penyajian berkas gambar (/api/admin/files, /api/public/files/:target/:hash)', () => {
  let server
  let origin

  const upload = (target, body, contentType) =>
    fetch(`${origin}/api/admin/files/${target}`, { method: 'PUT', headers: { 'Content-Type': contentType }, body })

  before(async () => {
    const app = createApp({ repositories: createTestRepositories() })
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    origin = `http://127.0.0.1:${server.address().port}`
  })

  after(async () => {
    if (!server) return
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('mengenali PNG, JPEG, dan WebP dari tanda tangan biner', () => {
    assert.equal(detectImageMime(PNG), 'image/png')
    assert.equal(detectImageMime(JPEG), 'image/jpeg')
    assert.equal(detectImageMime(WEBP), 'image/webp')
    assert.equal(detectImageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null)
    assert.equal(detectImageMime(Buffer.alloc(4)), null)
  })

  it('PUT menyimpan berkas dengan URL berbasis hash lalu GET publik menyajikan isi dengan header cache dan ETag', async () => {
    const res = await upload('qris', PNG, 'image/png')
    assert.equal(res.status, 201)
    const { data } = await res.json()
    assert.equal(data.path, `/api/public/files/qris/${sha256(PNG)}`)
    assert.equal(data.mimeType, 'image/png')
    assert.equal(data.size, PNG.length)

    const file = await fetch(`${origin}${data.path}`)
    assert.equal(file.status, 200)
    assert.equal(file.headers.get('content-type'), 'image/png')
    assert.match(file.headers.get('cache-control'), /immutable/)
    assert.equal(file.headers.get('x-content-type-options'), 'nosniff')
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), PNG)

    const cached = await fetch(`${origin}${data.path}`, { headers: { 'If-None-Match': file.headers.get('etag') } })
    assert.equal(cached.status, 304)
  })

  it('mengganti berkas membuat URL lama tidak berlaku dan DELETE mengosongkannya', async () => {
    const first = (await (await upload('logo', JPEG, 'image/jpeg')).json()).data
    const second = (await (await upload('logo', WEBP, 'image/webp')).json()).data
    assert.notEqual(first.path, second.path)
    assert.equal((await fetch(`${origin}${first.path}`)).status, 404)
    assert.equal((await fetch(`${origin}${second.path}`)).status, 200)

    const removed = await fetch(`${origin}/api/admin/files/logo`, { method: 'DELETE' })
    assert.equal(removed.status, 200)
    assert.deepEqual((await removed.json()).data, { path: null })
    assert.equal((await fetch(`${origin}${second.path}`)).status, 404)
  })

  it('menolak format, isi palsu, berkas kosong, ukuran berlebih, target, dan hash tidak dikenal', async () => {
    assert.equal((await upload('qris', Buffer.from('<svg/>'), 'image/svg+xml')).status, 415)
    assert.equal((await upload('qris', JPEG, 'image/png')).status, 415)
    assert.equal((await upload('qris', Buffer.from('bukan gambar sama sekali'), 'image/png')).status, 415)
    assert.equal((await upload('qris', Buffer.alloc(0), 'image/png')).status, 400)
    const tooBigForQris = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)])
    assert.equal((await upload('qris', tooBigForQris, 'image/png')).status, 413)
    assert.equal((await upload('masjid-photo', tooBigForQris, 'image/png')).status, 201)
    const overLimit = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)])
    assert.equal((await upload('masjid-photo', overLimit, 'image/png')).status, 413)
    assert.equal((await upload('avatar', PNG, 'image/png')).status, 404)
    assert.equal((await fetch(`${origin}/api/public/files/qris/abc`)).status, 404)
    assert.equal((await fetch(`${origin}/api/public/files/qris/${'0'.repeat(64)}`)).status, 404)
    assert.equal((await fetch(`${origin}/api/public/files/avatar/${'0'.repeat(64)}`)).status, 404)
    assert.equal((await fetch(`${origin}/api/public/files/99999`)).status, 404)
  })
})
