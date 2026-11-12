import { buildAdminMonthlyRecap, filterAdminFinanceTransactions, summarizeAdminFinanceTransactions } from './adminFinanceReportService.js'
import { createReportSheetsExport } from './reportExportService.js'
import { getAdminHistoricalTransactions } from './adminTransactionData.js'
import { getMonthRange, validateReportRange } from '../utils/reportCalculations.js'
import { formatReportMonth } from '../utils/reportFormatters.js'

export const ADMIN_REPORT_PAGE = Object.freeze({ width: 794, height: 1123 })
export const adminReportTypes = [
  { id: 'income', label: 'Kas Masuk', description: 'Seluruh transaksi pemasukan dalam periode' },
  { id: 'expense', label: 'Kas Keluar', description: 'Seluruh transaksi pengeluaran dalam periode' },
  { id: 'monthly', label: 'Rekap Bulanan', description: 'Rekap setiap bulan dan kategori dana' },
]

export function getAdminDownloadDefaults(report) {
  return { range: getAdminDownloadDefaultRange(report), periodMode: 'months', preset: 'week', types: ['monthly'], format: 'pdf' }
}

export function validateAdminDownloadSettings(settings) {
  if (!settings || !['preset', 'months', 'dates'].includes(settings.periodMode)) throw new Error('Pilih mode periode laporan.')
  validateReportRange(settings.range)
  if (!Array.isArray(settings.types) || !settings.types.length || settings.types.some((id) => !adminReportTypes.some((type) => type.id === id))) throw new Error('Pilih minimal satu jenis laporan yang tersedia.')
  if (!['pdf', 'png'].includes(settings.format)) throw new Error('Pilih format PDF atau PNG.')
}

export function getAdminDownloadDefaultRange(report) {
  const latest = report.transactions.map((item) => item.date).sort().at(-1) || report.updatedDate
  return getMonthRange(latest.slice(0, 7))
}

export function getAdminDownloadMonthRange(start, end) {
  const range = { startDate: getMonthRange(start).startDate, endDate: getMonthRange(end).endDate }
  validateReportRange(range)
  return range
}

function sumBalances(categories) {
  return categories.reduce((total, item) => Object.fromEntries(Object.keys(total).map((key) => [key, total[key] + item[key]])), { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 })
}

export function buildAdminDownloadDocument(report, range, types) {
  validateReportRange(range)
  const selected = adminReportTypes.filter((type) => types.includes(type.id))
  if (!selected.length) throw new Error('Pilih minimal satu jenis laporan.')
  const transactions = filterAdminFinanceTransactions(report, { range })
  const categories = report.categories.map((category) => {
    const source = report.transactions.filter((item) => item.categoryId === category.id)
    const prior = summarizeAdminFinanceTransactions(source.filter((item) => item.date < range.startDate))
    const current = summarizeAdminFinanceTransactions(transactions.filter((item) => item.categoryId === category.id))
    const openingBalance = report.historyOpeningBalances[category.id] + prior.income - prior.expense
    return { ...category, openingBalance, ...current, closingBalance: openingBalance + current.income - current.expense }
  })
  const totals = sumBalances(categories)
  const historical = getAdminHistoricalTransactions(report)
  const balanceStart = getMonthRange((historical[0]?.date || report.coverage.startDate).slice(0, 7)).startDate
  const beforeCoverage = range.startDate < balanceStart
  // Saldo di luar awal cakupan tidak direkayasa sebagai saldo historis yang diketahui.
  if (beforeCoverage) {
    for (const category of categories) { category.openingBalance = null; category.closingBalance = null }
    totals.openingBalance = null; totals.closingBalance = null
  }
  const sections = selected.map((type) => {
    let rows
    if (['income', 'expense'].includes(type.id)) rows = transactions.filter((item) => item.type === type.id).map((item) => ({ ...item, key: item.id, kind: 'transaction' }))
    else rows = buildAdminMonthlyRecap(report, range).flatMap(({ month, categories, totals }) => [
      ...categories.map((category) => ({ ...category, ...(month < balanceStart.slice(0, 7) ? { openingBalance: null, closingBalance: null } : {}), key: `${month}-${category.id}`, month, kind: 'monthly' })),
      { ...totals, ...(month < balanceStart.slice(0, 7) ? { openingBalance: null, closingBalance: null } : {}), key: `${month}-total`, month, label: 'TOTAL', kind: 'monthly', total: true },
    ])
    return { ...type, rows }
  })
  return {
    range: { ...range }, categories, transactions, totals, sections,
    sessionChangeCount: report.sessionChangeCount,
    coverage: { ...report.coverage },
    note: beforeCoverage ? 'Awal periode mendahului cakupan mock; saldo awal/akhir tidak tersedia. Nominal hanya mencakup transaksi mock yang tersedia.' : 'Saldo simulasi dihitung dari saldo awal historis dan transaksi aktif. Data di luar cakupan mock belum tersedia; tanpa transaksi tambahan yang direkayasa.',
  }
}

// Tinggi baris berasal dari DOM dengan font dan lebar A4 yang sama dengan pratinjau.
export function paginateAdminDownload(document, measurements) {
  const pages = []
  for (const section of document.sections) {
    const measure = measurements[section.id]
    if (!measure || !(measure.capacity > 0) || measure.heights.length !== section.rows.length) throw new Error('Layout laporan belum siap.')
    let rows = [], used = 0
    const push = () => { pages.push({ sectionId: section.id, title: section.label, rows }); rows = []; used = 0 }
    for (const [index, row] of section.rows.entries()) {
      const height = measure.heights[index]
      if (!(height > 0) || height > measure.capacity) throw new Error('Ada baris yang melebihi satu halaman A4. Periksa panjang isi transaksi.')
      if (rows.length && used + height > measure.capacity) push()
      rows.push(row); used += height
    }
    if (rows.length || !section.rows.length) push()
  }
  return pages.map((page, index) => ({ ...page, number: index + 1 }))
}

export function validateAdminDownloadSheets(document, pages, sheets) {
  if (!pages.length || sheets.length !== pages.length) throw new Error('Pratinjau laporan belum siap.')
  for (const section of document.sections) {
    const actual = pages.filter((page) => page.sectionId === section.id).flatMap((page) => page.rows)
    if (JSON.stringify(actual) !== JSON.stringify(section.rows)) throw new Error('Rincian pratinjau tidak sesuai data laporan.')
  }
  for (const [index, sheet] of sheets.entries()) {
    const actual = [...sheet.querySelectorAll('[data-export-row]')].map((row) => row.dataset.exportRow)
    if (!sheet.matches('.admin-download-sheet') || sheet.dataset.section !== pages[index].sectionId || JSON.stringify(actual) !== JSON.stringify(pages[index].rows.map((row) => row.key))) throw new Error('Halaman pratinjau tidak sesuai dengan data terpilih.')
    const footer = sheet.querySelector('.admin-download-sheet-footer')
    const rows = [...sheet.querySelectorAll('[data-export-row]')]
    if (footer && rows.some((row) => row.getBoundingClientRect().bottom > footer.getBoundingClientRect().top + 1)) throw new Error('Isi laporan melewati batas halaman. Buka kembali pengaturan dan coba lagi.')
  }
}

export function getAdminDownloadFilename(document, format, count) {
  if (!['pdf', 'png'].includes(format)) throw new Error('Format unduhan tidak valid.')
  const types = document.sections.map((section) => section.id).join('-')
  return `laporan-admin-mock-${types}-${document.range.startDate}--${document.range.endDate}.${format === 'png' && count > 1 ? 'zip' : format}`
}

export async function createAdminReportDownload({ document, pages, sheets, format, signal, onProgress }) {
  validateAdminDownloadSheets(document, pages, sheets)
  return createReportSheetsExport({ sheets, format, signal, onProgress, layout: ADMIN_REPORT_PAGE, orientation: 'portrait', filename: getAdminDownloadFilename(document, format, pages.length) })
}

export const adminDownloadMonthNames = Array.from({ length: 12 }, (_, index) => formatReportMonth(`2026-${String(index + 1).padStart(2, '0')}`).split(' ')[0])
