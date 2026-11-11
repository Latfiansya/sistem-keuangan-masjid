import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { adminCategoryColors, adminCategoryColorStyle } from '../src/utils/adminCategoryColors.js'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL
const phase = process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'

test('Kategori Dana: modal, validasi, relasi transaksi dan warna bersama pada Chrome QA', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 60000,
}, async (t) => {
  const output = fileURLToPath(new URL(`../../tmp/admin113-qa/${phase}/`, import.meta.url))
  await mkdir(output, { recursive: true })
  const target = await (await fetch(`${cdpUrl}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map(), failures = [], requests = []
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result) }
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push(message.params.response.url)
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type) && message.params.request.url.startsWith('http') && !message.params.request.url.includes('/assets/')) requests.push(message.params.request.url)
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
    const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`)
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 })
  }
  const key = async (value, code, modifiers = 0) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: value, code: value, windowsVirtualKeyCode: code, modifiers, ...(type === 'keyDown' && value === 'Enter' ? { text: '\r' } : {}) }) }
  const fillName = async (name) => { await evaluate('document.querySelector("#admin-category-name").focus();document.querySelector("#admin-category-name").select()'); await send('Input.insertText', { text: name }) }
  const open = async (route = 'kategori-dana', origin = baseUrl) => { await send('Page.navigate', { url: `${origin}/admin/${route}` }); await waitFor('document.readyState==="complete" && !!document.querySelector(".admin-shell")'); await waitFor(origin === baseUrl ? '!!document.querySelector(".admin-balance-table")' : '!!document.querySelector(".admin-dashboard-state[role=alert]")'); await evaluate('document.fonts.ready') }
  const navigate = async (route) => { if (await evaluate('innerWidth<1024')) await click('.admin-menu-toggle'); await click(`.admin-nav-link[href="/admin/${route}"]`); await waitFor(route === 'laporan' ? '!!document.querySelector(".admin-report-tabs")' : route === 'kategori-dana' ? '!!document.querySelector(".admin-categories-table")' : route === 'dashboard' ? '!!document.querySelector(".admin-dashboard")' : route === 'activity-log' ? '!!document.querySelector(".admin-activity-card")' : '!!document.querySelector(".admin-funds")'); if (route === 'laporan') await evaluate('document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))') }
  const screenshot = async (name) => { const png = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64')) }
  const rowAction = (id, mode) => `.admin-categories-table [data-category-id="${id}"] button:${mode === 'edit' ? 'first' : 'last'}-child`
  const count = () => evaluate('document.querySelectorAll(".admin-categories-table tbody tr").length')
  const noOverflow = async () => {
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false)
    assert.equal(await evaluate('(()=>{const e=document.querySelector("dialog[open]");if(!e)return true;const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth})()'), true)
  }
  const closeDialog = async () => { await key('Escape', 27); await waitFor('!document.querySelector("dialog")') }
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
    await t.test('tambah/edit satu modal pada empat viewport, sembilan warna, validasi, keyboard dan fokus kembali', async () => {
      for (const [width, height] of [[1728,1080],[1366,768],[768,1024],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open(); await click('.admin-categories-add'); await waitFor('!!document.querySelector("dialog[open]")')
        assert.equal(await evaluate('document.querySelector("dialog h2").textContent'), 'Tambah Kategori')
        assert.equal(await evaluate('document.querySelector("#admin-category-name").value'), '')
        assert.equal(await evaluate('document.querySelectorAll("input[name=color]").length'),9)
        assert.equal(await evaluate('document.querySelectorAll("input[name=color]:checked").length'),0)
        await key('Enter',13)
        assert.match(await evaluate('document.querySelector("#admin-category-name-error").textContent'),/wajib/)
        assert.match(await evaluate('document.querySelector("#admin-category-color-error").textContent'),/Pilih/)
        await fillName(' kas   MASJID '); await click('input[value=teal]'); await click('.admin-category-save')
        assert.match(await evaluate('document.querySelector("#admin-category-name-error").textContent'),/sudah digunakan/)
        await fillName('Dana Sosial'); await screenshot(`tambah-${width}`); await noOverflow()
        if (width===390) await key('Enter',13); else await click('.admin-category-save')
        await waitFor('!document.querySelector("dialog")')
        assert.equal(await count(),4)
        const id = await evaluate('document.querySelector(".admin-categories-table tbody tr:last-child").dataset.categoryId')
        await click(rowAction(id,'edit')); await waitFor('!!document.querySelector("dialog[open]")')
        assert.equal(await evaluate('document.querySelector("dialog h2").textContent'),'Edit Kategori')
        assert.equal(await evaluate('document.querySelector("#admin-category-name").value'),'Dana Sosial')
        assert.equal(await evaluate('document.querySelector("input[name=color]:checked").value'),'teal')
        await fillName('Dana Pendidikan'); await click('input[value=purple]')
        await key('ArrowLeft',37); assert.equal(await evaluate('document.querySelector("input[name=color]:checked").value'),'teal')
        await key('ArrowRight',39); assert.equal(await evaluate('document.querySelector("input[name=color]:checked").value'),'purple')
        await screenshot(`edit-${width}`); await noOverflow(); await click('.admin-category-save'); await waitFor('!document.querySelector("dialog")')
        assert.equal(await evaluate(`document.querySelector('[data-category-id="${id}"] th').textContent`),'Dana Pendidikan')
        assert.equal(await evaluate('document.querySelector(".admin-balance-table tfoot td:last-child").textContent'),'17.228.200')
        assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),'Edit kategori Dana Pendidikan')
        await click('.admin-categories-add'); await waitFor('!!document.querySelector("dialog[open]")')
        assert.equal(await evaluate('document.querySelector("#admin-category-name").value'),'')
        await click('dialog header button'); assert.equal(await evaluate('document.activeElement.className'),'admin-categories-add')
        await click('.admin-categories-add'); await waitFor('!!document.querySelector("dialog[open]")')
        await evaluate('document.querySelector("dialog header button").focus()'); await key('Tab',9,8)
        assert.equal(await evaluate('document.activeElement.className'),'admin-category-save')
        await key('Tab',9); assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),'Tutup form kategori')
        await closeDialog(); assert.equal(await count(),4); assert.equal(await evaluate('document.body.style.overflow'),'')
      }
    })
    await t.test('konfirmasi hapus melindungi kategori terpakai; kategori baru kosong dapat dibatalkan dan dihapus tanpa riwayat palsu', async () => {
      for (const [width,height] of [[1728,1080],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile:false }); await open()
        for (const id of ['mosque','friday','maintenance']) {
          await click(rowAction(id,'delete')); await waitFor('!!document.querySelector("dialog[open]")')
          assert.equal(await evaluate('document.querySelector("dialog h2").textContent'),'Hapus Kategori?')
          assert.match(await evaluate('document.querySelector(".admin-category-warning").textContent'),/digunakan transaksi.*tidak dapat dihapus/)
          assert.equal(await evaluate('document.querySelector(".admin-category-delete-confirm").disabled'),true)
          assert.doesNotMatch(await evaluate('document.querySelector("dialog").textContent'),/Hapus Transaksi|database|tercatat pada Activity Log/)
          if(id==='friday') await screenshot(`hapus-dilindungi-${width}`)
          await noOverflow(); await closeDialog(); assert.equal(await count(),3)
        }
        await click('.admin-categories-add'); await waitFor('!!document.querySelector("dialog[open]")'); await fillName('Dana Sementara'); await click('input[value=red]'); await click('.admin-category-save'); await waitFor('!document.querySelector("dialog")')
        const id=await evaluate('document.querySelector(".admin-categories-table tbody tr:last-child").dataset.categoryId')
        await click(rowAction(id,'delete')); await waitFor('!!document.querySelector("dialog[open]")'); await click('.admin-category-cancel'); assert.equal(await count(),4)
        await click(rowAction(id,'delete')); await waitFor('!!document.querySelector("dialog[open]")')
        assert.equal(await evaluate('document.querySelector(".admin-category-delete-confirm").disabled'),false)
        assert.equal(await evaluate('document.activeElement.className'),'admin-category-cancel')
        await screenshot(`hapus-${width}`); await noOverflow(); await click('.admin-category-delete-confirm'); await waitFor('!document.querySelector("dialog")')
        assert.equal(await count(),3); assert.equal(await evaluate('document.activeElement.className'),'admin-categories-add')
        assert.match(await evaluate('document.querySelector(".admin-category-session-note").textContent'),/dihapus dari sesi mock/)
      }
    })
    await t.test('sembilan warna/nama mengikuti ID di Dashboard, Kelola Dana dan Laporan selama sesi; nominal/jenis transaksi tetap', async () => {
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false}); await open()
      await click('.admin-categories-add'); await waitFor('!!document.querySelector("dialog[open]")'); await fillName('Dana Kosong'); await click('input[value=yellow]'); await click('.admin-category-save'); await waitFor('!document.querySelector("dialog")')
      for (const color of adminCategoryColors) {
        await click(rowAction('mosque','edit')); await waitFor('!!document.querySelector("dialog[open]")'); await fillName('Kas Utama'); await click(`input[value=${color.id}]`); await click('.admin-category-save'); await waitFor('!document.querySelector("dialog")')
        const style=adminCategoryColorStyle(color.id)
        const rgb=(hex)=>`rgb(${[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16)).join(', ')})`
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-categories-table tbody tr:first-child .admin-category-badge")).getPropertyValue("--category-color")'),style['--category-color'])
        await navigate('dashboard')
        assert.equal(await evaluate('document.querySelectorAll(".admin-balance-table tbody tr").length'),4)
        assert.equal(await evaluate('document.querySelector(".admin-balance-table tbody tr:first-child th").textContent'),'Kas Utama')
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-balance-table tbody tr:first-child .admin-category-dot")).getPropertyValue("--category-dot")'),style['--category-dot'])
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-balance-table tbody tr:first-child .admin-category-dot")).backgroundColor'),rgb(style['--category-dot']))
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-recent-table .admin-category-badge")).getPropertyValue("--category-color")'),style['--category-color'])
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-statistic > p")].map(e=>e.textContent)'),['Rp 16.864.200','Rp 1.791.500','Rp 1.427.500','Rp 17.228.200'])
        await navigate('kelola-dana'); assert.equal(await evaluate('document.querySelector(".admin-recent-table .admin-category-badge").textContent'),'Kas Utama')
        await navigate('laporan')
        await click('.admin-report-page-size button:last-of-type')
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table [data-transaction-id]").length'),141)
        assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-transaction-id=admin-report-history-mosque-001] .admin-report-category-label")).getPropertyValue("--category-color")'),style['--category-color'])
        assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-transaction-id=admin-report-history-mosque-001] .admin-report-category-label")).color'),rgb(color.text))
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-tabs button")].map(e=>getComputedStyle(e).getPropertyValue("--category-color"))'),['#087815','#ca003a','#087815'])
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-report-export-sheet .admin-category-dot")).backgroundColor'),rgb(style['--category-dot']))
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-export-sheet tbody tr").length'),4)
        await click('#admin-report-tab-expense'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table [data-transaction-id]").length'),108)
        await click('#admin-report-tab-monthly')
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-report-monthly-table [data-category-id=mosque] .admin-report-category-label")).getPropertyValue("--category-color")'),style['--category-color'])
        assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-month-total=\\\"2026-10\\\"] td")].map(e=>e.textContent)'),['16.864.200','1.791.500','1.427.500','17.228.200'])
        if(color.id==='purple') { await evaluate('document.querySelector(".admin-report-tabs").scrollIntoView({block:"start"})'); await screenshot('warna-laporan-rekap') }
        await navigate('kategori-dana'); await noOverflow()
      }
    })
    await t.test('refresh mengembalikan fixture; tidak ada storage/HTTP/log palsu atau operasi mode API', async () => {
      await open(); assert.equal(await evaluate('document.querySelector(".admin-categories-table tbody tr:first-child th").textContent'),'Kas Masjid')
      await navigate('activity-log'); await waitFor('!!document.querySelector(".admin-activity-card")')
      assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'),9)
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'),{local:0,session:0,cookie:''})
      await open('kategori-dana/',apiUrl); assert.equal(await evaluate('!!document.querySelector(".admin-categories-add")'),false)
      assert.deepEqual(requests,[]); assert.deepEqual(failures,[])
    })
  } finally { ws.close(); await fetch(`${cdpUrl}/json/close/${target.id}`) }
})
