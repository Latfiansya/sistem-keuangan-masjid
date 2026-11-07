// Ukuran piksel CSS pada 96 dpi, sebanding dengan A4 lanskap 297 × 210 mm.
export const REPORT_SHEET_LAYOUT = Object.freeze({
  width: 1122.52, height: 793.7, padding: 22, header: 40, gap: 10,
  columnHeader: 44, columnLabels: 18, row: 28, footer: 18, footerGap: 12,
  summaryGap: 16, summaryHeading: 24, summaryTitleGap: 8, summaryHeader: 24, summaryRow: 26,
})

export function getSheetCapacity(categoryCount) {
  const layout = REPORT_SHEET_LAYOUT
  const tableSpace = layout.height - 2 * layout.padding - layout.header - layout.gap - layout.columnHeader - layout.columnLabels - layout.footer - layout.footerGap
  const summaryHeight = layout.summaryHeading + layout.summaryTitleGap + layout.summaryHeader + (categoryCount + 1) * layout.summaryRow
  const regular = Math.floor(tableSpace / layout.row)
  const final = Math.floor((tableSpace - layout.summaryGap - summaryHeight) / layout.row)
  if (regular < 1 || final < 0) throw new Error('Ringkasan terlalu panjang untuk satu lembar laporan.')
  return { regular, final, summaryHeight }
}

export function paginateReport(report) {
  if (report?.status !== 'ready' || !report.summary) return []
  const income = report.transactions.filter((item) => item.type === 'income')
  const expense = report.transactions.filter((item) => item.type === 'expense')
  const capacity = getSheetCapacity(report.summary.rows.length)
  const longest = Math.max(income.length, expense.length)
  const count = longest <= capacity.final ? 1 : Math.ceil((longest - capacity.final) / capacity.regular) + 1
  let offset = 0
  return Array.from({ length: count }, (_, index) => {
    const showSummary = index === count - 1
    const remaining = longest - offset
    const size = showSummary ? capacity.final : remaining > capacity.regular ? capacity.regular : Math.max(1, remaining - capacity.final)
    const page = {
      number: index + 1, showSummary, incomeStart: offset + 1, expenseStart: offset + 1,
      income: income.slice(offset, offset + size).map((item) => ({ ...item })),
      expense: expense.slice(offset, offset + size).map((item) => ({ ...item })),
    }
    offset += size
    return page
  })
}

export function describeSheet(page) {
  return [['Pemasukan', page.income, page.incomeStart], ['Pengeluaran', page.expense, page.expenseStart]]
    .filter(([, items]) => items.length)
    .map(([label, items, start]) => `${label} ${start}–${start + items.length - 1}`)
    .concat(page.showSummary ? ['Resume saldo periode'] : [])
    .join(' · ')
}
