import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { execFileSync } from 'node:child_process'
import { emptyReceipt, receiptAmountInWords, receiptDateFromIso, receiptDateToIso, validateReceipt } from '../src/utils/adminReceipt.js'

const valid = { payer: 'Hamba Allah', amount: '1250000', purpose: 'Donasi pembangunan', method: 'QRIS', date: '29/02/2024' }

test('terbilang Indonesia tepat untuk satuan, belas, puluh, ratus, ribu, juta dan miliar', () => {
  for (const [number, words] of [[0, 'Nol'], [1, 'Satu'], [11, 'Sebelas'], [12, 'Dua belas'], [20, 'Dua puluh'], [21, 'Dua puluh satu'], [100, 'Seratus'], [111, 'Seratus sebelas'], [1000, 'Seribu'], [1011, 'Seribu sebelas'], [1250000, 'Satu juta dua ratus lima puluh ribu'], [1000000001, 'Satu miliar satu'], [999999999999, 'Sembilan ratus sembilan puluh sembilan miliar sembilan ratus sembilan puluh sembilan juta sembilan ratus sembilan puluh sembilan ribu sembilan ratus sembilan puluh sembilan']]) assert.equal(receiptAmountInWords(number), `${words} rupiah`)
  for (const amount of [-1, 1.5, NaN, Infinity, 1000000000000]) assert.throws(() => receiptAmountInWords(amount))
})

test('kelima field wajib, metode dibatasi dan nominal harus rupiah bulat positif dalam rentang', () => {
  assert.deepEqual(Object.keys(validateReceipt(emptyReceipt)), ['payer', 'purpose', 'amount', 'method', 'date'])
  assert.deepEqual(validateReceipt(valid), {})
  for (const amount of ['0', '-1', '1.2', '1,2', '1.000', '1e3', 'abc', '1000000000000']) assert.ok(validateReceipt({ ...valid, amount }).amount)
  for (const amount of ['1', '0001', '999999999999']) assert.equal(validateReceipt({ ...valid, amount }).amount, undefined)
  assert.ok(validateReceipt({ ...valid, method: 'Lainnya' }).method)
  assert.ok(validateReceipt({ ...valid, payer: '  ' }).payer)
  assert.ok(validateReceipt({ ...valid, payer: 'A'.repeat(101) }).payer)
  assert.ok(validateReceipt({ ...valid, purpose: 'A'.repeat(501) }).purpose)
  assert.ok(validateReceipt({ ...valid, purpose: 'A\u0000B' }).purpose)
})

test('tanggal dd/mm/yyyy memvalidasi kalender dan tahun kabisat tanpa pergeseran zona waktu', () => {
  assert.equal(receiptDateToIso('29/02/2024'), '2024-02-29')
  assert.equal(receiptDateToIso('10/11/2026'), '2026-11-10')
  for (const value of ['29/02/2025', '31/04/2026', '00/01/2026', '01/13/2026', '1/1/2026', '2026-11-10', '01/01/0000', '']) assert.equal(receiptDateToIso(value), '')
})

test('tanggal native dikonversi ke format draft tanpa mengubah hari atau menerima kalender tidak valid', () => {
  assert.equal(receiptDateFromIso('2024-02-29'), '29/02/2024')
  assert.equal(receiptDateFromIso('2026-11-10'), '10/11/2026')
  for (const value of ['', '2025-02-29', '2026-04-31', '10/11/2026', '2026-1-1']) assert.equal(receiptDateFromIso(value), '')
})

test('tanggal hari ini memakai kalender lokal pada kedua sisi pergantian tanggal UTC', () => {
  const moduleUrl = new URL('../src/utils/adminReceipt.js', import.meta.url).href
  for (const [timezone, instant, expected] of [['America/Los_Angeles', '2026-11-10T01:00:00Z', '09/11/2026'], ['Asia/Jakarta', '2026-11-10T23:30:00Z', '11/11/2026']]) {
    const script = `import { getLocalReceiptDate } from ${JSON.stringify(moduleUrl)}; process.stdout.write(getLocalReceiptDate(new Date(${JSON.stringify(instant)})))`
    assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ: timezone }, encoding: 'utf8' }), expected)
  }
})

test('route/menu kwitansi dan pratinjau awal eksplisit draft, tanpa nomor resmi atau unduhan kosong', async () => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom' })
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx')
    for (const path of ['/admin/kwitansi', '/admin/kwitansi/']) {
      const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
      assert.match(html, /<h1>Kwitansi<\/h1>/)
      assert.match(html, /aria-current="page"[^>]*href="\/admin\/kwitansi"/)
      assert.match(html, /Draft \/ Belum tersimpan ke server/)
      assert.match(html, /Belum diterbitkan/)
      assert.match(html, /disabled=""[^>]*aria-describedby="admin-receipt-download-note"/)
      assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form|<dialog/)
    }
    const { createReceiptPng } = await server.ssrLoadModule('/src/services/adminReceiptExportService.js')
    await assert.rejects(createReceiptPng({ sheet: null, date: valid.date }), /belum siap/)
  } finally { await server.close() }
})
