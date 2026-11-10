import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL
const phase = process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'

test('Kelola Dana: tambah transaksi sesi, privasi donatur dan snapshot pada Chrome QA', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 60000,
}, async (t) => {
  const output = fileURLToPath(new URL(`../../tmp/admin114-qa/${phase}/`, import.meta.url))
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
  const key = async (value, code, modifiers = 0) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: value, code: value === ' ' ? 'Space' : value, windowsVirtualKeyCode: code, modifiers, ...(type === 'keyDown' && value === 'Enter' ? { text: '\r' } : type === 'keyDown' && value === ' ' ? { text: ' ' } : {}) }) }
  const fillName = async (name) => { await evaluate('document.querySelector("#admin-category-name").focus();document.querySelector("#admin-category-name").select()'); await send('Input.insertText', { text: name }) }
  const open = async (route = 'kategori-dana', origin = baseUrl) => { await send('Page.navigate', { url: `${origin}/admin/${route}` }); await waitFor('document.readyState==="complete" && !!document.querySelector(".admin-shell")'); await waitFor(origin === baseUrl ? (route.startsWith('kelola-dana') ? '!!document.querySelector(".admin-funds")' : '!!document.querySelector(".admin-balance-table")') : '!!document.querySelector(".admin-dashboard-state[role=alert]")'); await evaluate('document.fonts.ready') }
  const navigate = async (route) => { if (await evaluate('innerWidth<1024')) await click('.admin-menu-toggle'); await click(`.admin-nav-link[href="/admin/${route}"]`); await waitFor(route === 'laporan' ? '!!document.querySelector(".admin-report-tabs")' : route === 'kategori-dana' ? '!!document.querySelector(".admin-categories-table")' : route === 'dashboard' ? '!!document.querySelector(".admin-dashboard")' : route === 'activity-log' ? '!!document.querySelector(".admin-activity-card")' : '!!document.querySelector(".admin-funds")') }
  const screenshot = async (name) => { const png = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64')) }
  const rowAction = (id, mode) => `.admin-categories-table [data-category-id="${id}"] button:${mode === 'edit' ? 'first' : 'last'}-child`
  const noOverflow = async () => {
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false)
    assert.equal(await evaluate('(()=>{const e=document.querySelector("dialog[open]");if(!e)return true;const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth})()'), true)
  }
  const closeDialog = async () => { await key('Escape', 27); await waitFor('!document.querySelector("dialog")') }
  const fill = async (name, value) => { await evaluate(`document.querySelector('dialog [name="${name}"]').focus();document.querySelector('dialog [name="${name}"]').select()`); await send('Input.insertText', { text: value }) }
  const setValue = (name,value) => evaluate(`(()=>{const e=document.querySelector('dialog [name="${name}"]');Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  const rows = () => evaluate('document.querySelectorAll(".admin-recent-table tbody tr").length')
  const openForm = async (type) => { await click(`.admin-funds-buttons button:${type==='income'?'first':'last'}-child`); await waitFor('!!document.querySelector("dialog[open]")') }
  const save = async () => { await click('.admin-transaction-save') }
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
    await t.test('dua modal pada empat viewport: native date, kategori, validasi wajib/nominal, checkbox dan simpan sesi', async () => {
      for (const [width,height] of [[1728,1080],[1366,768],[768,1024],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false}); await open('kelola-dana')
        const today=await evaluate("(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})()")
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-funds-buttons button")].map(e=>getComputedStyle(e).backgroundColor)'),['rgb(20, 134, 66)','rgb(202, 0, 58)'])
        for (const type of ['income','expense']) {
          await openForm(type)
          assert.equal(await evaluate('document.querySelector("dialog h2").textContent'),type==='income'?'Tambah Pemasukan':'Tambah Pengeluaran')
          assert.equal(await evaluate('document.querySelector("dialog [name=date]").type'),'date')
          assert.equal(await evaluate('document.querySelector("dialog [name=date]").value'),today)
          assert.equal(await evaluate('[...document.querySelector("dialog [name=categoryId]").options].filter(option=>option.value).length'),3)
          assert.equal(await evaluate('document.querySelectorAll("input[type=checkbox]").length'),type==='income'?1:0)
          assert.equal(await evaluate('document.querySelector("dialog [name=personName]").labels[0].textContent'),type==='income'?'Nama Donatur':'Nama Penerima')
          assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-transaction-save")).backgroundColor'),type==='income'?'rgb(0, 168, 61)':'rgb(202, 0, 58)')
          if(type==='income') assert.equal(await evaluate('document.querySelector("dialog [name=showDonorNamePublic]").checked'),false)
          await noOverflow(); await screenshot(`${type}-${width}-top`)
          await evaluate('document.querySelector("dialog").scrollTop=document.querySelector("dialog").scrollHeight'); await screenshot(`${type}-${width}-bottom`)
          await setValue('date',''); await save()
          assert.equal(await evaluate('document.querySelectorAll(".admin-transaction-error").length'),4)
          assert.equal(await evaluate('document.activeElement.name'),'date')
          await setValue('date',today); await setValue('categoryId','mosque'); await fill('description',`${type} mock ${width}`)
          for (const amount of ['0','-1','1e3','100.000','1.5','1000000000000']) {
            await fill('amount',amount); await save(); assert.match(await evaluate('document.querySelector("#admin-transaction-amount-error").textContent'),/rupiah bulat positif/)
          }
          await fill('amount',type==='income'?'125000':'50000'); await fill('personName','Nama Contoh'); await fill('notes','Catatan sesi\nbaris kedua')
          if(type==='income') { await click('[name=showDonorNamePublic]'); assert.equal(await evaluate('document.querySelector("dialog [name=showDonorNamePublic]").checked'),true); await key(' ',32); assert.equal(await evaluate('document.querySelector("dialog [name=showDonorNamePublic]").checked'),false); await click('[name=showDonorNamePublic]') }
          if(width===390) { await evaluate('document.querySelector("dialog [name=description]").focus()'); await key('Enter',13) } else await save()
          await waitFor('!document.querySelector("dialog")')
          assert.equal(await rows(),type==='income'?6:7)
          assert.match(await evaluate('document.querySelector(".admin-funds-controls-body p").textContent'),/Belum tersimpan ke server.*snapshot saldo/)
          assert.equal(await evaluate('document.activeElement.textContent'),type==='income'?'Pemasukan':'Pengeluaran')
          assert.equal(await evaluate('document.body.style.overflow'),'')
        }
        assert.equal(await evaluate('new Set([...document.querySelectorAll(".admin-recent-table tbody tr")].map(e=>e.dataset.transactionId)).size'),7)
        assert.equal(await evaluate('document.querySelectorAll(".admin-recent-table tr[data-source=session]").length'),2)
        await noOverflow(); await screenshot(`tersimpan-${width}`)
      }
    })
    await t.test('batal/Escape/tombol kembali tidak menambah data, fokus tetap di modal dan tanggal baru selalu hari ini', async () => {
      await open('kelola-dana')
      for (const type of ['income','expense']) for(const close of ['cancel','escape','back']) {
        await openForm(type); await fill('description','Draft dibatalkan'); await setValue('date','2020-02-29')
        await evaluate('document.querySelector("dialog header button").focus()'); await key('Tab',9,8); assert.equal(await evaluate('document.activeElement.className'),'admin-transaction-save')
        await key('Tab',9); assert.match(await evaluate('document.activeElement.getAttribute("aria-label")'),/Tutup tambah/)
        if(close==='cancel') await click('dialog footer button:first-child'); else if(close==='back') await click('dialog header button'); else await key('Escape',27)
        await waitFor('!document.querySelector("dialog")'); assert.equal(await rows(),5)
        await openForm(type); assert.equal(await evaluate('document.querySelector("dialog [name=description]").value'),''); assert.notEqual(await evaluate('document.querySelector("dialog [name=date]").value'),'2020-02-29')
        await closeDialog()
      }
    })
    await t.test('kategori bersama termasuk kategori baru, perlindungan relasi, daftar Dashboard dan batas snapshot/report tetap jelas', async () => {
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false}); await open()
      await click('.admin-categories-add'); await waitFor('!!document.querySelector("dialog[open]")'); await fillName('Dana Sesi'); await click('input[value=purple]'); await click('.admin-category-save'); await waitFor('!document.querySelector("dialog")')
      const id=await evaluate('document.querySelector(".admin-categories-table tbody tr:last-child").dataset.categoryId')
      await navigate('kelola-dana'); await openForm('income')
      assert.equal(await evaluate(`document.querySelector('dialog [name=categoryId] option[value="${id}"]').textContent`),'Dana Sesi')
      await setValue('categoryId',id); await fill('description','Transaksi integrasi sesi'); await fill('amount','250000'); await save(); await waitFor('!document.querySelector("dialog")')
      const transactionId=await evaluate('document.querySelector(".admin-recent-table tr[data-source=session]").dataset.transactionId')
      await navigate('dashboard'); assert.equal(await rows(),6)
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-statistic>p")].map(e=>e.textContent)'),['Rp 16.864.200','Rp 1.791.500','Rp 1.427.500','Rp 17.228.200'])
      assert.match(await evaluate('document.querySelector(".admin-session-transactions-note").textContent'),/Belum termasuk snapshot saldo/)
      await navigate('laporan')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tr[data-transaction-id]").length'),141)
      assert.match(await evaluate('document.querySelector(".admin-report-notice").textContent'),/1 tambahan sesi mock belum termasuk/)
      assert.equal(await evaluate('document.querySelector(".admin-report-balance h2").textContent'),'Rp 17.228.200')
      await click('#admin-report-tab-expense'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tr[data-transaction-id]").length'),108)
      await click('#admin-report-tab-monthly'); assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-month-total=\\"2026-10\\"] td")].map(e=>e.textContent)'),['16.864.200','1.791.500','1.427.500','17.228.200'])
      await navigate('kategori-dana'); await click(rowAction(id,'delete')); await waitFor('!!document.querySelector("dialog[open]")')
      assert.equal(await evaluate('document.querySelector(".admin-category-delete-confirm").disabled'),true); await closeDialog()
      await click(rowAction(id,'edit')); await waitFor('!!document.querySelector("dialog[open]")'); await fillName('Dana Sesi Baru'); await click('input[value=teal]'); await click('.admin-category-save'); await waitFor('!document.querySelector("dialog")')
      await navigate('kelola-dana'); assert.equal(await evaluate(`document.querySelector('[data-transaction-id="${transactionId}"] .admin-category-badge').textContent`),'Dana Sesi Baru')
      await screenshot('kategori-dan-sesi')
      await navigate('activity-log'); assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'),9)
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'),{local:0,session:0,cookie:''})
    })
    await t.test('tanggal lokal berbeda dari UTC, refresh menghapus tambahan sesi dan mode API tidak mengirim request', async () => {
      await send('Emulation.setTimezoneOverride',{timezoneId:'America/Los_Angeles'})
      const script=await send('Page.addScriptToEvaluateOnNewDocument',{source:"const OriginalDate=Date;window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-11-11T01:00:00Z']))}static now(){return OriginalDate.parse('2026-11-11T01:00:00Z')}}"})
      await open('kelola-dana'); assert.equal(await rows(),5); await openForm('income')
      assert.equal(await evaluate('document.querySelector("dialog [name=date]").value'),'2026-11-10')
      await closeDialog(); await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier}); await send('Emulation.setTimezoneOverride',{timezoneId:'Asia/Jakarta'})
      await open('kelola-dana/',apiUrl); assert.equal(await evaluate('!!document.querySelector(".admin-funds-buttons")'),false)
      assert.deepEqual(requests,[]); assert.deepEqual(failures,[])
    })
  } finally { ws.close(); await fetch(`${cdpUrl}/json/close/${target.id}`) }
})
