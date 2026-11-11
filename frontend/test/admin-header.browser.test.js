import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL

test('Dashboard/Header: tombol, modal sekali buka, akun dan notifikasi contoh pada Chrome QA', { skip: !baseUrl || !cdpUrl, timeout: 90000 }, async (t) => {
  const output = fileURLToPath(new URL('../../tmp/admin-header-qa/browser/', import.meta.url))
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
  const open = async (path, selector) => { await evaluate('window.admin115Navigation = true'); const navigation = await send('Page.navigate', { url: `${baseUrl}${path}` }); if (!navigation.loaderId) await evaluate('delete window.admin115Navigation'); await waitFor(`!window.admin115Navigation && document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`); await evaluate('document.fonts.ready'); await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))') }
  const screenshot = async (name) => { const png = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`${output}${name}.png`, Buffer.from(png.data, 'base64')) }
  const noOverflow = async () => {
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false)
    assert.equal(await evaluate('[...document.querySelectorAll(".admin-header-dropdown,dialog[open]")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth})'),true)
  }
  const back = async (direction=-1) => {const history=await send('Page.getNavigationHistory');await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex+direction].id});await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')}
  const bell='[aria-controls=admin-header-notifications]'
  const avatar='.admin-header-avatar'
  const openNotifications=async()=>{await click(bell);await waitFor('document.querySelectorAll("#admin-header-notifications li").length===5')}
  try {
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable')
    await t.test('dua tombol hero di empat viewport memakai modal lama, state sekali pakai, Batal/Kembali/Back/Forward/refresh aman',async()=>{
      for(const [width,height]of [[1728,1080],[1366,768],[768,1024],[390,844]]){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await open('/admin/dashboard','.admin-hero-actions')
        const totals=await evaluate('[...document.querySelectorAll(".admin-statistic > p")].map(e=>e.textContent)')
        for(const [index,type,label]of [[1,'income','Pemasukan'],[2,'expense','Pengeluaran']]){
          await click(`.admin-hero-actions button:nth-child(${index})`)
          await waitFor('location.pathname==="/admin/kelola-dana"&&!!document.querySelector("dialog[open]")')
          assert.equal(await evaluate('document.querySelector("#admin-transaction-title").textContent'),`Tambah ${label}`)
          assert.equal(await evaluate('history.state.usr?.openTransaction'),undefined)
          assert.equal(await evaluate('document.activeElement.name'),'date')
          await noOverflow();await screenshot(`hero-${type}-${width}`)
          if(type==='income')await click('dialog footer button:first-child');else await click('dialog header button')
          await waitFor('!document.querySelector("dialog")')
          assert.equal(await evaluate('document.activeElement.textContent'),label)
          await back();await waitFor('!!document.querySelector(".admin-dashboard")')
          await back(1);await waitFor('!!document.querySelector(".admin-funds")');assert.equal(await evaluate('document.querySelector("dialog")'),null)
          await evaluate('window.adminHeaderReload=true');await send('Page.reload');await waitFor('!window.adminHeaderReload&&document.readyState==="complete"&&!!document.querySelector(".admin-funds")')
          assert.equal(await evaluate('document.querySelector("dialog")'),null)
          await back();await waitFor('!!document.querySelector(".admin-dashboard")')
          assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-statistic > p")].map(e=>e.textContent)'),totals)
        }
      }
    })
    await t.test('banner serta tiga shortcut menuju halaman yang tersedia tanpa mengganti desain atau saldo',async()=>{
      for(const [width,height]of [[1728,1080],[390,844]]){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        for(const [selector,path]of [['.admin-transparency button','laporan'],['.admin-shortcuts button:nth-child(1)','laporan'],['.admin-shortcuts button:nth-child(2)','activity-log'],['.admin-shortcuts button:nth-child(3)','kelola-akun']]){
          await open('/admin/dashboard','.admin-shortcuts')
          await click(selector);await waitFor(`location.pathname==='/admin/${path}'&&document.querySelector('.admin-nav-link[aria-current=page]')?.getAttribute('href')==='/admin/${path}'`)
          assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'),`/admin/${path}`)
          await back();await waitFor('!!document.querySelector(".admin-dashboard")')
        }
      }
    })
    await t.test('header di empat viewport: avatar visual, logout Sidebar, lima terbaru, klik luar/Escape/Tab/ArrowDown dan tautan aktivitas',async()=>{
      for(const [width,height]of [[1728,1080],[1366,768],[768,1024],[390,844]]){
        await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false})
        await open('/admin/dashboard','.admin-hero-actions')
        await openNotifications()
        assert.deepEqual(await evaluate('[...document.querySelectorAll("#admin-header-notifications time")].map(e=>e.dateTime)'),['2026-06-14T10:12','2026-06-14T09:35','2026-06-13T11:00','2026-06-12T08:00','2026-06-11T08:00'])
        assert.match(await evaluate('document.querySelector("#admin-header-notifications").textContent'),/Data contoh.*bukan notifikasi real-time/)
        assert.deepEqual(await evaluate('[...document.querySelectorAll("#admin-header-notifications li a")].map(e=>e.getAttribute("href"))'),['/admin/kelola-dana','/admin/kelola-dana','/admin/kelola-dana','/admin/kelola-akun','/admin/kelola-akun'])
        await noOverflow();await screenshot(`notifikasi-${width}`)
        await key('Escape',27);assert.equal(await evaluate('document.querySelector(".admin-header-dropdown")'),null)
        assert.equal(await evaluate('document.activeElement.getAttribute("aria-controls")'),'admin-header-notifications')
        await click(avatar)
        assert.equal(await evaluate('document.querySelector(".admin-header-dropdown")'),null)
        assert.equal(await evaluate('document.querySelector(".admin-header-avatar").closest("button,a,[tabindex]")'),null)
        assert.equal(await evaluate('document.querySelector("#admin-header-account")'),null)
        await screenshot(`avatar-${width}`)
        await openNotifications();await click('.admin-topbar h1');assert.equal(await evaluate('document.querySelector(".admin-header-dropdown")'),null)
        await evaluate('document.querySelector("[aria-controls=admin-header-notifications]").focus()');await key('ArrowDown',40)
        await waitFor('!!document.querySelector("#admin-header-notifications")&&document.activeElement.tagName==="A"')
        await evaluate('document.querySelector(".admin-header-view-all").focus()');await key('Tab',9)
        await waitFor('!document.querySelector(".admin-header-dropdown")')
        await evaluate('document.querySelector("[aria-controls=admin-header-notifications]").focus()');await key('ArrowDown',40)
        await waitFor('!!document.querySelector("#admin-header-notifications")&&document.activeElement.tagName==="A"')
        await click('#admin-header-notifications li:first-child a');await waitFor('location.pathname==="/admin/kelola-dana"&&!!document.querySelector(".admin-funds")')
        assert.equal(await evaluate('document.querySelector("dialog")'),null)
        assert.equal(await evaluate('document.querySelector(".admin-header-dropdown")'),null)
        await openNotifications();await click('.admin-header-view-all');await waitFor('document.querySelectorAll(".admin-activity-card").length===9')
        if(width<1024){await click('.admin-menu-toggle');await waitFor('!!document.querySelector(".admin-sidebar--open")')}
        assert.equal(await evaluate('document.querySelector(".admin-account button").disabled'),false)
        assert.match(await evaluate('document.querySelector(".admin-account button").title'),/Autentikasi masih stub/)
        await click('.admin-account button');await waitFor('location.pathname==="/admin/login"&&!!document.querySelector(".admin-login-form")')
        assert.equal(await evaluate('document.querySelector(".admin-header-dropdown")'),null)
        assert.equal(await evaluate('localStorage.length+sessionStorage.length'),0)
        assert.equal(await evaluate('document.cookie'),'')
      }
    })
    await t.test('refresh saat modal dari hero masih terbuka tidak mengulang permintaan navigasi',async()=>{
      await open('/admin/dashboard','.admin-hero-actions')
      await click('.admin-hero-actions button:first-child');await waitFor('!!document.querySelector("dialog[open]")')
      assert.equal(await evaluate('history.state.usr?.openTransaction'),undefined)
      await evaluate('window.adminHeaderReload=true');await send('Page.reload')
      await waitFor('!window.adminHeaderReload&&document.readyState==="complete"&&!!document.querySelector(".admin-funds")')
      assert.equal(await evaluate('document.querySelector("dialog")'),null)
    })
    assert.deepEqual(failures,[]);assert.deepEqual(requests,[])
  }finally{ws.close();await fetch(`${cdpUrl}/json/close/${target.id}`)}
})
