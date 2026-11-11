import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL

test('interaksi dan responsive Login Pengurus pada Chrome terpisah', {
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
  const output = fileURLToPath(new URL('../../tmp/admin11-qa/', import.meta.url))
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
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type)) requests.push(message.params.request)
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
  const openLogin = async (origin = baseUrl) => {
    await send('Page.navigate', { url: `${origin}/admin/login` })
    await waitFor(`location.pathname === '/admin/login' && !!document.querySelector('.admin-login-form') && document.readyState === 'complete'`)
    await evaluate('document.fonts.ready')
  }
  const fill = async (selector, value) => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus(); document.querySelector(${JSON.stringify(selector)}).select()`)
    await send('Input.insertText', { text: value })
  }
  const submit = () => evaluate('document.querySelector(".admin-login-form").requestSubmit()')
  const click = async (selector) => {
    const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2} })()`)
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 })
  }
  const screenshot = async (name) => {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    await writeFile(`${output}${name}.png`, Buffer.from(result.data, 'base64'))
  }

  try {
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Network.enable')
    await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })

    await t.test('desktop, tablet, mobile dan layar pendek tanpa overflow atau elemen terpotong', async () => {
      for (const [width, height] of [[1728, 1000], [1366, 768], [1024, 768], [768, 1024], [390, 844], [360, 800], [390, 360]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await openLogin()
        const metrics = await evaluate(`(() => {
          const form = document.querySelector('.admin-login-card')
          const elements = [...document.querySelectorAll('.admin-login img, .admin-login h1, .admin-login h2, .admin-login p, .admin-login input, .admin-login button')]
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            visible: elements.every(e => { const r=e.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= document.documentElement.scrollHeight }),
            clipped: elements.some(e => e.scrollWidth > e.clientWidth + 1),
            image: document.querySelector('.admin-login-logo').naturalWidth > 0,
            font: [...document.fonts].some(f => f.family.includes('Plus Jakarta Sans') && f.status === 'loaded'),
            columns: getComputedStyle(document.querySelector('.admin-login')).gridTemplateColumns.split(' ').length,
            inputsEmpty: [...document.querySelectorAll('input')].every(e => e.value === ''),
            passwordType: document.querySelector('#admin-password').type,
            publicLayout: !!document.querySelector('nav, .public-footer'),
            cardWidth: form.getBoundingClientRect().width
          }
        })()`)
        assert.equal(metrics.overflow, false, `${width}: overflow`)
        assert.equal(metrics.visible, true, `${width}: elemen di luar halaman`)
        assert.equal(metrics.clipped, false, `${width}: elemen terpotong`)
        assert.equal(metrics.image && metrics.font && metrics.inputsEmpty, true)
        assert.equal(metrics.passwordType, 'password')
        assert.equal(metrics.publicLayout, false)
        assert.equal(metrics.columns, width >= 1024 ? 2 : 1)
        await screenshot(`login-${width}-${height}`)
      }
      await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
    })

    await t.test('toggle mouse/keyboard mempertahankan password, validasi dan geometri input di desktop/tablet/mobile', async () => {
      for (const [width, height] of [[1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await openLogin()
        await submit()
        const before = await evaluate('(() => { const input=document.querySelector("#admin-password"), r=input.getBoundingClientRect(); return {width:r.width,height:r.height,borderWidth:getComputedStyle(input).borderWidth,borderStyle:getComputedStyle(input).borderStyle,radius:getComputedStyle(input).borderRadius,error:document.querySelector("#admin-password-error").textContent} })()')
        await click('.admin-login-password-toggle')
        assert.equal(await evaluate('document.querySelector("#admin-password").type'), 'text')
        assert.equal(await evaluate('document.querySelector(".admin-login-password-toggle").getAttribute("aria-label")'), 'Sembunyikan password')
        assert.equal(await evaluate('document.querySelector("#admin-password-error").textContent'), before.error)
        assert.equal(await evaluate('document.querySelector("#admin-password").getAttribute("aria-invalid")'), 'true')
        assert.notEqual(await evaluate('getComputedStyle(document.querySelector(".admin-login-password-toggle")).backgroundColor'), 'rgba(0, 0, 0, 0)')
        await fill('#admin-password', 'spasi & karakter khusus tetap')
        await evaluate('document.querySelector(".admin-login-password-toggle").focus()')
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
        assert.equal(await evaluate('document.querySelector("#admin-password").type'), 'password')
        assert.equal(await evaluate('document.querySelector("#admin-password").value'), 'spasi & karakter khusus tetap')
        assert.equal(await evaluate('document.querySelector(".admin-login-password-toggle").getAttribute("aria-label")'), 'Tampilkan password')
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-login-password-toggle")).outlineStyle'), 'solid')
        assert.equal(await evaluate('document.querySelector(".admin-login-form").getAttribute("aria-busy")'), 'false')
        assert.equal(await evaluate('document.querySelector("#admin-email-error").textContent'), 'Email wajib diisi.')
        await click('.admin-login-password-toggle')
        assert.equal(await evaluate('document.querySelector("#admin-password").type'), 'text')
        assert.equal(await evaluate('document.querySelector("#admin-password").value'), 'spasi & karakter khusus tetap')
        await click('.admin-login-password-toggle')
        assert.equal(await evaluate('document.querySelector("#admin-password").type'), 'password')
        const after = await evaluate('(() => { const input=document.querySelector("#admin-password"), r=input.getBoundingClientRect(); return {width:r.width,height:r.height,borderWidth:getComputedStyle(input).borderWidth,borderStyle:getComputedStyle(input).borderStyle,radius:getComputedStyle(input).borderRadius} })()')
        const { error: _error, ...geometry } = before
        assert.deepEqual(after, geometry)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        await screenshot(`login-password-toggle-${width}`)
      }
      await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
    })

    await t.test('field wajib dan format email menampilkan error serta memfokuskan input', async () => {
      await openLogin()
      await submit()
      assert.match(await evaluate('document.body.innerText'), /Email wajib diisi/)
      assert.match(await evaluate('document.body.innerText'), /Password wajib diisi/)
      assert.equal(await evaluate('document.activeElement.id'), 'admin-email')
      await fill('#admin-email', 'bukan-email')
      await fill('#admin-password', 'data-uji-sementara')
      await submit()
      assert.equal(await evaluate('document.querySelector("#admin-email").getAttribute("aria-invalid")'), 'true')
      assert.match(await evaluate('document.body.innerText'), /alamat email yang valid/)
      await screenshot('login-validasi')
    })

    await t.test('Enter memulai loading, submit ganda ditahan dan kegagalan tidak memberi akses', async () => {
      await fill('#admin-email', 'pengurus@contoh.test')
      await fill('#admin-password', 'data-uji-sementara')
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
      await waitFor('document.querySelector(".admin-login-form").getAttribute("aria-busy") === "true"')
      assert.equal(await evaluate('[...document.querySelectorAll(".admin-login input, .admin-login button")].every(e => e.disabled)'), true)
      await evaluate('window.loginFinished = 0; new MutationObserver(() => { if (document.querySelector(".admin-login-form").getAttribute("aria-busy") === "false") window.loginFinished++ }).observe(document.querySelector(".admin-login-form"), {attributes:true,attributeFilter:["aria-busy"]}); for(let i=0;i<4;i++) document.querySelector("form").dispatchEvent(new Event("submit", {bubbles:true,cancelable:true}))')
      await screenshot('login-loading')
      await waitFor('!!document.querySelector(".admin-login-submit-error")')
      assert.match(await evaluate('document.body.innerText'), /Login pengurus belum tersedia/)
      assert.equal(await evaluate('window.loginFinished'), 1)
      assert.equal(await evaluate('document.querySelector("#admin-password").value'), '')
      assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), false)
      assert.equal(await evaluate('location.pathname'), '/admin/login')
      assert.deepEqual(await evaluate('({local: localStorage.length, session: sessionStorage.length, cookie: document.cookie})'), { local: 0, session: 0, cookie: '' })
      await screenshot('login-error')
      await fill('#admin-password', 'data-uji-sementara')
      const point = await evaluate('(() => { const button=document.querySelector("button[type=submit]"); button.scrollIntoView({block:"center"}); const r=button.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2} })()')
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 })
      await waitFor('document.querySelector(".admin-login-form").getAttribute("aria-busy") === "true"')
      await waitFor('!!document.querySelector(".admin-login-submit-error")')
      assert.equal(await evaluate('document.querySelector("#admin-password").value'), '')
      await send('Page.reload')
      await waitFor('!!document.querySelector("#admin-email") && document.querySelector("#admin-email").value === ""')
      assert.equal(await evaluate('document.querySelector("#admin-password").value'), '')
    })

    await t.test('tautan Footer tetap membuka login dari halaman publik tanpa reload dokumen', async () => {
      for (const [width, height] of [[1366, 768], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        for (const route of ['/', '/agenda', '/profil', '/kontak', '/tidak-ada']) {
          await send('Page.navigate', { url: `${baseUrl}${route}` })
          await waitFor(`document.readyState === 'complete' && !!document.querySelector('.public-footer a[href="/admin/login"]')`)
          await evaluate('window.adminLoginNavigation = true')
          await click('.public-footer a[href="/admin/login"]')
          await waitFor('location.pathname === "/admin/login" && !!document.querySelector(".admin-login-form")')
          assert.equal(await evaluate('window.adminLoginNavigation'), true)
          assert.equal(await evaluate('document.querySelector("#admin-password").type'), 'password')
        }
      }
    })

    await t.test('mode API tidak mengirim kredensial ke endpoint yang belum disepakati', async () => {
      await openLogin(apiUrl)
      await fill('#admin-email', 'pengurus@contoh.test')
      await fill('#admin-password', 'data-uji-sementara')
      await submit()
      await waitFor('!!document.querySelector(".admin-login-submit-error")')
      assert.match(await evaluate('document.body.innerText'), /Login pengurus belum tersedia/)
      assert.equal(await evaluate('location.pathname'), '/admin/login')
      assert.equal(requests.length, 0)
      assert.deepEqual(failures, [])
    })
  } finally {
    ws.close()
    await fetch(`${cdpUrl}/json/close/${target.id}`)
  }
})
