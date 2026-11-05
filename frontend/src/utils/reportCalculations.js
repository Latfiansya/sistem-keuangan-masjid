export const DEFAULT_REPORT_RANGE = Object.freeze({ startDate: '2026-04-01', endDate: '2026-04-30' })

export function validateReportRange({ startDate, endDate }) {
  for (const value of [startDate, endDate]) {
    const date = new Date(`${value}T00:00:00Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new Error('Tanggal awal dan akhir harus diisi dengan tanggal yang valid.')
    }
  }
  if (startDate > endDate) throw new Error('Tanggal awal tidak boleh melebihi tanggal akhir.')
}

export function getMonthRange(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Bulan laporan tidak valid.')
  const [year, number] = month.split('-').map(Number)
  return { startDate: `${month}-01`, endDate: new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10) }
}

export function getPresetRange(preset) {
  const endDate = DEFAULT_REPORT_RANGE.endDate
  if (preset === '1m') return { ...DEFAULT_REPORT_RANGE }
  if (preset === '3m') return { startDate: '2026-02-01', endDate }
  if (preset !== '1w') throw new Error('Pilihan periode tidak valid.')
  const start = new Date(`${endDate}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 6)
  return { startDate: start.toISOString().slice(0, 10), endDate }
}

export function calculateReport(data, range = DEFAULT_REPORT_RANGE) {
  validateReportRange(range)
  const metadata = { name: data.name, coverage: { ...data.coverage }, months: [...data.months], range: { ...range } }
  if (range.startDate < data.coverage.startDate || range.endDate > data.coverage.endDate) {
    return { ...metadata, status: 'unavailable', transactions: [], summary: null, message: 'Data belum tersedia atau belum lengkap untuk rentang ini. Data contoh hanya mencakup 1–30 April 2026.' }
  }
  const transactions = data.transactions.filter((item) => item.date >= range.startDate && item.date <= range.endDate).map((item) => ({ ...item }))
  const rows = data.categories.map((category) => {
    if (!Number.isSafeInteger(category.openingBalance)) throw new Error('Saldo awal laporan harus berupa integer Rupiah.')
    let openingBalance = category.openingBalance
    let income = 0
    let expense = 0
    for (const item of data.transactions.filter((transaction) => transaction.categoryId === category.id)) {
      if (!Number.isSafeInteger(item.amount)) throw new Error('Nominal transaksi harus berupa integer Rupiah.')
      if (!['income', 'expense'].includes(item.type)) throw new Error('Jenis transaksi laporan tidak valid.')
      if (item.date < range.startDate) openingBalance += item.type === 'income' ? item.amount : -item.amount
      else if (item.date <= range.endDate) {
        if (item.type === 'income') income += item.amount
        else expense += item.amount
      }
    }
    return { id: category.id, label: category.label, color: category.color, openingBalance, income, expense, closingBalance: openingBalance + income - expense }
  })
  if (data.transactions.some((item) => !data.categories.some((category) => category.id === item.categoryId))) throw new Error('Kategori transaksi laporan belum tersedia.')
  const totals = rows.reduce((sum, row) => ({ openingBalance: sum.openingBalance + row.openingBalance, income: sum.income + row.income, expense: sum.expense + row.expense, closingBalance: sum.closingBalance + row.closingBalance }), { openingBalance: 0, income: 0, expense: 0, closingBalance: 0 })
  return { ...metadata, status: 'ready', transactions, summary: { rows, totals } }
}
