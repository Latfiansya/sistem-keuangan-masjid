import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

const createTestServer = (mode) => createServer({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom',
  define: { 'import.meta.env.VITE_DATA_SOURCE': JSON.stringify(mode) },
})
let server
let getAdminAccounts
let filterAdminAccounts
let App
before(async () => {
  server = await createTestServer('mock')
  ;({ getAdminAccounts, filterAdminAccounts } = await server.ssrLoadModule('/src/services/adminAccountsService.js'))
  ;({ default: App } = await server.ssrLoadModule('/src/App.jsx'))
})
after(async () => { await server?.close() })

test('empat akun contoh hanya data tampilan, terisolasi dari mutasi dan mendukung pembatalan', async () => {
  const accounts = await getAdminAccounts()
  assert.equal(accounts.length, 4)
  assert.equal(accounts.filter((account) => account.active).length, 3)
  assert.equal(accounts[3].name, 'Budi Santoso')
  for (const account of accounts) {
    assert.deepEqual(Object.keys(account).sort(), ['active', 'createdDate', 'email', 'id', 'initials', 'name', 'role'])
    assert.match(account.createdDate, /^2026-\d{2}-\d{2}$/)
  }
  accounts[0].name = 'Diubah lokal'
  accounts[0].active = false
  accounts.pop()
  const fresh = await getAdminAccounts()
  assert.equal(fresh.length, 4)
  assert.equal(fresh[0].name, 'Super Admin')
  assert.equal(fresh[0].active, true)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getAdminAccounts({ signal: controller.signal }), { name: 'AbortError' })
})

test('pencarian nama/email mengabaikan kapital dan spasi luar, tanpa memfilter role atau mengubah sumber', async () => {
  const accounts = await getAdminAccounts()
  const before = structuredClone(accounts)
  assert.equal(filterAdminAccounts(accounts, '  aHMaD  ')[0].name, 'Ahmad Fauzi')
  assert.equal(filterAdminAccounts(accounts, 'SITI@MASJID.ID')[0].name, 'Siti Rahmawati')
  assert.equal(filterAdminAccounts(accounts, 'budi@')[0].active, false)
  assert.equal(filterAdminAccounts(accounts, 'admin').length, 1)
  assert.equal(filterAdminAccounts(accounts, 'MASJID.ID').length, 4)
  assert.equal(filterAdminAccounts(accounts, '  ').length, 4)
  assert.deepEqual(filterAdminAccounts(accounts, 'tidak ada'), [])
  assert.deepEqual(filterAdminAccounts(accounts, '<script>'), [])
  assert.deepEqual(accounts, before)
})

test('mode API belum tersedia tanpa HTTP atau fallback akun contoh', async () => {
  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('HTTP tidak diharapkan.') }
  try {
    const service = await api.ssrLoadModule('/src/services/adminAccountsService.js')
    await assert.rejects(service.getAdminAccounts(), /Manajemen akun admin melalui API belum tersedia/)
    assert.equal(calls, 0)
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('route akun langsung/trailing slash memakai menu aktif dan label visual tanpa menghalangi route dengan role', () => {
  for (const path of ['/admin/kelola-akun', '/admin/kelola-akun/']) {
    const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(App)))
    assert.match(html, /<h1>Kelola Akun<\/h1>/)
    assert.match(html, /aria-current="page"[^>]*href="\/admin\/kelola-akun"/)
    assert.match(html, /Super Admin Only/)
    assert.match(html, /Memuat daftar akun contoh/)
    assert.match(html, /role="search"/)
    assert.doesNotMatch(html, /public-layout|public-footer|admin-login-form|type="password"|<dialog/)
  }
})
