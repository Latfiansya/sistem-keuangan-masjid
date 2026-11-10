import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL
const phase = process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'

test('Dashboard Keuangan responsive, navigasi dan mock tanpa autentikasi pada Chrome QA', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 30000,
}, async (t) => {
  const target = await (await fetch(`${cdpUrl}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  const pending = new Map()
  const failures = []
  const requests = []
  const metrics = []
  const output = fileURLToPath(new URL(`../../tmp/admin12-qa/${phase}/`, import.meta.url))
  await mkdir(output, { recursive: true })
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      const request = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) request.reject(message.error)
      else request.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push(message.params.response.url)
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type)) requests.push(message.params.request.url)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
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
  const open = async (origin = baseUrl, suffix = '') => {
    await send('Page.navigate', { url: `${origin}/admin/dashboard${suffix}` })
    await waitFor('document.readyState === "complete" && !!document.querySelector(".admin-dashboard")')
    await evaluate('document.fonts.ready')
  }
  const click = async (selector) => {
    const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2} })()`)
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 })
  }
  const screenshot = async (name, full = false) => {
    const size = await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})')
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(full ? { clip: { x: 0, y: 0, ...size, scale: 1 } } : {}) })
    await writeFile(`${output}${name}.png`, Buffer.from(result.data, 'base64'))
  }
  try {
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Network.enable')
    await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })

    await t.test('empat viewport menampilkan angka lengkap, aset, tabel dan menu aktif tanpa overflow halaman', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        const result = await evaluate(`(() => {
          const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
          return {
            viewport:[innerWidth,innerHeight], overflow:document.documentElement.scrollWidth>innerWidth,
            amounts:[...document.querySelectorAll('.admin-statistic > p')].map(e=>e.textContent),
            amountsFit:[...document.querySelectorAll('.admin-statistic > p')].every(e=>e.scrollWidth<=e.clientWidth),
            columns:getComputedStyle(document.querySelector('.admin-statistics')).gridTemplateColumns.split(' ').length,
            active:document.querySelector('.admin-nav-link').getAttribute('aria-current'),
            sidebar:getComputedStyle(document.querySelector('.admin-sidebar')).display,
            categories:document.querySelectorAll('.admin-balance-table tbody tr').length,
            transactions:document.querySelectorAll('.admin-recent-table tbody tr').length,
            finalTotal:document.querySelector('.admin-balance-table tfoot td:last-child').textContent,
            images:[...document.images].every(e=>e.complete&&e.naturalWidth>0),
            font:[...document.fonts].some(f=>f.family.includes('Plus Jakarta Sans')&&f.status==='loaded'),
            publicLayout:!!document.querySelector('.public-layout,.admin-login-form'),
            boxes:Object.fromEntries(['.admin-topbar','.admin-dashboard-hero','.admin-statistics','.admin-balance','.admin-transparency','.admin-recent','.admin-shortcuts'].map(s=>[s,box(document.querySelector(s))]))
          }
        })()`)
        metrics.push(result)
        assert.equal(result.overflow, false, `${width}: overflow halaman`)
        assert.equal(result.amountsFit, true, `${width}: nominal terpotong`)
        assert.deepEqual(result.amounts, ['Rp 16.864.200', 'Rp 1.791.500', 'Rp 1.427.500', 'Rp 17.228.200'])
        assert.equal(result.columns, width >= 1024 ? 4 : width >= 480 ? 2 : 1)
        assert.equal(result.active, 'page')
        assert.equal(result.sidebar === 'none', width < 1024)
        assert.equal(result.categories, 3)
        assert.equal(result.transactions, 5)
        assert.equal(result.finalTotal, '17.228.200')
        assert.equal(result.images && result.font, true)
        assert.equal(result.publicLayout, false)
        await screenshot(`dashboard-${width}-top`)
        await screenshot(`dashboard-${width}-full`, true)
      }
      await writeFile(`${output}metrics.json`, JSON.stringify(metrics, null, 2))
    })

    await t.test('menu tablet/mobile dapat dibuka, memilih dashboard dan ditutup lewat Escape/backdrop', async () => {
      for (const [width, height] of [[768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await click('.admin-menu-toggle')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'true')
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-sidebar")).display'), 'flex')
        assert.equal(await evaluate('document.activeElement.classList.contains("admin-nav-link")'), true)
        await screenshot(`dashboard-${width}-menu`)
        await click('.admin-nav-link')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'false')
        await click('.admin-menu-toggle')
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
        assert.equal(await evaluate('document.activeElement.className'), 'admin-menu-toggle')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'false')
        await click('.admin-menu-toggle')
        await evaluate('document.querySelector(".admin-sidebar-backdrop").click()')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'false')
      }
    })

    await t.test('tabel mobile dapat digeser lokal dengan keyboard dan menampilkan kolom terakhir', async () => {
      for (const selector of ['.admin-balance .admin-table-scroll', '.admin-recent .admin-table-scroll']) {
        await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'}); document.querySelector(${JSON.stringify(selector)}).focus()`)
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
        await waitFor(`document.querySelector(${JSON.stringify(selector)}).scrollLeft > 0`)
        await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollLeft=9999`)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
      }
      await screenshot('dashboard-mobile-tabel')
    })

    await t.test('fitur di luar lingkup nonaktif, akun contoh tidak menjadi autentikasi dan refresh tetap membuka dashboard', async () => {
      assert.equal(await evaluate('[...document.querySelectorAll(".admin-dashboard button, .admin-nav-group button, .admin-account button, .admin-topbar-actions button")].every(e=>e.disabled&&!!e.title)'), true)
      assert.match(await evaluate('document.querySelector(".admin-dashboard-status").textContent'), /Data contoh/)
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-shell a[href]")].map(e=>e.getAttribute("href"))'), ['#admin-content', '/admin/dashboard'])
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      await send('Page.reload')
      await waitFor('!!document.querySelector(".admin-dashboard")')
      await open(baseUrl, '/')
      assert.equal(await evaluate('document.querySelector(".admin-nav-link").getAttribute("aria-current")'), 'page')
    })

    await t.test('mode API tidak memakai mock diam-diam atau menghubungi endpoint admin karangan', async () => {
      await send('Page.navigate', { url: `${apiUrl}/admin/dashboard` })
      await waitFor('!!document.querySelector(".admin-dashboard-state[role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-dashboard-state").textContent'), /Dashboard admin melalui API belum tersedia/)
      assert.equal(await evaluate('document.querySelectorAll(".admin-statistic").length'), 0)
      assert.deepEqual(requests, [])
      assert.deepEqual(failures, [])
    })
  } finally {
    ws.close()
    await fetch(`${cdpUrl}/json/close/${target.id}`)
  }
})
