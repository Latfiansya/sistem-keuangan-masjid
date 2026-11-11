import { validateReportRange } from '../utils/reportCalculations.js'

export async function createAdminFinanceSummaryPng({ sheet, updatedDate, signal }) {
  validateReportRange({ startDate: updatedDate, endDate: updatedDate })
  if (!sheet?.matches('.admin-report-export-sheet')) throw new Error('Ringkasan laporan belum siap.')
  signal?.throwIfAborted()
  const { toCanvas, getFontEmbedCSS } = await import('html-to-image')
  await document.fonts.ready
  const fonts = await document.fonts.load('600 16px "Plus Jakarta Sans"')
  if (!fonts.length || fonts.some((font) => font.status !== 'loaded')) throw new Error('Font laporan belum berhasil dimuat.')
  const fontEmbedCSS = await getFontEmbedCSS(sheet)
  if (!fontEmbedCSS.includes('data:')) throw new Error('Font laporan gagal disematkan.')
  signal?.throwIfAborted()
  let canvas
  try {
    const height = Math.ceil(sheet.getBoundingClientRect().height)
    canvas = await toCanvas(sheet, { width: 1120, height, pixelRatio: 2, backgroundColor: '#ffffff', fontEmbedCSS, style: { transform: 'none', margin: '0' } })
    signal?.throwIfAborted()
    if (canvas.width !== 2240 || canvas.height < height * 2) throw new Error('Resolusi PNG ringkasan tidak mencukupi.')
    const blob = await new Promise((resolve, reject) => canvas.toBlob((file) => file?.size ? resolve(file) : reject(new Error('PNG ringkasan gagal dibuat.')), 'image/png'))
    signal?.throwIfAborted()
    return { blob, filename: `ringkasan-keuangan-admin-contoh-${updatedDate}.png` }
  } finally { if (canvas) { canvas.width = 0; canvas.height = 0 } }
}
