import { receiptDateToIso } from '../utils/adminReceipt.js'

export async function createReceiptPng({ sheet, date, signal }) {
  if (!sheet?.matches('.admin-receipt-document') || !receiptDateToIso(date)) throw new Error('Pratinjau kwitansi belum siap.')
  signal?.throwIfAborted()
  const { toCanvas, getFontEmbedCSS } = await import('html-to-image')
  await document.fonts.ready
  const fonts = await document.fonts.load('600 16px "Plus Jakarta Sans"')
  if (!fonts.length || fonts.some((font) => font.status !== 'loaded')) throw new Error('Font kwitansi belum berhasil dimuat.')
  await Promise.all([...sheet.querySelectorAll('img')].map((image) => image.decode()))
  const fontEmbedCSS = await getFontEmbedCSS(sheet)
  if (!fontEmbedCSS.includes('data:')) throw new Error('Font kwitansi gagal disematkan.')
  signal?.throwIfAborted()
  const width = 1120
  const height = Math.ceil(sheet.getBoundingClientRect().height)
  let canvas
  try {
    canvas = await toCanvas(sheet, { width, height, pixelRatio: 2, backgroundColor: '#ffffff', fontEmbedCSS, style: { margin: '0', boxShadow: 'none', transform: 'none' } })
    signal?.throwIfAborted()
    if (canvas.width !== width * 2 || canvas.height < height * 2) throw new Error('Resolusi gambar kwitansi tidak mencukupi.')
    const blob = await new Promise((resolve, reject) => canvas.toBlob((file) => file?.size ? resolve(file) : reject(new Error('Gambar PNG gagal dibuat.')), 'image/png'))
    signal?.throwIfAborted()
    return { blob, filename: `draft-kwitansi-masjid-al-hidayah-${receiptDateToIso(date)}.png` }
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0 }
  }
}
