import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'
import { createApp } from '../src/app.js'
import { createTestRepositories } from './helpers/testRepositories.js'

describe('Endpoint konten, profil, agenda, donasi, dan pengaturan website pengurus (/api/admin)', () => {
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

  it('GET & PUT /api/admin/profile membaca dan memvalidasi perubahan profil masjid', async () => {
    const getRes = await fetch(`${baseUrl}/profile`)
    assert.equal(getRes.status, 200)
    const initial = (await getRes.json()).data
    assert.equal(initial.name, 'Masjid Al-Hidayah')
    assert.equal(initial.contact, '')

    // Tolak nama kosong atau nomor telepon kurang dari 8 digit
    const badNameRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...initial, name: '   ' }),
    })
    assert.equal(badNameRes.status, 400)

    const badPhoneRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...initial, contact: '08123' }),
    })
    assert.equal(badPhoneRes.status, 400)

    // Simpan perubahan valid
    const updateRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Masjid Al-Hidayah Sorolaten',
        description: 'Pusat ibadah dan kegiatan umat.',
        address: 'Sorolaten, Sidokarto, Godean, Sleman',
        contact: '+62 812-3456-7890',
      }),
    })
    assert.equal(updateRes.status, 200)
    const updated = (await updateRes.json()).data
    assert.equal(updated.name, 'Masjid Al-Hidayah Sorolaten')
    assert.equal(updated.contact, '+62 812-3456-7890')
  })

  it('GET /api/admin/agenda mengembalikan kelompok kegiatan dan ringkasan jumlah 5/2/5 (total 12)', async () => {
    const res = await fetch(`${baseUrl}/agenda`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.success, true)
    assert.equal(body.data.groups.length, 3)
    assert.deepEqual(body.data.counts, {
      total: 12,
      weekly: 5,
      monthly: 2,
      yearly: 5,
    })
  })

  it('GET & PUT /api/admin/donation-settings memvalidasi rekening/WhatsApp dan menormalisasi kesiapan metode', async () => {
    const getRes = await fetch(`${baseUrl}/donation-settings`)
    assert.equal(getRes.status, 200)
    const initial = (await getRes.json()).data
    assert.equal(initial.bankEnabled, false)
    assert.equal(initial.readiness.paymentReadyCount, 0)

    // Jika bank belum lengkap namun bankEnabled dikirim true, otomatis dinormalisasi menjadi false
    const partialRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName: 'BSI',
        accountNumber: '',
        accountName: '',
        bankEnabled: true,
      }),
    })
    assert.equal(partialRes.status, 200)
    const partialData = (await partialRes.json()).data
    assert.equal(partialData.bankEnabled, false)
    assert.equal(partialData.readiness.bank.complete, false)

    // Tolak nomor rekening dengan huruf/spasi atau WhatsApp dengan tanda +
    const badAccRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber: '1234-5678' }),
    })
    assert.equal(badAccRes.status, 400)

    const badWaRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappNumber: '+628123456789' }),
    })
    assert.equal(badWaRes.status, 400)

    // Simpan konfigurasi rekening dengan nol di depan dan WhatsApp valid
    const validRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName: 'Bank Syariah Indonesia',
        accountNumber: '007123456789',
        accountName: 'Takmir Masjid Al-Hidayah',
        bankEnabled: true,
        whatsappNumber: '6281234567890',
        whatsappEnabled: true,
      }),
    })
    assert.equal(validRes.status, 200)
    const validData = (await validRes.json()).data
    assert.equal(validData.accountNumber, '007123456789')
    assert.equal(validData.bankEnabled, true)
    assert.equal(validData.whatsappEnabled, true)
    assert.equal(validData.readiness.paymentReadyCount, 1)
  })

  it('GET & PUT /api/admin/website-settings memvalidasi WhatsApp, email, dan tautan HTTPS Google Maps', async () => {
    const getRes = await fetch(`${baseUrl}/website-settings`)
    assert.equal(getRes.status, 200)
    const initial = (await getRes.json()).data
    assert.equal(initial.publicReportEnabled, true)

    // Tolak email tidak valid dan tautan Maps non-HTTPS atau domain asing
    const badEmailRes = await fetch(`${baseUrl}/website-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bukan-email' }),
    })
    assert.equal(badEmailRes.status, 400)

    const badMapsRes = await fetch(`${baseUrl}/website-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapsUrl: 'https://example.com/maps/masjid' }),
    })
    assert.equal(badMapsRes.status, 400)

    // Simpan pengaturan valid termasuk tautan maps.app.goo.gl
    const validRes = await fetch(`${baseUrl}/website-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whatsapp: '+62 813-2233-4455',
        email: 'takmir@alhidayah.id',
        address: 'Padukuhan Sorolaten, Sidokarto, Godean, Sleman',
        mapsUrl: 'https://maps.app.goo.gl/AbCdEfGh123',
        publicReportEnabled: false,
      }),
    })
    assert.equal(validRes.status, 200)
    const updated = (await validRes.json()).data
    assert.equal(updated.email, 'takmir@alhidayah.id')
    assert.equal(updated.mapsUrl, 'https://maps.app.goo.gl/AbCdEfGh123')
    assert.equal(updated.publicReportEnabled, false)
  })

  it('CRUD /api/admin/agenda menambah, memvalidasi duplikasi, mengubah, dan menghapus agenda', async () => {
    // Validasi frekuensi tidak sah -> 400
    const badFreqRes = await fetch(`${baseUrl}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Kajian Khusus', frequency: 'daily', schedule: 'Setiap hari' }),
    })
    assert.equal(badFreqRes.status, 400)

    // Tambah agenda baru -> 201
    const createRes = await fetch(`${baseUrl}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tahsin Al-Quran',
        frequency: 'weekly',
        schedule: 'Ahad Pagi 07:00',
        description: 'Bimbingan membaca Al-Quran.',
        order: 6,
      }),
    })
    assert.equal(createRes.status, 201)
    const created = (await createRes.json()).data
    assert.equal(created.name, 'Tahsin Al-Quran')
    assert.equal(created.frequency, 'weekly')

    // Tolak duplikasi nama + frekuensi yang sama (case-insensitive) -> 400
    const dupRes = await fetch(`${baseUrl}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '  tahsin al-quran  ',
        frequency: 'Mingguan',
        schedule: 'Ahad 08:00',
      }),
    })
    assert.equal(dupRes.status, 400)

    // Ubah agenda (termasuk pindah kelompok frekuensi ke monthly) -> 200
    const updateRes = await fetch(`${baseUrl}/agenda/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tahsin & Tadabbur Bulanan',
        frequency: 'monthly',
        schedule: 'Sabtu Wage 19:30',
        active: true,
      }),
    })
    assert.equal(updateRes.status, 200)
    const updated = (await updateRes.json()).data
    assert.equal(updated.frequency, 'monthly')

    // Hapus agenda -> 200
    const deleteRes = await fetch(`${baseUrl}/agenda/${created.id}`, { method: 'DELETE' })
    assert.equal(deleteRes.status, 200)
    assert.equal((await deleteRes.json()).data.deletedId, created.id)

    // Hapus ulang ID tidak ada -> 404
    const missingDeleteRes = await fetch(`${baseUrl}/agenda/${created.id}`, { method: 'DELETE' })
    assert.equal(missingDeleteRes.status, 404)
  })
})

