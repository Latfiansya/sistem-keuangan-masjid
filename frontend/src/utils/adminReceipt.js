export const receiptMethods = ['Tunai', 'Transfer Bank', 'QRIS']
export const emptyReceipt = { payer: '', amount: '', purpose: '', method: '', date: '' }
// Batas panjang mengikuti kolom t_kwitansi (telah_terima_dari 150) dan uraian t_transaksi (255).
export const receiptTextLimits = { payer: 100, purpose: 255 }

export function receiptDateToIso(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match || Number(match[3]) === 0) return ''
  const iso = `${match[3]}-${match[2]}-${match[1]}`
  const date = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === iso ? iso : ''
}

export function receiptDateFromIso(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const formatted = value.split('-').reverse().join('/')
  return receiptDateToIso(formatted) === value ? formatted : ''
}

export function getLocalReceiptDate(date = new Date()) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].map((part, index) => String(part).padStart(index === 2 ? 4 : 2, '0')).join('/')
}

export function validateReceipt(values) {
  const errors = {}
  for (const [field, label, limit] of [['payer', 'Nama pemberi pembayaran', receiptTextLimits.payer], ['purpose', 'Tujuan pembayaran', receiptTextLimits.purpose]]) {
    if (!values[field].trim()) errors[field] = `${label} wajib diisi.`
    else if (values[field].trim().length > limit || [...values[field]].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) errors[field] = `${label} tidak valid atau terlalu panjang.`
  }
  if (!/^\d{1,12}$/.test(values.amount) || Number(values.amount) <= 0) errors.amount = 'Masukkan rupiah bulat positif, maksimal 999.999.999.999, tanpa desimal.'
  if (!receiptMethods.includes(values.method)) errors.method = 'Pilih metode pembayaran.'
  if (!receiptDateToIso(values.date)) errors.date = 'Masukkan tanggal yang valid dalam format dd/mm/yyyy.'
  return errors
}

export function receiptAmountInWords(amount) {
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 999999999999) throw new Error('Nominal di luar rentang terbilang.')
  const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']
  function spell(value) {
    if (value < 12) return units[value]
    if (value < 20) return `${spell(value - 10)} belas`
    if (value < 100) return `${spell(Math.floor(value / 10))} puluh ${spell(value % 10)}`.trim()
    if (value < 200) return `seratus ${spell(value - 100)}`.trim()
    if (value < 1000) return `${spell(Math.floor(value / 100))} ratus ${spell(value % 100)}`.trim()
    if (value < 2000) return `seribu ${spell(value - 1000)}`.trim()
    for (const [divisor, label] of [[1000000000, 'miliar'], [1000000, 'juta'], [1000, 'ribu']]) {
      if (value >= divisor) return `${spell(Math.floor(value / divisor))} ${label} ${spell(value % divisor)}`.trim()
    }
  }
  const words = amount === 0 ? 'nol' : spell(amount)
  return `${words[0].toUpperCase()}${words.slice(1)} rupiah`
}
