import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { mockAgenda } from '../src/mocks/agenda.js'
import { mockPublicContent } from '../src/mocks/publicContent.js'
import { mockAdminAccounts } from '../src/mocks/adminAccounts.js'
import { mockAdminActivityLog } from '../src/mocks/adminActivityLog.js'

const baseUrl = process.env.ADMIN_BROWSER_QA_URL
const apiUrl = process.env.ADMIN_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL
const phase = process.env.ADMIN_DASHBOARD_QA_PHASE === 'production' ? 'production' : 'development'

test('Dashboard Keuangan responsive, navigasi dan mock tanpa autentikasi pada Chrome QA', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 45000,
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
  let fileChooserCount = 0
  const metrics = []
  const output = fileURLToPath(new URL(`../../tmp/admin12-qa/${phase}/`, import.meta.url))
  const fundsOutput = fileURLToPath(new URL(`../../tmp/admin13-qa/${phase}/`, import.meta.url))
  const categoriesOutput = fileURLToPath(new URL(`../../tmp/admin14-qa/${phase}/`, import.meta.url))
  const profileOutput = fileURLToPath(new URL(`../../tmp/admin15-qa/${phase}/`, import.meta.url))
  const photoOutput = fileURLToPath(new URL(`../../tmp/admin15-photo-qa/${phase}/`, import.meta.url))
  const agendaOutput = fileURLToPath(new URL(`../../tmp/admin16-qa/${phase}/`, import.meta.url))
  const settingsOutput = fileURLToPath(new URL(`../../tmp/admin17-qa/${phase}/`, import.meta.url))
  const accountsOutput = fileURLToPath(new URL(`../../tmp/admin18-qa/${phase}/`, import.meta.url))
  const reportAccessOutput = fileURLToPath(new URL(`../../tmp/admin19-qa/${phase}/`, import.meta.url))
  const activityOutput = fileURLToPath(new URL(`../../tmp/admin110-qa/${phase}/`, import.meta.url))
  await mkdir(output, { recursive: true })
  await mkdir(fundsOutput, { recursive: true })
  await mkdir(categoriesOutput, { recursive: true })
  await mkdir(profileOutput, { recursive: true })
  await mkdir(photoOutput, { recursive: true })
  await mkdir(agendaOutput, { recursive: true })
  await mkdir(settingsOutput, { recursive: true })
  await mkdir(accountsOutput, { recursive: true })
  await mkdir(reportAccessOutput, { recursive: true })
  await mkdir(activityOutput, { recursive: true })
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      const request = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) request.reject(message.error)
      else request.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
    if (message.method === 'Page.fileChooserOpened') fileChooserCount++
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) failures.push(message.params.response.url)
    if (message.method === 'Network.requestWillBeSent' && ['Fetch', 'XHR'].includes(message.params.type)) requests.push(message.params.request.url)
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
  const open = async (origin = baseUrl, suffix = '') => {
    await send('Page.navigate', { url: `${origin}/admin/dashboard${suffix}` })
    await waitFor('document.readyState === "complete" && !!document.querySelector(".admin-dashboard")')
    await evaluate('document.fonts.ready')
  }
  const reload = async (expression) => {
    await evaluate('window.adminReloadMarker = true')
    await send('Page.reload')
    await waitFor(`window.adminReloadMarker !== true && document.readyState === 'complete' && (${expression})`)
  }
  const click = async (selector) => {
    const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2} })()`)
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 })
  }
  const fill = async (name, value, prefix = 'admin-profile') => {
    await evaluate(`document.querySelector('#${prefix}-${name}').focus();document.querySelector('#${prefix}-${name}').select()`)
    await send('Input.insertText', { text: value })
  }
  const choosePhoto = async (files) => {
    const { root } = await send('DOM.getDocument')
    const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '#admin-profile-photo' })
    await send('DOM.setFileInputFiles', { nodeId, files })
  }
  const activityFilter = async (name, value) => {
    await evaluate(`(() => {const e=document.querySelector('#admin-activity-${name}');const prototype=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  }
  const trackPhotoUrls = () => evaluate(`(() => {
    window.photoUrls = {created:[],revoked:[]}
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = file => {const url=create(file);photoUrls.created.push(url);return url}
    URL.revokeObjectURL = url => {photoUrls.revoked.push(url);revoke(url)}
  })()`)
  const screenshot = async (name, full = false, directory = output) => {
    const size = await evaluate('({width:innerWidth,height:document.documentElement.scrollHeight})')
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(full ? { clip: { x: 0, y: 0, ...size, scale: 1 } } : {}) })
    await writeFile(`${directory}${name}.png`, Buffer.from(result.data, 'base64'))
  }
  try {
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Network.enable')
    await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })

    await t.test('empat viewport menampilkan angka lengkap, aset, tabel dan menu aktif tanpa overflow halaman', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        const result = await evaluate(`(() => {
          const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}
          return {
            viewport:[innerWidth,innerHeight], overflow:document.documentElement.scrollWidth>innerWidth,
            amounts:[...document.querySelectorAll('.admin-statistic > p')].map(e=>e.textContent),
            amountsFit:[...document.querySelectorAll('.admin-statistic > p')].every(e=>e.scrollWidth<=e.clientWidth),
            columns:getComputedStyle(document.querySelector('.admin-statistics')).gridTemplateColumns.split(' ').length,
            active:document.querySelector('.admin-nav-link').getAttribute('aria-current'),
            sidebar:getComputedStyle(document.querySelector('.admin-sidebar')).display,
            categories:document.querySelectorAll('.admin-balance-table tbody tr').length,
            transactions:document.querySelectorAll('.admin-recent-table tbody tr').length,
            finalTotal:document.querySelector('.admin-balance-table tfoot td:last-child').textContent,
            images:[...document.images].every(e=>e.complete&&e.naturalWidth>0),
            font:[...document.fonts].some(f=>f.family.includes('Plus Jakarta Sans')&&f.status==='loaded'),
            publicLayout:!!document.querySelector('.public-layout,.admin-login-form'),
            boxes:Object.fromEntries(['.admin-topbar','.admin-dashboard-hero','.admin-statistics','.admin-balance','.admin-transparency','.admin-recent','.admin-shortcuts'].map(s=>[s,box(document.querySelector(s))]))
          }
        })()`)
        metrics.push(result)
        assert.equal(result.overflow, false, `${width}: overflow halaman`)
        assert.equal(result.amountsFit, true, `${width}: nominal terpotong`)
        assert.deepEqual(result.amounts, ['Rp 16.864.200', 'Rp 1.791.500', 'Rp 1.427.500', 'Rp 17.228.200'])
        assert.equal(result.columns, width >= 1024 ? 4 : width >= 480 ? 2 : 1)
        assert.equal(result.active, 'page')
        assert.equal(result.sidebar === 'none', width < 1024)
        assert.equal(result.categories, 3)
        assert.equal(result.transactions, 5)
        assert.equal(result.finalTotal, '17.228.200')
        assert.equal(result.images && result.font, true)
        assert.equal(result.publicLayout, false)
        await screenshot(`dashboard-${width}-top`)
        await screenshot(`dashboard-${width}-full`, true)
      }
      await writeFile(`${output}metrics.json`, JSON.stringify(metrics, null, 2))
    })

    await t.test('menu tablet/mobile dapat dibuka, memilih dashboard dan ditutup lewat Escape/backdrop', async () => {
      for (const [width, height] of [[768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await click('.admin-menu-toggle')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'true')
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-sidebar")).display'), 'flex')
        assert.equal(await evaluate('document.activeElement.classList.contains("admin-nav-link")'), true)
        await screenshot(`dashboard-${width}-menu`)
        await click('.admin-nav-link')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'false')
        await click('.admin-menu-toggle')
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
        assert.equal(await evaluate('document.activeElement.className'), 'admin-menu-toggle')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'false')
        await click('.admin-menu-toggle')
        await evaluate('document.querySelector(".admin-sidebar-backdrop").click()')
        assert.equal(await evaluate('document.querySelector(".admin-menu-toggle").getAttribute("aria-expanded")'), 'false')
      }
    })

    await t.test('tabel mobile dapat digeser lokal dengan keyboard dan menampilkan kolom terakhir', async () => {
      for (const selector of ['.admin-balance .admin-table-scroll', '.admin-recent .admin-table-scroll']) {
        await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'}); document.querySelector(${JSON.stringify(selector)}).focus()`)
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
        await waitFor(`document.querySelector(${JSON.stringify(selector)}).scrollLeft > 0`)
        await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollLeft=9999`)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
      }
      await screenshot('dashboard-mobile-tabel')
    })

    await t.test('fitur di luar lingkup nonaktif, akun contoh tidak menjadi autentikasi dan refresh tetap membuka dashboard', async () => {
      assert.equal(await evaluate('[...document.querySelectorAll(".admin-dashboard button, .admin-nav-group button, .admin-account button, .admin-topbar-actions button")].every(e=>e.disabled&&!!e.title)'), true)
      assert.match(await evaluate('document.querySelector(".admin-dashboard-status").textContent'), /Data contoh/)
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-shell a[href]")].map(e=>e.getAttribute("href"))'), ['#admin-content', '/admin/dashboard', '/admin/kelola-dana', '/admin/kategori-dana', '/admin/kwitansi', '/admin/activity-log', '/admin/profil-masjid', '/admin/agenda', '/admin/kontak-pengaturan', '/admin/kelola-akun', '/admin/kode-akses-laporan'])
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      await reload('!!document.querySelector(".admin-dashboard")')
      await open(baseUrl, '/')
      assert.equal(await evaluate('document.querySelector(".admin-nav-link").getAttribute("aria-current")'), 'page')
    })

    await t.test('Kelola Dana di empat viewport memakai tabel Dashboard yang identik dan navigasi bolak-balik tanpa reload', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        const original = await evaluate('document.querySelector(".admin-recent").outerHTML')
        await evaluate('window.adminFundsNavigation = true; window.scrollTo(0,500)')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kelola-dana"]')
        await waitFor('!!document.querySelector(".admin-funds") && document.querySelector(".admin-topbar h1").textContent === "Kelola Dana Keuangan"')
        assert.equal(await evaluate('window.adminFundsNavigation'), true)
        assert.equal(await evaluate('window.scrollY'), 0)
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/kelola-dana')
        assert.equal(await evaluate('document.querySelector(".admin-recent").outerHTML'), original)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        assert.equal(await evaluate('[...document.querySelectorAll(".admin-funds button")].every(e=>e.disabled&&!!e.title)'), true)
        assert.equal(await evaluate('document.querySelectorAll(".admin-funds input,.admin-funds form,.admin-funds dialog").length'), 0)
        await evaluate('document.fonts.ready')
        await screenshot(`kelola-dana-${width}-top`, false, fundsOutput)
        await screenshot(`kelola-dana-${width}-full`, true, fundsOutput)
        if (width < 1024) {
          await click('.admin-menu-toggle')
          assert.equal(await evaluate('document.activeElement.getAttribute("href")'), '/admin/kelola-dana')
        }
        await click('.admin-nav-link[href="/admin/dashboard"]')
        await waitFor('!!document.querySelector(".admin-dashboard")')
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Dashboard Keuangan')
        assert.equal(await evaluate('document.querySelector(".admin-recent").outerHTML'), original)
      }
    })

    await t.test('Kelola Dana mendukung scroll tabel lokal, refresh dan trailing slash', async () => {
      await send('Page.navigate', { url: `${baseUrl}/admin/kelola-dana/` })
      await waitFor('!!document.querySelector(".admin-funds")')
      const selector = '.admin-recent .admin-table-scroll'
      await evaluate(`document.querySelector('${selector}').scrollIntoView({block:'center'});document.querySelector('${selector}').focus()`)
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
      await waitFor(`document.querySelector('${selector}').scrollLeft > 0`)
      await evaluate(`document.querySelector('${selector}').scrollLeft = 9999`)
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
      await screenshot('kelola-dana-mobile-tabel', false, fundsOutput)
      await reload('document.querySelectorAll(".admin-recent-table tbody tr").length === 5')
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kelola Dana Keuangan')
    })

    await t.test('Kategori Dana memakai saldo Dashboard yang sama dan navigasi tiga halaman berfungsi pada empat viewport', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        const original = await evaluate('document.querySelector(".admin-balance-table").outerHTML')
        const labels = await evaluate('[...document.querySelectorAll(".admin-balance-table tbody th")].map(e=>e.textContent)')
        await evaluate('window.adminCategoriesNavigation = true')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kategori-dana"]')
        await waitFor('!!document.querySelector(".admin-categories")')
        assert.equal(await evaluate('window.adminCategoriesNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kategori Dana')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/kategori-dana')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-categories-table tbody th")].map(e=>e.textContent)'), labels)
        assert.equal(await evaluate('document.querySelector(".admin-balance-table").outerHTML'), original)
        assert.equal(await evaluate('document.querySelectorAll(".admin-categories button:disabled").length'), 7)
        assert.equal(await evaluate('document.querySelectorAll(".admin-categories form,.admin-categories dialog,.admin-categories input").length'), 0)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        await evaluate('document.fonts.ready')
        await screenshot(`kategori-dana-${width}-top`, false, categoriesOutput)
        await screenshot(`kategori-dana-${width}-full`, true, categoriesOutput)
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kelola-dana"]')
        await waitFor('!!document.querySelector(".admin-funds")')
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kelola Dana Keuangan')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/dashboard"]')
        await waitFor('!!document.querySelector(".admin-dashboard")')
        assert.equal(await evaluate('document.querySelector(".admin-balance-table").outerHTML'), original)
      }
    })

    await t.test('Kategori Dana mendukung scroll lokal kedua tabel, refresh dan trailing slash tanpa CRUD', async () => {
      await send('Page.navigate', { url: `${baseUrl}/admin/kategori-dana/` })
      await waitFor('!!document.querySelector(".admin-categories")')
      for (const selector of ['.admin-categories-list .admin-table-scroll', '.admin-categories .admin-balance .admin-table-scroll']) {
        await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'});document.querySelector(${JSON.stringify(selector)}).focus()`)
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
        await waitFor(`document.querySelector(${JSON.stringify(selector)}).scrollLeft > 0`)
        await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollLeft = 9999`)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
      }
      await screenshot('kategori-dana-mobile-tabel', false, categoriesOutput)
      await reload('document.querySelectorAll(".admin-categories-table tbody tr").length === 3')
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kategori Dana')
    })

    await t.test('Profil Masjid pada empat viewport mendukung navigasi, edit, validasi dan simpan simulasi', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await evaluate('window.adminProfileNavigation = true')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/profil-masjid"]')
        await waitFor('!!document.querySelector("#admin-profile-form")')
        await evaluate('document.fonts.ready')
        await waitFor('document.querySelector(".admin-profile-banner img").complete')
        assert.equal(await evaluate('window.adminProfileNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Profil Masjid')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/profil-masjid')
        assert.equal(await evaluate('document.querySelector("#admin-profile-name").value'), 'Masjid Al-Hidayah')
        assert.equal(await evaluate('document.querySelector("#admin-profile-contact").value'), '')
        assert.equal(await evaluate('document.querySelectorAll("input[type=file]").length'), 1)
        assert.equal(await evaluate('document.querySelectorAll(".admin-profile dialog").length'), 0)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        assert.equal(await evaluate('document.querySelector(".admin-profile-banner img").naturalWidth > 0'), true)
        assert.equal(await evaluate('[...document.querySelectorAll(".admin-profile input,.admin-profile textarea,.admin-profile-save")].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.height>=40})'), true)
        await evaluate('window.scrollTo(0,0)')
        await screenshot(`profil-masjid-${width}-top`, false, profileOutput)
        await screenshot(`profil-masjid-${width}-full`, true, profileOutput)
        await fill('name', '   ')
        await fill('contact', 'bukan nomor')
        await click('.admin-profile-save')
        assert.match(await evaluate('document.querySelector("#admin-profile-name-error").textContent'), /wajib/)
        assert.match(await evaluate('document.querySelector("#admin-profile-contact-error").textContent'), /8–15 digit/)
        assert.equal(await evaluate('document.activeElement.id'), 'admin-profile-name')
        assert.equal(await evaluate('!!document.querySelector(".admin-profile-feedback")'), false)
        await screenshot(`profil-masjid-${width}-validasi`, true, profileOutput)
        await fill('name', 'Masjid untuk review UI')
        await fill('description', 'Deskripsi percobaan\nBaris kedua tetap tersimpan.')
        await fill('address', 'Alamat percobaan\nSorolaten')
        await fill('contact', '+62 812-0000-0000')
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
        await waitFor('!!document.querySelector(".admin-profile-feedback")')
        assert.match(await evaluate('document.querySelector(".admin-profile-feedback").textContent'), /Simulasi.*sementara.*belum tersimpan permanen/)
        assert.equal(await evaluate('document.querySelector("#admin-profile-name").value'), 'Masjid untuk review UI')
        assert.equal(await evaluate('document.querySelector("#admin-profile-description").value'), 'Deskripsi percobaan\nBaris kedua tetap tersimpan.')
        assert.equal(await evaluate('document.querySelector("#admin-profile-address").value'), 'Alamat percobaan\nSorolaten')
        await screenshot(`profil-masjid-${width}-simulasi`, true, profileOutput)
        await fill('contact', '123')
        assert.equal(await evaluate('!!document.querySelector(".admin-profile-feedback")'), false)
        await click('.admin-profile-save')
        assert.equal(await evaluate('document.activeElement.id'), 'admin-profile-contact')
        await fill('contact', '')
        await click('.admin-profile-save')
        assert.equal(await evaluate('!!document.querySelector(".admin-profile-feedback")'), true)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
      }
    })

    await t.test('simulasi profil tidak dipersist, tidak mengubah publik, dan kembali ke data awal setelah refresh/navigasi', async () => {
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      assert.equal(await evaluate('location.search'), '')
      await reload('!!document.querySelector("#admin-profile-form")')
      assert.equal(await evaluate('document.querySelector("#admin-profile-name").value'), 'Masjid Al-Hidayah')
      assert.equal(await evaluate('document.querySelector("#admin-profile-contact").value'), '')
      assert.equal(await evaluate('!!document.querySelector(".admin-profile-feedback")'), false)
      await fill('name', 'Sementara saja')
      await click('.admin-profile-save')
      for (const [route, selector] of [['dashboard', '.admin-dashboard'], ['kelola-dana', '.admin-funds'], ['kategori-dana', '.admin-categories']]) {
        await click('.admin-menu-toggle')
        await click(`.admin-nav-link[href="/admin/${route}"]`)
        await waitFor(`location.pathname === '/admin/${route}' && !!document.querySelector('${selector}')`)
        assert.equal(await evaluate('!!document.querySelector("#admin-profile-form")'), false)
        await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/profil-masjid"]')
        await waitFor('!!document.querySelector("#admin-profile-form")')
        assert.equal(await evaluate('document.querySelector("#admin-profile-name").value'), 'Masjid Al-Hidayah')
      }
      await send('Page.navigate', { url: `${baseUrl}/admin/profil-masjid/` })
      await waitFor('location.pathname.endsWith("/profil-masjid/") && !!document.querySelector("#admin-profile-form")')
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Profil Masjid')
      await send('Page.navigate', { url: `${baseUrl}/profil` })
      await waitFor('!!document.querySelector(".profile-header h1")')
      assert.match(await evaluate('document.querySelector(".profile-header h1").textContent'), /Al-Hidayah/)
      assert.doesNotMatch(await evaluate('document.body.innerText'), /Sementara saja|Masjid untuk review UI|Alamat percobaan/)
    })

    const fixtures = fileURLToPath(new URL('../../tmp/admin15-photo-qa/fixtures/', import.meta.url))
    await mkdir(fixtures, { recursive: true })
    await copyFile(fileURLToPath(new URL('../public/assets/masjid-background.webp', import.meta.url)), `${fixtures}foto.webp`)
    for (const [extension, type] of [['jpg', 'image/jpeg'], ['png', 'image/png']]) {
      const data = await evaluate(`(() => {const c=document.createElement('canvas');c.width=8;c.height=8;const ctx=c.getContext('2d');ctx.fillStyle='#276a91';ctx.fillRect(0,0,8,8);return c.toDataURL('${type}').split(',')[1]})()`)
      await writeFile(`${fixtures}foto.${extension}`, Buffer.from(data, 'base64'))
    }
    await writeFile(`${fixtures}besar.png`, Buffer.alloc(5 * 1024 * 1024 + 1))
    await writeFile(`${fixtures}kosong.webp`, '')
    await writeFile(`${fixtures}rusak.png`, 'Ini bukan gambar yang dapat dibaca.')
    await writeFile(`${fixtures}foto.svg`, '<svg xmlns="http://www.w3.org/2000/svg"/>')

    await t.test('Ganti Foto mendukung keyboard, tiga format, batal picker/pilihan, ukuran banner tetap dan cleanup URL di empat viewport', async () => {
      await send('Page.setInterceptFileChooserDialog', { enabled: true })
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/profil-masjid"]')
        await waitFor('!!document.querySelector("#admin-profile-form")')
        await trackPhotoUrls()
        const original = await evaluate('document.querySelector(".admin-profile-photo img").src')
        const fields = await evaluate('[...document.querySelectorAll(".admin-profile-field input,.admin-profile-field textarea")].map(e=>e.value)')
        const box = await evaluate('(() => {const r=document.querySelector(".admin-profile-photo img").getBoundingClientRect();return [r.width,r.height]})()')
        const chooserBefore = fileChooserCount
        await evaluate('document.querySelector("#admin-profile-photo").focus()')
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-profile-photo-picker")).outlineStyle'), 'solid')
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
        await choosePhoto([`${fixtures}foto.png`])
        assert.equal(fileChooserCount, chooserBefore + 1)
        await waitFor('document.querySelector(".admin-profile-photo img").src.startsWith("blob:") && document.querySelector(".admin-profile-photo img").complete && document.querySelector(".admin-profile-photo img").naturalWidth > 0')
        const first = await evaluate('document.querySelector(".admin-profile-photo img").src')
        await choosePhoto([])
        assert.equal(await evaluate('document.querySelector(".admin-profile-photo img").src'), first)
        assert.equal(await evaluate('!!document.querySelector(".admin-profile-feedback")'), false)
        assert.deepEqual(await evaluate('(() => {const r=document.querySelector(".admin-profile-photo img").getBoundingClientRect();return [r.width,r.height]})()'), box)
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-profile-field input,.admin-profile-field textarea")].map(e=>e.value)'), fields)
        assert.equal(await evaluate('document.querySelector("#admin-profile-photo").multiple'), false)
        assert.equal(await evaluate('document.querySelector("#admin-profile-photo").files.length'), 0)
        await click('.admin-profile-save')
        assert.match(await evaluate('document.querySelector(".admin-profile-feedback").textContent'), /Foto baru hanya dipratinjau dan belum tersimpan ke server/)
        for (const extension of ['jpg', 'webp']) {
          const previous = await evaluate('document.querySelector(".admin-profile-photo img").src')
          await choosePhoto([`${fixtures}foto.${extension}`])
          await waitFor(`document.querySelector('.admin-profile-photo img').src !== ${JSON.stringify(previous)} && document.querySelector('.admin-profile-photo img').complete && document.querySelector('.admin-profile-photo img').naturalWidth > 0`)
          assert.equal(await evaluate(`photoUrls.revoked.includes(${JSON.stringify(previous)})`), true)
        }
        assert.equal(await evaluate('!!document.querySelector(".admin-profile-feedback")'), false)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        await evaluate('window.scrollTo(0,0)')
        await screenshot(`ganti-foto-${width}-preview`, true, photoOutput)
        await click('.admin-profile-photo-cancel')
        await waitFor(`document.querySelector('.admin-profile-photo img').src === ${JSON.stringify(original)}`)
        assert.deepEqual(await evaluate('photoUrls.revoked'), await evaluate('photoUrls.created'))
        assert.equal(await evaluate('!!document.querySelector(".admin-profile-photo-cancel")'), false)
        await choosePhoto([`${fixtures}foto.webp`])
        await waitFor('document.querySelector(".admin-profile-photo img").src.startsWith("blob:")')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/dashboard"]')
        await waitFor('!!document.querySelector(".admin-dashboard")')
        assert.equal(await evaluate('photoUrls.created.length'), 4)
        assert.deepEqual(await evaluate('photoUrls.revoked'), await evaluate('photoUrls.created'))
      }
      await send('Page.setInterceptFileChooserDialog', { enabled: false })
    })

    await t.test('foto menolak format/ukuran/jumlah/berkas rusak tanpa upload, mempertahankan preview valid dan melepas seluruh URL', async () => {
      await click('.admin-menu-toggle')
      await click('.admin-nav-link[href="/admin/profil-masjid"]')
      await waitFor('!!document.querySelector("#admin-profile-form")')
      await trackPhotoUrls()
      await choosePhoto([`${fixtures}foto.webp`])
      await waitFor('document.querySelector(".admin-profile-photo img").src.startsWith("blob:")')
      const preview = await evaluate('document.querySelector(".admin-profile-photo img").src')
      for (const [file, message] of [['foto.svg', /Format foto/], ['besar.png', /maksimal 5 MB/], ['kosong.webp', /kosong/]]) {
        await choosePhoto([`${fixtures}${file}`])
        await waitFor('!!document.querySelector("#admin-profile-photo-error")')
        assert.match(await evaluate('document.querySelector("#admin-profile-photo-error").textContent'), message)
        assert.equal(await evaluate('document.querySelector("#admin-profile-photo").getAttribute("aria-invalid")'), 'true')
        assert.equal(await evaluate('document.querySelector(".admin-profile-photo img").src'), preview)
      }
      for (const [count, type, message] of [[2, 'image/png', /tepat satu/], [1, 'text/plain', /Format foto/]]) {
        await evaluate(`(() => {const dt=new DataTransfer();for(let i=0;i<${count};i++)dt.items.add(new File(['data'],'foto.png',{type:'${type}'}));const input=document.querySelector('#admin-profile-photo');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()`)
        assert.match(await evaluate('document.querySelector("#admin-profile-photo-error").textContent'), message)
        assert.equal(await evaluate('document.querySelector(".admin-profile-photo img").src'), preview)
      }
      await choosePhoto([`${fixtures}rusak.png`])
      await waitFor('!!document.querySelector("#admin-profile-photo-error") && document.querySelector("#admin-profile-photo-error").textContent.includes("tidak dapat dibaca")')
      await waitFor('!document.querySelector(".admin-profile-photo img").src.startsWith("blob:")')
      assert.deepEqual(await evaluate('photoUrls.revoked'), await evaluate('photoUrls.created'))
      await evaluate('window.scrollTo(0,0)')
      await screenshot('ganti-foto-mobile-validasi', true, photoOutput)
      await choosePhoto([`${fixtures}foto.png`])
      await waitFor('document.querySelector(".admin-profile-photo img").src.startsWith("blob:") && document.querySelector(".admin-profile-photo img").complete')
      assert.equal(await evaluate('!!document.querySelector("#admin-profile-photo-error")'), false)
      await click('.admin-profile-photo-cancel')
      await waitFor('!document.querySelector(".admin-profile-photo img").src.startsWith("blob:")')
      assert.deepEqual(await evaluate('photoUrls.revoked'), await evaluate('photoUrls.created'))
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
    })

    await t.test('Agenda menampilkan seluruh data publik dalam tiga kelompok, aksi nonaktif dan navigasi lima halaman di empat viewport', async () => {
      const expected = mockAgenda.groups.flatMap((group) => group.items.map((item) => ({ ...item, frequency: group.title })))
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await evaluate('window.adminAgendaNavigation = true')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/agenda"]')
        await waitFor('document.querySelectorAll(".admin-agenda-card").length === 12')
        assert.equal(await evaluate('window.adminAgendaNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Agenda')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/agenda')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-agenda-group")].map(e=>e.querySelectorAll(".admin-agenda-card").length)'), [5, 2, 5])
        assert.deepEqual(await evaluate(`[...document.querySelectorAll('.admin-agenda-card')].map(e=>({name:e.querySelector('h4').textContent,frequency:e.querySelector('.admin-agenda-details > span:first-child').textContent.replace(/^Frekuensi: /,''),schedule:e.querySelector('.admin-agenda-details > span:last-child').textContent.replace(/^Jadwal: /,'')}))`), expected)
        assert.equal(await evaluate('document.querySelectorAll(".admin-agenda button:disabled").length'), 25)
        assert.equal(await evaluate('[...document.querySelectorAll(".admin-agenda button")].every(e=>e.disabled&&!!e.title)'), true)
        assert.equal(await evaluate('document.querySelectorAll(".admin-agenda form,.admin-agenda dialog,.admin-agenda input").length'), 0)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        assert.equal(await evaluate(`[...document.querySelectorAll('.admin-agenda-card')].every(e=>{const c=e.getBoundingClientRect(),t=e.querySelector('.admin-agenda-copy').getBoundingClientRect(),a=e.querySelector('.admin-agenda-actions').getBoundingClientRect();return c.left>=0&&c.right<=innerWidth&&e.querySelector('h4').scrollWidth<=e.querySelector('h4').clientWidth&&(a.left>=t.right||a.top>=t.bottom)&&a.right<=c.right})`), true)
        await evaluate('document.fonts.ready;window.scrollTo(0,0)')
        await screenshot(`agenda-${width}-top`, false, agendaOutput)
        await screenshot(`agenda-${width}-full`, true, agendaOutput)
        for (const [route, selector] of [['kelola-dana', '.admin-funds'], ['kategori-dana', '.admin-categories'], ['profil-masjid', '#admin-profile-form'], ['dashboard', '.admin-dashboard']]) {
          if (width < 1024) await click('.admin-menu-toggle')
          await click(`.admin-nav-link[href="/admin/${route}"]`)
          await waitFor(`!!document.querySelector('${selector}')`)
          assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), `/admin/${route}`)
        }
      }
    })

    await t.test('Agenda mendukung refresh/trailing slash dan tidak mengubah daftar publik', async () => {
      await send('Page.navigate', { url: `${baseUrl}/admin/agenda/` })
      await waitFor('document.querySelectorAll(".admin-agenda-card").length === 12')
      await reload('document.querySelectorAll(".admin-agenda-card").length === 12')
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Agenda')
      const names = await evaluate('[...document.querySelectorAll(".admin-agenda-card h4")].map(e=>e.textContent)')
      const schedules = await evaluate(`[...document.querySelectorAll('.admin-agenda-details > span:last-child')].map(e=>e.textContent.replace(/^Jadwal: /,''))`)
      await send('Page.navigate', { url: `${baseUrl}/agenda` })
      await waitFor('document.querySelectorAll(".agenda-row").length === 12')
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".agenda-row-name")].map(e=>e.textContent)'), names)
      assert.deepEqual(await evaluate('[...document.querySelectorAll(".agenda-row-time")].map(e=>e.textContent)'), schedules)
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
    })

    await t.test('Kontak dan Pengaturan pada empat viewport mendukung edit, validasi, toggle keyboard dan simpan simulasi', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await evaluate('window.adminSettingsNavigation = true')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kontak-pengaturan"]')
        await waitFor('!!document.querySelector("#admin-settings-form")')
        assert.equal(await evaluate('window.adminSettingsNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kontak & Pengaturan Website')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/kontak-pengaturan')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-settings-field input")].map(e=>e.value)'), ['', '', ''])
        assert.equal(await evaluate('document.querySelector("#admin-settings-address").value'), mockPublicContent.address)
        assert.equal(await evaluate('document.querySelector("#admin-settings-publicReportEnabled").checked'), true)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        assert.equal(await evaluate('[...document.querySelectorAll(".admin-settings input,.admin-settings textarea,.admin-settings-save")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>=40})'), true)
        await evaluate('document.fonts.ready')
        await screenshot(`kontak-pengaturan-${width}-top`, false, settingsOutput)
        await screenshot(`kontak-pengaturan-${width}-full`, true, settingsOutput)
        await fill('whatsapp', 'bukan nomor', 'admin-settings')
        await fill('email', 'salah', 'admin-settings')
        await fill('mapsUrl', 'javascript:alert(1)', 'admin-settings')
        await click('.admin-settings-save')
        assert.equal(await evaluate('document.querySelectorAll(".admin-settings-error").length'), 3)
        assert.equal(await evaluate('document.activeElement.id'), 'admin-settings-whatsapp')
        assert.equal(await evaluate('!!document.querySelector(".admin-settings-feedback")'), false)
        await screenshot(`kontak-pengaturan-${width}-validasi`, true, settingsOutput)
        await fill('whatsapp', '+62 812-0000-0000', 'admin-settings')
        await fill('email', 'pengurus@contoh.test', 'admin-settings')
        await fill('address', 'Alamat percobaan\nSorolaten', 'admin-settings')
        await fill('mapsUrl', 'https://maps.google.com/?q=Sorolaten', 'admin-settings')
        await click('#admin-settings-publicReportEnabled')
        assert.equal(await evaluate('document.querySelector("#admin-settings-publicReportEnabled").checked'), false)
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 })
        assert.equal(await evaluate('document.querySelector("#admin-settings-publicReportEnabled").checked'), true)
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-settings-switch")).outlineStyle'), 'solid')
        await click('#admin-settings-publicReportEnabled')
        await evaluate('document.querySelector("#admin-settings-mapsUrl").focus()')
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
        await waitFor('!!document.querySelector(".admin-settings-feedback")')
        assert.match(await evaluate('document.querySelector(".admin-settings-feedback").textContent'), /Simulasi.*sementara.*belum tersimpan permanen.*akses laporan publik tidak berubah/)
        assert.equal(await evaluate('document.querySelector("#admin-settings-publicReportEnabled").checked'), false)
        assert.equal(await evaluate('document.querySelector("#admin-settings-address").value'), 'Alamat percobaan\nSorolaten')
        assert.equal(await evaluate('document.querySelectorAll(".admin-settings-error").length'), 0)
        await evaluate('window.scrollTo(0,0)')
        await screenshot(`kontak-pengaturan-${width}-simulasi`, true, settingsOutput)
        await fill('email', 'lain@contoh.test', 'admin-settings')
        assert.equal(await evaluate('!!document.querySelector(".admin-settings-feedback")'), false)
      }
    })

    await t.test('pengaturan tidak mempersist atau menyinkronkan profil/kontak dan tidak mengunci laporan publik', async () => {
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      assert.equal(await evaluate('location.search'), '')
      await click('.admin-menu-toggle')
      await click('.admin-nav-link[href="/admin/profil-masjid"]')
      await waitFor('!!document.querySelector("#admin-profile-form")')
      assert.equal(await evaluate('document.querySelector("#admin-profile-address").value'), mockPublicContent.address)
      assert.equal(await evaluate('document.querySelector("#admin-profile-contact").value'), '')
      await click('.admin-menu-toggle')
      await click('.admin-nav-link[href="/admin/kontak-pengaturan"]')
      await waitFor('!!document.querySelector("#admin-settings-form")')
      assert.equal(await evaluate('document.querySelector("#admin-settings-address").value'), mockPublicContent.address)
      assert.equal(await evaluate('document.querySelector("#admin-settings-publicReportEnabled").checked'), true)
      await click('#admin-settings-publicReportEnabled')
      await click('.admin-settings-save')
      await send('Page.navigate', { url: `${baseUrl}/kontak` })
      await waitFor('document.querySelectorAll(".contact-information-row").length === 3')
      assert.equal(await evaluate('[...document.querySelectorAll(".contact-information-row p")].every(e=>e.textContent==="Data belum dikonfirmasi")'), true)
      assert.doesNotMatch(await evaluate('document.body.innerText'), /Alamat percobaan|pengurus@contoh.test|lain@contoh.test/)
      await send('Page.navigate', { url: `${baseUrl}/laporan-keuangan` })
      await waitFor('document.querySelectorAll(".financial-results table").length === 3')
      assert.equal(await evaluate('!!document.querySelector(".report-access-panel")'), false)
      await send('Page.navigate', { url: `${baseUrl}/admin/kontak-pengaturan/` })
      await waitFor('!!document.querySelector("#admin-settings-form")')
      await reload('!!document.querySelector("#admin-settings-form")')
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kontak & Pengaturan Website')
      assert.equal(await evaluate('document.querySelector("#admin-settings-publicReportEnabled").checked'), true)
      assert.equal(await evaluate('!!document.querySelector(".admin-settings-feedback")'), false)
      for (const name of ['whatsapp', 'email', 'address', 'mapsUrl']) await fill(name, '', 'admin-settings')
      await click('.admin-settings-save')
      assert.equal(await evaluate('document.querySelectorAll(".admin-settings-error").length'), 0)
      assert.equal(await evaluate('!!document.querySelector(".admin-settings-feedback")'), true)
    })

    await t.test('Kelola Akun menampilkan status/aksi contoh dan pencarian nama/email serta empty state di empat viewport', async () => {
      const expected = mockAdminAccounts.map(({ name, email, active }) => ({ name, email, status: active ? 'Aktif' : 'Nonaktif' }))
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await evaluate('window.adminAccountsNavigation = true')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kelola-akun"]')
        await waitFor('document.querySelectorAll(".admin-accounts-card").length === 4')
        assert.equal(await evaluate('window.adminAccountsNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kelola Akun')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/kelola-akun')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-accounts-card")].map(e=>({name:e.querySelector("h3").textContent,email:e.querySelector(".admin-accounts-email").textContent,status:e.querySelector(".admin-accounts-status").textContent}))'), expected)
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-accounts-meta time")].map(e=>e.dateTime)'), mockAdminAccounts.map((account) => account.createdDate))
        assert.equal(await evaluate('document.querySelectorAll(".admin-accounts button:disabled").length'), 10)
        assert.equal(await evaluate('document.querySelectorAll(".admin-accounts-card:last-child button").length'), 3)
        assert.equal(await evaluate('document.querySelectorAll(".admin-accounts input[type=password],.admin-accounts dialog").length'), 0)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        assert.equal(await evaluate(`[...document.querySelectorAll('.admin-accounts-card')].every(e=>{const c=e.getBoundingClientRect(),t=e.querySelector('.admin-accounts-copy').getBoundingClientRect(),a=e.querySelector('.admin-accounts-actions').getBoundingClientRect();return c.left>=0&&c.right<=innerWidth&&(a.left>=t.right||a.top>=t.bottom)&&a.right<=c.right&&[...e.querySelectorAll('button')].every(b=>b.disabled&&!!b.title)})`), true)
        await evaluate('document.fonts.ready;window.scrollTo(0,0)')
        await screenshot(`kelola-akun-${width}-top`, false, accountsOutput)
        await screenshot(`kelola-akun-${width}-full`, true, accountsOutput)
        await fill('query', '  aHMaD  ', 'admin-accounts')
        assert.equal(await evaluate('document.querySelectorAll(".admin-accounts-card").length'), 4)
        await click('.admin-accounts-search button')
        assert.equal(await evaluate('document.querySelector(".admin-accounts-card h3").textContent'), 'Ahmad Fauzi')
        for (const [query, name] of [['SITI@MASJID.ID', 'Siti Rahmawati'], ['budi@', 'Budi Santoso']]) {
          await fill('query', query, 'admin-accounts')
          await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
          await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
          assert.equal(await evaluate('document.querySelectorAll(".admin-accounts-card").length'), 1)
          assert.equal(await evaluate('document.querySelector(".admin-accounts-card h3").textContent'), name)
        }
        await fill('query', 'akun-yang-tidak-ada', 'admin-accounts')
        await click('.admin-accounts-search button')
        assert.equal(await evaluate('document.querySelectorAll(".admin-accounts-card").length'), 0)
        assert.match(await evaluate('document.querySelector(".admin-accounts .admin-dashboard-state").textContent'), /Tidak ada akun yang cocok/)
        await evaluate('window.scrollTo(0,0)')
        await screenshot(`kelola-akun-${width}-kosong`, true, accountsOutput)
        for (const query of ['MASJID.ID', '   ']) {
          await fill('query', query, 'admin-accounts')
          await click('.admin-accounts-search button')
          assert.equal(await evaluate('document.querySelectorAll(".admin-accounts-card").length'), 4)
        }
        await evaluate('[...document.querySelectorAll(".admin-accounts button:disabled")].forEach(e=>e.click())')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-accounts-status")].map(e=>e.textContent)'), ['Aktif', 'Aktif', 'Aktif', 'Nonaktif'])
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
      }
    })

    await t.test('pencarian akun tidak dipersist, mendukung refresh dan navigasi kembali dari enam halaman admin sebelumnya', async () => {
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      assert.equal(await evaluate('location.search'), '')
      await fill('query', 'budi', 'admin-accounts')
      await click('.admin-accounts-search button')
      await reload('document.querySelectorAll(".admin-accounts-card").length === 4')
      assert.equal(await evaluate('document.querySelector("#admin-accounts-query").value'), '')
      for (const [route, selector] of [['dashboard', '.admin-dashboard'], ['kelola-dana', '.admin-funds'], ['kategori-dana', '.admin-categories'], ['profil-masjid', '#admin-profile-form'], ['agenda', '.admin-agenda-card'], ['kontak-pengaturan', '#admin-settings-form']]) {
        await click('.admin-menu-toggle')
        await click(`.admin-nav-link[href="/admin/${route}"]`)
        await waitFor(`!!document.querySelector('${selector}')`)
        await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kelola-akun"]')
        await waitFor('document.querySelectorAll(".admin-accounts-card").length === 4')
        assert.equal(await evaluate('document.querySelector("#admin-accounts-query").value'), '')
      }
      await send('Page.navigate', { url: `${baseUrl}/admin/kelola-akun/` })
      await waitFor('document.querySelectorAll(".admin-accounts-card").length === 4')
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kelola Akun')
    })

    await t.test('Kode Akses Laporan menampilkan metadata simulasi dan penjelasan UI gate tanpa kode asli di empat viewport', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await evaluate('window.adminReportAccessNavigation = true')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kode-akses-laporan"]')
        await waitFor('!!document.querySelector(".admin-report-access-status button")')
        assert.equal(await evaluate('window.adminReportAccessNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kode Akses Laporan')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/kode-akses-laporan')
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-access .admin-panel").length'), 2)
        assert.equal(await evaluate('document.querySelector(".admin-report-access-badge--active").textContent'), 'Aktif')
        assert.equal(await evaluate('document.querySelector(".admin-report-access-mask").textContent'), '••••••••')
        assert.match(await evaluate('document.querySelector(".admin-report-access-code").textContent'), /Simulasi/)
        assert.match(await evaluate('document.querySelector(".admin-report-access-history").textContent'), /10 Juni 2026, 09:00.*Super Admin/)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-access input,.admin-report-access form,.admin-report-access dialog").length'), 0)
        assert.equal(await evaluate('document.querySelector(".admin-report-access-status button").disabled'), true)
        assert.equal(await evaluate('document.querySelectorAll(".admin-report-access-how li").length'), 5)
        const explanation = await evaluate('document.querySelector(".admin-report-access-how").textContent')
        assert.match(explanation, /Tombol laporan di Beranda atau Footer membuka gate \(permintaan kode\)/)
        assert.match(explanation, /Setelah integrasi, sistem memeriksa kode yang dimasukkan pengunjung/)
        assert.match(explanation, /Akses langsung dan refresh \/laporan-keuangan tetap tanpa gate/)
        assert.match(explanation, /bukan autentikasi atau otorisasi laporan/)
        assert.match(explanation, /Autentikasi Super Admin untuk mengelolanya terpisah/)
        assert.doesNotMatch(explanation, /\/laporan(?!-keuangan)|realtime|Terenkripsi/)
        const before = await evaluate('document.querySelector(".admin-report-access-status").innerHTML')
        await evaluate('document.querySelector(".admin-report-access-status button").click()')
        assert.equal(await evaluate('document.querySelector(".admin-report-access-status").innerHTML'), before)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        assert.equal(await evaluate('[...document.querySelectorAll(".admin-report-access .admin-panel")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth})'), true)
        await evaluate('document.fonts.ready;window.scrollTo(0,0)')
        await screenshot(`kode-akses-${width}-top`, false, reportAccessOutput)
        await screenshot(`kode-akses-${width}-full`, true, reportAccessOutput)
      }
    })

    await t.test('halaman kode akses mendukung refresh/trailing slash dan navigasi ke tujuh halaman admin lama tanpa penyimpanan', async () => {
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      assert.equal(await evaluate('location.search'), '')
      await reload('!!document.querySelector(".admin-report-access-status button")')
      for (const [route, selector] of [['dashboard', '.admin-dashboard'], ['kelola-dana', '.admin-funds'], ['kategori-dana', '.admin-categories'], ['profil-masjid', '#admin-profile-form'], ['agenda', '.admin-agenda-card'], ['kontak-pengaturan', '#admin-settings-form'], ['kelola-akun', '.admin-accounts-card']]) {
        await click('.admin-menu-toggle')
        await click(`.admin-nav-link[href="/admin/${route}"]`)
        await waitFor(`!!document.querySelector('${selector}')`)
        await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/kode-akses-laporan"]')
        await waitFor('!!document.querySelector(".admin-report-access-status button")')
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Kode Akses Laporan')
      }
      await send('Page.navigate', { url: `${baseUrl}/admin/kode-akses-laporan/` })
      await waitFor('!!document.querySelector(".admin-report-access-status button")')
      assert.equal(await evaluate('document.querySelector(".admin-report-access-code .admin-report-access-badge").textContent'), 'Simulasi')
    })

    await t.test('Activity Log di empat viewport menampilkan sembilan contoh, kelompok tanggal dan kombinasi filter lokal tanpa mutasi', async () => {
      const expectedTitles = mockAdminActivityLog.map((activity) => `${activity.admin} ${activity.title}`)
      for (const [width, height] of [[1728, 1080], [1366, 768], [768, 1024], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await open()
        await evaluate('window.adminActivityNavigation = true')
        if (width < 1024) await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/activity-log"]')
        await waitFor('document.querySelectorAll(".admin-activity-card").length === 9')
        assert.equal(await evaluate('window.adminActivityNavigation'), true)
        assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Activity Log')
        assert.equal(await evaluate('document.querySelector(".admin-nav-link[aria-current=page]").getAttribute("href")'), '/admin/activity-log')
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-activity-card h4")].map(e=>e.textContent)'), expectedTitles)
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-activity-date-group")].map(e=>e.querySelectorAll(".admin-activity-card").length)'), [2, 1, 1, 1, 2, 1, 1])
        assert.equal(await evaluate('[...document.querySelectorAll(".admin-activity-date-group")].every(g=>[...g.querySelectorAll(".admin-activity-author time")].every(e=>e.dateTime.startsWith(g.querySelector("h3 time").dateTime)))'), true)
        assert.match(await evaluate('document.querySelector(".admin-activity-system").textContent'), /hanya data contoh.*belum ditegakkan/)
        assert.equal(await evaluate('document.querySelectorAll(".admin-activity button,.admin-activity form,.admin-activity dialog,.admin-activity input[type=password]").length'), 0)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        assert.equal(await evaluate('[...document.querySelectorAll(".admin-activity-card,.admin-activity-details,.admin-activity-filter-grid input,.admin-activity-filter-grid select")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&e.scrollWidth<=e.clientWidth})'), true)
        await evaluate('document.fonts.ready;window.scrollTo(0,0)')
        await screenshot(`activity-log-${width}-top`, false, activityOutput)
        await screenshot(`activity-log-${width}-full`, true, activityOutput)
        await activityFilter('admin', 'Ahmad')
        assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'), 3)
        await fill('query', ' KONSUMSI ', 'admin-activity')
        assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'), 1)
        for (const [name, value] of [['type', 'edit'], ['date', '2026-06-14'], ['module', 'Keuangan']]) await activityFilter(name, value)
        assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'), 1)
        await activityFilter('admin', 'Siti')
        assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'), 0)
        assert.match(await evaluate('document.querySelector(".admin-activity .admin-dashboard-state").textContent'), /Tidak ada aktivitas yang sesuai/)
        await evaluate('window.scrollTo(0,0)')
        await screenshot(`activity-log-${width}-kosong`, true, activityOutput)
        for (const name of ['admin', 'type', 'date', 'module', 'query']) await activityFilter(name, '')
        assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'), 9)
        for (const [name, value, count] of [['type', 'code', 1], ['module', 'Akun', 3], ['date', '2026-06-13', 1], ['admin', 'Super Admin', 4], ['query', 'SITI', 2], ['query', 'donasi pembangunan', 1]]) {
          await activityFilter(name, value)
          assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'), count)
          await activityFilter(name, '')
        }
        assert.deepEqual(await evaluate('[...document.querySelectorAll(".admin-activity-card h4")].map(e=>e.textContent)'), expectedTitles)
        if (width === 390) {
          await evaluate('document.querySelector(".admin-activity-card").scrollIntoView({block:"start"});window.scrollBy(0,-84)')
          await screenshot('activity-log-mobile-detail', false, activityOutput)
        }
      }
    })

    await t.test('filter Activity Log tidak dipersist, refresh/trailing slash serta navigasi delapan halaman admin tetap berfungsi', async () => {
      assert.deepEqual(await evaluate('({local:localStorage.length,session:sessionStorage.length,cookie:document.cookie})'), { local: 0, session: 0, cookie: '' })
      assert.equal(await evaluate('location.search'), '')
      await activityFilter('type', 'code')
      await reload('document.querySelectorAll(".admin-activity-card").length === 9')
      assert.equal(await evaluate('document.querySelector("#admin-activity-type").value'), '')
      for (const [route, selector] of [['dashboard', '.admin-dashboard'], ['kelola-dana', '.admin-funds'], ['kategori-dana', '.admin-categories'], ['profil-masjid', '#admin-profile-form'], ['agenda', '.admin-agenda-card'], ['kontak-pengaturan', '#admin-settings-form'], ['kelola-akun', '.admin-accounts-card'], ['kode-akses-laporan', '.admin-report-access-status']]) {
        await click('.admin-menu-toggle')
        await click(`.admin-nav-link[href="/admin/${route}"]`)
        await waitFor(`!!document.querySelector('${selector}')`)
        await click('.admin-menu-toggle')
        await click('.admin-nav-link[href="/admin/activity-log"]')
        await waitFor('document.querySelectorAll(".admin-activity-card").length === 9')
      }
      await send('Page.navigate', { url: `${baseUrl}/admin/activity-log/` })
      await waitFor('document.querySelectorAll(".admin-activity-card").length === 9')
      assert.equal(await evaluate('document.querySelector(".admin-topbar h1").textContent'), 'Activity Log')
    })

    await t.test('mode API tidak memakai mock diam-diam atau menghubungi endpoint admin karangan', async () => {
      for (const route of ['/admin/dashboard', '/admin/kelola-dana', '/admin/kategori-dana']) {
        await send('Page.navigate', { url: `${apiUrl}${route}` })
        await waitFor('!!document.querySelector(".admin-dashboard-state[role=alert]")')
        assert.match(await evaluate('document.querySelector(".admin-dashboard-state").textContent'), /Dashboard admin melalui API belum tersedia/)
        assert.equal(await evaluate('document.querySelectorAll(".admin-statistic,.admin-recent").length'), 0)
      }
      await send('Page.navigate', { url: `${apiUrl}/admin/profil-masjid` })
      await waitFor('!!document.querySelector(".admin-profile [role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-profile [role=alert]").textContent'), /Profil admin melalui API belum tersedia/)
      assert.equal(await evaluate('document.querySelector(".admin-profile-save").disabled'), true)
      assert.equal(await evaluate('!!document.querySelector("#admin-profile-form")'), false)
      await send('Page.navigate', { url: `${apiUrl}/admin/agenda` })
      await waitFor('!!document.querySelector(".admin-agenda [role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-agenda [role=alert]").textContent'), /Agenda melalui API belum tersedia/)
      assert.equal(await evaluate('document.querySelectorAll(".admin-agenda-card").length'), 0)
      await send('Page.navigate', { url: `${apiUrl}/admin/kontak-pengaturan` })
      await waitFor('!!document.querySelector(".admin-settings [role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-settings [role=alert]").textContent'), /Kontak dan pengaturan admin melalui API belum tersedia/)
      assert.equal(await evaluate('document.querySelector(".admin-settings-save").disabled'), true)
      assert.equal(await evaluate('!!document.querySelector("#admin-settings-form")'), false)
      await send('Page.navigate', { url: `${apiUrl}/admin/kelola-akun` })
      await waitFor('!!document.querySelector(".admin-accounts [role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-accounts [role=alert]").textContent'), /Manajemen akun admin melalui API belum tersedia/)
      assert.equal(await evaluate('document.querySelectorAll(".admin-accounts-card").length'), 0)
      assert.equal(await evaluate('document.querySelector(".admin-accounts-search button").disabled'), true)
      await send('Page.navigate', { url: `${apiUrl}/admin/kode-akses-laporan` })
      await waitFor('!!document.querySelector(".admin-report-access [role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-report-access [role=alert]").textContent'), /Status kode akses admin melalui API belum tersedia/)
      assert.equal(await evaluate('!!document.querySelector(".admin-report-access-status")'), false)
      await send('Page.navigate', { url: `${apiUrl}/admin/activity-log` })
      await waitFor('!!document.querySelector(".admin-activity [role=alert]")')
      assert.match(await evaluate('document.querySelector(".admin-activity [role=alert]").textContent'), /Activity Log melalui API belum tersedia/)
      assert.equal(await evaluate('document.querySelectorAll(".admin-activity-card").length'), 0)
      assert.equal(await evaluate('document.querySelectorAll(".admin-activity-filters [disabled]").length'), 5)
      assert.deepEqual(requests, [])
      assert.deepEqual(failures, [])
    })
  } finally {
    ws.close()
    await fetch(`${cdpUrl}/json/close/${target.id}`)
  }
})
