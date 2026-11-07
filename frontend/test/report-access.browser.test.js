import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, mkdtemp, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const baseUrl = process.env.REPORT_BROWSER_QA_URL
const apiUrl = process.env.REPORT_BROWSER_API_QA_URL
const cdpUrl = process.env.REPORT_BROWSER_CDP_URL

test('interaksi gate dan laporan pada Chrome terpisah', {
  skip: !baseUrl || !apiUrl || !cdpUrl ? 'Jalankan server mock/API dan Chrome QA sesuai README.' : false,
  timeout: 90000,
}, async (t) => {
  const targets = await (await fetch(`${cdpUrl}/json`)).json()
  const target = targets.find((item) => item.type === 'page')
  assert.ok(target, 'Tab Chrome QA harus tersedia.')
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  const pending = new Map()
  const failures = []
  const downloads = []
  const downloadRoot = fileURLToPath(new URL('../../tmp/report-export-tests/', import.meta.url))
  await mkdir(downloadRoot, { recursive: true })
  const downloadPath = await mkdtemp(`${downloadRoot}run-`)
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
    if (message.method === 'Browser.downloadWillBegin') downloads.push(message.params)
    if (message.method === 'Browser.downloadProgress') {
      const file = downloads.find((item) => item.guid === message.params.guid)
      if (file) Object.assign(file, message.params)
    }
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true })
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
  const openGate = async (origin = baseUrl) => {
    const url = `${origin}/?qa=${++sequence}`
    await send('Page.navigate', { url })
    await waitFor(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && !!document.querySelector('.public-footer a[href="/laporan-keuangan"]')`)
    await evaluate('document.querySelector(\'.public-footer a[href="/laporan-keuangan"]\').click()')
    await waitFor('!!document.querySelector(".report-access-dialog[open] #report-password")')
  }
  const fillPassword = async (value) => {
    await evaluate('document.querySelector("#report-password").focus(); document.querySelector("#report-password").select()')
    await send('Input.insertText', { text: value })
  }
  const submit = () => evaluate('document.querySelector(".report-access-form").requestSubmit()')
  const clickVisible = async (selector) => {
    const point = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,visible:r.width>0&&r.height>0&&e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))} })()`)
    assert.equal(point.visible, true, selector)
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: point.x, y: point.y, button: 'left', clickCount: 1 })
  }
  const setDates = async (startDate, endDate) => {
    await evaluate(`(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      for (const [label, value] of ${JSON.stringify([['Tanggal awal', startDate], ['Tanggal akhir', endDate]])}) {
        const input = document.querySelector('input[aria-label="' + label + '"]')
        setter.call(input, value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })()`)
  }
  const applyDates = () => evaluate('document.querySelector(".financial-custom-range").requestSubmit()')
  const panRight = async (selector) => {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`)
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
    await waitFor(`document.querySelector(${JSON.stringify(selector)}).scrollLeft > 0`)
  }
  const readDownload = async (index) => {
    for (let attempt = 0; attempt < 500; attempt++) {
      const file = downloads[index]
      if (file?.state === 'completed') return { ...file, bytes: await readFile(`${downloadPath}/${file.guid}`) }
      assert.notEqual(file?.state, 'canceled')
      await new Promise((resolve) => setTimeout(resolve, 30))
    }
    assert.fail('Berkas unduhan tidak selesai diterima Chrome QA.')
  }
  const exportCurrent = async () => {
    const index = downloads.length
    await evaluate('document.querySelector(".report-preview-toolbar-actions .export-button--primary").click()')
    await waitFor('document.querySelector(".report-preview-toolbar-actions").getAttribute("aria-busy") === "false"')
    assert.match(await evaluate('document.querySelector("#report-export-status").textContent'), /telah dibuat; unduhan dimulai/)
    return readDownload(index)
  }
  const checkPdf = (file, count) => {
    assert.equal(file.bytes.subarray(0, 5).toString(), '%PDF-')
    const content = file.bytes.toString('latin1')
    assert.equal((content.match(/\/Type\s*\/Page\b/g) || []).length, count)
    const boxes = [...content.matchAll(/\/MediaBox\s*\[([^\]]+)\]/g)].map((match) => match[1].split(/\s+/).map(Number))
    assert.equal(boxes.length, count)
    for (const [x, y, width, height] of boxes) {
      assert.equal(x + y, 0)
      assert.ok(Math.abs(width - 841.89) < .01 && Math.abs(height - 595.28) < .01)
    }
    assert.ok(file.bytes.length > 10000)
  }
  const checkPng = (bytes) => {
    const data = Buffer.from(bytes)
    assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
    assert.equal(data.readUInt32BE(16), 2245)
    assert.equal(data.readUInt32BE(20), 1587)
    assert.ok(data.length > 10000)
  }

  try {
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Network.enable')
    await send('Page.bringToFront')
    await send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath, eventsEnabled: true })
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false })
    await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 })

    await t.test('akses langsung dan refresh memuat laporan tanpa gate atau Navbar/Footer publik', async () => {
      await send('Page.navigate', { url: `${baseUrl}/laporan-keuangan` })
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
      assert.equal(await evaluate('document.querySelectorAll("nav, .public-footer, #report-password").length'), 0)
      await send('Page.reload', { ignoreCache: true })
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
      assert.equal(await evaluate('!!document.querySelector("#report-password")'), false)
    })
    await t.test('modal berada di halaman asal, mengunci scroll/fokus, Escape dan tutup mengembalikan fokus', async () => {
      await openGate()
      assert.equal(await evaluate('location.pathname'), '/')
      assert.equal(await evaluate('!!document.querySelector(".public-header")'), true)
      assert.equal(await evaluate('document.querySelector("dialog").matches(":modal")'), true)
      assert.equal(await evaluate('document.querySelector("#report-password").type'), 'password')
      assert.equal(await evaluate('document.activeElement.id'), 'report-password')
      assert.equal(await evaluate('document.body.style.overflow'), 'hidden')
      assert.equal(await evaluate(`(()=>{const e=document.querySelector('.navbar'),r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))})()`), false)
      for (let i = 0; i < 5; i++) {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
        assert.equal(await evaluate('!!document.activeElement.closest("dialog")'), true)
      }
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 8, y: 740, deltaX: 0, deltaY: 500 })
      assert.equal(await evaluate('scrollY'), 0)
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
      await waitFor('!document.querySelector("dialog")')
      assert.equal(await evaluate('document.activeElement.matches(\'.public-footer a[href="/laporan-keuangan"]\')'), true)
      assert.equal(await evaluate('document.body.style.overflow'), '')
      await evaluate('document.activeElement.click()')
      await waitFor('!!document.querySelector("dialog[open]")')
      await evaluate('document.querySelector(".report-access-close").click()')
      await waitFor('!document.querySelector("dialog")')
      assert.equal(await evaluate('document.activeElement.matches(\'.public-footer a[href="/laporan-keuangan"]\')'), true)
      await openGate()
    })
    await t.test('sandi kosong menampilkan pesan tanpa membuka laporan', async () => {
      await submit()
      await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Sandi wajib diisi")')
      assert.equal(await evaluate('!!document.querySelector(".financial-report")'), false)
    })
    await t.test('sandi salah menampilkan loading lalu error dan tetap pada gate', async () => {
      await fillPassword('salah')
      await submit()
      assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), true)
      assert.equal(await evaluate('document.querySelector("form").getAttribute("aria-busy")'), 'true')
      await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Sandi tidak cocok")')
      assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), false)
    })
    await t.test('submit berulang hanya memulai satu pemeriksaan', async () => {
      await evaluate(`(() => {
        const OriginalController = window.AbortController
        window.__qaChecks = 0
        window.AbortController = class extends OriginalController { constructor(...args) { super(...args); window.__qaChecks++ } }
        try { for (let i = 0; i < 8; i++) document.querySelector('form').requestSubmit() }
        finally { window.AbortController = OriginalController }
      })()`)
      assert.equal(await evaluate('window.__qaChecks'), 1)
      await waitFor('document.querySelector("form")?.getAttribute("aria-busy") === "true"')
      await waitFor('document.querySelector("button[type=submit]")?.disabled === false')
    })
    await t.test('Enter dengan sandi benar membuka laporan dan membersihkan input', async () => {
      await fillPassword('demo123')
      assert.equal(await evaluate('document.querySelector("#report-password").value'), 'demo123')
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
      await waitFor('!!document.querySelector(".financial-report")')
      assert.equal(await evaluate('document.querySelectorAll("input[type=password]").length'), 0)
      assert.equal(await evaluate('document.activeElement.tagName'), 'H1')
      assert.equal(await evaluate('document.querySelector(".financial-results").getAttribute("aria-busy")'), 'true')
    })
    await t.test('laporan menampilkan 50 transaksi, total konsisten dan pilihan format tersedia', async () => {
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
      assert.equal(await evaluate('document.querySelector(".financial-table--income .financial-subtotal").textContent'), 'Rp 10.665.500')
      assert.equal(await evaluate('document.querySelector(".financial-table--expense .financial-subtotal").textContent'), 'Rp 8.771.500')
      assert.equal(await evaluate('document.querySelector(".financial-summary-table tfoot td:last-child").textContent'), '20.484.700')
      assert.equal(await evaluate('document.querySelector(".financial-export button").disabled'), false)
      assert.equal(await evaluate('!!document.querySelector(".financial-presets select")'), false)
    })
    await t.test('draft tanggal baru berlaku setelah Terapkan dan saldo awal mengikuti mutasi sebelumnya', async () => {
      await setDates('2026-04-03', '2026-04-05')
      assert.equal(await evaluate('document.querySelectorAll(".financial-transactions-table tbody tr").length'), 50)
      await applyDates()
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 9')
      assert.equal(await evaluate('document.querySelector(".financial-summary-table tfoot td:first-of-type").textContent'), '15.445.700')
      assert.equal(await evaluate('document.querySelector(".financial-summary-table tfoot td:last-child").textContent'), '16.602.700')
    })
    await t.test('tanggal terbalik ditolak dan mempertahankan laporan sebelumnya', async () => {
      await setDates('2026-04-30', '2026-04-01')
      await applyDates()
      await waitFor('document.querySelector(".financial-filter-error")?.textContent.includes("tidak boleh melebihi")')
      assert.equal(await evaluate('document.querySelectorAll(".financial-transactions-table tbody tr").length'), 9)
    })
    await t.test('hari kosong dalam April menampilkan tabel kosong dan saldo terbawa', async () => {
      await setDates('2026-04-04', '2026-04-04')
      await applyDates()
      await waitFor('document.querySelectorAll(".financial-table-empty").length === 2')
      assert.equal(await evaluate('document.querySelector(".financial-summary-table tfoot td:last-child").textContent'), '16.815.700')
    })
    await t.test('preset mingguan memakai akhir April dan memperbarui tabel serta ringkasan', async () => {
      await evaluate(`document.querySelector('.financial-presets button').click()`)
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 14')
      assert.equal(await evaluate('document.querySelector(".financial-summary-table tfoot td:last-child").textContent'), '20.484.700')
    })
    await t.test('preset tiga bulan dan bulan tanpa data tidak ditampilkan sebagai saldo nol', async () => {
      await evaluate('document.querySelectorAll(".financial-presets button")[2].click()')
      await waitFor('document.querySelector(".financial-status")?.textContent.includes("belum lengkap")')
      assert.equal(await evaluate('document.querySelector(".financial-export button").disabled'), true)
      assert.equal(await evaluate('document.querySelectorAll(".financial-summary-table").length'), 0)
      await evaluate(`(() => { const e=document.querySelector('.financial-month select'); e.value='2026-03'; e.dispatchEvent(new Event('change',{bubbles:true})) })()`)
      await waitFor('document.querySelector("#financial-detail-heading").textContent.includes("Maret 2026") && document.querySelector(".financial-status")?.textContent.includes("belum lengkap")')
      assert.equal(await evaluate('document.querySelectorAll(".financial-transactions-table").length'), 0)
      await evaluate(`document.querySelectorAll('.financial-presets button')[1].click()`)
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
    })
    await t.test('laporan membuka pilihan format dengan PDF aktif dan jumlah lembar aktual', async () => {
      await evaluate('document.querySelector(".financial-export button").click()')
      await waitFor('!!document.querySelector(".report-format-options")')
      assert.equal(await evaluate('document.querySelector("input[value=pdf]").checked'), true)
      assert.match(await evaluate('document.querySelector(".report-export-period").textContent'), /17 transaksi masuk · 33 transaksi keluar · 2 lembar/)
      assert.equal(await evaluate('location.pathname'), '/laporan-keuangan')
    })
    await t.test('pilihan PDF dan PNG dapat diganti dan status aktif mengikuti radio', async () => {
      await evaluate('document.querySelector("input[value=png]").click()')
      assert.equal(await evaluate('document.querySelector("input[value=png]").checked'), true)
      assert.equal(await evaluate('document.querySelectorAll(".report-format-card.is-selected").length'), 1)
      await evaluate('document.querySelector("input[value=pdf]").click()')
      assert.equal(await evaluate('document.querySelector("input[value=pdf]").checked'), true)
    })
    await t.test('lanjut PDF menampilkan seluruh baris dan ringkasan pada halaman terakhir', async () => {
      await evaluate('document.querySelector(".report-export-actions .export-button--primary").click()')
      await waitFor('document.querySelectorAll(".report-sheet").length === 2')
      assert.equal(await evaluate(`([...document.querySelectorAll('.report-sheet .financial-category')]).every(e => {
        const style = getComputedStyle(e), box = e.getBoundingClientRect(), cell = e.closest('td, th').getBoundingClientRect()
        return style.backgroundColor === 'rgba(0, 0, 0, 0)' && style.borderRadius === '0px' && e.scrollWidth <= e.clientWidth && box.right <= cell.right
      })`), true)
      assert.equal(await evaluate('document.querySelectorAll(".report-sheet [data-transaction-id]").length'), 50)
      assert.equal(await evaluate('document.querySelector(".report-sheet").querySelectorAll(".financial-summary--sheet").length'), 0)
      assert.equal(await evaluate('document.querySelector(".financial-summary--sheet tfoot td:last-child").textContent'), '20.484.700')
      assert.equal(await evaluate('document.querySelectorAll(".report-preview-toolbar-actions button:disabled, .report-export-actions button:disabled").length'), 0)
      await evaluate('window.__qaSheetContent = [...document.querySelectorAll(".report-sheet")].map(e=>e.outerHTML).join("")')
    })
    await t.test('mengganti pratinjau ke PNG mempertahankan isi lembar dan total', async () => {
      await evaluate('document.querySelectorAll(".report-preview-format button")[1].click()')
      assert.equal(await evaluate('[...document.querySelectorAll(".report-sheet")].map(e=>e.outerHTML).join("") === window.__qaSheetContent'), true)
      assert.match(await evaluate('document.querySelector(".report-preview-page-label h3").textContent'), /Gambar 1 dari 2/)
      assert.equal(await evaluate('document.querySelectorAll("[download], canvas, iframe").length'), 0)
    })
    await t.test('ekspor PDF nyata berisi dua halaman A4 dan submit ganda hanya mengunduh satu berkas', async () => {
      await evaluate('document.querySelector(".report-preview-format button").click()')
      const index = downloads.length
      await evaluate('document.querySelectorAll(".report-preview-toolbar-actions .export-button--primary, .report-export-actions .export-button--primary").forEach(button => { for (let i = 0; i < 5; i++) button.click() })')
      assert.equal(await evaluate('document.querySelector(".report-preview-toolbar-actions").getAttribute("aria-busy")'), 'true')
      assert.equal(await evaluate('document.querySelector(".report-preview-format button").disabled'), true)
      await waitFor('document.querySelector(".report-preview-toolbar-actions").getAttribute("aria-busy") === "false"')
      const file = await readDownload(index)
      assert.equal(downloads.length, index + 1)
      assert.equal(file.suggestedFilename, 'laporan-keuangan-masjid-al-hidayah-2026-04.pdf')
      checkPdf(file, 2)
      assert.equal(await evaluate('[...document.querySelectorAll(".report-sheet")].map(e=>e.outerHTML).join("") === window.__qaSheetContent'), true)
    })
    await t.test('ekspor PNG jamak menghasilkan ZIP dengan dua PNG 2× yang berurutan', async () => {
      await evaluate('document.querySelectorAll(".report-preview-format button")[1].click()')
      assert.match(await evaluate('document.querySelector(".report-preview-meta").textContent'), /ZIP/)
      const file = await exportCurrent()
      assert.equal(file.suggestedFilename, 'laporan-keuangan-masjid-al-hidayah-2026-04.zip')
      const zip = await JSZip.loadAsync(file.bytes, { checkCRC32: true })
      assert.deepEqual(Object.keys(zip.files), ['halaman-01.png', 'halaman-02.png'])
      for (const image of Object.values(zip.files)) checkPng(await image.async('uint8array'))
    })
    await t.test('render kosong ditolak tanpa mengunduh dan tombol dapat dicoba kembali', async () => {
      const count = downloads.length
      await evaluate('window.__qaDrawImage = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = () => {}')
      try {
        await evaluate('document.querySelector(".report-preview-toolbar-actions .export-button--primary").click()')
        await waitFor('document.querySelector("#report-export-status")?.getAttribute("role") === "alert"')
        assert.match(await evaluate('document.querySelector("#report-export-status").textContent'), /Render laporan kosong/)
        assert.equal(downloads.length, count)
        assert.equal(await evaluate('document.querySelector(".report-preview-toolbar-actions .export-button--primary").disabled'), false)
      } finally { await evaluate('CanvasRenderingContext2D.prototype.drawImage = window.__qaDrawImage') }
    })
    await t.test('kegagalan pemicu unduhan tidak menampilkan sukses dan tetap menjaga pratinjau', async () => {
      const count = downloads.length
      await evaluate('window.__qaAnchorClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = () => { throw new Error("Simulasi unduhan ditolak") }')
      try {
        await evaluate('document.querySelector(".report-preview-toolbar-actions .export-button--primary").click()')
        await waitFor('document.querySelector("#report-export-status")?.getAttribute("role") === "alert"')
        assert.match(await evaluate('document.querySelector("#report-export-status").textContent'), /Unduhan tidak dapat dimulai/)
        assert.doesNotMatch(await evaluate('document.querySelector("#report-export-status").textContent'), /telah dibuat/)
        assert.equal(downloads.length, count)
        assert.equal(await evaluate('document.querySelectorAll(".report-sheet [data-transaction-id]").length'), 50)
      } finally { await evaluate('HTMLAnchorElement.prototype.click = window.__qaAnchorClick') }
    })
    await t.test('kembali ke pilihan format mempertahankan PNG lalu kembali ke laporan', async () => {
      await evaluate('document.querySelector(".report-export-actions > button").click()')
      await waitFor('!!document.querySelector("input[value=png]")')
      assert.equal(await evaluate('document.querySelector("input[value=png]").checked'), true)
      await evaluate('document.querySelector(".report-export-actions > button").click()')
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
    })
    await t.test('filter kustom tetap sama sepanjang pilihan format dan kedua pratinjau', async () => {
      await evaluate('document.querySelectorAll(".financial-presets button")[3].click()')
      await setDates('2026-04-03', '2026-04-05')
      await applyDates()
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 9')
      await evaluate('document.querySelector(".financial-export button").click()')
      await waitFor('!!document.querySelector(".report-format-options")')
      assert.match(await evaluate('document.querySelector(".report-export-period").textContent'), /3–5 April 2026/)
      await evaluate('document.querySelector("input[value=pdf]").click()')
      await evaluate('document.querySelector(".report-export-actions .export-button--primary").click()')
      await waitFor('document.querySelectorAll(".report-sheet").length === 1')
      assert.equal(await evaluate('document.querySelectorAll(".report-sheet [data-transaction-id]").length'), 9)
      assert.equal(await evaluate('document.querySelector(".financial-summary--sheet tfoot td:first-of-type").textContent'), '15.445.700')
      checkPdf(await exportCurrent(), 1)
      await evaluate('document.querySelectorAll(".report-preview-format button")[1].click()')
      assert.equal(await evaluate('document.querySelector(".financial-summary--sheet tfoot td:last-child").textContent'), '16.602.700')
      const png = await exportCurrent()
      assert.equal(png.suggestedFilename, 'laporan-keuangan-masjid-al-hidayah-2026-04-03--2026-04-05.png')
      checkPng(png.bytes)
      await evaluate('document.querySelector(".report-export-header > button").click()')
      await waitFor('!!document.querySelector(".report-format-options")')
      await evaluate('document.querySelector(".report-export-actions > button").click()')
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 9')
      assert.equal(await evaluate(`document.querySelector('input[aria-label="Tanggal awal"]').value`), '2026-04-03')
      assert.equal(await evaluate(`document.querySelector('input[aria-label="Tanggal akhir"]').value`), '2026-04-05')
      await evaluate('document.querySelector(".financial-export button").click()')
      await waitFor('!!document.querySelector(".report-format-options")')
      await evaluate('document.querySelector(".report-export-actions .export-button--primary").click()')
      await waitFor('document.querySelectorAll(".report-sheet").length === 1')
    })
    await t.test('sandi/status tidak ditulis ke URL, storage atau cookie', async () => {
      assert.equal(await evaluate('localStorage.length + sessionStorage.length'), 0)
      assert.equal(await evaluate('document.cookie'), '')
      assert.equal(await evaluate('location.href.includes("demo123") || /password|valid|access=true/.test(location.search)'), false)
    })
    await t.test('refresh dari pratinjau tetap di laporan dan mereset tampilan tanpa sandi', async () => {
      await send('Page.reload', { ignoreCache: true })
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
      assert.equal(await evaluate('!!document.querySelector("#report-password")'), false)
      assert.equal(await evaluate('location.pathname'), '/laporan-keuangan')
    })
    await t.test('mode API gagal dengan pesan integrasi dan dapat dicoba kembali', async () => {
      await openGate(apiUrl)
      await fillPassword('demo123')
      await submit()
      await waitFor('document.querySelector("[role=alert]")?.textContent.includes("API belum tersedia")')
      assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), false)
      assert.equal(await evaluate('!!document.querySelector(".financial-report")'), false)
      await send('Page.navigate', { url: `${apiUrl}/laporan-keuangan` })
      await waitFor('document.querySelector("[role=alert]")?.textContent.includes("Laporan keuangan melalui API belum tersedia")')
      assert.equal(await evaluate('!!document.querySelector("#report-password")'), false)
    })
    await t.test('CTA Beranda dan tautan Footer seluruh halaman membuka gate', async () => {
      for (const route of ['/', '/agenda', '/profil', '/kontak']) {
        const url = `${baseUrl}${route}?qa=${++sequence}`
        await send('Page.navigate', { url })
        await waitFor(`location.href === ${JSON.stringify(url)} && !!document.querySelector('.public-footer a[href="/laporan-keuangan"]') && !document.querySelector('.content-status')`)
        if (route === '/') {
          await evaluate('document.querySelector(".finance-cta a").click()')
          await waitFor('!!document.querySelector("#report-password")')
          await send('Page.navigate', { url })
          await waitFor(`location.href === ${JSON.stringify(url)} && !!document.querySelector('.public-footer')`)
        }
        await evaluate(`document.querySelector('.public-footer a[href="/laporan-keuangan"]').scrollIntoView({ block: 'center' })`)
        const originScroll = await evaluate('scrollY')
        await evaluate(`document.querySelector('.public-footer a[href="/laporan-keuangan"]').click()`)
        await waitFor(`location.pathname === ${JSON.stringify(route)} && !!document.querySelector('dialog[open] #report-password')`)
        assert.equal(await evaluate('scrollY'), originScroll)
        await evaluate('document.querySelector(".report-access-close").click()')
        await waitFor('!document.querySelector("dialog")')
        assert.equal(await evaluate('scrollY'), originScroll)
        assert.equal(await evaluate('document.activeElement.matches(\'.public-footer a[href="/laporan-keuangan"]\')'), true)
      }
    })
    await t.test('keluar laporan lalu klik CTA kembali membuka modal baru pada Beranda', async () => {
      await openGate()
      await fillPassword('demo123')
      await submit()
      await waitFor('!!document.querySelector(".financial-report")')
      await evaluate('document.querySelector(".financial-report a").click()')
      await waitFor('location.pathname === "/" && !!document.querySelector(".hero")')
      await evaluate('document.querySelector(".finance-cta a").click()')
      await waitFor('!!document.querySelector("#report-password")')
      assert.equal(await evaluate('location.pathname'), '/')
    })
    await t.test('menutup modal saat loading membatalkan pemeriksaan dan tidak berpindah halaman', async () => {
      await openGate()
      await fillPassword('demo123')
      await submit()
      await waitFor('document.querySelector(".report-access-form").getAttribute("aria-busy") === "true"')
      await evaluate('document.querySelector(".report-access-close").click()')
      await waitFor('!document.querySelector("dialog")')
      await new Promise((resolve) => setTimeout(resolve, 350))
      assert.equal(await evaluate('location.pathname'), '/')
      await evaluate('document.activeElement.click()')
      await waitFor('!!document.querySelector("dialog[open]")')
      assert.equal(await evaluate('document.querySelector("#report-password").value'), '')
      assert.equal(await evaluate('!!document.querySelector(".report-access-error")'), false)
      await evaluate('document.querySelector(".report-access-close").click()')
    })
    await t.test('navigasi publik berurutan, menu aktif dan skip link dapat digunakan melalui keyboard', async () => {
      const url = `${baseUrl}/?qa=${++sequence}`
      await send('Page.navigate', { url })
      await waitFor(`location.href === ${JSON.stringify(url)} && !!document.querySelector('.hero')`)
      async function key(key, code, number, text) {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: number, ...(text ? { text } : {}) })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: number })
      }
      await key('Tab', 'Tab', 9)
      assert.equal(await evaluate('document.activeElement.matches(".skip-link")'), true)
      assert.ok(await evaluate('document.activeElement.getBoundingClientRect().top >= 0'))
      assert.notEqual(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'none')
      await key('Enter', 'Enter', 13, '\r')
      await waitFor('document.activeElement.id === "konten"')
      await key('Tab', 'Tab', 9)
      assert.equal(await evaluate('document.activeElement.getAttribute("href")'), '/agenda')
      await key('Enter', 'Enter', 13, '\r')
      await waitFor('location.pathname === "/agenda" && !!document.querySelector(".agenda-group")')
      for (const route of ['/agenda', '/profil', '/kontak', '/']) {
        if (route !== '/agenda') await evaluate(`document.querySelector('.nav-links a[href="${route}"]').click()`)
        await waitFor(`location.pathname === ${JSON.stringify(route)} && !!document.querySelector('.nav-links a[aria-current="page"]')`)
        assert.equal(await evaluate('document.querySelectorAll(".nav-links a[aria-current=page]").length'), 1)
        assert.equal(await evaluate('document.querySelector(".nav-links a[aria-current=page]").getAttribute("href")'), route)
      }
      await send('Page.navigate', { url: `${baseUrl}/halaman-tidak-ada` })
      await waitFor('document.querySelector("h1")?.textContent.includes("tidak ditemukan")')
      await evaluate('document.querySelector("main a").click()')
      await waitFor('location.pathname === "/" && !!document.querySelector(".hero")')
    })
    await t.test('mode API menampilkan error integrasi pada empat halaman publik tanpa route rusak', async () => {
      for (const route of ['/', '/agenda', '/profil', '/kontak']) {
        const url = `${apiUrl}${route}?qa=${++sequence}`
        await send('Page.navigate', { url })
        await waitFor(`location.href === ${JSON.stringify(url)} && document.querySelector('[role=alert]')?.textContent.includes('Konten publik melalui API belum tersedia')`)
        assert.equal(await evaluate('document.querySelector(".nav-links a[aria-current=page]").getAttribute("href")'), route)
      }
    })
    await t.test('enam viewport menjaga subtotal utuh, filter terbaca dan lembar pratinjau tidak meluap', async () => {
      for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1728, 1080]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        await openGate()
        await fillPassword('demo123')
        await submit()
        await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `Overflow laporan ${width}`)
        assert.equal(await evaluate(`[...document.querySelectorAll('.financial-table-header')].every(e => { const r=e.getBoundingClientRect(), a=e.querySelector('.financial-subtotal').getBoundingClientRect(); return a.left >= r.left && a.right <= r.right-8 })`), true, `Subtotal terpotong ${width}`)
        assert.equal(await evaluate(`document.querySelector('.financial-table--expense').getBoundingClientRect().top >= document.querySelector('.financial-table--income').getBoundingClientRect().bottom`), width < 1024)
        if (width < 1024) await panRight('.financial-summary-scroll')
        await evaluate('document.querySelector(".financial-export button").click()')
        await waitFor('!!document.querySelector(".report-format-options")')
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        await evaluate('document.querySelector(".report-export-actions .export-button--primary").click()')
        await waitFor('document.querySelectorAll(".report-sheet").length === 2')
        assert.equal(await evaluate('document.querySelectorAll(".report-sheet [data-transaction-id]").length'), 50)
        assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false)
        if (width < 768) await panRight('.report-sheet-scroll')
        await evaluate('document.querySelector(".report-preview-workspace-header button").click()')
        await waitFor(`document.querySelector('.report-preview-workspace-header button').getAttribute('aria-pressed') === '${width < 768}'`)
        assert.equal(await evaluate('!!document.querySelector(".report-preview-scroll-hint")'), width >= 768)
      }
    })
    await t.test('menu mobile dapat dibuka, dinavigasi, ditutup dengan Escape dan ditinggalkan melalui Tab', async () => {
      for (const width of [360, 390]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false })
        await send('Page.navigate', { url: `${baseUrl}/?qa=mobile-${++sequence}` })
        await waitFor('!!document.querySelector(".hero")')
        assert.equal(await evaluate('getComputedStyle(document.querySelector(".nav-links")).display'), 'none')
        assert.ok(await evaluate('document.querySelector(".navbar").getBoundingClientRect().height < 70'))
        await clickVisible('.nav-toggle')
        assert.equal(await evaluate('document.querySelector(".nav-toggle").getAttribute("aria-expanded")'), 'true')
        assert.equal(await evaluate('[...document.querySelectorAll(".nav-link")].every(e=>e.getBoundingClientRect().height>=44)'), true)
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
        await waitFor('document.querySelector(".nav-toggle").getAttribute("aria-expanded") === "false"')
        assert.equal(await evaluate('document.activeElement.matches(".nav-toggle")'), true)
        await clickVisible('.nav-toggle')
        await evaluate('document.querySelector(".nav-link:last-child").focus()')
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
        await waitFor('document.querySelector(".nav-toggle").getAttribute("aria-expanded") === "false"')
        for (const route of ['/agenda', '/profil', '/kontak', '/']) {
          await clickVisible('.nav-toggle')
          await clickVisible(`.nav-links a[href="${route}"]`)
          await waitFor(`location.pathname === ${JSON.stringify(route)} && document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'false' && document.querySelector('.nav-link.is-active').getAttribute('href') === ${JSON.stringify(route)}`)
          assert.equal(await evaluate('document.querySelector(".nav-link.is-active").getAttribute("href")'), route)
        }
      }
    })
    await t.test('modal mobile mengikuti area layar yang menyusut, dapat digulir dan tetap dapat disubmit', async () => {
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
      await openGate()
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 360, deviceScaleFactor: 1, mobile: false })
      await waitFor('parseFloat(document.querySelector("dialog").style.getPropertyValue("--dialog-viewport-height")) <= 360')
      const bounds = await evaluate('(()=>{const e=document.querySelector("dialog"),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,scrollable:e.scrollHeight>e.clientHeight}})()')
      assert.ok(bounds.top >= 0 && bounds.bottom <= 360)
      assert.equal(bounds.scrollable, true)
      await evaluate('document.querySelector(".report-access-form button").scrollIntoView({block:"center"})')
      assert.equal(await evaluate('(()=>{const e=document.querySelector(".report-access-close"),r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))})()'), true)
      await fillPassword('salah')
      await clickVisible('.report-access-form button')
      await waitFor('document.querySelector("#report-access-error")?.textContent.includes("tidak cocok")')
      assert.equal(await evaluate('document.body.style.overflow'), 'hidden')
      await fillPassword('demo123')
      await clickVisible('.report-access-form button')
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
      await send('Page.reload')
      await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
      assert.equal(await evaluate('!!document.querySelector("dialog")'), false)
    })
    await t.test('ekspor mobile memakai dua lembar yang sama dan menghasilkan PDF serta ZIP PNG nyata', async () => {
      for (const width of [360, 390]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false })
        await send('Page.navigate', { url: `${baseUrl}/laporan-keuangan?qa=export-mobile-${width}` })
        await waitFor('document.querySelectorAll(".financial-transactions-table tbody tr").length === 50')
        await clickVisible('.financial-export button')
        await clickVisible('.report-export-actions .export-button--primary')
        await waitFor('document.querySelectorAll(".report-sheet").length === 2')
        assert.equal(await evaluate('new Set([...document.querySelectorAll("[data-transaction-id]")].map(e=>e.dataset.transactionId)).size'), 50)
        assert.match(await evaluate('document.querySelector(".report-sheet .financial-summary-table tfoot td:last-child").textContent'), /20\.484\.700/)
        const pdf = await exportCurrent()
        checkPdf(pdf, 2)
        await clickVisible('.report-preview-format button:nth-child(2)')
        const zip = await JSZip.loadAsync((await exportCurrent()).bytes, { checkCRC32: true })
        assert.deepEqual(Object.keys(zip.files), ['halaman-01.png', 'halaman-02.png'])
        for (const file of Object.values(zip.files)) checkPng(await file.async('nodebuffer'))
      }
    })
    await t.test('Navbar publik tetap terlihat dan dapat dipakai saat scroll tanpa masuk ke layout laporan', async () => {
      for (const [width, height] of [[1728, 1080], [1366, 768], [390, 844]]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
        for (const route of ['/', '/agenda', '/profil', '/kontak']) {
          const url = `${baseUrl}${route}?qa=${++sequence}`
          await send('Page.navigate', { url })
          await waitFor(`location.href === ${JSON.stringify(url)} && !!document.querySelector('.copyright')`)
          if (width < 768) await clickVisible('.nav-toggle')
          for (const fraction of [0, .5, 1]) {
            await evaluate(`scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ${fraction})`)
            const result = await evaluate(`(()=>{
              const nav = document.querySelector('.navbar'), rect = nav.getBoundingClientRect()
              const link = nav.querySelector('a[aria-current="page"]'), target = link.getBoundingClientRect()
              return {
                fixed: getComputedStyle(document.querySelector('.public-header')).position === 'fixed',
                visible: rect.top >= 0 && rect.bottom <= innerHeight,
                clickable: link.contains(document.elementFromPoint(target.left + target.width / 2, target.top + target.height / 2)),
                overflow: document.documentElement.scrollWidth > innerWidth
              }
            })()`)
            assert.deepEqual(result, { fixed: true, visible: true, clickable: true, overflow: false }, `${route} ${width} scroll ${fraction}`)
          }
          const nextRoute = route === '/agenda' ? '/' : '/agenda'
          await evaluate(`document.querySelector('.nav-links a[href="${nextRoute}"]').click()`)
          await waitFor(`location.pathname === ${JSON.stringify(nextRoute)} && !!document.querySelector(${JSON.stringify(nextRoute === '/' ? '.hero' : '.agenda-group')})`)
          assert.equal(await evaluate('scrollY'), 0)
        }
        await openGate()
        assert.equal(await evaluate('!!document.querySelector(".public-header") && document.querySelector("dialog").matches(":modal")'), true)
        await fillPassword('demo123')
        await submit()
        await waitFor('!!document.querySelector(".financial-summary-table")')
        assert.equal(await evaluate('!!document.querySelector(".public-header")'), false)
      }
    })
    assert.deepEqual(failures, [])
  } finally {
    await send('Browser.setDownloadBehavior', { behavior: 'default' })
    ws.close()
  }
})
