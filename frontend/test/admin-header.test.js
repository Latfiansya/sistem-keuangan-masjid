import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

let server, service, Header
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', define: { 'import.meta.env.VITE_DATA_SOURCE': '"mock"' } })
  service = await server.ssrLoadModule('/src/services/adminActivityLogService.js')
  ;({ default: Header } = await server.ssrLoadModule('/src/components/AdminHeaderActions.jsx'))
})
after(async () => { await server?.close() })

test('header memakai maksimal lima aktivitas terbaru, tanggal/waktu menurun, tanpa mutasi atau rincian sensitif', async () => {
  const source = await service.getAdminActivityLog()
  const before = structuredClone(source)
  const latest = service.getAdminHeaderActivities(source)
  assert.equal(latest.length, 5)
  assert.deepEqual(latest.map((item) => item.id), ['demo-log-02', 'demo-log-01', 'demo-log-03', 'demo-log-04', 'demo-log-05'])
  assert.deepEqual(latest.map((item) => item.to), ['/admin/kelola-dana', '/admin/kelola-dana', '/admin/kelola-dana', '/admin/kelola-akun', '/admin/kelola-akun'])
  assert.ok(latest.every((item) => item.admin && item.title && item.time && item.module && !Object.hasOwn(item, 'details')))
  const sensitive = [{ id: 'test', admin: 'Contoh', date: '2026-06-10', time: '09:00', type: 'code', module: 'Pengaturan', title: 'mengubah kode gate laporan publik', details: [{ value: 'RAHASIA-UJI' }], token: 'TOKEN-UJI', password: 'PASSWORD-UJI' }]
  assert.doesNotMatch(JSON.stringify(service.getAdminHeaderActivities(sensitive)), /RAHASIA-UJI|TOKEN-UJI|PASSWORD-UJI/)
  assert.deepEqual(source, before)
  assert.deepEqual(service.getAdminHeaderActivities([]), [])
})

test('tautan transaksi memerlukan ID yang benar-benar aktif; kode tampilan atau ID hilang tidak dianggap ID transaksi', () => {
  const activity = { module: 'Keuangan', type: 'edit', title: 'mengubah transaksi', transactionId: 'id stabil/1' }
  assert.equal(service.getAdminActivityTarget(activity, [{ id: 'id stabil/1' }]), '/admin/laporan/transaksi/id%20stabil%2F1')
  assert.equal(service.getAdminActivityTarget(activity, []), '/admin/kelola-dana')
  assert.equal(service.getAdminActivityTarget({ ...activity, transactionId: undefined, details: [{ label: 'Kode transaksi', value: 'TRX-001' }] }), '/admin/kelola-dana')
})

test('modul kategori/akun/kode/profil/agenda/kontak/donasi memilih halaman yang tersedia dan lainnya fallback Activity Log', () => {
  for (const [module, title, type, path] of [
    ['Keuangan', 'mengubah kategori dana', 'edit', 'kategori-dana'],
    ['Akun', 'mengubah akun', 'account', 'kelola-akun'],
    ['Pengaturan', 'mengubah kode gate laporan publik', 'code', 'kode-akses-laporan'],
    ['Konten', 'memperbarui profil masjid', 'content', 'profil-masjid'],
    ['Konten', 'menambah agenda masjid', 'content', 'agenda'],
    ['Kontak', 'memperbarui alamat', 'content', 'kontak-pengaturan'],
    ['Konten', 'memperbarui pengaturan donasi', 'content', 'donasi'],
    ['Kontak', 'memperbarui pengaturan donasi', 'content', 'donasi'],
    ['Keuangan', 'mencatat donasi', 'add', 'kelola-dana'],
    ['Lainnya', 'aktivitas umum', 'other', 'activity-log'],
  ]) assert.equal(service.getAdminActivityTarget({ module, title, type }), `/admin/${path}`)
})

test('lonceng dapat diakses dan avatar hanya visual, tanpa dropdown profil atau sesi baru', () => {
  const html = renderToStaticMarkup(h(MemoryRouter, null, h(Header, { account: { name: 'Pengurus Masjid', initials: 'PM' }, dashboard: null })))
  assert.equal((html.match(/aria-expanded="false"/g) || []).length, 1)
  assert.match(html, /class="admin-header-avatar" aria-label="Profil akun pengurus"/)
  assert.equal((html.match(/<button\b/g) || []).length, 1)
  assert.match(html, /Buka notifikasi aktivitas terbaru/)
  assert.doesNotMatch(html, /contoh|simulasi|mock|aria-current|admin-header-account|admin-header-return|admin-header-dropdown|type="password"|token/i)
})
