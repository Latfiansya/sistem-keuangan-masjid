import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../src/app.js'
import { loadEnv } from '../src/config/env.js'
import { createReportService } from '../src/services/reportService.js'
import { hashPassword } from '../src/utils/passwordHash.js'
import { createTestRepositories } from './helpers/testRepositories.js'

const TEST_PASSWORD = 'sandi-uji-laporan'
const TEST_PASSWORD_HASH = hashPassword(TEST_PASSWORD)
const repositories = createTestRepositories()
const reportService = createReportService(repositories.financeReportRepository)

let server
let baseUrl

before(async () => {
  const testApp = createApp({
    reportPasswordHash: TEST_PASSWORD_HASH,
    rateLimitWindowMs: 60_000,
    rateLimitMax: 20,
    repositories,
  })
  await new Promise((resolve) => {
    server = testApp.listen(0, '127.0.0.1', resolve)
  })
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test('POST /api/public/report/check-password memverifikasi sandi secara persis dengan hash scrypt', async () => {
  const validRes = await fetch(`${baseUrl}/api/public/report/check-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  })
  assert.equal(validRes.status, 200)
  assert.deepEqual(await validRes.json(), { success: true, data: { valid: true } })

  for (const wrongPassword of ['salah', 'Sandi-uji-laporan', ` ${TEST_PASSWORD} `]) {
    const res = await fetch(`${baseUrl}/api/public/report/check-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: wrongPassword }),
    })
    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { success: true, data: { valid: false } })
  }
})

test('POST /api/public/report/check-password menolak input kosong, bukan teks, atau karakter kontrol', async () => {
  for (const payload of [{}, { password: '' }, { password: '   ' }, { password: null }, { password: 'abc\u0000' }]) {
    const res = await fetch(`${baseUrl}/api/public/report/check-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.equal(body.error.code, 'BAD_REQUEST')
  }
})

test('POST /api/public/report/check-password mengembalikan 503 bila sandi belum dikonfigurasi dan 429 saat brute force', async () => {
  const unconfiguredApp = createApp({ reportPasswordHash: '', repositories })
  const unconfiguredServer = await new Promise((resolve) => {
    const s = unconfiguredApp.listen(0, '127.0.0.1', () => resolve(s))
  })
  try {
    const res = await fetch(`http://127.0.0.1:${unconfiguredServer.address().port}/api/public/report/check-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    })
    assert.equal(res.status, 503)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.equal(body.error.code, 'SERVICE_UNAVAILABLE')
  } finally {
    await new Promise((resolve) => unconfiguredServer.close(resolve))
  }

  const limitedApp = createApp({
    reportPasswordHash: TEST_PASSWORD_HASH,
    rateLimitWindowMs: 60_000,
    rateLimitMax: 3,
    repositories,
  })
  const limitedServer = await new Promise((resolve) => {
    const s = limitedApp.listen(0, '127.0.0.1', () => resolve(s))
  })
  const limitedUrl = `http://127.0.0.1:${limitedServer.address().port}/api/public/report/check-password`
  try {
    for (let i = 0; i < 3; i++) {
      const attempt = await fetch(limitedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'salah' }),
      })
      assert.equal(attempt.status, 200)
    }
    const blocked = await fetch(limitedUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    })
    assert.equal(blocked.status, 429)
    assert.ok(Number(blocked.headers.get('retry-after')) >= 1)
    const blockedBody = await blocked.json()
    assert.equal(blockedBody.success, false)
    assert.equal(blockedBody.error.code, 'TOO_MANY_REQUESTS')
  } finally {
    await new Promise((resolve) => limitedServer.close(resolve))
  }
})

test('GET /api/public/finance/report default April 2026 cocok dengan rekonsiliasi audit', async () => {
  const res = await fetch(`${baseUrl}/api/public/finance/report`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.success, true)

  const report = body.data
  assert.equal(report.status, 'ready')
  assert.deepEqual(report.range, { startDate: '2026-04-01', endDate: '2026-04-30' })
  assert.equal(report.transactions.length, 50)
  assert.equal(new Set(report.transactions.map((item) => item.id)).size, 50)
  assert.ok(report.transactions.every((item) => typeof item.id === 'string' && Number.isSafeInteger(item.amount)))
  assert.equal(report.transactions.filter((item) => item.type === 'income').length, 17)
  assert.equal(report.transactions.filter((item) => item.type === 'expense').length, 33)

  assert.deepEqual(report.summary.totals, {
    openingBalance: 18590700,
    income: 10665500,
    expense: 8771500,
    closingBalance: 20484700,
  })
  assert.deepEqual(
    report.summary.rows.map(({ id, color, openingBalance, income, expense, closingBalance }) => ({
      id,
      color,
      openingBalance,
      income,
      expense,
      closingBalance,
    })),
    [
      { id: 'mosque', color: 'green', openingBalance: 15256700, income: 8657500, expense: 5791500, closingBalance: 18122700 },
      { id: 'maintenance', color: 'orange', openingBalance: 1335000, income: 685000, expense: 300000, closingBalance: 1720000 },
      { id: 'friday', color: 'blue', openingBalance: 1999000, income: 1323000, expense: 2680000, closingBalance: 642000 },
    ],
  )
})

test('GET /api/public/finance/report menghitung rentang inklusif, hari akhir, dan hari kosong dengan tepat', async () => {
  const customRes = await fetch(`${baseUrl}/api/public/finance/report?startDate=2026-04-03&endDate=2026-04-05`)
  assert.equal(customRes.status, 200)
  const custom = (await customRes.json()).data
  assert.equal(custom.status, 'ready')
  assert.equal(custom.transactions.length, 2)
  assert.ok(custom.transactions.every((item) => item.date >= '2026-04-03' && item.date <= '2026-04-05'))
  assert.deepEqual(custom.summary.totals, {
    openingBalance: 18590700,
    income: 600000,
    expense: 190000,
    closingBalance: 19000700,
  })

  const finalDayRes = await fetch(`${baseUrl}/api/public/finance/report?startDate=2026-04-30&endDate=2026-04-30`)
  const finalDay = (await finalDayRes.json()).data
  assert.equal(finalDay.transactions.length, 1)
  assert.equal(finalDay.summary.totals.openingBalance, 20161700)
  assert.equal(finalDay.summary.totals.closingBalance, 20484700)

  const emptyDayRes = await fetch(`${baseUrl}/api/public/finance/report?startDate=2026-04-04&endDate=2026-04-04`)
  const emptyDay = (await emptyDayRes.json()).data
  assert.equal(emptyDay.status, 'ready')
  assert.equal(emptyDay.transactions.length, 0)
  assert.equal(emptyDay.summary.totals.openingBalance, 19000700)
  assert.equal(emptyDay.summary.totals.closingBalance, 19000700)
})

test('GET /api/public/finance/report mengembalikan HTTP 200 status unavailable di luar cakupan', async () => {
  for (const [startDate, endDate] of [
    ['2026-03-01', '2026-03-31'],
    ['2026-02-01', '2026-04-30'],
    ['2026-04-01', '2026-05-01'],
  ]) {
    const res = await fetch(`${baseUrl}/api/public/finance/report?startDate=${startDate}&endDate=${endDate}`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.success, true)
    assert.equal(body.data.status, 'unavailable')
    assert.deepEqual(body.data.transactions, [])
    assert.equal(body.data.summary, null)
    assert.match(body.data.message, /belum tersedia atau belum lengkap/)
  }
})

test('GET /api/public/finance/report menolak query tanggal tidak valid dengan HTTP 400', async () => {
  for (const qs of [
    'startDate=2026-04-01',
    'startDate=&endDate=2026-04-30',
    'startDate=2026-02-30&endDate=2026-04-30',
    'startDate=2026-04-30&endDate=2026-04-01',
    'startDate=2026-04-01&startDate=2026-04-02&endDate=2026-04-30',
    'startDate=2025-01-01&endDate=2026-04-30',
  ]) {
    const res = await fetch(`${baseUrl}/api/public/finance/report?${qs}`)
    assert.equal(res.status, 400)
    const body = await res.json()
    assert.equal(body.success, false)
    assert.equal(body.error.code, 'BAD_REQUEST')
    assert.equal(typeof body.error.message, 'string')
  }
})

test('isolasi hasil laporan dan validasi konfigurasi sandi environment', async () => {
  const report = await reportService.getFinanceReport({ startDate: '2026-04-24', endDate: '2026-04-30' })
  report.transactions[0].amount = 1
  report.summary.rows[0].openingBalance = 0
  report.months.pop()

  const fresh = await reportService.getFinanceReport()
  assert.equal(fresh.summary.totals.income, 10665500)
  assert.equal(fresh.months.length, 5)

  assert.throws(
    () => loadEnv({ NODE_ENV: 'production', REPORT_SHARED_PASSWORD: 'plaintext-tidak-boleh' }),
    /REPORT_SHARED_PASSWORD_HASH/,
  )
  assert.equal(
    loadEnv({
      NODE_ENV: 'production',
      REPORT_SHARED_PASSWORD_HASH: TEST_PASSWORD_HASH,
      AUTH_SECRET: 'rahasia-produksi-minimal-32-karakter-aman',
    }).reportPasswordHash,
    TEST_PASSWORD_HASH,
  )
})


test('laporan publik memperhitungkan transfer internal di dalam periode pada saldo akhir per kategori', async () => {
  const repos = createTestRepositories()
  const original = repos.financeReportRepository.findFinanceReportForRange.bind(repos.financeReportRepository)
  const transfer = {
    id: '9', date: '2026-04-10', amount: 500000, note: '',
    fromCategoryId: 'mosque', fromCategoryLabel: 'Kas Masjid',
    toCategoryId: 'maintenance', toCategoryLabel: 'Kotak Pembangunan & Pemeliharaan',
  }
  repos.financeReportRepository.findFinanceReportForRange = async (range) => ({
    ...(await original(range)),
    transfers: transfer.date >= range.startDate && transfer.date <= range.endDate ? [transfer] : [],
  })
  const service = createReportService(repos.financeReportRepository)
  const baseline = await createReportService(createTestRepositories().financeReportRepository).getFinanceReport()
  const report = await service.getFinanceReport()

  const row = (data, id) => data.summary.rows.find((item) => item.id === id)
  assert.equal(row(report, 'mosque').closingBalance, row(baseline, 'mosque').closingBalance - 500000)
  assert.equal(row(report, 'maintenance').closingBalance, row(baseline, 'maintenance').closingBalance + 500000)
  assert.equal(row(report, 'mosque').income, row(baseline, 'mosque').income)
  assert.equal(row(report, 'mosque').expense, row(baseline, 'mosque').expense)
  assert.deepEqual(report.summary.totals, baseline.summary.totals)
  assert.deepEqual(report.summary.transfers, [{
    date: '2026-04-10', fromCategoryId: 'mosque', fromCategoryLabel: 'Kas Masjid',
    toCategoryId: 'maintenance', toCategoryLabel: 'Kotak Pembangunan & Pemeliharaan', amount: 500000,
  }])
  assert.deepEqual(baseline.summary.transfers, [])
})
