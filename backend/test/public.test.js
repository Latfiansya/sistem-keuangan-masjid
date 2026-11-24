import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../src/app.js'
import { createPublicContentRepository } from '../src/repositories/publicContentRepository.js'
import { createAgendaService } from '../src/services/agendaService.js'
import { createPublicContentService } from '../src/services/publicContentService.js'
import { createTestRepositories } from './helpers/testRepositories.js'

const repositories = createTestRepositories()
const agendaService = createAgendaService(repositories.agendaRepository)
const publicContentService = createPublicContentService(repositories.publicContentRepository)

let server
let baseUrl

before(async () => {
  const testApp = createApp({ repositories })
  await new Promise((resolve) => {
    server = testApp.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test('GET /api/public/agenda mengembalikan daftar kegiatan sesuai kontrak', async () => {
  const response = await fetch(`${baseUrl}/api/public/agenda`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)

  const body = await response.json()
  assert.equal(body.success, true)
  assert.equal(typeof body.data.description, 'string')
  assert.ok(body.data.description.length > 0)
  assert.equal('counts' in body.data, false)
  assert.deepEqual(body.data.groups.map((group) => group.id), ['weekly', 'monthly', 'yearly'])
  assert.deepEqual(body.data.groups.map((group) => group.items.length), [5, 2, 5])

  for (const group of body.data.groups) {
    assert.equal(typeof group.title, 'string')
    assert.equal(typeof group.subtitle, 'string')
    for (const item of group.items) {
      assert.equal(typeof item.name, 'string')
      assert.equal(typeof item.schedule, 'string')
      assert.ok(item.name.length > 0)
      assert.ok(item.schedule.length > 0)
    }
  }
})

test('GET /api/public/content mengembalikan konten publik tanpa agenda dan menjaga placeholder aman', async () => {
  const response = await fetch(`${baseUrl}/api/public/content`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)

  const body = await response.json()
  assert.equal(body.success, true)

  const content = body.data
  assert.equal('agenda' in content, false)
  assert.equal(content.name, 'Masjid Al-Hidayah')
  assert.equal(typeof content.address, 'string')
  assert.equal(Number.isInteger(content.copyrightYear), true)
  assert.equal(typeof content.heroDescription, 'string')
  assert.equal(typeof content.vision, 'string')
  assert.equal(Array.isArray(content.missions), true)
  assert.equal(content.missions.length, 4)

  // Statistik harus konsisten dengan tahun berdiri serta nilai profil.
  assert.deepEqual(content.statistics.map((item) => item.id), ['founded', 'area', 'capacity'])
  const founded = content.statistics.find((item) => item.id === 'founded')
  assert.equal(Number(founded.value), content.profile.foundedYear)
  for (const stat of content.statistics.filter((item) => item.amount !== undefined)) {
    assert.equal(Number.isInteger(stat.amount), true)
    assert.equal(stat.value, `${stat.amount} ${stat.unit}`)
    assert.equal(typeof stat.profileLabel, 'string')
    assert.equal(typeof stat.description, 'string')
  }

  // Program kemakmuran memakai icon yang didukung HomePage.
  assert.equal(content.programs.length, 3)
  for (const program of content.programs) {
    assert.ok(['heart', 'health', 'economy'].includes(program.icon))
    assert.equal(typeof program.title, 'string')
    assert.equal(typeof program.description, 'string')
  }

  // Profil masjid lengkap dengan linimasa dan 7 pengurus.
  assert.equal(content.profile.managementPeriod, '2023–2025')
  assert.deepEqual(content.profile.timeline.map((event) => event.year), [1980, 2000])
  assert.equal(content.profile.members.length, 7)

  // Data kontak & donasi yang belum dikonfirmasi wajib tetap false/null.
  assert.deepEqual(content.contact.information.map((item) => item.id), ['address', 'phone', 'hours'])
  for (const info of content.contact.information) {
    assert.equal(info.verified, false)
    assert.equal(info.value, null)
  }
  assert.deepEqual(content.contact.location, { verified: false, url: null })
  assert.deepEqual(content.contact.donation.qris, { verified: false, imageSrc: null })
  assert.deepEqual(content.contact.donation.bank, {
    verified: false,
    name: null,
    number: null,
    recipient: null,
  })
  assert.deepEqual(content.contact.donation.bank2, {
    verified: false,
    name: null,
    number: null,
    recipient: null,
  })
})

test('metode selain GET pada endpoint publik mengembalikan JSON 404', async () => {
  const response = await fetch(`${baseUrl}/api/public/agenda`, { method: 'POST' })
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route tidak ditemukan.' },
  })
})

test('salinan data sumber terisolasi dari mutasi pemanggil', async () => {
  const agendaCopy = await agendaService.getPublicAgenda()
  agendaCopy.groups[0].items.pop()

  const contentCopy = await publicContentService.getPublicContent()
  contentCopy.profile.members.pop()

  const [agendaResponse, contentResponse] = await Promise.all([
    fetch(`${baseUrl}/api/public/agenda`),
    fetch(`${baseUrl}/api/public/content`),
  ])
  const agendaBody = await agendaResponse.json()
  const contentBody = await contentResponse.json()

  assert.equal(agendaBody.data.groups[0].items.length, 5)
  assert.equal(contentBody.data.profile.members.length, 7)
})

test('createPublicContentRepository memakai 1 koneksi client secara berurutan tanpa pool burst', async () => {
  let connectCount = 0
  let releaseCount = 0
  let directPoolQueryCount = 0
  const queriedSql = []

  const spyPool = {
    async query() {
      directPoolQueryCount += 1
      return { rows: [] }
    },
    async connect() {
      connectCount += 1
      return {
        async query(sql) {
          queriedSql.push(sql)
          if (sql.includes('m_profil_masjid')) {
            return {
              rows: [
                {
                  nama_masjid: 'Masjid Al-Hidayah',
                  tagline: 'Tagline Beranda',
                  deskripsi: 'Deskripsi Lengkap Profil',
                },
              ],
            }
          }
          return { rows: [] }
        },
        release() {
          releaseCount += 1
        },
      }
    },
  }

  const repo = createPublicContentRepository(spyPool)
  const content = await repo.findPublicContent()

  assert.equal(connectCount, 1)
  assert.equal(releaseCount, 1)
  assert.equal(directPoolQueryCount, 0)
  assert.equal(queriedSql.length, 7)
  assert.equal(content.heroDescription, 'Tagline Beranda')
  assert.equal(content.profile.introduction, 'Deskripsi Lengkap Profil')
})

test('GET /api/public/content menyertakan hingga 4 rekening terverifikasi, menyaring data tidak terverifikasi, dan fallback aman', async () => {
  const serviceUnverified = createPublicContentService({
    async findPublicContent() {
      return {
        name: 'Masjid Al-Hidayah',
        contact: {
          introduction: '',
          information: [],
          location: { verified: false, url: null },
          donation: {
            qris: { verified: false, imageSrc: null },
            banks: [
              { verified: true, name: 'BSI', number: '007123456789', recipient: 'Takmir' },
              { verified: false, name: 'BPD', number: '999', recipient: 'Bocoran' },
            ],
            bank: { verified: true, name: 'BSI', number: '007123456789', recipient: 'Takmir' },
            bank2: { verified: false, name: 'BPD', number: '999', recipient: 'Bocoran' },
          },
        },
      }
    },
  })
  const sanitized = await serviceUnverified.getPublicContent()
  assert.equal(sanitized.contact.donation.banks.length, 1)
  assert.deepEqual(sanitized.contact.donation.bank2, {
    verified: false,
    name: null,
    number: null,
    recipient: null,
  })

  const repoFourBanks = createPublicContentRepository({
    async connect() {
      return {
        async query(sql) {
          if (sql.includes('m_rekening_donasi')) {
            return {
              rows: [
                {
                  id: 1,
                  nama_bank: 'Bank Syariah Indonesia',
                  no_rekening: '007123456789',
                  atas_nama: 'Takmir Masjid Al-Hidayah',
                  urutan: 1,
                },
                {
                  id: 2,
                  nama_bank: 'Bank BPD DIY Syariah',
                  no_rekening: '800112233445',
                  atas_nama: 'Panitia Pembangunan Masjid Al-Hidayah',
                  urutan: 2,
                },
                {
                  id: 3,
                  nama_bank: 'Bank Muamalat',
                  no_rekening: '511000223344',
                  atas_nama: 'Lazis Masjid Al-Hidayah',
                  urutan: 3,
                },
                {
                  id: 4,
                  nama_bank: 'BRI',
                  no_rekening: '002901001234',
                  atas_nama: 'Operasional Masjid Al-Hidayah',
                  urutan: 4,
                },
              ],
            }
          }
          return { rows: [] }
        },
        release() {},
      }
    },
  })
  const repoContent = await createPublicContentService(repoFourBanks).getPublicContent()
  assert.equal(repoContent.contact.donation.banks.length, 4)
  assert.deepEqual(repoContent.contact.donation.bank, {
    verified: true,
    name: 'Bank Syariah Indonesia',
    number: '007123456789',
    recipient: 'Takmir Masjid Al-Hidayah',
  })
  assert.deepEqual(repoContent.contact.donation.bank2, {
    verified: true,
    name: 'Bank BPD DIY Syariah',
    number: '800112233445',
    recipient: 'Panitia Pembangunan Masjid Al-Hidayah',
  })

  // Fallback ke kolom legacy m_pengaturan_website bila tabel rekening terpisah belum ada (42P01)
  const repoFallbackLegacy = createPublicContentRepository({
    async connect() {
      return {
        async query(sql) {
          if (/FROM keu_masjid\.(m_rekening_donasi|rekening_donasi|m_rek|m_rekening)/.test(sql)) {
            const error = new Error('relation does not exist')
            error.code = '42P01'
            throw error
          }
          if (sql.includes('m_pengaturan_website')) {
            return {
              rows: [
                {
                  bank_nama: 'Bank Syariah Indonesia',
                  bank_no_rekening: '007123456789',
                  bank_atas_nama: 'Takmir Masjid Al-Hidayah',
                },
              ],
            }
          }
          return { rows: [] }
        },
        release() {},
      }
    },
  })
  const fallbackContent = await createPublicContentService(repoFallbackLegacy).getPublicContent()
  assert.equal(fallbackContent.contact.donation.bank.verified, true)
  assert.equal(fallbackContent.contact.donation.banks.length, 1)
  assert.deepEqual(fallbackContent.contact.donation.bank2, {
    verified: false,
    name: null,
    number: null,
    recipient: null,
  })
})
