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
    assert.equal(validData.bankName2, '')
    assert.equal(validData.accountNumber2, '')
    assert.equal(validData.accountName2, '')
    assert.equal(validData.bankEnabled, true)
    assert.equal(validData.whatsappEnabled, true)
    assert.equal(validData.readiness.paymentReadyCount, 1)
    assert.equal(validData.readiness.bank.accountCount, 1)

    // Tolak Rekening 2 yang diisi sebagian (1 atau 2 dari 3 field) atau format tidak valid
    const partialBank2Res = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName2: 'Bank BPD DIY Syariah',
        accountNumber2: '',
        accountName2: '',
      }),
    })
    assert.equal(partialBank2Res.status, 400)

    const partialBank2TwoFieldsRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName2: 'Bank BPD DIY Syariah',
        accountNumber2: '800112233445',
        accountName2: '',
      }),
    })
    assert.equal(partialBank2TwoFieldsRes.status, 400)

    const badAcc2Res = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName2: 'Bank BPD DIY Syariah',
        accountNumber2: '8001-1223',
        accountName2: 'Panitia Pembangunan',
      }),
    })
    assert.equal(badAcc2Res.status, 400)

    const badName2Res = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName2: 'x'.repeat(101),
        accountNumber2: '800112233445',
        accountName2: 'Panitia Pembangunan',
      }),
    })
    assert.equal(badName2Res.status, 400)

    const ctrlRecipient2Res = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName2: 'Bank BPD DIY Syariah',
        accountNumber2: '800112233445',
        accountName2: 'Panitia\nPembangunan',
      }),
    })
    assert.equal(ctrlRecipient2Res.status, 400)

    // Simpan 2 rekening lengkap (termasuk leading zero pada Rekening 2)
    const twoBanksRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName: 'Bank Syariah Indonesia',
        accountNumber: '007123456789',
        accountName: 'Takmir Masjid Al-Hidayah',
        bankName2: 'Bank BPD DIY Syariah',
        accountNumber2: '008112233445',
        accountName2: 'Panitia Pembangunan Masjid Al-Hidayah',
        bankEnabled: true,
      }),
    })
    assert.equal(twoBanksRes.status, 200)
    const twoBanksData = (await twoBanksRes.json()).data
    assert.equal(twoBanksData.bankName2, 'Bank BPD DIY Syariah')
    assert.equal(twoBanksData.accountNumber2, '008112233445')
    assert.equal(twoBanksData.accountName2, 'Panitia Pembangunan Masjid Al-Hidayah')
    assert.equal(twoBanksData.bankEnabled, true)
    assert.equal(twoBanksData.readiness.bank.accountCount, 2)
    assert.match(twoBanksData.readiness.bank.reason, /2 rekening/)

    // Kosongkan kembali Rekening 2 sementara Rekening 1 tetap terjaga
    const clearBank2Res = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankName2: '',
        accountNumber2: '',
        accountName2: '',
      }),
    })
    assert.equal(clearBank2Res.status, 200)
    const clearedData = (await clearBank2Res.json()).data
    assert.equal(clearedData.bankName, 'Bank Syariah Indonesia')
    assert.equal(clearedData.accountNumber, '007123456789')
    assert.equal(clearedData.bankName2, '')
    assert.equal(clearedData.accountNumber2, '')
    assert.equal(clearedData.accountName2, '')
    assert.equal(clearedData.readiness.bank.accountCount, 1)
    assert.equal(clearedData.readiness.bank.maxAccounts, 4)

    // Tolak slot rekening tidak lengkap di dalam array bankAccounts
    const partialArrayRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankAccounts: [
          { bankName: 'Bank Syariah Indonesia', accountNumber: '007123456789', accountName: 'Takmir' },
          { bankName: 'Mandiri', accountNumber: '137000111222', accountName: '' },
        ],
      }),
    })
    assert.equal(partialArrayRes.status, 400)

    // Simpan hingga maksimal 4 rekening melalui bankAccounts
    const fourAccounts = [
      { bankName: 'BSI', accountNumber: '007123456789', accountName: 'Takmir Masjid Al-Hidayah' },
      { bankName: 'BPD DIY Syariah', accountNumber: '008112233445', accountName: 'Panitia Pembangunan' },
      { bankName: 'Bank Muamalat', accountNumber: '511000223344', accountName: 'Lazis Al-Hidayah' },
      { bankName: 'BRI', accountNumber: '002901001234', accountName: 'Operasional Masjid' },
    ]
    const fourBanksRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankAccounts: fourAccounts,
        bankEnabled: true,
      }),
    })
    assert.equal(fourBanksRes.status, 200)
    const fourBanksData = (await fourBanksRes.json()).data
    assert.equal(fourBanksData.bankAccounts.length, 4)
    assert.equal(fourBanksData.readiness.bank.accountCount, 4)
    assert.equal(fourBanksData.readiness.bank.maxAccounts, 4)
    assert.match(fourBanksData.readiness.bank.reason, /4 rekening/)
    assert.doesNotMatch(fourBanksData.readiness.bank.reason, /simulasi/i)
    assert.doesNotMatch(fourBanksData.readiness.whatsapp.reason, /simulasi/i)

    // Tolak penambahan rekening ke-5 saat 4 rekening sudah penuh
    const fiveBanksRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankAccounts: [
          ...fourAccounts,
          { bankName: 'BCA Syariah', accountNumber: '099887766554', accountName: 'Dana Sosial' },
        ],
      }),
    })
    assert.equal(fiveBanksRes.status, 400)

    // Hapus salah satu rekening (sisa 3), lalu isi rekening ke-4 pengganti
    const threeBanksRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankAccounts: [fourAccounts[0], fourAccounts[2], fourAccounts[3]],
      }),
    })
    assert.equal(threeBanksRes.status, 200)
    const threeBanksData = (await threeBanksRes.json()).data
    assert.equal(threeBanksData.bankAccounts.length, 3)

    const replacedFourthRes = await fetch(`${baseUrl}/donation-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bankAccounts: [
          ...threeBanksData.bankAccounts,
          { bankName: 'BCA Syariah', accountNumber: '099887766554', accountName: 'Dana Sosial' },
        ],
      }),
    })
    assert.equal(replacedFourthRes.status, 200)
    const replacedData = (await replacedFourthRes.json()).data
    assert.equal(replacedData.bankAccounts.length, 4)
    assert.equal(replacedData.bankAccounts[3].bankName, 'BCA Syariah')
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

  it('PUT /api/admin/profile menyimpan kolom profil lengkap dan mempertahankan field yang tidak dikirim', async () => {
    const put = (body) => fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    assert.equal((await put({ name: 'Masjid', foundedYear: 1700 })).status, 400)
    assert.equal((await put({ name: 'Masjid', buildingArea: -1 })).status, 400)
    assert.equal((await put({ name: 'Masjid', capacity: '290' })).status, 400)
    assert.equal((await put({ name: 'Masjid', managementPeriod: 'x'.repeat(21) })).status, 400)

    const res = await put({
      name: 'Masjid Al-Hidayah',
      tagline: 'Pusat ibadah warga Sorolaten.',
      vision: 'Menjadi pusat ibadah dan pembinaan masyarakat Sorolaten.',
      foundedYear: 1981,
      buildingArea: null,
      managementPeriod: '2023–2026',
    })
    assert.equal(res.status, 200)
    const data = (await res.json()).data
    assert.equal(data.tagline, 'Pusat ibadah warga Sorolaten.')
    assert.equal(data.foundedYear, 1981)
    assert.equal(data.buildingArea, null)
    assert.equal(data.capacity, 290)
    assert.equal(data.location, 'Sorolaten')
  })

  it('PUT /api/admin/website-settings menyimpan telepon, keterangan telepon, jam operasional, dan label peta', async () => {
    const put = (body) => fetch(`${baseUrl}/website-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    assert.equal((await put({ phone: '123' })).status, 400)
    assert.equal((await put({ hours: 'x'.repeat(151) })).status, 400)
    assert.equal((await put({ mapLabel: 'Label\u0000' })).status, 400)

    const res = await put({
      phone: '(0274) 123456',
      phoneNote: 'Sekretariat takmir',
      hours: 'Setiap hari · 04.30 – 21.00 WIB',
      mapLabel: 'Masjid Al-Hidayah Sorolaten',
    })
    assert.equal(res.status, 200)
    const data = (await res.json()).data
    assert.equal(data.phone, '(0274) 123456')
    assert.equal(data.mapLabel, 'Masjid Al-Hidayah Sorolaten')
    assert.equal(data.email, 'takmir@alhidayah.id')
    assert.equal('latitude' in data, false)
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

