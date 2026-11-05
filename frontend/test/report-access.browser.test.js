import assert from 'node:assert/strict'
import { test } from 'node:test'

const baseUrl = process.env.REPORT_BROWSER_QA_URL
const apiUrl = process.env.REPORT_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL

test('interaksi gate pada Chrome terpisah', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 30000,
}, async (t) => {
  const targets = await (await fetch(`${cdpUrl}/json`)).json()
  const target = targets.find((item) => item.type === 'page')
  assert.ok(target, 'Tab Chrome QA harus tersedia.')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  const pending = new Map()
  const failures = []
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      const request = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) request.reject(message.error)
      else request.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true })
    assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text)
    return result.result.value
  }
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (await evaluate(expression)) return
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    assert.fail(`Kondisi browser tidak tercapai: ${expression}`)
  }
  const openGate = async (origin = baseUrl) => {
    const url = `${origin}/laporan-keuangan?qa=${++sequence}`
    await send('Page.navigate', { url })
    await waitFor(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && !!document.querySelector('#report-password')`)
  }
  const fillPassword = async (value) => {
    await evaluate('document.querySelector("#report-password").focus(); document.querySelector("#report-password").select()')
    await send('Input.insertText', { text: value })
  }
  const submit = () => evaluate('document.querySelector(".report-access-form").requestSubmit()')

  try {
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
    await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })

    await t.test('akses langsung diawali gate tanpa Navbar/Footer', async () => {
      await openGate()
      assert.equal(await evaluate('document.querySelectorAll("nav, footer").length'), 0)
      assert.equal(await evaluate('document.querySelector("#report-password").type'), 'password')
    })
    await t.test('sandi kosong menampilkan pesan tanpa membuka laporan', async () => {
      await submit()
      await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Sandi wajib diisi")')
      assert.equal(await evaluate('!!document.querySelector(".report-placeholder")'), false)
    })
    await t.test('sandi salah menampilkan loading lalu error dan tetap pada gate', async () => {
      await fillPassword('salah')
      await submit()
      assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), true)
      assert.equal(await evaluate('document.querySelector("form").getAttribute("aria-busy")'), 'true')
      await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Sandi tidak cocok")')
      assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), false)
    })
    await t.test('submit berulang hanya memulai satu pemeriksaan', async () => {
      await evaluate(`(() => {
        const OriginalController = window.AbortController
        window.__qaChecks = 0
        window.AbortController = class extends OriginalController { constructor(...args) { super(...args); window.__qaChecks++ } }
        try { for (let i = 0; i < 8; i++) document.querySelector('form').requestSubmit() }
        finally { window.AbortController = OriginalController }
      })()`)
      assert.equal(await evaluate('window.__qaChecks'), 1)
      await waitFor('document.querySelector("form")?.getAttribute("aria-busy") === "true"')
      await waitFor('document.querySelector("button[type=submit]")?.disabled === false')
    })
    await t.test('Enter dengan sandi benar membuka placeholder dan membersihkan input', async () => {
      await fillPassword('demo123')
      assert.equal(await evaluate('document.querySelector("#report-password").value'), 'demo123')
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
      await waitFor('!!document.querySelector(".report-placeholder")')
      assert.equal(await evaluate('document.querySelectorAll("input[type=password]").length'), 0)
      assert.equal(await evaluate('document.activeElement.tagName'), 'H1')
    })
    await t.test('sandi/status tidak ditulis ke URL, storage atau cookie', async () => {
      assert.equal(await evaluate('localStorage.length + sessionStorage.length'), 0)
      assert.equal(await evaluate('document.cookie'), '')
      assert.equal(await evaluate('location.href.includes("demo123") || /password|valid|access=true/.test(location.search)'), false)
    })
    await t.test('refresh meminta sandi kembali dengan input kosong', async () => {
      await send('Page.reload', { ignoreCache: true })
      await waitFor('!!document.querySelector("#report-password")')
      assert.equal(await evaluate('document.querySelector("#report-password").value'), '')
      assert.equal(await evaluate('!!document.querySelector(".report-placeholder")'), false)
    })
    await t.test('mode API gagal dengan pesan integrasi dan dapat dicoba kembali', async () => {
      await openGate(apiUrl)
      await fillPassword('demo123')
      await submit()
      await waitFor('document.querySelector("[role=alert]")?.textContent.includes("API belum tersedia")')
      assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), false)
      assert.equal(await evaluate('!!document.querySelector(".report-placeholder")'), false)
    })
    await t.test('CTA Beranda dan tautan Footer seluruh halaman membuka gate', async () => {
      for (const route of ['/', '/agenda', '/profil', '/kontak']) {
        const url = `${baseUrl}${route}?qa=${++sequence}`
        await send('Page.navigate', { url })
        await waitFor(`location.href === ${JSON.stringify(url)} && !!document.querySelector('.public-footer a[href="/laporan-keuangan"]') && !document.querySelector('.content-status')`)
        if (route === '/') {
          await evaluate('document.querySelector(".finance-cta a").click()')
          await waitFor('!!document.querySelector("#report-password")')
          await send('Page.navigate', { url })
          await waitFor(`location.href === ${JSON.stringify(url)} && !!document.querySelector('.public-footer')`)
        }
        await evaluate(`document.querySelector('.public-footer a[href="/laporan-keuangan"]').click()`)
        await waitFor('location.pathname === "/laporan-keuangan" && !!document.querySelector("#report-password")')
      }
    })
    await t.test('navigasi keluar setelah akses berhasil mengembalikan gate saat dibuka lagi', async () => {
      await fillPassword('demo123')
      await submit()
      await waitFor('!!document.querySelector(".report-placeholder")')
      await evaluate('document.querySelector(".report-placeholder a").click()')
      await waitFor('location.pathname === "/" && !!document.querySelector(".hero")')
      await evaluate('document.querySelector(".finance-cta a").click()')
      await waitFor('!!document.querySelector("#report-password")')
    })
    assert.deepEqual(failures, [])
  } finally {
    ws.close()
  }
})
