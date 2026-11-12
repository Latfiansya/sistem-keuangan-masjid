import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { formatReportRange } from '../src/utils/reportFormatters.js'
import { getAdminFinancePreset } from '../src/services/adminFinanceReportService.js'
import { getAdminHistoricalTransactions } from '../src/services/adminTransactionData.js'
import { mockAdminDashboard } from '../src/mocks/adminDashboard.js'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL

test('Admin 1.17: dua halaman, mode periode, format awal dan ekspor portrait penuh', { skip: !baseUrl || !cdpUrl, timeout: 300000 }, async (t) => {
  const output = fileURLToPath(new URL(`../../tmp/admin117-refinement-qa/${process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'}/`, import.meta.url))
  await mkdir(output, { recursive: true })
  const target = await (await fetch(`${cdpUrl}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map(), failures = [], requests = [], downloads = []
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result) }
    if (message.method === 'Browser.downloadWillBegin') downloads.push(message.params)
    if (message.method === 'Browser.downloadProgress') { const file = downloads.find((item) => item.guid === message.params.guid); if (file) Object.assign(file, message.params) }
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push(message.params.response.url)
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type) && message.params.request.url.startsWith('http') && !message.params.request.url.includes('/assets/')) requests.push(message.params.request.url)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async (expression) => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text); return result.result.value }
  const waitFor = async (expression) => { for (let attempt = 0; attempt < 1500; attempt++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 20)) } await screenshot('gagal-navigasi');assert.fail(`Kondisi browser tidak tercapai: ${expression}; lokasi=${await evaluate('location.pathname')}`) }
  const click = async (selector) => { const point = await evaluate(`(async()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 }) }
  const key = async (value, code, modifiers = 0) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: value, code: value, windowsVirtualKeyCode: code, modifiers, ...(value === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }) }
  const open = async (path, selector) => { await evaluate('window.admin115Navigation = true'); const navigation = await send('Page.navigate', { url: `${baseUrl}${path}` }); if (!navigation.loaderId) await evaluate('delete window.admin115Navigation'); await waitFor(`!window.admin115Navigation && document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`); await evaluate('document.fonts.ready'); await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))') }
  const screenshot = async (name) => { const png = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64')) }
  const noOverflow = async () => {
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false)
    assert.equal(await evaluate('[...document.querySelectorAll(".admin-download-flow,.admin-download-settings,.admin-download-document-summary,.admin-download-page-frame")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&e.scrollWidth<=e.clientWidth})'),true)
  }
  const settings=async()=>{await click('.admin-report-download button');await waitFor('location.pathname==="/admin/laporan/unduh"&&!!document.querySelector(".admin-download-settings")')}
  const next=async()=>{await click('.admin-download-primary');await waitFor('location.pathname==="/admin/laporan/unduh/pratinjau"&&document.querySelectorAll(".admin-download-preview-pages .admin-download-sheet").length>0');await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
  const month=async(index,value)=>{await evaluate(`(()=>{const e=document.querySelectorAll('.admin-download-month-range input')[${index}];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)}
  const readDownload=async(index)=>{for(let i=0;i<2000;i++){const file=downloads[index];if(file?.state==='completed')return{...file,bytes:await readFile(`${output}downloads/${file.guid}`)};assert.notEqual(file?.state,'canceled');await new Promise(r=>setTimeout(r,25))}assert.fail('Unduhan tidak selesai')}
  const assertSheets=async()=>{assert.equal(await evaluate(`(()=>{return [...document.querySelectorAll('.admin-download-preview-pages .admin-download-sheet')].every(sheet=>{const end=sheet.querySelector('footer').getBoundingClientRect().top;return [...sheet.querySelectorAll('[data-export-row]')].every(row=>row.getBoundingClientRect().bottom<=end+1)})})()`),true)}
  const field=async(selector,value)=>{await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`)}
  const selectMode=async(mode)=>{await click(`.admin-download-mode input[value=${mode}]`)}
  const changeSettings=async()=>{await click('[data-back-settings]');await waitFor('location.pathname==="/admin/laporan/unduh"&&!!document.querySelector(".admin-download-settings")')}
  const primary='.admin-download-heading-actions .admin-download-primary'
  const pdfCheck=bytes=>{assert.equal(bytes.subarray(0,5).toString(),'%PDF-');const box=bytes.toString('latin1').match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);assert.ok(box);assert.ok(Math.abs(Number(box[1])-595.28)<.01);assert.ok(Math.abs(Number(box[2])-841.89)<.01)}
  try {
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable')
    await mkdir(`${output}downloads`,{recursive:true});await send('Browser.setDownloadBehavior',{behavior:'allowAndName',downloadPath:`${output}downloads`,eventsEnabled:true})
    await t.test('dua halaman memakai AdminLayout, pilihan awal dan preview lebar berurutan, Batal mempertahankan filter tabel pada empat viewport',async()=>{
      for(const [width,height]of [[1728,1080],[1366,768],[768,1024],[390,844]]){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await open('/admin/laporan','.admin-report-download')
        await field('.admin-report-search input','tidak_ada_transaksi_QA')
        await settings()
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'),'/admin/laporan')
        assert.equal(await evaluate('document.querySelector(".admin-download-month-range input").value'),'2026-10')
        assert.equal(await evaluate('document.querySelector(".admin-download-format input:checked").value'),'pdf')
        assert.equal(await evaluate('document.querySelectorAll(".admin-download-types input").length'),3)
        assert.equal(await evaluate('document.querySelector(".admin-download-types").textContent.includes("Laporan Bulanan")'),false)
        assert.equal(await evaluate('document.querySelector("dialog")'),null)
        assert.match(await evaluate('document.querySelector(".admin-download-selection").textContent'),/17\.228\.200/)
        await noOverflow();await screenshot(`pengaturan-${width}`)
        await next()
        assert.equal(await evaluate('document.querySelectorAll(".admin-download-preview-pages .admin-download-sheet").length'),1)
        assert.equal(await evaluate('document.querySelectorAll(".admin-download-heading-actions button").length'),1)
        assert.equal(await evaluate('document.querySelector(".admin-download-format")'),null)
        assert.equal(await evaluate('document.querySelector(".admin-download-page-count,dialog")'),null)
        if(width>=1366)assert.ok(await evaluate('document.querySelector(".admin-download-page-frame").getBoundingClientRect().width')>=794)
        await assertSheets();await noOverflow();await screenshot(`preview-${width}`)
        await changeSettings();assert.equal(await evaluate('document.querySelector(".admin-download-types input:checked").value'),'monthly')
        await click('.admin-download-settings > footer a');await waitFor('!!document.querySelector(".admin-report-search")')
        assert.equal(await evaluate('document.querySelector(".admin-report-search input").value'),'tidak_ada_transaksi_QA')
      }
    })
    await t.test('validasi, periode eksklusif, tanggal inklusif, bulan lintas tahun dan format tersimpan saat kembali/Back/Forward',async()=>{
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false})
      await open('/admin/laporan/unduh','.admin-download-settings')
      await click('.admin-download-types input[value=monthly]');await click('.admin-download-primary')
      assert.equal(await evaluate('location.pathname'),'/admin/laporan/unduh')
      assert.match(await evaluate('document.querySelector("[role=alert]").textContent'),/minimal satu/)
      for(const id of ['income','expense','monthly'])await click(`.admin-download-types input[value=${id}]`)
      await selectMode('dates')
      assert.equal(await evaluate('document.querySelector(".admin-download-month-range,.admin-download-presets")'),null)
      await field('.admin-download-date-range input[name=startDate]','2026-10-16');await field('.admin-download-date-range input[name=endDate]','2026-10-15')
      await click('.admin-download-primary');assert.match(await evaluate('document.querySelector("[role=alert]").textContent'),/tidak boleh/)
      await field('.admin-download-date-range input[name=startDate]','');await click('.admin-download-primary')
      assert.match(await evaluate('document.querySelector("[role=alert]").textContent'),/harus diisi/)
      await field('.admin-download-date-range input[name=startDate]','2026-10-15')
      await click('.admin-download-format input[value=png]')
      assert.equal(await evaluate('document.querySelectorAll(".admin-download-format input:checked").length'),1)
      await next()
      const expected=getAdminHistoricalTransactions(mockAdminDashboard).filter(row=>row.date==='2026-10-15').map(row=>row.id).sort()
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-download-preview-pages [data-transaction-id]")].map(e=>e.dataset.transactionId).sort()'),expected)
      assert.match(await evaluate('document.querySelector(".admin-download-heading-actions button").textContent'),/Unduh PNG \(ZIP\)/)
      await changeSettings()
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-download-date-range input")].map(e=>e.value)'),['2026-10-15','2026-10-15'])
      assert.equal(await evaluate('document.querySelector(".admin-download-format input:checked").value'),'png')
      await selectMode('months');assert.equal(await evaluate('document.querySelector(".admin-download-date-range")'),null)
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-download-month-range input")].map(e=>e.value)'),['2026-10','2026-10'])
      await month(0,'2025-12');await month(1,'2026-03')
      await field('.admin-download-year select','2026')
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-download-month-range input")].map(e=>e.value)'),['2026-12','2027-03'])
      await click('.admin-download-months button:nth-child(4)')
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-download-month-range input")].map(e=>e.value)'),['2026-04','2026-04'])
      await selectMode('preset')
      for(const [index,preset]of [[1,'week'],[2,'month'],[3,'quarter']]){
        await click(`.admin-download-presets button:nth-child(${index})`)
        const expected=getAdminFinancePreset(preset)
        assert.match(await evaluate('document.querySelector(".admin-download-selected-period").textContent'),new RegExp(formatReportRange(expected)))
        assert.equal(await evaluate(`document.querySelector('.admin-download-presets button:nth-child(${index})').getAttribute('aria-pressed')`),'true')
      }
      await selectMode('dates');await field('.admin-download-date-range input[name=startDate]','2027-01-01');await field('.admin-download-date-range input[name=endDate]','2027-01-31')
      await next();assert.equal(await evaluate('document.querySelectorAll(".admin-download-preview-pages [data-transaction-id]").length'),0)
      assert.match(await evaluate('document.querySelector(".admin-download-preview-pages").textContent'),/Tidak ada transaksi mock/)
      const history=await send('Page.getNavigationHistory');await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex-1].id})
      await waitFor('location.pathname==="/admin/laporan/unduh"&&!!document.querySelector(".admin-download-settings")')
      assert.equal(await evaluate('document.querySelector(".admin-download-format input:checked").value'),'png')
      const back=await send('Page.getNavigationHistory');await send('Page.navigateToHistoryEntry',{entryId:back.entries[back.currentIndex+1].id})
      await waitFor('location.pathname==="/admin/laporan/unduh/pratinjau"&&document.querySelectorAll(".admin-download-preview-pages .admin-download-sheet").length===3')
    })
    await t.test('format dipilih di awal, PDF/PNG tunggal A4, toast setelah trigger, loading/error/auto-dismiss pada desktop dan mobile',async()=>{
      await open('/admin/laporan/unduh','.admin-download-settings');await next()
      await evaluate('window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...rest){window.resumeExport=()=>originalToBlob.call(this,callback,...rest)}')
      const index=downloads.length;await click(primary);await waitFor('typeof window.resumeExport==="function"')
      assert.equal(await evaluate('!!document.querySelector(".admin-report-toast--success")'),false);assert.equal(downloads.length,index)
      assert.equal(await evaluate('document.querySelector(".admin-download-heading-actions button").disabled'),true)
      await evaluate('HTMLCanvasElement.prototype.toBlob=originalToBlob;window.resumeExport();delete window.resumeExport')
      const pdf=await readDownload(index);pdfCheck(pdf.bytes)
      assert.equal((pdf.bytes.toString('latin1').match(/\/Type \/Page\b/g)||[]).length,1)
      await writeFile(`${output}contoh-rekap-oktober.pdf`,pdf.bytes)
      await waitFor('!!document.querySelector(".admin-report-toast--success")');const start=Date.now()
      assert.equal(await evaluate('document.querySelector(".admin-report-toast").textContent'),'Laporan berhasil diunduh')
      assert.equal(await evaluate('document.querySelector(".admin-report-toast").getAttribute("role")'),'status')
      await screenshot('toast-sukses');await waitFor('!document.querySelector(".admin-report-toast")');assert.ok(Date.now()-start>=2600)
      await changeSettings();await click('.admin-download-format input[value=png]');await next()
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false})
      const pngIndex=downloads.length;await click(primary);const png=await readDownload(pngIndex)
      assert.match(png.suggestedFilename,/\.png$/);assert.equal(png.bytes.readUInt32BE(16),1588);assert.equal(png.bytes.readUInt32BE(20),2246)
      await writeFile(`${output}contoh-rekap-oktober.png`,png.bytes);await noOverflow()
      for(const mode of ['render','download']){
        await evaluate(mode==='render'?'window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback){callback(null)}':'window.originalAnchorClick=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){throw new Error("Unduhan diblokir untuk QA")}')
        const before=downloads.length;await click(primary);await waitFor('!!document.querySelector(".admin-report-toast--error")')
        assert.equal(downloads.length,before);assert.equal(await evaluate('!!document.querySelector(".admin-report-toast--success")'),false)
        assert.match(await evaluate('document.querySelector(".admin-report-toast--error").textContent'),/Laporan gagal diunduh/)
        await evaluate(mode==='render'?'HTMLCanvasElement.prototype.toBlob=originalToBlob':'HTMLAnchorElement.prototype.click=originalAnchorClick')
        await waitFor('!document.querySelector(".admin-report-toast")')
      }
    })
    await t.test('pagination tabel tidak membatasi ekspor 249 transaksi, rekap lengkap serta PDF/ZIP multipage tanpa baris terpotong',async()=>{
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false})
      await open('/admin/laporan','.admin-report-download')
      assert.equal(await evaluate('document.querySelectorAll(".admin-report-ledger-table tbody [data-transaction-id]").length'),20)
      await field('.admin-report-search input','tidak_ada_transaksi_QA')
      await settings();await month(0,'2026-01');await month(1,'2026-10')
      for(const id of ['income','expense'])await click(`.admin-download-types input[value=${id}]`)
      await next();await assertSheets();await noOverflow()
      const ids=await evaluate('[...document.querySelectorAll(".admin-download-preview-pages [data-transaction-id]")].map(e=>e.dataset.transactionId)')
      assert.equal(ids.length,249);assert.equal(new Set(ids).size,249)
      assert.deepEqual(ids.toSorted(),getAdminHistoricalTransactions(mockAdminDashboard).map(row=>row.id).sort())
      const count=await evaluate('document.querySelectorAll(".admin-download-preview-pages .admin-download-sheet").length')
      assert.ok(count>3)
      assert.equal(await evaluate('new Set([...document.querySelectorAll(".admin-download-page-frame")].map(e=>e.getBoundingClientRect().left)).size'),1)
      assert.match(await evaluate('document.querySelector(".admin-download-preview-pages").textContent'),/17\.228\.200/)
      await writeFile(`${output}rekonsiliasi.json`,JSON.stringify({pageCount:count,transactionCount:ids.length,ids},null,2))
      await screenshot('preview-multipage')
      const pdfIndex=downloads.length;await click(primary);const pdf=await readDownload(pdfIndex);pdfCheck(pdf.bytes)
      assert.equal((pdf.bytes.toString('latin1').match(/\/Type \/Page\b/g)||[]).length,count)
      await writeFile(`${output}contoh-laporan-lengkap.pdf`,pdf.bytes)
      await changeSettings();await click('.admin-download-format input[value=png]');await next()
      assert.equal(await evaluate('document.querySelectorAll(".admin-download-preview-pages .admin-download-sheet").length'),count)
      const zipIndex=downloads.length;await click(primary);const zip=await readDownload(zipIndex);assert.match(zip.suggestedFilename,/\.zip$/)
      const {default:JSZip}=await import('jszip');const archive=await JSZip.loadAsync(zip.bytes,{checkCRC32:true})
      assert.equal(Object.keys(archive.files).length,count)
      for(const file of Object.values(archive.files)){const bytes=await file.async('nodebuffer');assert.equal(bytes.readUInt32BE(16),1588);assert.equal(bytes.readUInt32BE(20),2246)}
      await writeFile(`${output}contoh-laporan-lengkap.zip`,zip.bytes)
    })
    await t.test('perubahan sesi tercermin, pembatalan saat navigasi aman, refresh/direktori preview tanpa konfigurasi kembali ke pengaturan',async()=>{
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false})
      await open('/admin/kelola-dana','.admin-funds-buttons');await click('.admin-funds-buttons button:first-child');await waitFor('!!document.querySelector(".admin-transaction-dialog[open]")')
      await evaluate(`(()=>{for(const[name,value]of Object.entries({date:'2026-10-21',categoryId:'mosque',description:'Transaksi sesi QA ekspor',amount:'12345'})){const e=document.querySelector('dialog [name='+name+']');Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))}})()`)
      await click('.admin-transaction-save');await waitFor('!document.querySelector("dialog")')
      await click('.admin-nav-link[href="/admin/laporan"]');await waitFor('!!document.querySelector(".admin-report-download")')
      await settings();assert.match(await evaluate('document.querySelector(".admin-download-selection").textContent'),/17\.240\.545/)
      await click('.admin-download-types input[value=income]');await click('.admin-download-format input[value=png]');await next()
      assert.match(await evaluate('document.querySelector(".admin-download-preview-pages").textContent'),/1 perubahan sesi diperhitungkan/)
      assert.equal(await evaluate('[...document.querySelectorAll(".admin-download-preview-pages [data-transaction-id]")].filter(e=>e.textContent.includes("Transaksi sesi QA ekspor")).length'),1)
      await evaluate('window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...rest){window.resumeExport=()=>originalToBlob.call(this,callback,...rest)}')
      const index=downloads.length;await click(primary);await waitFor('typeof window.resumeExport==="function"')
      await changeSettings();await evaluate('HTMLCanvasElement.prototype.toBlob=originalToBlob;window.resumeExport();delete window.resumeExport');await evaluate('new Promise(resolve=>setTimeout(resolve,100))')
      assert.equal(downloads.length,index);assert.equal(await evaluate('document.querySelector(".admin-report-toast")'),null)
      await next();await evaluate('window.qaReload=true');await send('Page.reload')
      await waitFor('!window.qaReload&&location.pathname==="/admin/laporan/unduh"&&!!document.querySelector(".admin-download-settings")')
      assert.equal(await evaluate('document.querySelector(".admin-download-format input:checked").value'),'pdf')
      assert.match(await evaluate('document.querySelector(".admin-download-flow [role=status]").textContent'),/Atur kembali/)
      await open('/admin/laporan/unduh/pratinjau','.admin-download-settings')
      assert.equal(await evaluate('location.pathname'),'/admin/laporan/unduh')
      assert.equal(await evaluate('localStorage.length+sessionStorage.length'),0);assert.equal(await evaluate('document.cookie'),'')
    })
    assert.deepEqual(failures,[]);assert.deepEqual(requests,[])
  }finally{ws.close();await fetch(`${cdpUrl}/json/close/${target.id}`)}
})
