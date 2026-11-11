import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL

test('Donasi: draf, QRIS, kelengkapan, preview dan Kontak publik pada Chrome QA', { skip: !baseUrl || !apiUrl || !cdpUrl, timeout: 90000 }, async (t) => {
  const output = fileURLToPath(new URL('../../tmp/admin116-qa/browser/', import.meta.url))
  await mkdir(output, { recursive: true })
  const target = await (await fetch(`${cdpUrl}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }) })
  let sequence = 0
  const pending = new Map(), failures = [], requests = [], choosers = []
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) { const request = pending.get(message.id); pending.delete(message.id); if (message.error) request.reject(message.error); else request.resolve(message.result) }
    if (message.method === 'Page.fileChooserOpened') choosers.push(message.params)
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push(message.params.response.url)
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type) && message.params.request.url.startsWith('http')) requests.push(message.params.request.url)
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
  const evaluate = async (expression) => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); assert.equal(result.exceptionDetails, undefined, result.exceptionDetails?.text); return result.result.value }
  const waitFor = async (expression) => { for (let attempt = 0; attempt < 300; attempt++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 20)) } assert.fail(`Kondisi browser tidak tercapai: ${expression}`) }
  const click = async (selector) => { const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`); for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 }) }
  const key = async (value, code, modifiers = 0) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: value, code: value, windowsVirtualKeyCode: code, modifiers, ...(value === 'Enter' && type === 'keyDown' ? { text: '\r' } : {}) }) }
  const fill = async (selector, value) => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus();document.querySelector(${JSON.stringify(selector)}).select()`); await send('Input.insertText', { text: value }) }
  const open = async (path, selector) => { await evaluate('window.admin115Navigation = true'); const navigation = await send('Page.navigate', { url: `${baseUrl}${path}` }); if (!navigation.loaderId) await evaluate('delete window.admin115Navigation'); await waitFor(`!window.admin115Navigation && document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`); await evaluate('document.fonts.ready'); await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))') }
  const screenshot = async (name, full = false) => { const size = await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})'); const png = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport:full, ...(full ? {clip:{x:0,y:0,...size,scale:1}} : {}) }); await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64')) }
  const noOverflow = async () => { assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false); assert.equal(await evaluate('[...document.querySelectorAll(".admin-donation-card,.admin-donation-footer")].every(e=>e.scrollWidth<=e.clientWidth)'),true) }
  const save = () => click('.admin-donation-footer button[type=submit]')
  const cancel = () => click('.admin-donation-footer button[type=button]')
  const upload = async (...names) => {
    const {root}=await send('DOM.getDocument')
    const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'#admin-donation-qris-file'})
    await send('DOM.setFileInputFiles',{nodeId,files:names.map(name=>`${output}${name}`)})
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    await waitFor('document.querySelector("form[aria-busy]").getAttribute("aria-busy")==="false"')
  }
  const fillField = (name,value) => fill(`#admin-donation-${name}`,value)
  const toggle = name => click(`#admin-donation-${name} + .admin-settings-switch-track`)
  const navigate = async route => {if(await evaluate('innerWidth<1024'))await click('.admin-menu-toggle');await click(`.admin-nav-link[href="/admin/${route}"]`);await waitFor(`location.pathname==='/admin/${route}'`);await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')}
  const activeUrls = () => evaluate('window.adminDonationUrls.created.filter(url=>!window.adminDonationUrls.revoked.includes(url)).length')
  try {
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable')
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.adminDonationUrls={created:[],revoked:[]};const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=value=>{const url=create(value);window.adminDonationUrls.created.push(url);return url};URL.revokeObjectURL=url=>{window.adminDonationUrls.revoked.push(url);revoke(url)}`})
    const images=await evaluate(`(()=>{const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,200,200);x.fillStyle='black';for(let a=0;a<12;a++)for(let b=0;b<12;b++)if((a*7+b*3)%5<2)x.fillRect(16+a*14,12+b*14,12,12);x.fillStyle='white';x.fillRect(0,178,200,22);x.fillStyle='black';x.font='12px Arial';x.fillText('SIMULASI QA',58,193);return {png:c.toDataURL('image/png'),jpg:c.toDataURL('image/jpeg')}})()`)
    const png=Buffer.from(images.png.split(',')[1],'base64'),jpg=Buffer.from(images.jpg.split(',')[1],'base64')
    await writeFile(`${output}qris.png`,png);await writeFile(`${output}qris.jpg`,jpg)
    await writeFile(`${output}besar.png`,Buffer.concat([png,Buffer.alloc(2*1024*1024+1-png.length)]))
    await writeFile(`${output}rusak.png`,Buffer.from([137,80,78,71,13,10,26,10,0,0]))
    await writeFile(`${output}palsu.png`,Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))
    await writeFile(`${output}format.webp`,png)
    await t.test('empat viewport: navigasi Sidebar, konfigurasi awal kosong, draft belum lengkap dapat disimpan, Batal dan preview kosong', async () => {
      for(const [width,height]of [[1728,1080],[1366,768],[768,1024],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await open('/admin/dashboard','.admin-dashboard');await navigate('donasi');await waitFor('!!document.querySelector(".admin-donation-footer")')
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'),'Donasi')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'),'/admin/donasi')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-donation input:not([type=file])")].filter(e=>e.type!=="checkbox").map(e=>e.value)'),['','','',''])
        assert.equal(await evaluate('document.querySelectorAll(".admin-donation [role=switch]:disabled").length'),3)
        assert.match(await evaluate('document.querySelector(".admin-donation-readiness header").textContent'),/0 dari 2 siap/)
        await noOverflow();await evaluate('window.scrollTo(0,0)');await screenshot(`donasi-${width}-awal`);await screenshot(`donasi-${width}-penuh`,true)
        await save();assert.match(await evaluate('document.querySelector(".admin-donation-feedback").textContent'),/Draf tersimpan sementara.*belum dipublikasikan/)
        const note=await evaluate('document.querySelector("#admin-donation-donationNote").value')
        await fillField('donationNote','Catatan belum disimpan');assert.match(await evaluate('document.querySelector(".admin-donation-preview-note").textContent'),/Catatan belum disimpan/)
        await cancel();assert.equal(await evaluate('document.querySelector("#admin-donation-donationNote").value'),note)
        await noOverflow()
      }
    })
    await t.test('unggah/ganti PNG dan JPG, validasi tipe/ukuran/isi/rusak, Hapus/Batal, keyboard dan cleanup object URL', async () => {
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false})
      await open('/admin/donasi','.admin-donation-footer')
      await send('Page.setInterceptFileChooserDialog',{enabled:true})
      await evaluate('document.querySelector(".admin-donation-upload-buttons button").focus()');await key('Enter',13)
      await waitFor('document.activeElement.tagName!=="BODY"')
      assert.ok(choosers.length>0)
      await upload('qris.png');await waitFor('!!document.querySelector(".admin-donation-qris-image img")')
      assert.equal(await activeUrls(),1)
      assert.equal(await evaluate('document.querySelector("#admin-donation-qrisEnabled").disabled'),false)
      await toggle('qrisEnabled');assert.equal(await evaluate('document.querySelectorAll(".admin-donation-preview-qris img").length'),1)
      await save()
      for(const [name,pattern]of [['format.webp','PNG atau JPG'],['besar.png','maksimal 2 MB'],['palsu.png','tidak sesuai'],['rusak.png','rusak atau tidak dapat dibaca']]) {
        await upload(name);assert.match(await evaluate('document.querySelector(".admin-donation-qris-upload [role=alert]").textContent'),new RegExp(pattern))
        assert.equal(await activeUrls(),1)
        assert.equal(await evaluate('document.querySelector("#admin-donation-qrisEnabled").checked'),true)
      }
      await evaluate('document.querySelector("#admin-donation-qris-file").multiple=true');await upload('qris.png','qris.jpg')
      assert.match(await evaluate('document.querySelector(".admin-donation-qris-upload [role=alert]").textContent'),/tepat satu/)
      await evaluate('document.querySelector("#admin-donation-qris-file").multiple=false')
      await upload('qris.jpg');assert.equal(await activeUrls(),1)
      await click('.admin-donation-upload-buttons button:last-child');assert.equal(await activeUrls(),0)
      assert.equal(await evaluate('document.querySelector("#admin-donation-qrisEnabled").checked'),false)
      await cancel();await waitFor('!!document.querySelector(".admin-donation-qris-image img")');assert.equal(await activeUrls(),1)
      assert.equal(await evaluate('document.querySelector("#admin-donation-qrisEnabled").checked'),true)
      await cancel();assert.equal(await activeUrls(),1)
      await navigate('kontak-pengaturan');assert.equal(await activeUrls(),0)
      await navigate('donasi');await waitFor('!!document.querySelector(".admin-donation-qris-image img")');assert.equal(await activeUrls(),1)
      await send('Page.setInterceptFileChooserDialog',{enabled:false})
      await noOverflow();await screenshot('donasi-qris-draf')
    })
    await t.test('rekening/WA, validasi, auto-nonaktif, template dan preview hidup, simpan/batal tanpa pesan/penyimpanan palsu', async () => {
      await open('/admin/donasi','.admin-donation-footer')
      await fillField('bankName','Bank Simulasi QA');await fillField('accountNumber','001234567890');await fillField('accountName','Penerima Simulasi')
      await toggle('bankEnabled');assert.match(await evaluate('document.querySelector(".admin-donation-preview-bank").textContent'),/Bank Simulasi QA.*001234567890.*Penerima Simulasi/)
      await fillField('accountName','');assert.equal(await evaluate('document.querySelector("#admin-donation-bankEnabled").checked'),false)
      assert.equal(await evaluate('document.querySelector(".admin-donation-preview-bank")'),null)
      await fillField('accountName','Penerima Simulasi');await toggle('bankEnabled')
      await fillField('whatsappNumber','08123456789');await save();assert.match(await evaluate('document.querySelector("#admin-donation-whatsappNumber-error").textContent'),/internasional/)
      assert.equal(await evaluate('document.querySelector("#admin-donation-whatsappEnabled").disabled'),true)
      await fillField('whatsappNumber','6281234567890');await toggle('whatsappEnabled')
      assert.equal(await evaluate('document.querySelector(".admin-donation-preview-whatsapp button").disabled'),true)
      await fillField('messageTemplate','');assert.equal(await evaluate('document.querySelector("#admin-donation-whatsappEnabled").checked'),false)
      await fillField('messageTemplate','Konfirmasi [Nama donatur]\nNominal [Nominal]');await toggle('whatsappEnabled')
      assert.match(await evaluate('document.querySelector(".admin-donation-preview-template").textContent'),/Konfirmasi \[Nama donatur\]/)
      await save();await fillField('bankName','Draft berbeda');await fillField('messageTemplate','Draft tidak disimpan');await cancel()
      assert.equal(await evaluate('document.querySelector("#admin-donation-bankName").value'),'Bank Simulasi QA')
      assert.equal(await evaluate('document.querySelector("#admin-donation-messageTemplate").value'),'Konfirmasi [Nama donatur]\nNominal [Nominal]')
      for(const [width,height]of [[1728,1080],[1366,768],[768,1024],[390,844]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await noOverflow();await evaluate('window.scrollTo(0,0)');await screenshot(`donasi-${width}-terisi`)
      }
      await evaluate('document.querySelector("#admin-donation-bankEnabled").focus()');await key(' ',32);assert.equal(await evaluate('document.querySelector("#admin-donation-bankEnabled").checked'),false)
      await cancel();await navigate('kontak-pengaturan');await navigate('donasi');await waitFor('!!document.querySelector("#admin-donation-bankName")')
      assert.equal(await evaluate('document.querySelector("#admin-donation-bankName").value'),'Bank Simulasi QA')
      assert.equal(await evaluate('localStorage.length+sessionStorage.length'),0)
      assert.equal(await evaluate('document.cookie'),'')
    })
    await t.test('Batal dan keluar halaman saat decode berjalan tidak menimpa draf atau meninggalkan URL preview', async () => {
      await send('Emulation.setDeviceMetricsOverride',{width:1728,height:1080,deviceScaleFactor:1,mobile:false})
      await open('/admin/donasi','.admin-donation-footer')
      await evaluate(`window.originalDonationDecode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=async function(){await window.originalDonationDecode.call(this);await new Promise(resolve=>setTimeout(resolve,200))}`)
      const beginUpload=async()=>{const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'#admin-donation-qris-file'});await send('DOM.setFileInputFiles',{nodeId,files:[`${output}qris.png`]});await waitFor('document.querySelector("form[aria-busy]").getAttribute("aria-busy")==="true"')}
      await beginUpload();await cancel();await new Promise(resolve=>setTimeout(resolve,250))
      assert.equal(await evaluate('document.querySelector(".admin-donation-qris-image img")'),null)
      assert.equal(await activeUrls(),0)
      await beginUpload();await navigate('kontak-pengaturan');await new Promise(resolve=>setTimeout(resolve,250))
      assert.equal(await activeUrls(),0)
      await evaluate('HTMLImageElement.prototype.decode=window.originalDonationDecode')
    })
    await t.test('refresh menghapus draft, Kontak publik tetap placeholder, dan mode API tidak mengirim endpoint karangan', async () => {
      await open('/admin/donasi','.admin-donation-footer')
      assert.equal(await evaluate('document.querySelector("#admin-donation-bankName").value'),'')
      await open('/kontak','.contact-donation')
      assert.equal(await evaluate('document.querySelectorAll(".contact-qris img").length'),0)
      assert.equal(await evaluate('document.querySelectorAll(".contact-bank dd").length'),3)
      assert.ok(await evaluate('[...document.querySelectorAll(".contact-bank dd")].every(e=>e.textContent==="Data belum dikonfirmasi")'))
      assert.doesNotMatch(await evaluate('document.querySelector(".contact-donation").textContent'),/Bank Simulasi QA|001234567890/)
      await send('Page.navigate',{url:`${apiUrl}/admin/donasi`});await waitFor('!!document.querySelector(".admin-dashboard-state[role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-dashboard-state[role=alert]").textContent'),/API admin belum tersedia/)
      assert.equal(await evaluate('document.querySelector(".admin-donation form")'),null)
    })
    assert.deepEqual(failures,[]);assert.deepEqual(requests,[])
  } finally {ws.close();await fetch(`${cdpUrl}/json/close/${target.id}`)}
})
