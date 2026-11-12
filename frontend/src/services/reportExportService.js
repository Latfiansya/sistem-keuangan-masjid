import { getMonthRange, validateReportRange } from '../utils/reportCalculations.js'
import { REPORT_SHEET_LAYOUT } from '../utils/reportPagination.js'

export function getReportExportName(range, format, pageCount) {
  validateReportRange(range)
  if (!['pdf', 'png'].includes(format) || !Number.isInteger(pageCount) || pageCount < 1) throw new Error('Format atau jumlah lembar ekspor tidak valid.')
  const month = range.startDate.slice(0, 7)
  const fullMonth = getMonthRange(month)
  const period = range.startDate === fullMonth.startDate && range.endDate === fullMonth.endDate ? month : `${range.startDate}--${range.endDate}`
  return `laporan-keuangan-masjid-al-hidayah-${period}.${format === 'png' && pageCount > 1 ? 'zip' : format}`
}

export function validateExportSheets(report, pages, sheets) {
  if (report?.status !== 'ready' || !report.summary || !pages.length) throw new Error('Data laporan belum lengkap; ekspor tidak tersedia.')
  const items = pages.flatMap((page) => [...page.income, ...page.expense])
  const ids = items.map((item) => item.id)
  const source = new Map(report.transactions.map((item) => [item.id, item]))
  if (ids.length !== report.transactions.length || new Set(ids).size !== ids.length || items.some((item) => !source.has(item.id) || ['date', 'type', 'description', 'categoryId', 'amount'].some((field) => item[field] !== source.get(item.id)[field]))) throw new Error('Transaksi pratinjau tidak sesuai dengan laporan.')
  if (sheets.length !== pages.length || sheets.some((sheet, index) => {
    const expected = [...pages[index].income, ...pages[index].expense].map((item) => item.id)
    const actual = [...sheet.querySelectorAll('[data-transaction-id]')].map((node) => node.dataset.transactionId)
    return !sheet.matches('.report-sheet') || JSON.stringify(actual) !== JSON.stringify(expected)
  })) throw new Error('Lembar pratinjau belum siap. Buka kembali pratinjau dan coba lagi.')
}

function canvasToPng(canvas, layout) {
  const context = canvas.getContext('2d')
  if (!context || canvas.width < layout.width * 2 - 1 || canvas.height < layout.height * 2 - 1) throw new Error('Resolusi gambar laporan tidak mencukupi.')
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let ink = 0
  for (let i = 0; i < pixels.length; i += 64) {
    if (pixels[i + 3] > 0 && Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 240) ink++
  }
  if (ink < 32) throw new Error('Render laporan kosong. Coba lagi setelah font dan aset termuat.')
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob?.size ? resolve(blob) : reject(new Error('Gambar laporan gagal dibuat.')), 'image/png'))
}

export async function createReportExport({ report, pages, sheets, format, signal, onProgress = () => {} }) {
  validateExportSheets(report, pages, sheets)
  const filename = getReportExportName(report.range, format, pages.length)
  return createReportSheetsExport({ sheets, filename, format, signal, onProgress, layout: REPORT_SHEET_LAYOUT, orientation: 'landscape' })
}

// Renderer bersama; template, validasi data dan pagination tetap milik masing-masing laporan.
export async function createReportSheetsExport({ sheets, filename, format, signal, onProgress = () => {}, layout, orientation }) {
  if (!sheets?.length || !['pdf', 'png'].includes(format) || !['portrait', 'landscape'].includes(orientation) || !(layout?.width > 0 && layout?.height > 0)) throw new Error('Pengaturan ekspor laporan tidak valid.')
  signal?.throwIfAborted()
  onProgress('Menyiapkan font dan aset laporan…')
  const { toCanvas, getFontEmbedCSS } = await import('html-to-image')
  await document.fonts.ready
  const fonts = await document.fonts.load('600 16px "Plus Jakarta Sans"')
  if (!fonts.length || fonts.some((font) => font.status !== 'loaded')) throw new Error('Font laporan belum berhasil dimuat.')
  await Promise.all(sheets.flatMap((sheet) => [...sheet.querySelectorAll('img')].map((image) => image.decode())))
  const fontEmbedCSS = await getFontEmbedCSS(sheets[0])
  if (!fontEmbedCSS.includes('data:')) throw new Error('Font laporan gagal disematkan ke gambar.')
  signal?.throwIfAborted()
  const pdf = format === 'pdf' ? new (await import('jspdf')).jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true }) : null
  const zip = format === 'png' && sheets.length > 1 ? new (await import('jszip')).default() : null
  let singlePng
  for (const [index, sheet] of sheets.entries()) {
    signal?.throwIfAborted()
    onProgress(`Merender lembar ${index + 1} dari ${sheets.length}…`)
    // Hanya lembar yang dirender. Transform pratinjau dan kontainer scroll tidak ikut.
    let canvas
    try {
      canvas = await toCanvas(sheet, {
        width: layout.width, height: layout.height,
        pixelRatio: 2, backgroundColor: '#ffffff', fontEmbedCSS,
        style: { transform: 'none', transformOrigin: 'top left', margin: '0', boxShadow: 'none' },
      })
    } catch (cause) { throw new Error('Lembar laporan gagal dirender. Pastikan font dan aset tersedia.', { cause }) }
    try {
      signal?.throwIfAborted()
      const png = await canvasToPng(canvas, layout)
      const bytes = new Uint8Array(await png.arrayBuffer())
      if (pdf) {
        if (index > 0) pdf.addPage('a4', orientation)
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height)
        const width = canvas.width * scale
        const height = canvas.height * scale
        pdf.addImage(bytes, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height, `lembar-${index + 1}`, 'FAST')
      } else if (zip) zip.file(`halaman-${String(index + 1).padStart(2, '0')}.png`, bytes)
      else singlePng = png
    } finally {
      canvas.width = 0
      canvas.height = 0
    }
  }
  onProgress('Menyiapkan berkas unduhan…')
  const blob = pdf ? pdf.output('blob') : zip ? await zip.generateAsync({ type: 'blob', compression: 'STORE' }) : singlePng
  signal?.throwIfAborted()
  if (!blob?.size) throw new Error('Berkas laporan gagal dibuat.')
  return { blob, filename, pageCount: sheets.length }
}

export function downloadReportFile({ blob, filename }) {
  if (!blob?.size) throw new Error('Berkas unduhan kosong.')
  let url
  let link
  try {
    url = URL.createObjectURL(blob)
    link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
  } catch (cause) {
    throw new Error('Unduhan tidak dapat dimulai. Periksa izin unduhan browser.', { cause })
  } finally {
    link?.remove()
    // Memberi browser waktu mengambil Blob, termasuk pada perangkat mobile.
    if (url) setTimeout(() => URL.revokeObjectURL(url), 60000)
  }
}
