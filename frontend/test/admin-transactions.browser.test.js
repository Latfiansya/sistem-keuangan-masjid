import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL

test('Admin 1.15: pagination, detail, edit dan hapus simulasi pada Chrome QA', { skip: !baseUrl || !cdpUrl, timeout: 90000 }, async (t) => {
  const output = fileURLToPath(new URL('../../tmp/admin115-qa/browser/', import.meta.url))
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
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type) && message.params.request.url.startsWith('http')) requests.push(message.params.request.url)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async (expression) => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text); return result.result.value }
  const waitFor = async (expression) => { for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 20)) } assert.fail(`Kondisi browser tidak tercapai: ${expression}`) }
  const click = async (selector) => { const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 }) }
  const key = async (value, code, modifiers = 0) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: value, code: value, windowsVirtualKeyCode: code, modifiers, ...(value === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }) }
  const fill = async (selector, value) => { if (selector.startsWith('[name=')) selector = `.admin-transaction-edit-form ${selector}`; await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).select()`); await send('Input.insertText', { text: value }) }
  const setValue = (selector, value) => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  const open = async (path, selector) => { await evaluate('window.admin115Navigation = true'); const navigation = await send('Page.navigate', { url: `${baseUrl}${path}` }); if (!navigation.loaderId) await evaluate('delete window.admin115Navigation'); await waitFor(`!window.admin115Navigation && document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`); await evaluate('document.fonts.ready'); await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))') }
  const screenshot = async (name) => { const png = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64')) }
  const rows = () => evaluate('document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]").length')
  const noOverflow = async () => { assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false); assert.equal(await evaluate('[...document.querySelectorAll("dialog[open]")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth})'), true) }
  const returnToList = async () => { await click('.admin-transaction-back'); await waitFor('!!document.querySelector(".admin-report-ledger-table")'); await evaluate('document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))') }
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
    await t.test('20/30/50/Semua, halaman awal/tengah/akhir, ellipsis, pencarian dan reset tab/filter', async () => {
      await send('Emulation.setDeviceMetricsOverride', { width: 1728, height: 1080, deviceScaleFactor: 1, mobile: false })
      await open('/admin/laporan', '.admin-report-pagination')
      assert.equal(await rows(), 20)
      assert.match(await evaluate('document.querySelector(".admin-report-pagination").textContent'), /Menampilkan 1–20 dari 141 transaksi/)
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-pagination nav > button")].slice(1,-1).map(e=>e.textContent)'), ['1','2','3','8'])
      await click('.admin-report-pagination [aria-label="Halaman 3"]')
      await click('.admin-report-pagination [aria-label="Halaman 4"]')
      assert.match(await evaluate('document.querySelector(".admin-report-pagination").textContent'), /Menampilkan 61–80/)
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-pagination nav > span").length'),2)
      await click('.admin-report-pagination [aria-label="Halaman 8"]')
      assert.equal(await rows(), 1)
      assert.equal(await evaluate(`document.querySelector('[aria-label="Halaman berikutnya"]').disabled`), true)
      await click('.admin-report-pagination [aria-label="Halaman sebelumnya"]'); assert.equal(await rows(), 20)
      for (const [index, count] of [[2,30],[3,50],[4,141]]) { await click(`.admin-report-page-size button:nth-of-type(${index})`); assert.equal(await rows(),count); assert.match(await evaluate('document.querySelector(".admin-report-pagination").textContent'),new RegExp(`Menampilkan 1–${count}`)) }
      assert.equal(await evaluate('document.querySelector(".admin-report-pagination nav")'),null)
      await click('#admin-report-tab-expense'); assert.equal(await rows(),108)
      await click('.admin-report-page-size button:first-of-type'); assert.equal(await rows(),20)
      await click('.admin-report-pagination [aria-label="Halaman berikutnya"]')
      await fill('.admin-report-search input','tidak ditemukan'); assert.equal(await rows(),0)
      assert.match(await evaluate('document.querySelector(".admin-report-pagination").textContent'),/Menampilkan 0–0 dari 0 transaksi/)
      await click('#admin-report-tab-income'); assert.equal(await rows(),20)
      await setValue('[name=startDate]','2026-10-15'); await setValue('[name=endDate]','2026-10-15'); await click('.admin-report-filters button')
      assert.equal(await rows(),1)
      assert.equal(await evaluate('document.querySelector(".admin-report-pagination [aria-current=page]").textContent'),'1')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-pagination nav button:disabled").length'),2)
    })
    await t.test('daftar-detail-edit-batal-simpan mempertahankan ID, tab dan konteks pencarian/pagination', async () => {
      await open('/admin/laporan','.admin-report-pagination')
      await fill('.admin-report-search input','Infaq')
      await click('.admin-report-page-size button:nth-of-type(2)'); await click('.admin-report-pagination [aria-label="Halaman berikutnya"]')
      const id = await evaluate('document.querySelector(".admin-report-ledger-table tbody tr").dataset.transactionId')
      const description = await evaluate('document.querySelector(".admin-report-ledger-table tbody tr td:nth-child(3)").textContent')
      await click('.admin-report-detail-link'); await waitFor('!!document.querySelector(".admin-transaction-information")')
      assert.ok(await evaluate(`location.pathname.endsWith('/${id}')`))
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'),'Transaksi')
      assert.equal(await evaluate('document.querySelector(".admin-transaction-information-body h3").textContent'),description)
      await returnToList()
      assert.equal(await evaluate('document.querySelector(".admin-report-search input").value'),'Infaq')
      assert.match(await evaluate('document.querySelector(".admin-report-pagination").textContent'),/Menampilkan 31–60/)
      await click('.admin-report-detail-link'); await waitFor('!!document.querySelector(".admin-transaction-heading")')
      await click('.admin-transaction-heading a'); await waitFor('!!document.querySelector(".admin-transaction-edit-form")')
      await fill('[name=description]','Draft dibatalkan'); await click('.admin-transaction-edit-form footer a'); await waitFor('!!document.querySelector(".admin-transaction-information-body")')
      assert.equal(await evaluate('document.querySelector(".admin-transaction-information-body h3").textContent'),description)
      await click('.admin-transaction-heading a'); await waitFor('!!document.querySelector(".admin-transaction-edit-form")')
      await fill('[name=description]',''); await fill('[name=amount]','0'); await click('.admin-transaction-edit-form button[type=submit]')
      assert.equal(await evaluate('document.querySelectorAll(".admin-transaction-error").length'),2)
      await fill('[name=description]','Infaq diperbarui sesi'); await fill('[name=amount]','150000'); await setValue('[name=categoryId]','friday')
      await fill('[name=personName]','Donatur Contoh'); await fill('[name=notes]','Catatan perubahan sesi')
      await click('[name=showDonorNamePublic]'); await click('.admin-transaction-edit-form button[type=submit]'); await waitFor('!!document.querySelector(".admin-transaction-information-body")')
      assert.ok(await evaluate(`location.pathname.endsWith('/${id}')`))
      assert.match(await evaluate('document.querySelector(".admin-transaction-information-body").textContent'),/Infaq diperbarui sesi.*150.000.*Donatur Contoh.*Diizinkan.*Catatan perubahan sesi/)
      await returnToList(); assert.equal(await evaluate('document.querySelector(".admin-report-search input").value'),'Infaq')
      await open(`/admin/laporan/transaksi/${id}`,'.admin-transaction-information-body')
      assert.equal(await evaluate('document.querySelector(".admin-transaction-information-body h3").textContent'),description)
      await open('/admin/laporan/transaksi/tidak-ada','.admin-transaction-not-found'); assert.match(await evaluate('document.querySelector(".admin-transaction-not-found").textContent'),/tidak ditemukan/)
    })
    await t.test('empat viewport: detail dua jenis, form edit, modal HAPUS, Escape, fokus dan transaksi benar-benar hilang dari simulasi', async () => {
      for (const [width,height] of [[1728,1080],[1366,768],[768,1024],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        for (const [id,type] of [['admin-trx-01','income'],['admin-trx-02','expense']]) {
          await open(`/admin/laporan/transaksi/${id}`,'.admin-transaction-information-body')
          await noOverflow(); await screenshot(`detail-${type}-${width}`)
          await click('.admin-transaction-heading a'); await waitFor('!!document.querySelector(".admin-transaction-edit-form")')
          assert.equal(await evaluate('document.querySelectorAll("[name=showDonorNamePublic]").length'),type==='income'?1:0)
          assert.equal(await evaluate('document.querySelector("[name=date]").type'),'date')
          await noOverflow(); await screenshot(`edit-${type}-${width}`)
          await fill('[name=amount]','150000'); await fill('[name=description]',`Transaksi ${type} sesi ${width}`); await click('.admin-transaction-edit-form button[type=submit]'); await waitFor('!!document.querySelector(".admin-transaction-information-body")')
          await click('.admin-transaction-danger'); await waitFor('!!document.querySelector("dialog[open]")')
          await noOverflow(); await screenshot(`hapus-${type}-${width}`)
          if (width === 1728) { await click('.admin-transaction-delete footer button:first-child'); await waitFor('!document.querySelector("dialog")'); await click('.admin-transaction-danger'); await waitFor('!!document.querySelector("dialog[open]")') }
          for (const text of ['hapus',' HAPUS','HAPUS ']) { await fill('#admin-transaction-delete-confirmation',text); assert.equal(await evaluate('document.querySelector(".admin-transaction-delete button[type=submit]").disabled'),true) }
          await key('Escape',27); await waitFor('!document.querySelector("dialog")'); assert.equal(await evaluate('document.activeElement.textContent'),'Hapus')
          await click('.admin-transaction-danger'); await fill('#admin-transaction-delete-confirmation','HAPUS')
          assert.equal(await evaluate('document.querySelector(".admin-transaction-delete button[type=submit]").disabled'),false)
          await click('.admin-transaction-delete button[type=submit]'); await waitFor('!!document.querySelector(".admin-report-pagination")')
          assert.equal(await evaluate('document.querySelector("dialog")'),null)
          assert.equal(await evaluate('document.body.style.overflow'),'')
          assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'),`admin-report-tab-${type}`)
          assert.equal(await evaluate('document.querySelector(".admin-report-ledger-count strong").textContent'),type==='income'?'140':'107')
          assert.equal(await evaluate('document.querySelector(".admin-report-balance h2").textContent'),'Rp 17.228.200')
          await evaluate('document.querySelector(".admin-report-pagination").scrollIntoView({block:"center"})'); await noOverflow(); await screenshot(`pagination-${type}-${width}`)
          if(width<1024) await click('.admin-menu-toggle')
          await click('.admin-nav-link[href="/admin/kelola-dana"]'); await waitFor('!!document.querySelector(".admin-recent-table")')
          assert.equal(await evaluate(`document.querySelector('.admin-recent-table [data-transaction-id="${id}"]')`),null)
          await noOverflow()
        }
      }
    })
    await t.test('tambahan dari Kelola Dana dapat diedit/dihapus di Laporan; Dashboard, privasi dan rekap simulasi konsisten', async () => {
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false})
      await open('/admin/kelola-dana','.admin-funds-buttons')
      await click('.admin-funds-buttons button:first-child'); await waitFor('!!document.querySelector("dialog[open]")')
      await setValue('dialog [name=categoryId]','friday')
      await fill('dialog [name=description]','Sumbangan sesi'); await fill('dialog [name=amount]','300000'); await fill('dialog [name=personName]','Nama disembunyikan')
      await click('.admin-transaction-save'); await waitFor('!document.querySelector("dialog")')
      const id = await evaluate('document.querySelector(".admin-recent-table [data-source=session]").dataset.transactionId')
      await click('.admin-recent-heading button'); await waitFor('!!document.querySelector(".admin-report-search input")')
      await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
      await fill('.admin-report-search input','Sumbangan sesi'); assert.equal(await rows(),1)
      await click('.admin-report-detail-link'); await waitFor('!!document.querySelector(".admin-transaction-information-body")')
      assert.match(await evaluate('document.querySelector(".admin-transaction-optional").textContent'),/Nama disembunyikan.*Tidak ditampilkan/)
      await click('.admin-transaction-heading a'); await waitFor('!!document.querySelector(".admin-transaction-edit-form")')
      await fill('[name=amount]','450000'); await click('.admin-transaction-edit-form button[type=submit]'); await waitFor('!!document.querySelector(".admin-transaction-information-body")')
      await returnToList(); assert.equal(await rows(),1)
      assert.match(await evaluate('document.querySelector(".admin-report-ledger-total strong").textContent'),/450.000/)
      await fill('.admin-report-search input',''); assert.equal(await evaluate('document.querySelector(".admin-report-ledger-count strong").textContent'),'142')
      await click('#admin-report-tab-monthly')
      assert.equal(await evaluate('document.querySelector(".admin-report-monthly-table tbody:last-child [data-month-total] td:last-child").textContent'),'17.678.200')
      await click('.admin-nav-link[href="/admin/dashboard"]'); await waitFor('!!document.querySelector(".admin-dashboard")')
      assert.match(await evaluate(`document.querySelector('.admin-recent-table [data-transaction-id="${id}"]').textContent`),/450.000/)
      assert.equal(await evaluate('document.querySelector(".admin-statistic:last-child > p").textContent'),'Rp 17.228.200')
      await click('.admin-nav-link[href="/admin/laporan"]'); await waitFor('!!document.querySelector(".admin-report-detail-link")')
      await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
      await click('.admin-report-detail-link'); await waitFor('!!document.querySelector(".admin-transaction-danger")')
      await click('.admin-transaction-danger'); await fill('#admin-transaction-delete-confirmation','HAPUS'); await click('.admin-transaction-delete button[type=submit]')
      await waitFor('!!document.querySelector(".admin-report-pagination")'); assert.equal(await rows(),0)
      await fill('.admin-report-search input',''); assert.equal(await evaluate('document.querySelector(".admin-report-ledger-count strong").textContent'),'141')
      await click('.admin-nav-link[href="/admin/kelola-dana"]'); await waitFor('!!document.querySelector(".admin-recent-table")')
      assert.equal(await evaluate(`document.querySelector('.admin-recent-table [data-transaction-id="${id}"]')`),null)
      assert.match(await evaluate('document.querySelector(".admin-session-transactions-note").textContent'),/snapshot saldo tetap/)
    })
    assert.deepEqual(failures,[])
    assert.deepEqual(requests,[])
  } finally { ws.close(); await fetch(`${cdpUrl}/json/close/${target.id}`) }
})
