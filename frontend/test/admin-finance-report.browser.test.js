import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { mockAdminDashboard } from '../src/mocks/adminDashboard.js'
import { mockAdminFinanceHistory, mockAdminFinanceOctober } from '../src/mocks/adminFinanceReport.js'

const fixture = [...mockAdminFinanceHistory, ...mockAdminFinanceOctober, ...mockAdminDashboard.recentTransactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
const october = fixture.filter((row) => row.date.startsWith('2026-10'))

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL
const phase = process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'

test('Laporan admin: snapshot, tiga jenis laporan, filter mock dan pengaturan unduhan pada Chrome QA', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 60000,
}, async (t) => {
  const output = fileURLToPath(new URL(`../../tmp/admin112-navigation-qa/${phase}/`, import.meta.url))
  await mkdir(`${output}downloads`, { recursive: true })
  const target = await (await fetch(`${cdpUrl}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map(), failures = [], requests = [], downloads = []
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      const request = pending.get(message.id); pending.delete(message.id)
      if (message.error) request.reject(message.error); else request.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push(message.params.response.url)
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type) && message.params.request.url.startsWith('http') && !message.params.request.url.includes('/assets/')) requests.push(message.params.request.url)
    if (message.method === 'Browser.downloadWillBegin') downloads.push(message.params)
    if (message.method === 'Browser.downloadProgress') { const file = downloads.find((item) => item.guid === message.params.guid); if (file) Object.assign(file, message.params) }
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
  const key = async (value, code) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: value, code: value, windowsVirtualKeyCode: code }) }
  const setDate = (name, value) => evaluate(`(()=>{const e=document.querySelector('.admin-report-filters [name=${name}]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  const search = async (value) => { await evaluate('document.querySelector(".admin-report-search input").focus();document.querySelector(".admin-report-search input").select()'); await send('Input.insertText', { text: value }) }
  const open = async (route = 'laporan', origin = baseUrl) => { await send('Page.navigate', { url: `${origin}/admin/${route}` }); await waitFor('document.readyState==="complete" && !!document.querySelector(".admin-shell")'); if (route === 'laporan' && origin === baseUrl) await waitFor('!!document.querySelector(".admin-report-tabs")'); await evaluate('document.fonts.ready'); await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))') }
  const navigate = async (route) => { if (await evaluate('innerWidth<1024')) await click('.admin-menu-toggle'); await click(`.admin-nav-link[href="/admin/${route}"]`) }
  const screenshot = async (name, full = false) => {
    const size = await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})')
    const png = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(full ? { clip: { x: 0, y: 0, ...size, scale: 1 } } : {}) })
    await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64'))
  }
  const summary = () => evaluate('document.querySelector(".admin-report > .admin-balance .admin-balance-table").textContent')
  const noOverflow = async () => {
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false)
    assert.equal(await evaluate('[...document.querySelectorAll(".admin-report-hero,.admin-report-balance,.admin-report-category-card,.admin-report-tabs button,.admin-report-ledger-tools article,.admin-report-toast")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth})'), true)
  }
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
    await send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: `${output}downloads`, eventsEnabled: true })
    await t.test('hero memakai modal Kelola Dana sekali buka dan tipografi banner normal pada desktop/mobile', async () => {
      for (const [width,height] of [[1728,1080],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await open()
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-report-download h2")).letterSpacing'),'normal')
        for (const [index,label] of [[1,'Pemasukan'],[2,'Pengeluaran']]) {
          await click(`.admin-report-hero button:nth-child(${index})`)
          await waitFor('location.pathname==="/admin/kelola-dana"&&!!document.querySelector(".admin-transaction-dialog[open]")')
          assert.equal(await evaluate('document.querySelector("#admin-transaction-title").textContent'),`Tambah ${label}`)
          assert.equal(await evaluate('history.state.usr?.openTransaction'),undefined)
          await key('Escape',27);await waitFor('!document.querySelector(".admin-transaction-dialog")')
          let history=await send('Page.getNavigationHistory')
          await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex-1].id})
          await waitFor('location.pathname==="/admin/laporan"&&!!document.querySelector(".admin-report-hero")')
          history=await send('Page.getNavigationHistory')
          await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex+1].id})
          await waitFor('location.pathname==="/admin/kelola-dana"&&!!document.querySelector(".admin-funds")')
          assert.equal(await evaluate('document.querySelector(".admin-transaction-dialog")'),null)
          await open()
          await click(`.admin-report-hero button:nth-child(${index})`)
          await waitFor('!!document.querySelector(".admin-transaction-dialog[open]")')
          await evaluate('window.reportHeroReload=true');await send('Page.reload')
          await waitFor('!window.reportHeroReload&&document.readyState==="complete"&&!!document.querySelector(".admin-funds")')
          assert.equal(await evaluate('document.querySelector(".admin-transaction-dialog")'),null)
          await open()
        }
        await noOverflow()
      }
    })
    await t.test('empat viewport: tiga jenis laporan lintas kategori, rekap bulanan, alignment filter dan saldo tetap', async () => {
      for (const [width, height] of [[1728,1080],[1366,768],[768,1024],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open('kelola-dana'); await waitFor('!!document.querySelector(".admin-funds-hero")')
        const fundsOverlay = await evaluate('getComputedStyle(document.querySelector(".admin-funds-hero")).backgroundImage.split("url(")[0]')
        await open('dashboard'); await waitFor('!!document.querySelector(".admin-balance-table")')
        const expectedSummary = await evaluate('document.querySelector(".admin-balance-table").textContent')
        await evaluate('window.adminReportNavigation=true')
        await navigate('laporan'); await waitFor('!!document.querySelector(".admin-report-tabs")')
        assert.equal(await evaluate('window.adminReportNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Laporan Keuangan')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/laporan')
        assert.equal(await summary(), expectedSummary)
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-report-hero")).backgroundImage.split("url(")[0]'), fundsOverlay)
        const controls = await evaluate('(()=>{const form=document.querySelector(".admin-report-filters"),input=[...form.querySelectorAll("input")],b=form.querySelector("button").getBoundingClientRect();return {height:form.getBoundingClientRect().height,centers:[...form.children].map(e=>{const r=e.getBoundingClientRect();return r.top+r.height/2}),floatingLabels:[...form.querySelectorAll("label")].every(e=>{const l=e.querySelector("span").getBoundingClientRect(),i=e.querySelector("input").getBoundingClientRect(),s=getComputedStyle(e.querySelector("input"));return l.top>i.top&&l.bottom<i.top+parseFloat(s.paddingTop)&&l.left>i.left&&l.right<i.right}),heights:input.map(e=>e.getBoundingClientRect().height),buttonHeight:b.height}})()')
        assert.equal(controls.buttonHeight,52)
        assert.deepEqual(controls.heights, [controls.buttonHeight, controls.buttonHeight])
        if (width >= 1024) { assert.ok(controls.height < 75); assert.ok(controls.centers.every(center=>Math.abs(center-controls.centers[0])<1)) }
        assert.equal(controls.floatingLabels,true)
        assert.match(await evaluate('document.querySelector(".admin-report-hero button:first-child svg").getAttribute("class")'), /circle-arrow-down/)
        assert.match(await evaluate('document.querySelector(".admin-report-hero button:nth-child(2) svg").getAttribute("class")'), /circle-arrow-up/)
        assert.match(await evaluate('document.querySelector(".admin-report-transactions--income header svg").getAttribute("class")'), /arrow-up-right/)
        assert.match(await evaluate('document.querySelector(".admin-report-transactions--expense header svg").getAttribute("class")'), /arrow-down-right/)
        assert.match(await evaluate('document.querySelector("#admin-report-tab-monthly svg").getAttribute("class")'), /file-text/)
        assert.equal(await evaluate('document.querySelector(".admin-report-balance h2").textContent'), 'Rp 17.228.200')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-tabs [role=tab]")].map(e=>e.textContent)'), ['Kas Masuk','Kas Keluar','Rekap Bulanan'])
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-transactions li")].map(e=>e.dataset.transactionId).sort()'), october.map((item) => item.id).sort())
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-transactions header > strong")].map(e=>e.textContent)'), ['Rp 1.791.500', 'Rp 1.427.500'])
        assert.match(await evaluate('document.querySelector(".admin-report-notice").textContent'), /transaksi historis.*bukan riwayat resmi/)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-actions button:not(:disabled),.admin-report dialog").length'), 0)
        if (width >= 640) assert.equal(await evaluate('new Set([...document.querySelectorAll(".admin-report-tabs button")].map(e=>Math.round(e.getBoundingClientRect().width))).size'), 1)
        await noOverflow(); await evaluate('document.querySelector(".admin-report-filters").scrollIntoView({block:"center"})'); await screenshot(`laporan-${width}-filter`); await evaluate('window.scrollTo(0,0)'); await screenshot(`laporan-${width}-top`); await screenshot(`laporan-${width}-full`, true)
        const activeColors = []
        for (const type of ['income','expense','monthly']) {
          await click(`#admin-report-tab-${type}`)
          if (type !== 'monthly') await click('.admin-report-page-size button:last-of-type')
          assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'), `admin-report-tab-${type}`)
          const expectedColor = type === 'expense' ? 'rgb(202, 0, 58)' : 'rgb(8, 120, 21)'
          activeColors.push(await evaluate('getComputedStyle(document.querySelector(".admin-report-tabs [aria-selected=true]")).backgroundColor'))
          assert.equal(activeColors.at(-1),expectedColor)
          if (type === 'monthly') {
            assert.equal(await evaluate('document.querySelector(".admin-report-ledger-heading h2").textContent'),'Rekap Bulanan 2026')
            assert.equal(await evaluate('document.querySelectorAll(".admin-report-monthly-table tbody").length'),10)
            assert.equal(await evaluate('document.querySelectorAll(".admin-report-monthly-table tr[data-category-id]").length'),30)
            assert.deepEqual(await evaluate('[...document.querySelectorAll("[data-month-total=\\"2026-10\\"] td")].map(e=>e.textContent)'),['16.864.200','1.791.500','1.427.500','17.228.200'])
            const totals=await evaluate('[...document.querySelectorAll(".admin-report-monthly-table [data-month-total]")].map(e=>[...e.querySelectorAll("td")].map(c=>Number(c.textContent.replaceAll(".",""))))')
            for (const [index,row] of totals.entries()) { assert.equal(row[0]+row[1]-row[2],row[3]); if(index) assert.equal(row[0],totals[index-1][3]) }
            assert.equal(totals.reduce((sum,row)=>sum+row[1],0),74941200)
            assert.equal(totals.reduce((sum,row)=>sum+row[2],0),64782500)
          } else {
            assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]")].map(e=>e.dataset.transactionId)'),fixture.filter(item=>item.type===type).map(item=>item.id))
            const amount=fixture.filter(item=>item.type===type).reduce((sum,item)=>sum+item.amount,0)
            assert.equal(await evaluate('document.querySelector(".admin-report-ledger-total strong").textContent'),`Rp ${new Intl.NumberFormat('id-ID').format(amount)}`)
            assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody .admin-report-category-label").length'),type==='income'?141:108)
            assert.deepEqual(await evaluate('[...new Set([...document.querySelectorAll(".admin-report-ledger-table tbody .admin-report-category-label")].map(e=>getComputedStyle(e).color))].sort()'),['rgb(0, 139, 67)','rgb(206, 87, 0)','rgb(36, 96, 222)'].sort())
          }
          await evaluate('window.scrollTo(0,document.querySelector(".admin-report-tabs").getBoundingClientRect().top+scrollY-160)')
          await noOverflow(); await screenshot(`laporan-${width}-${type}`)
          if (width===1728) await screenshot(`laporan-${width}-${type}-full`,true)
        }
        assert.equal(new Set(activeColors).size,2)
        await key('Home',36); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-income')
        await key('ArrowRight',39); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-expense')
        await key('End',35); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-monthly')
        await key('ArrowLeft',37); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-expense')
      }
    })
    await t.test('pencarian/rentang lokal, preset, validasi dan rekap parsial/kosong tanpa mengubah snapshot', async () => {
      await open(); await click('.admin-report-page-size button:last-of-type'); const initialSummary = await summary()
      await search(' INFAQ '); assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]").length'),fixture.filter(row=>row.type==='income'&&row.description.toLowerCase().includes('infaq')).length)
      await search('tidak ditemukan'); assert.match(await evaluate('document.querySelector(".admin-report-ledger-table tbody").textContent'),/Tidak ada transaksi mock/)
      await search(' '); assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]").length'),141)
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-presets button")].map(e=>e.textContent)'), ['1 minggu terakhir', '1 bulan terakhir', '3 bulan terakhir', 'Bulan ini'])
      for (let index = 0; index < 4; index++) {
        const expected = await evaluate(`(() => {const end=new Date(),start=new Date(end),day=start.getDate();if(${index}===0)start.setDate(day-6);else if(${index}===3)start.setDate(1);else {start.setDate(1);start.setMonth(start.getMonth()-(${index}===1?1:3));start.setDate(Math.min(day,new Date(start.getFullYear(),start.getMonth()+1,0).getDate()))}const f=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');return {startDate:f(start),endDate:f(end)}})()`)
        await click(`.admin-report-presets button:nth-child(${index+1})`)
        assert.deepEqual(await evaluate('Object.fromEntries([...document.querySelectorAll(".admin-report-filters input")].map(e=>[e.name,e.value]))'),expected)
        assert.equal(await evaluate(`document.querySelector('.admin-report-presets button:nth-child(${index+1})').getAttribute('aria-pressed')`),'true')
        const rows = fixture.filter(row=>row.date>=expected.startDate&&row.date<=expected.endDate)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),rows.length)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]").length'),rows.filter(row=>row.type==='income').length)
      }
      await setDate('startDate','2026-10-14'); await setDate('endDate','2026-10-14'); await click('.admin-report-filters button')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),1)
      assert.match(await evaluate('document.querySelector(".admin-report-transactions--income").textContent'),/Tidak ada transaksi mock pemasukan/)
      assert.match(await evaluate('document.querySelector(".admin-report-ledger-table tbody").textContent'),/Tidak ada transaksi mock/)
      await click('#admin-report-tab-expense'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]").length'),1)
      await setDate('startDate','2026-10-15'); await click('.admin-report-filters button')
      assert.match(await evaluate('document.querySelector("#admin-report-range-error").textContent'),/tidak boleh melebihi/)
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),1)
      await setDate('startDate',''); await click('.admin-report-filters button'); assert.match(await evaluate('document.querySelector("#admin-report-range-error").textContent'),/tanggal yang valid/)
      await setDate('startDate','2026-10-16'); await setDate('endDate','2026-10-20'); await click('.admin-report-filters button')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),0)
      await click('#admin-report-tab-monthly')
      const empty=await evaluate('[...document.querySelectorAll(".admin-report-monthly-table [data-month-total] td")].map(e=>e.textContent)')
      assert.deepEqual(empty,['17.228.200','0','0','17.228.200'])
      assert.equal(await summary(),initialSummary)
      await setDate('startDate','2026-10-01'); await setDate('endDate','2026-10-20'); await click('.admin-report-filters button'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),13)
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-presets [aria-pressed=true]").length'),0)
      await click('#admin-report-tab-income'); await search('pengajian'); await click('#admin-report-tab-expense')
      assert.equal(await evaluate('document.querySelector(".admin-report-search input").value'),'')
      await evaluate('document.querySelector(".admin-report-ledger .admin-table-scroll").focus()'); await key('ArrowRight',39)
      await waitFor('document.querySelector(".admin-report-ledger .admin-table-scroll").scrollLeft>0')
      await noOverflow(); await screenshot('laporan-mobile-scroll-tabel')
      await setDate('startDate','2026-01-01'); await setDate('endDate','2026-01-31'); await click('.admin-report-filters button')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),26)
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]").length'),11)
      assert.equal(await evaluate('document.querySelector("#admin-report-detail-title").textContent'),'Detail Riwayat Mock')
      assert.equal(await summary(),initialSummary)
      await click('#admin-report-tab-income'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody tr[data-transaction-id]").length'),15)
      await click('#admin-report-tab-monthly'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-monthly-table tbody").length'),1)
      await setDate('startDate','2026-01-15'); await setDate('endDate','2026-02-18'); await click('.admin-report-filters button')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-monthly-table tbody").length'),2)
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-monthly-table [data-category-id]").length'),6)
      await noOverflow(); await screenshot('laporan-filter-parsial',true)
    })
    await t.test('preset memakai hari lokal berbeda dari UTC dan periode tanpa data menampilkan empty state', async () => {
      await send('Emulation.setTimezoneOverride', { timezoneId: 'America/Los_Angeles' })
      const script = await send('Page.addScriptToEvaluateOnNewDocument', { source: `const OriginalDate=Date;globalThis.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:['2026-11-11T01:00:00Z']))}static now(){return new OriginalDate('2026-11-11T01:00:00Z').getTime()}}` })
      try {
        await open()
        for (const [index, start] of ['2026-11-04','2026-10-10','2026-08-10','2026-11-01'].entries()) {
          await click(`.admin-report-presets button:nth-child(${index+1})`)
          assert.equal(await evaluate('document.querySelector("[name=startDate]").value'), start)
          assert.equal(await evaluate('document.querySelector("[name=endDate]").value'), '2026-11-10')
        }
        assert.match(await evaluate('document.querySelector(".admin-report-ledger-table tbody").textContent'), /Tidak ada transaksi mock/)
        await click('#admin-report-tab-monthly')
        assert.match(await evaluate('document.querySelector(".admin-report-monthly-table tbody").textContent'), /Tidak ada transaksi mock/)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-monthly-table [data-month-total]").length'), 0)
      } finally {
        await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier })
        await send('Emulation.setTimezoneOverride', { timezoneId: '' })
        await open()
      }
    })
    await t.test('Lihat Semua Kelola Dana menuju hash Kas Masuk di bawah banner, sedangkan Sidebar tetap membuka dari atas', async () => {
      for (const [width,height] of [[1728,1080],[1366,768],[768,1024],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await open(); await click('#admin-report-tab-expense')
        await navigate('kelola-dana'); await waitFor('!!document.querySelector(".admin-recent-heading button:not(:disabled)")')
        await evaluate('window.viewAllNavigation=true')
        await click('.admin-recent-heading button')
        await waitFor('location.pathname==="/admin/laporan"&&location.hash==="#kas-masuk"&&!!document.querySelector("#kas-masuk")&&scrollY>500')
        await evaluate('document.fonts.ready')
        await waitFor('document.querySelector(".admin-report-tabs [aria-selected=true]").id==="admin-report-tab-income"')
        const position=await evaluate('(()=>{const nav=document.querySelector("#kas-masuk").getBoundingClientRect(),header=document.querySelector(".admin-topbar"),h=getComputedStyle(header).position,edge=["sticky","fixed"].includes(h)?header.getBoundingClientRect().bottom:0;return {top:nav.top,bottom:nav.bottom,edge,title:document.querySelector(".admin-report-ledger-heading h2").getBoundingClientRect().top}})()')
        assert.ok(position.top>=position.edge+12&&position.top<=position.edge+20,JSON.stringify(position))
        assert.ok(position.bottom<height&&position.title>=position.bottom)
        assert.equal(await evaluate('window.viewAllNavigation'),true)
        assert.equal(await evaluate('document.activeElement.id'),'admin-report-tab-income')
        assert.equal(await evaluate('document.querySelector(".admin-report-ledger-heading h2").textContent'),'Kas Masuk')
        await screenshot(`lihat-semua-${width}`)
        await click('#admin-report-tab-expense')
        assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'),'admin-report-tab-expense')
        await navigate('laporan'); await waitFor('location.hash===""&&scrollY===0')
        assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'),'admin-report-tab-expense')
        await navigate('kelola-dana'); await waitFor('location.pathname==="/admin/kelola-dana"&&!!document.querySelector(".admin-funds")')
        await navigate('laporan'); await waitFor('location.pathname==="/admin/laporan"&&!!document.querySelector(".admin-report-tabs")&&location.hash===""&&scrollY===0')
        assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'),'admin-report-tab-income')
        await open('laporan#kas-masuk'); await waitFor('!!document.querySelector("#kas-masuk")&&scrollY>500')
        assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'),'admin-report-tab-income')
      }
    })
    await t.test('banner menuju halaman pengaturan unduhan, Batal kembali tanpa mengubah konteks laporan', async () => {
      await open()
      assert.equal(await evaluate('document.querySelector(".admin-report-download h2").textContent'),'Unduh Laporan Keuangan')
      await click('.admin-report-download button');await waitFor('location.pathname==="/admin/laporan/unduh"&&!!document.querySelector(".admin-download-settings")')
      assert.equal(await evaluate('document.querySelector(".admin-download-month-range input").value'),'2026-10')
      assert.equal(await evaluate('document.querySelector("dialog")'),null)
      await click('.admin-download-settings > footer a');await waitFor('location.pathname==="/admin/laporan"&&!!document.querySelector(".admin-report-tabs")')
    })
    await t.test('refresh/trailing slash, navigasi admin lama dan mode API tanpa endpoint/fallback karangan', async () => {
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'),{local:0,session:0,cookie:''})
      for (const [route,selector] of [['dashboard','.admin-dashboard'],['kelola-dana','.admin-funds'],['kategori-dana','.admin-categories'],['kwitansi','.admin-receipt'],['activity-log','.admin-activity-card'],['profil-masjid','.admin-profile'],['agenda','.admin-agenda'],['kontak-pengaturan','.admin-settings'],['kelola-akun','.admin-accounts'],['kode-akses-laporan','.admin-report-access']]) {
        await navigate(route); await waitFor(`!!document.querySelector('${selector}')`); await navigate('laporan'); await waitFor('!!document.querySelector(".admin-report-tabs")')
      }
      await open('laporan/'); await waitFor('!!document.querySelector(".admin-report-tabs")')
      assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'),'admin-report-tab-income')
      await open('laporan',apiUrl); await waitFor('!!document.querySelector(".admin-dashboard-state[role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-dashboard-state").textContent'),/Dashboard admin melalui API belum tersedia/)
      assert.equal(await evaluate('!!document.querySelector(".admin-report")'),false)
      assert.deepEqual(requests,[]); assert.deepEqual(failures,[])
    })
  } finally { await send('Browser.setDownloadBehavior',{behavior:'default'}); ws.close(); await fetch(`${cdpUrl}/json/close/${target.id}`) }
})
