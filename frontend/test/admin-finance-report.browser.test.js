import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { mockAdminDashboard } from '../src/mocks/adminDashboard.js'
import { mockAdminFinanceHistory, mockAdminFinanceOctober } from '../src/mocks/adminFinanceReport.js'

const fixture = [...mockAdminFinanceHistory, ...mockAdminFinanceOctober, ...mockAdminDashboard.recentTransactions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
const october = fixture.filter((row) => row.date.startsWith('2026-10'))

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL
const phase = process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'

test('Laporan admin: snapshot, tiga kategori, filter mock dan PNG ringkasan pada Chrome QA', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 60000,
}, async (t) => {
  const output = fileURLToPath(new URL(`../../tmp/admin112-refinement-qa/${phase}/`, import.meta.url))
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
  const open = async (route = 'laporan', origin = baseUrl) => { await send('Page.navigate', { url: `${origin}/admin/${route}` }); await waitFor('document.readyState==="complete" && !!document.querySelector(".admin-shell")'); if (route === 'laporan' && origin === baseUrl) await waitFor('!!document.querySelector(".admin-report-tabs")'); await evaluate('document.fonts.ready') }
  const navigate = async (route) => { if (await evaluate('innerWidth<1024')) await click('.admin-menu-toggle'); await click(`.admin-nav-link[href="/admin/${route}"]`) }
  const screenshot = async (name, full = false) => {
    const size = await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})')
    const png = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(full ? { clip: { x: 0, y: 0, ...size, scale: 1 } } : {}) })
    await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64'))
  }
  const readDownload = async (index) => {
    for (let attempt = 0; attempt < 300; attempt++) { const file = downloads[index]; if (file?.state === 'completed') return { ...file, bytes: await readFile(`${output}downloads/${file.guid}`) }; assert.notEqual(file?.state, 'canceled'); await new Promise((resolve) => setTimeout(resolve, 20)) }
    assert.fail('Unduhan ringkasan PNG tidak selesai.')
  }
  const summary = () => evaluate('document.querySelector(".admin-report > .admin-balance .admin-balance-table").textContent')
  const noOverflow = async () => {
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false)
    assert.equal(await evaluate('[...document.querySelectorAll(".admin-report-hero,.admin-report-balance,.admin-report-category-card,.admin-report-tabs button,.admin-report-category-tools article,.admin-report-toast")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth})'), true)
  }
  try {
    await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable')
    await send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: `${output}downloads`, eventsEnabled: true })
    await t.test('empat viewport: navigasi, saldo identik Dashboard, fixture lengkap dan tepat tiga tab kategori dengan warna/data aktif', async () => {
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
        const controls = await evaluate('(()=>{const inputs=[...document.querySelectorAll(".admin-report-filters input")].map(e=>e.getBoundingClientRect()),b=document.querySelector(".admin-report-filters button").getBoundingClientRect();return {bottoms:inputs.map(r=>r.bottom),buttonBottom:b.bottom,heights:inputs.map(r=>r.height),buttonHeight:b.height}})()')
        assert.equal(controls.buttonHeight, width < 1024 ? 44 : 36)
        assert.deepEqual(controls.heights, [controls.buttonHeight, controls.buttonHeight])
        if (width >= 480) assert.ok(controls.bottoms.every(bottom=>Math.abs(bottom-controls.buttonBottom)<1))
        assert.match(await evaluate('document.querySelector(".admin-report-hero button:first-child svg").getAttribute("class")'), /circle-arrow-down/)
        assert.match(await evaluate('document.querySelector(".admin-report-hero button:nth-child(2) svg").getAttribute("class")'), /circle-arrow-up/)
        assert.match(await evaluate('document.querySelector(".admin-report-transactions--income header svg").getAttribute("class")'), /arrow-up-right/)
        assert.match(await evaluate('document.querySelector(".admin-report-transactions--expense header svg").getAttribute("class")'), /arrow-down-right/)
        assert.match(await evaluate('document.querySelector("#admin-report-tab-maintenance svg").getAttribute("class")'), /file-text/)
        assert.equal(await evaluate('document.querySelector(".admin-report-balance h2").textContent'), 'Rp 17.228.200')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-tabs [role=tab]")].map(e=>e.textContent)'), mockAdminDashboard.categories.map((category) => category.label))
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-transactions li")].map(e=>e.dataset.transactionId).sort()'), october.map((item) => item.id).sort())
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-transactions header > strong")].map(e=>e.textContent)'), ['Rp 1.791.500', 'Rp 1.427.500'])
        assert.match(await evaluate('document.querySelector(".admin-report-notice").textContent'), /transaksi simulasi.*bukan riwayat resmi/)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-actions button:not(:disabled),.admin-report dialog").length'), 0)
        if (width >= 640) assert.equal(await evaluate('new Set([...document.querySelectorAll(".admin-report-tabs button")].map(e=>Math.round(e.getBoundingClientRect().width))).size'), 1)
        await noOverflow(); await evaluate('window.scrollTo(0,0)'); await screenshot(`laporan-${width}-top`); await screenshot(`laporan-${width}-full`, true)
        const activeColors = []
        for (const category of mockAdminDashboard.categories) {
          await click(`#admin-report-tab-${category.id}`)
          assert.equal(await evaluate('document.querySelector(".admin-report-category-detail > h2").textContent'), category.label)
          assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'), `admin-report-tab-${category.id}`)
          assert.equal(await evaluate('document.querySelector(".admin-report-category-total strong").textContent'), `Rp ${new Intl.NumberFormat('id-ID').format(category.openingBalance+category.income-category.expense)}`)
          assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-report-category-table tbody tr[data-transaction-id]")].map(e=>e.dataset.transactionId)'), fixture.filter((item) => item.categoryId === category.id).map((item) => item.id))
          activeColors.push(await evaluate('getComputedStyle(document.querySelector(".admin-report-tabs [aria-selected=true]")).backgroundColor'))
          assert.ok(await evaluate('document.querySelectorAll(".admin-report-category-table tbody .admin-report-amount--income").length>0&&document.querySelectorAll(".admin-report-category-table tbody .admin-report-amount--expense").length>0'))
          await noOverflow(); await screenshot(`laporan-${width}-${category.id}`)
        }
        assert.equal(new Set(activeColors).size, 3)
        await key('Home',36); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-mosque')
        await key('ArrowRight',39); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-friday')
        await key('End',35); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-maintenance')
        await key('ArrowLeft',37); assert.equal(await evaluate('document.activeElement.id'), 'admin-report-tab-friday')
      }
    })
    await t.test('pencarian/rentang lokal, preset, validasi dan empty state tidak mengubah saldo snapshot', async () => {
      await open(); const initialSummary = await summary()
      await search(' INFAQ '); assert.equal(await evaluate('document.querySelectorAll(".admin-report-category-table tbody tr[data-transaction-id]").length'),fixture.filter(row=>row.categoryId==='mosque'&&row.description.toLowerCase().includes('infaq')).length)
      await search('tidak ditemukan'); assert.match(await evaluate('document.querySelector(".admin-report-category-table tbody").textContent'),/Tidak ada transaksi mock/)
      await search(' '); assert.equal(await evaluate('document.querySelectorAll(".admin-report-category-table tbody tr[data-transaction-id]").length'),172)
      await click('.admin-report-presets button:first-child')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),4)
      await setDate('startDate','2026-10-14'); await setDate('endDate','2026-10-14'); await click('.admin-report-filters button')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),1)
      assert.match(await evaluate('document.querySelector(".admin-report-transactions--income").textContent'),/Tidak ada transaksi mock pemasukan/)
      await setDate('startDate','2026-10-15'); await click('.admin-report-filters button')
      assert.match(await evaluate('document.querySelector("#admin-report-range-error").textContent'),/tidak boleh melebihi/)
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),1)
      await setDate('startDate',''); await click('.admin-report-filters button'); assert.match(await evaluate('document.querySelector("#admin-report-range-error").textContent'),/tanggal yang valid/)
      await setDate('startDate','2025-12-31'); await click('.admin-report-filters button'); assert.match(await evaluate('document.querySelector("#admin-report-range-error").textContent'),/di dalam riwayat mock/)
      await setDate('startDate','2026-10-16'); await setDate('endDate','2026-10-20'); await click('.admin-report-filters button')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),0)
      assert.equal(await summary(),initialSummary)
      await click('.admin-report-presets button:nth-child(2)'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),13)
      await click('#admin-report-tab-maintenance'); await search('pengajian'); assert.match(await evaluate('document.querySelector(".admin-report-category-table tbody").textContent'),/Tidak ada transaksi mock/)
      await click('#admin-report-tab-mosque'); assert.equal(await evaluate('document.querySelector(".admin-report-search input").value'),'')
      await noOverflow(); await screenshot('laporan-filter-kategori',true)
      await evaluate('document.querySelector(".admin-report-category-detail .admin-table-scroll").focus()'); await key('ArrowRight',39)
      await waitFor('document.querySelector(".admin-report-category-detail .admin-table-scroll").scrollLeft>0')
      await screenshot('laporan-mobile-scroll-tabel')
      await setDate('startDate','2026-01-01'); await setDate('endDate','2026-01-31'); await click('.admin-report-filters button')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-transactions li").length'),26)
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-category-table tbody tr[data-transaction-id]").length'),18)
      assert.equal(await evaluate('document.querySelector("#admin-report-detail-title").textContent'),'Detail Riwayat Mock')
      assert.equal(await summary(),initialSummary)
      await click('#admin-report-tab-friday'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-category-table tbody tr[data-transaction-id]").length'),4)
      await click('#admin-report-tab-maintenance'); assert.equal(await evaluate('document.querySelectorAll(".admin-report-category-table tbody tr[data-transaction-id]").length'),4)
      await noOverflow(); await screenshot('laporan-filter-januari',true)
    })
    await t.test('PNG snapshot nyata mencakup seluruh kategori, toast sukses setelah trigger, error dan auto-dismiss', async () => {
      for (const [width,height] of [[1728,1080],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await open(); await click('#admin-report-tab-friday'); await search('kosong')
        const index=downloads.length
        await evaluate(`window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...args){originalToBlob.call(this,blob=>{window.resumeReport=()=>callback(blob)},...args)};window.originalAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.reportDownloadUrl=this.href;return originalAnchorClick.call(this)}`)
        await click('.admin-report-download button'); await waitFor('typeof window.resumeReport==="function"')
        assert.equal(await evaluate('!!document.querySelector(".admin-report-toast")'),false); assert.equal(downloads.length,index)
        assert.equal(await evaluate('document.querySelector(".admin-report-download button").disabled'),true)
        await evaluate('window.resumeReport();delete window.resumeReport;HTMLCanvasElement.prototype.toBlob=originalToBlob')
        await waitFor('!!document.querySelector(".admin-report-toast--success")'); const started=Date.now()
        await evaluate('HTMLAnchorElement.prototype.click=originalAnchorClick')
        assert.equal(await evaluate('document.querySelector(".admin-report-toast").textContent'),'Laporan berhasil diunduh')
        assert.equal(await evaluate('document.querySelector(".admin-report-toast").getAttribute("role")'),'status')
        const file=await readDownload(index)
        assert.equal(file.suggestedFilename,'ringkasan-keuangan-admin-contoh-2026-10-20.png')
        assert.equal(file.bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a'); assert.equal(file.bytes.readUInt32BE(16),2240)
        await writeFile(`${output}ringkasan-${width}.png`,file.bytes)
        assert.equal(await evaluate('(async()=>{const image=await createImageBitmap(await(await fetch(reportDownloadUrl)).blob());const ok=image.width===2240&&image.height>900;image.close();return ok})()'),true)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-export-sheet tbody tr").length'),3)
        assert.match(await evaluate('document.querySelector(".admin-report-export-sheet").textContent'),/Data contoh.*17\.228\.200/s)
        await noOverflow(); await screenshot(`laporan-${width}-toast`)
        await waitFor('!document.querySelector(".admin-report-toast")'); assert.ok(Date.now()-started>=2700&&Date.now()-started<4500)
      }
      for (const mode of ['render','download']) {
        const index=downloads.length
        await evaluate(mode==='render'?'window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback){callback(null)}':'window.originalAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){throw new Error("Unduhan diblokir untuk QA")}')
        await click('.admin-report-download button'); await waitFor('!!document.querySelector(".admin-report-toast--error")')
        assert.match(await evaluate('document.querySelector(".admin-report-toast").textContent'),/Laporan gagal diunduh/)
        assert.equal(downloads.length,index); assert.equal(await evaluate('!!document.querySelector(".admin-report-toast--success")'),false)
        await evaluate('HTMLCanvasElement.prototype.toBlob=originalToBlob;HTMLAnchorElement.prototype.click=originalAnchorClick')
        await screenshot(`laporan-error-${mode}`); await waitFor('!document.querySelector(".admin-report-toast")')
      }
    })
    await t.test('refresh/trailing slash, navigasi admin lama dan mode API tanpa endpoint/fallback karangan', async () => {
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'),{local:0,session:0,cookie:''})
      for (const [route,selector] of [['dashboard','.admin-dashboard'],['kelola-dana','.admin-funds'],['kategori-dana','.admin-categories'],['kwitansi','.admin-receipt'],['activity-log','.admin-activity-card'],['profil-masjid','.admin-profile'],['agenda','.admin-agenda'],['kontak-pengaturan','.admin-settings'],['kelola-akun','.admin-accounts'],['kode-akses-laporan','.admin-report-access']]) {
        await navigate(route); await waitFor(`!!document.querySelector('${selector}')`); await navigate('laporan'); await waitFor('!!document.querySelector(".admin-report-tabs")')
      }
      await open('laporan/'); await waitFor('!!document.querySelector(".admin-report-tabs")')
      assert.equal(await evaluate('document.querySelector(".admin-report-tabs [aria-selected=true]").id'),'admin-report-tab-mosque')
      await open('laporan',apiUrl); await waitFor('!!document.querySelector(".admin-dashboard-state[role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-dashboard-state").textContent'),/Dashboard admin melalui API belum tersedia/)
      assert.equal(await evaluate('!!document.querySelector(".admin-report")'),false)
      assert.deepEqual(requests,[]); assert.deepEqual(failures,[])
    })
  } finally { await send('Browser.setDownloadBehavior',{behavior:'default'}); ws.close(); await fetch(`${cdpUrl}/json/close/${target.id}`) }
})
