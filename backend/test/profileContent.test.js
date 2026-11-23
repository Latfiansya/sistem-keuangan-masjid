import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { createTestRepositories } from './helpers/testRepositories.js'

describe('Endpoint konten profil masjid (/api/admin/profile-content)', () => {
  let server
  let baseUrl

  const send = (path, method, body) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

  before(async () => {
    const app = createApp({ repositories: createTestRepositories() })
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/profile-content`
  })

  after(async () => {
    if (!server) return
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  })

  it('GET mengembalikan keempat bagian konten profil', async () => {
    const res = await fetch(baseUrl)
    assert.equal(res.status, 200)
    const { data } = await res.json()
    assert.deepEqual(Object.keys(data), ['missions', 'programs', 'history', 'officers'])
    assert.equal(data.missions.length, 2)
    assert.equal(data.officers[0].role, 'KETUA')
  })

  it('POST, PUT, dan DELETE misi berjalan dengan validasi isi wajib', async () => {
    const empty = await send('/missions', 'POST', { text: '   ', order: 3 })
    assert.equal(empty.status, 400)

    const tooLong = await send('/missions', 'POST', { text: 'a'.repeat(256), order: 3 })
    assert.equal(tooLong.status, 400)

    const created = await send('/missions', 'POST', { text: '  Memakmurkan kegiatan sosial  ', order: 3 })
    assert.equal(created.status, 201)
    const mission = (await created.json()).data
    assert.equal(mission.text, 'Memakmurkan kegiatan sosial')

    const updated = await send(`/missions/${mission.id}`, 'PUT', { text: 'Memakmurkan kegiatan sosial jamaah', order: 4 })
    assert.equal(updated.status, 200)
    assert.equal((await updated.json()).data.order, 4)

    const deleted = await send(`/missions/${mission.id}`, 'DELETE')
    assert.equal(deleted.status, 200)
    assert.deepEqual((await deleted.json()).data, { deletedId: mission.id })

    const missing = await send(`/missions/${mission.id}`, 'DELETE')
    assert.equal(missing.status, 404)
  })

  it('memvalidasi field wajib program, sejarah, dan pengurus sesuai constraint database', async () => {
    assert.equal((await send('/programs', 'POST', { title: 'Program', description: '' })).status, 400)
    assert.equal((await send('/programs', 'POST', { title: 'Program', description: 'Deskripsi', active: 'ya' })).status, 400)
    assert.equal((await send('/history', 'POST', { year: 1799, title: 'Terlalu lama' })).status, 400)
    assert.equal((await send('/history', 'POST', { year: '1980', title: 'Tahun string' })).status, 400)
    assert.equal((await send('/officers', 'POST', { name: 'Budi', role: '' })).status, 400)
    assert.equal((await send('/officers', 'POST', { name: 'Budi', role: 'a'.repeat(51) })).status, 400)
    assert.equal((await send('/missions', 'POST', { text: 'Misi', order: -1 })).status, 400)

    const history = await send('/history', 'POST', { year: 2010, title: 'Renovasi', era: '', description: 'Baris 1\nBaris 2' })
    assert.equal(history.status, 201)
    const historyData = (await history.json()).data
    assert.equal(historyData.era, '')
    assert.equal(historyData.order, 0)

    const officer = await send('/officers', 'POST', { name: 'Budi Santoso', role: 'BENDAHARA', active: false })
    assert.equal(officer.status, 201)
    assert.equal((await officer.json()).data.active, false)
  })

  it('menolak bagian yang tidak dikenal dan id yang tidak ada', async () => {
    assert.equal((await send('/unknown', 'POST', { text: 'x' })).status, 404)
    assert.equal((await send('/programs/9999', 'PUT', { title: 'X', description: 'Y' })).status, 404)
  })
})
