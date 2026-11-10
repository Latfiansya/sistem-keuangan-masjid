import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL
const phase = process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'

test('Kwitansi lokal, modal, PNG nyata dan toast pada Chrome QA', {
  skip: !baseUrl || !cdpUrl ? 'Jalankan frontend dan Chrome QA sesuai README.' : false,
  timeout: 60000,
}, async (t) => {
  const output = fileURLToPath(new URL(`../../tmp/admin111-qa/${phase}/`, import.meta.url))
  await mkdir(`${output}downloads`, { recursive: true })
  const target = await (await fetch(`${cdpUrl}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map()
  const failures = []
  const requests = []
  const downloads = []
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
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type) && message.params.request.url.startsWith('http') && !message.params.request.url.includes('/assets/')) requests.push(message.params.request.url)
    if (message.method === 'Browser.downloadWillBegin') downloads.push(message.params)
    if (message.method === 'Browser.downloadProgress') {
      const file = downloads.find((item) => item.guid === message.params.guid)
      if (file) Object.assign(file, message.params)
    }
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text)
    return result.result.value
  }
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 20)) }
    assert.fail(`Kondisi browser tidak tercapai: ${expression}`)
  }
  const click = async (selector) => {
    const point = await evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`)
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 })
  }
  const key = async (value, code, extra = {}) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: value, code: value, windowsVirtualKeyCode: code, ...(type === 'keyDown' && value === 'Enter' ? { text: '\r' } : {}), ...extra }) }
  const fill = async (name, value) => {
    await evaluate(`document.querySelector('#admin-receipt-${name}').focus();document.querySelector('#admin-receipt-${name}').select()`)
    await send('Input.insertText', { text: value })
  }
  const method = async (value) => evaluate(`(() => {const e=document.querySelector('#admin-receipt-method');Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  const setDate = async (value) => evaluate(`(() => {const e=document.querySelector('#admin-receipt-date');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  const save = () => click('.admin-receipt-confirm')
  const open = async () => {
    await send('Page.navigate', { url: `${baseUrl}/admin/kwitansi` })
    await waitFor('document.readyState === "complete" && !!document.querySelector(".admin-receipt-create")')
    await evaluate('document.fonts.ready')
  }
  const screenshot = async (name, full = false) => {
    const size = await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})')
    const png = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(full ? { clip: { x: 0, y: 0, ...size, scale: 1 } } : {}) })
    await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64'))
  }
  const readDownload = async (index) => {
    for (let attempt = 0; attempt < 300; attempt++) {
      const file = downloads[index]
      if (file?.state === 'completed') return { ...file, bytes: await readFile(`${output}downloads/${file.guid}`) }
      assert.notEqual(file?.state, 'canceled')
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    assert.fail('Unduhan PNG tidak selesai.')
  }
  const noOverflow = async () => {
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
    assert.equal(await evaluate('[...document.querySelectorAll(".admin-receipt > .admin-receipt-document,.admin-receipt-dialog[open],.admin-receipt-toast")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth})'), true)
  }
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
    await send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: `${output}downloads`, eventsEnabled: true })
    await t.test('empat viewport: navigasi, modal native/keyboard, lima field, validasi, batal dan preview lokal', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await send('Page.navigate', { url: `${baseUrl}/admin/kategori-dana` })
        await waitFor('!!document.querySelector(".admin-categories-add")')
        const referenceButton = await evaluate('(()=>{const s=getComputedStyle(document.querySelector(".admin-categories-add"));return [s.height,s.fontSize,s.padding,s.borderRadius,s.lineHeight,s.gap]})()')
        await open()
        assert.deepEqual(await evaluate('(()=>{const s=getComputedStyle(document.querySelector(".admin-receipt-create"));return [s.height,s.fontSize,s.padding,s.borderRadius,s.lineHeight,s.gap]})()'), referenceButton)
        assert.deepEqual(await evaluate('(()=>{const s=getComputedStyle(document.querySelector(".admin-receipt-download"));return [s.fontSize,s.padding,s.minHeight]})()'), [width < 480 ? '16px' : '20px', '14px 32px', width < 480 ? '48px' : '52px'])
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kwitansi')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/kwitansi')
        assert.equal(await evaluate('document.querySelector(".admin-receipt-download").disabled'), true)
        await screenshot(`kwitansi-${width}-awal`, true)
        await click('.admin-receipt-create')
        assert.equal(await evaluate('document.querySelector("dialog").matches(":modal")'), true)
        assert.equal(await evaluate('document.activeElement.id'), 'admin-receipt-payer')
        assert.equal(await evaluate('document.querySelector("#admin-receipt-date").type'), 'date')
        assert.equal(await evaluate('(()=>{const d=new Date(),p=n=>String(n).padStart(2,"0");return document.querySelector("#admin-receipt-date").value===`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`})()'), true)
        assert.equal(await evaluate('document.querySelector("#admin-receipt-date").min+document.querySelector("#admin-receipt-date").max'), '')
        await screenshot(`kwitansi-${width}-modal`)
        await setDate('')
        await save()
        assert.equal(await evaluate('document.querySelectorAll(".admin-receipt-error").length'), 5)
        assert.equal(await evaluate('document.activeElement.id'), 'admin-receipt-payer')
        for (let i = 0; i < 10; i++) { await key('Tab', 9); assert.equal(await evaluate('!!document.activeElement.closest("dialog")'), true) }
        await fill('payer', ' Hamba Allah ')
        await fill('amount', '0')
        await fill('purpose', 'Donasi pembangunan masjid')
        await method('Transfer Bank')
        await setDate('2026-02-31')
        await save()
        assert.equal(await evaluate('document.querySelectorAll(".admin-receipt-error").length'), 2)
        await fill('amount', '1250000')
        await setDate('2026-11-10')
        if (width === 390) { await evaluate('document.querySelector("#admin-receipt-payer").focus()'); await key('Enter', 13) }
        else await save()
        await waitFor('!document.querySelector("dialog")')
        assert.equal(await evaluate('document.activeElement.className'), 'admin-receipt-create')
        const text = await evaluate('document.querySelector(".admin-receipt > .admin-receipt-document").textContent')
        assert.match(text, /Hamba Allah.*Rp 1.250.000.*Donasi pembangunan masjid.*Transfer Bank/)
        assert.match(text, /Satu juta dua ratus lima puluh ribu rupiah/)
        assert.match(text, /Draft \/ Belum tersimpan ke server/)
        assert.match(text, /10\/11\/2026/)
        await noOverflow()
        await evaluate('window.scrollTo(0,0)')
        await screenshot(`kwitansi-${width}-isi`, true)
        for (const close of ['escape', 'cancel', 'x']) {
          await click('.admin-receipt-create')
          assert.equal(await evaluate('document.querySelector("#admin-receipt-date").value'), '2026-11-10')
          await setDate('2020-01-01')
          await fill('payer', 'Perubahan dibatalkan')
          if (close === 'escape') await key('Escape', 27)
          else await click(close === 'cancel' ? '.admin-receipt-dialog footer button[type=button]' : '.admin-receipt-dialog header button')
          await waitFor('!document.querySelector("dialog")')
          assert.equal(await evaluate('document.querySelector(".admin-receipt > article").textContent'), text)
          assert.equal(await evaluate('document.body.style.overflow'), '')
        }
      }
    })
    await t.test('PNG 2× dapat dibuka, hanya kwitansi, sukses setelah trigger dan toast hilang sekitar tiga detik', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await evaluate(`window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...args){originalToBlob.call(this,blob=>{window.resumeReceipt=()=>callback(blob)},...args)};window.originalAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.receiptDownloadUrl=this.href;return originalAnchorClick.call(this)}`)
        const index = downloads.length
        await click('.admin-receipt-download')
        await waitFor('typeof window.resumeReceipt === "function"')
        assert.equal(await evaluate('!!document.querySelector(".admin-receipt-toast")'), false)
        assert.equal(await evaluate('document.querySelector(".admin-receipt-download").disabled'), true)
        assert.equal(downloads.length, index)
        await evaluate('window.resumeReceipt();delete window.resumeReceipt;HTMLCanvasElement.prototype.toBlob=originalToBlob')
        await waitFor('!!document.querySelector(".admin-receipt-toast--success")')
        await evaluate('HTMLAnchorElement.prototype.click=originalAnchorClick')
        const toastStart = Date.now()
        assert.equal(await evaluate('document.querySelector(".admin-receipt-toast").textContent'), 'Kwitansi berhasil diunduh')
        assert.equal(await evaluate('document.querySelector(".admin-receipt-toast").getAttribute("role")'), 'status')
        const file = await readDownload(index)
        assert.equal(file.suggestedFilename, 'draft-kwitansi-masjid-al-hidayah-2026-11-10.png')
        assert.equal(file.bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
        assert.equal(file.bytes.readUInt32BE(16), 2240)
        assert.ok(file.bytes.readUInt32BE(20) >= 900)
        await writeFile(`${output}draft-${width}.png`, file.bytes)
        assert.equal(await evaluate('(async()=>{const image=await createImageBitmap(await(await fetch(receiptDownloadUrl)).blob());const valid=image.width===2240&&image.height>=900;image.close();return valid})()'), true)
        await noOverflow()
        assert.equal(await evaluate('(()=>{const t=document.querySelector(".admin-receipt-toast").getBoundingClientRect(),b=document.querySelector(".admin-receipt-download").getBoundingClientRect();return b.bottom<=t.top||b.top>=t.bottom})()'), true)
        await screenshot(`kwitansi-${width}-toast`)
        await waitFor('!document.querySelector(".admin-receipt-toast")')
        const duration = Date.now() - toastStart
        assert.ok(duration >= 2700 && duration < 4500, `Toast: ${duration}ms`)
      }
    })
    await t.test('gagal render dan gagal memicu unduhan menghasilkan error, tanpa sukses atau berkas tambahan', async () => {
      for (const mode of ['render', 'download']) {
        const index = downloads.length
        if (mode === 'render') await evaluate('window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback){callback(null)}')
        else await evaluate('window.originalAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){throw new Error("Unduhan diblokir untuk QA") }')
        await click('.admin-receipt-download')
        await waitFor('!!document.querySelector(".admin-receipt-toast--error")')
        assert.match(await evaluate('document.querySelector(".admin-receipt-toast").textContent'), /Kwitansi gagal diunduh/)
        assert.equal(await evaluate('!!document.querySelector(".admin-receipt-toast--success")'), false)
        assert.equal(await evaluate('document.querySelector(".admin-receipt-download").disabled'), false)
        assert.equal(downloads.length, index)
        await screenshot(`kwitansi-error-${mode}`)
        await evaluate('HTMLCanvasElement.prototype.toBlob=originalToBlob;HTMLAnchorElement.prototype.click=originalAnchorClick')
        await waitFor('!document.querySelector(".admin-receipt-toast")')
      }
    })
    await t.test('teks panjang tercakup PNG, refresh/navigasi mereset draft tanpa transaksi atau log baru', async () => {
      await click('.admin-receipt-create')
      await fill('payer', 'Nama Panjang '.repeat(8))
      await fill('purpose', 'Pembayaran kegiatan dan pemeliharaan masjid. '.repeat(11))
      await fill('amount', '999999999999')
      await method('QRIS')
      await save()
      await noOverflow()
      assert.equal(await evaluate('document.querySelector(".admin-receipt-export article").scrollHeight===document.querySelector(".admin-receipt-export article").clientHeight'), true)
      const index = downloads.length
      await click('.admin-receipt-download')
      await waitFor('!!document.querySelector(".admin-receipt-toast--success")')
      const file = await readDownload(index)
      await writeFile(`${output}draft-teks-panjang.png`, file.bytes)
      assert.ok(file.bytes.readUInt32BE(20) > 1000)
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      if (await evaluate('innerWidth<1024')) await click('.admin-menu-toggle')
      await click('.admin-nav-link[href="/admin/activity-log"]')
      await waitFor('document.querySelectorAll(".admin-activity-card").length===9')
      if (await evaluate('innerWidth<1024')) await click('.admin-menu-toggle')
      await click('.admin-nav-link[href="/admin/kwitansi"]')
      await waitFor('!!document.querySelector(".admin-receipt-download")')
      assert.equal(await evaluate('document.querySelector(".admin-receipt-download").disabled'), true)
      await send('Page.navigate', { url: `${baseUrl}/admin/kwitansi/` })
      await waitFor('document.readyState==="complete" && !!document.querySelector(".admin-receipt-download")')
      assert.equal(await evaluate('document.querySelector(".admin-receipt-download").disabled'), true)
      assert.deepEqual(requests, [])
      assert.deepEqual(failures, [])
    })
    await t.test('default tanggal lokal berbeda dari UTC, tanggal lampau tersimpan dan pembukaan ulang mempertahankan draft', async () => {
      await send('Emulation.setTimezoneOverride', { timezoneId: 'America/Los_Angeles' })
      const { identifier } = await send('Page.addScriptToEvaluateOnNewDocument', { source: `const ReceiptNativeDate=Date;window.Date=class extends ReceiptNativeDate {constructor(...args){super(...(args.length?args:[Date.parse('2026-11-10T01:00:00Z')]))}static now(){return ReceiptNativeDate.parse('2026-11-10T01:00:00Z')}}` })
      try {
        await open()
        await click('.admin-receipt-create')
        assert.equal(await evaluate('document.querySelector("#admin-receipt-date").value'), '2026-11-09')
        await fill('payer', 'Contoh tanggal lampau')
        await fill('amount', '1000')
        await fill('purpose', 'Review tanggal kabisat')
        await method('Tunai')
        await setDate('2024-02-29')
        await save()
        await waitFor('!document.querySelector("dialog")')
        assert.match(await evaluate('document.querySelector(".admin-receipt > article").textContent'), /29\/02\/2024/)
        await click('.admin-receipt-create')
        assert.equal(await evaluate('document.querySelector("#admin-receipt-date").value'), '2024-02-29')
        await setDate('2020-01-01')
        await key('Escape', 27)
        await click('.admin-receipt-create')
        assert.equal(await evaluate('document.querySelector("#admin-receipt-date").value'), '2024-02-29')
        await key('Escape', 27)
        await open()
        await click('.admin-receipt-create')
        assert.equal(await evaluate('document.querySelector("#admin-receipt-date").value'), '2026-11-09')
        await key('Escape', 27)
      } finally {
        await send('Page.removeScriptToEvaluateOnNewDocument', { identifier })
        await send('Emulation.setTimezoneOverride', { timezoneId: '' })
      }
    })
  } finally {
    await send('Browser.setDownloadBehavior', { behavior: 'default' })
    ws.close()
    await fetch(`${cdpUrl}/json/close/${target.id}`)
  }
})
