import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { calculateReport, DEFAULT_REPORT_RANGE, getMonthRange, getPresetRange } from '../src/utils/reportCalculations.js'
import { formatReportPeriod, formatRupiah } from '../src/utils/reportFormatters.js'
import { mockReport } from '../src/mocks/report.js'

const root = fileURLToPath(new URL('../', import.meta.url))
let server
let getReport
let FinancialTable
let BalanceSummary
let FinancialReportPage
before(async () => {
  server = await createServer({ root, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify('mock') } })
  ;({ getReport } = await server.ssrLoadModule('/src/services/reportService.js'))
  ;({ default: FinancialTable } = await server.ssrLoadModule('/src/components/FinancialTable.jsx'))
  ;({ default: BalanceSummary } = await server.ssrLoadModule('/src/components/BalanceSummary.jsx'))
  ;({ default: FinancialReportPage } = await server.ssrLoadModule('/src/pages/FinancialReportPage.jsx'))
})
after(async () => { await server?.close() })

test('audit 50 transaksi integer menghasilkan total dan saldo akhir sesuai rekonsiliasi', async () => {
  const report = await getReport()
  assert.equal(new Set(report.transactions.map((item) => item.id)).size, 50)
  assert.equal(report.transactions.filter((item) => item.type === 'income').length, 17)
  assert.equal(report.transactions.filter((item) => item.type === 'expense').length, 33)
  assert.ok(report.transactions.every((item) => Number.isSafeInteger(item.amount)))
  assert.deepEqual(report.summary.totals, { openingBalance: 18590700, income: 10665500, expense: 8771500, closingBalance: 20484700 })
  assert.deepEqual(report.summary.rows.map(({ id, openingBalance, income, expense, closingBalance }) => ({ id, openingBalance, income, expense, closingBalance })), [
    { id: 'mosque', openingBalance: 15256700, income: 8657500, expense: 5791500, closingBalance: 18122700 },
    { id: 'maintenance', openingBalance: 1335000, income: 685000, expense: 300000, closingBalance: 1720000 },
    { id: 'friday', openingBalance: 1999000, income: 1323000, expense: 2680000, closingBalance: 642000 },
  ])
})

test('rentang inklusif memasukkan kedua batas dan menggeser saldo awal dari mutasi sebelumnya', () => {
  const report = calculateReport(mockReport, { startDate: '2026-04-03', endDate: '2026-04-05' })
  assert.ok(report.transactions.some((item) => item.date === '2026-04-03'))
  assert.ok(report.transactions.some((item) => item.date === '2026-04-05'))
  assert.ok(report.transactions.every((item) => item.date >= '2026-04-03' && item.date <= '2026-04-05'))
  assert.equal(report.transactions.length, 9)
  assert.deepEqual(report.summary.totals, { openingBalance: 15445700, income: 2023500, expense: 866500, closingBalance: 16602700 })
  const month = calculateReport(mockReport)
  const finalDay = calculateReport(mockReport, { startDate: '2026-04-30', endDate: '2026-04-30' })
  assert.equal(finalDay.transactions.length, 1)
  assert.equal(finalDay.summary.totals.openingBalance, 20368700)
  assert.equal(finalDay.summary.totals.closingBalance, month.summary.totals.closingBalance)
})

test('tanggal kosong, tidak valid dan terbalik ditolak tanpa menormalkan tanggal salah', async () => {
  for (const range of [{ startDate: '', endDate: '2026-04-30' }, { startDate: '2026-02-30', endDate: '2026-04-30' }, { startDate: '2026-04-30', endDate: '2026-04-01' }]) {
    assert.throws(() => calculateReport(mockReport, range), /Tanggal/)
    await assert.rejects(getReport(range), /Tanggal/)
  }
})

test('preset berpatokan akhir April dan periode tidak lengkap tidak menghasilkan saldo nol', () => {
  assert.deepEqual(getPresetRange('1w'), { startDate: '2026-04-24', endDate: '2026-04-30' })
  assert.deepEqual(getPresetRange('1m'), DEFAULT_REPORT_RANGE)
  assert.deepEqual(getPresetRange('1w', '2026-10-31'), { startDate: '2026-10-25', endDate: '2026-10-31' })
  assert.deepEqual(getPresetRange('1m', '2026-10-31'), { startDate: '2026-10-01', endDate: '2026-10-31' })
  assert.deepEqual(getPresetRange('3m', '2026-10-31'), { startDate: '2026-08-01', endDate: '2026-10-31' })
  assert.deepEqual(getMonthRange('2026-03'), { startDate: '2026-03-01', endDate: '2026-03-31' })
  for (const range of [getPresetRange('3m'), getMonthRange('2026-03'), { startDate: '2026-04-01', endDate: '2026-05-01' }]) {
    const report = calculateReport(mockReport, range)
    assert.equal(report.status, 'unavailable')
    assert.equal(report.summary, null)
    assert.equal(report.transactions.length, 0)
    assert.match(report.message, /belum tersedia atau belum lengkap/)
  }
})

test('hari tanpa transaksi dalam cakupan mempertahankan saldo awal, bukan periode tidak lengkap', () => {
  const report = calculateReport(mockReport, { startDate: '2026-04-04', endDate: '2026-04-04' })
  assert.equal(report.status, 'ready')
  assert.equal(report.transactions.length, 0)
  assert.equal(report.summary.totals.income, 0)
  assert.equal(report.summary.totals.expense, 0)
  assert.equal(report.summary.totals.closingBalance, 16815700)
  assert.equal(report.summary.totals.openingBalance, report.summary.totals.closingBalance)
})

test('filter dan perubahan hasil service tidak memutasi mock atau hasil berikutnya', async () => {
  const original = structuredClone(mockReport)
  const range = { startDate: '2026-04-24', endDate: '2026-04-30' }
  const calculated = calculateReport(mockReport, range)
  calculated.transactions[0].amount = 1
  calculated.months.pop()
  calculated.summary.rows[0].openingBalance = 0
  assert.deepEqual(mockReport, original)
  const report = await getReport(range)
  report.transactions[0].amount = 1
  report.summary.rows[0].openingBalance = 0
  report.months.pop()
  report.coverage.startDate = '2000-01-01'
  assert.deepEqual(mockReport, original)
  assert.equal((await getReport()).summary.totals.income, 10665500)
  assert.deepEqual(range, { startDate: '2026-04-24', endDate: '2026-04-30' })
})

test('komponen tabel dan ringkasan konsisten dengan hasil filter serta menangani daftar kosong', () => {
  for (const range of [DEFAULT_REPORT_RANGE, getPresetRange('1w'), { startDate: '2026-04-04', endDate: '2026-04-04' }]) {
    const report = calculateReport(mockReport, range)
    const summary = renderToStaticMarkup(h(BalanceSummary, { summary: report.summary, period: formatReportPeriod(range) }))
    for (const type of ['income', 'expense']) {
      const transactions = report.transactions.filter((item) => item.type === type)
      assert.equal(transactions.reduce((sum, item) => sum + item.amount, 0), report.summary.totals[type])
      const html = renderToStaticMarkup(h(FinancialTable, { type, transactions, subtotal: report.summary.totals[type], categories: report.summary.rows }))
      assert.ok(html.includes(`${transactions.length} transaksi`))
      assert.ok(html.includes(formatRupiah(report.summary.totals[type])))
      if (!transactions.length) assert.match(html, /role="status".*Tidak ada transaksi/)
    }
    assert.ok(summary.includes('TOTAL'))
    for (const row of report.summary.rows) assert.equal(row.closingBalance, row.openingBalance + row.income - row.expense)
  }
})

test('API laporan memanggil /api/public/finance/report, menormalisasi months dan AbortSignal tetap didukung', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getReport({ signal: controller.signal }), { name: 'AbortError' })
  const pendingController = new AbortController()
  const pending = getReport({ signal: pendingController.signal })
  pendingController.abort()
  await assert.rejects(pending, { name: 'AbortError' })
  const apiServer = await createServer({ root, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify('api') } })
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    return new Response(JSON.stringify({
      success: true,
      data: {
        name: 'Masjid API',
        status: 'ready',
        coverage: { startDate: '2026-01-01', endDate: '2026-10-31' },
        months: [{ id: '2026-04', label: 'April 2026' }],
        range: { startDate: '2026-04-01', endDate: '2026-04-30' },
        transactions: [],
        summary: { rows: [], totals: { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 } },
      },
    }), { status: 200 })
  }
  try {
    const service = await apiServer.ssrLoadModule('/src/services/reportService.js')
    const report = await service.getReport({ startDate: '2026-04-01', endDate: '2026-04-30' })
    assert.equal(calls[0], '/api/public/finance/report?startDate=2026-04-01&endDate=2026-04-30')
    assert.deepEqual(report.months, ['2026-04'])
  } finally { globalThis.fetch = originalFetch; await apiServer.close() }
})

test('input rentang kustom pada FinancialReportPage awalnya kosong', () => {
  const html = renderToStaticMarkup(h(MemoryRouter, null, h(FinancialReportPage)))
  assert.match(html, /aria-label="Tanggal awal"[^>]*value=""/)
  assert.match(html, /aria-label="Tanggal akhir"[^>]*value=""/)
})
