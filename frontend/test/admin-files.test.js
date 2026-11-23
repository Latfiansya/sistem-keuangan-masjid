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
before(async () => { server = await createTestServer('mock') })
after(async () => { await server?.close() })

test('hanya path unggahan database yang dianggap gambar valid', async () => {
  const { resolveUploadedImage } = await server.ssrLoadModule('/src/utils/uploadedImage.js')
  const hash = 'a'.repeat(64)
  for (const target of ['masjid-photo', 'logo', 'qris']) {
    assert.equal(resolveUploadedImage(`/api/public/files/${target}/${hash}`), `/api/public/files/${target}/${hash}`)
  }
  for (const path of ['/images/qris-donasi.png', '/api/public/files/', '/api/public/files/12', `/api/public/files/avatar/${hash}`, '/api/public/files/qris/abc', `/api/public/files/qris/${'A'.repeat(64)}`, `/api/public/files/qris/${hash}/../x`, 'https://contoh.test/a.png', '', null, undefined, 12]) {
    assert.equal(resolveUploadedImage(path), null)
  }
})

test('validasi logo membatasi format JPG/PNG/WebP dan ukuran 2 MB', async () => {
  const { validateAdminProfileLogo, validateAdminProfilePhoto } = await server.ssrLoadModule('/src/services/adminProfileService.js')
  const png = (size) => new File([new Uint8Array(size)], 'logo.png', { type: 'image/png' })
  assert.equal(validateAdminProfileLogo([png(2 * 1024 * 1024)]), '')
  assert.match(validateAdminProfileLogo([png(2 * 1024 * 1024 + 1)]), /logo maksimal 2 MB/)
  assert.match(validateAdminProfileLogo([new File(['x'], 'logo.svg', { type: 'image/svg+xml' })]), /Format logo/)
  assert.match(validateAdminProfileLogo([]), /tepat satu logo/)
  assert.equal(validateAdminProfilePhoto([png(3 * 1024 * 1024)]), '')
})

test('mode mock menolak unggah ke server, mode API mengirim body biner ke /api/admin/files', async () => {
  const mockService = await server.ssrLoadModule('/src/services/adminFileService.js')
  await assert.rejects(mockService.uploadAdminFile('qris', new File(['x'], 'q.png', { type: 'image/png' })), /mode API/)

  const api = await createTestServer('api')
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    if (init.method === 'PUT' && init.headers['Content-Type'] === 'image/gif') {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Format berkas harus PNG, JPG, atau WebP.' } }), { status: 415 })
    }
    const data = init.method === 'PUT' ? { path: `/api/public/files/qris/${'b'.repeat(64)}`, mimeType: 'image/png', size: 3 } : { path: null }
    return new Response(JSON.stringify({ success: true, data }), { status: init.method === 'PUT' ? 201 : 200 })
  }
  try {
    const service = await api.ssrLoadModule('/src/services/adminFileService.js')
    const file = new File([new Uint8Array([1, 2, 3])], 'qris masjid.png', { type: 'image/png' })
    assert.deepEqual(await service.uploadAdminFile('qris', file), { path: `/api/public/files/qris/${'b'.repeat(64)}`, mimeType: 'image/png', size: 3 })
    assert.equal(calls[0].url, '/api/admin/files/qris')
    assert.equal(calls[0].init.method, 'PUT')
    assert.equal(calls[0].init.body, file)
    assert.equal(calls[0].init.headers['Content-Type'], 'image/png')
    assert.deepEqual(Object.keys(calls[0].init.headers), ['Content-Type'])
    assert.equal(calls[0].init.credentials, 'include')
    await service.removeAdminFile('logo')
    assert.deepEqual([calls[1].init.method, calls[1].url], ['DELETE', '/api/admin/files/logo'])
    await assert.rejects(service.uploadAdminFile('qris', new File(['x'], 'a.gif', { type: 'image/gif' })), /PNG, JPG, atau WebP/)
  } finally { globalThis.fetch = originalFetch; await api.close() }
})

test('Navbar dan Beranda memakai logo/foto unggahan, dan kembali ke aset bawaan tanpa unggahan', async () => {
  const { default: Navbar } = await server.ssrLoadModule('/src/components/Navbar.jsx')
  const router = (element) => renderToStaticMarkup(h(MemoryRouter, null, element))
  const logoSrc = `/api/public/files/logo/${'c'.repeat(64)}`
  assert.ok(router(h(Navbar, { logoSrc })).includes(`src="${logoSrc}"`))
  assert.match(router(h(Navbar)), /src="\/assets\/masjid-logo\.webp"/)

  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  const html = renderToStaticMarkup(h(MemoryRouter, { initialEntries: ['/'] }, h(App)))
  assert.match(html, /src="\/assets\/masjid-logo\.webp"/)
  assert.doesNotMatch(html, /--public-scene-image/)
})

test('hash foto bawaan sesuai aset dan overlay hero tetap tampil untuk salinan foto bawaan di database', async () => {
  const { createHash } = await import('node:crypto')
  const { readFile } = await import('node:fs/promises')
  const { DEFAULT_MASJID_PHOTO_SHA256S, isDefaultMasjidPhoto } = await server.ssrLoadModule('/src/utils/uploadedImage.js')
  const asset = await readFile(fileURLToPath(new URL('../public/assets/masjid-background.webp', import.meta.url)))
  const [assetHash, originalPngHash] = DEFAULT_MASJID_PHOTO_SHA256S
  assert.equal(createHash('sha256').update(asset).digest('hex'), assetHash)
  assert.equal(isDefaultMasjidPhoto({ photoPath: null }), true)
  assert.equal(isDefaultMasjidPhoto({ photoPath: '/images/Background Pict.png' }), true)
  const photoPath = (hash) => `/api/public/files/masjid-photo/${hash}`
  assert.equal(isDefaultMasjidPhoto({ photoPath: photoPath(assetHash), photoSha256: assetHash }), true)
  assert.equal(isDefaultMasjidPhoto({ photoPath: photoPath(originalPngHash), photoSha256: originalPngHash }), true)
  assert.equal(isDefaultMasjidPhoto({ photoPath: photoPath('f'.repeat(64)), photoSha256: 'f'.repeat(64) }), false)
  assert.equal(isDefaultMasjidPhoto({ photoPath: photoPath('f'.repeat(64)) }), false)
})
