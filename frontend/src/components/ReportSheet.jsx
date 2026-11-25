import BalanceSummary from './BalanceSummary.jsx'
import { formatReportDate, formatReportRange, formatReportPeriod, formatRupiah } from '../utils/reportFormatters.js'
import { describeSheet, REPORT_SHEET_LAYOUT } from '../utils/reportPagination.js'

export default function ReportSheet({ report, page, pageCount }) {
  const layout = REPORT_SHEET_LAYOUT
  const style = Object.fromEntries(Object.entries(layout).map(([key, value]) => [`--sheet-${key}`, `${value}px`]))
  const period = formatReportPeriod(report.range)
  return (
    <article className="report-sheet" style={style} aria-label={`Lembar laporan ${page.number} dari ${pageCount}`}>
      <header className="report-sheet-header"><div><p>{report.name}</p><h3>Laporan Keuangan {period}</h3></div><div><strong>Periode {formatReportRange(report.range)}</strong><small>A4 lanskap · Halaman {page.number} dari {pageCount}</small></div></header>
      <div className="report-sheet-columns">
        {['income', 'expense'].map((type) => {
          const title = type === 'income' ? 'Pemasukan' : 'Pengeluaran'
          const totalCount = report.transactions.filter((item) => item.type === type).length
          return <section className={`report-sheet-column report-sheet-column--${type}`} key={type} aria-label={title}>
            <div className="report-sheet-column-header"><div><h4>{title}</h4><p>{totalCount} transaksi · total periode</p></div><strong>{formatRupiah(report.summary.totals[type])}</strong></div>
            <div className="report-sheet-column-labels"><span>Uraian · tanggal &amp; kategori</span><span>Nominal (Rp)</span></div>
            {page[type].length ? <table className="report-sheet-transactions"><caption className="sr-only">{title} pada lembar {page.number}</caption><tbody>{page[type].map((item) => {
              const category = report.summary.rows.find((entry) => entry.id === item.categoryId)
              return <tr key={item.id} data-transaction-id={item.id}><td><strong title={item.description}>{item.description}</strong><div className="report-sheet-meta"><time dateTime={item.date}>{formatReportDate(item.date)}</time><span className={`financial-category financial-category--${category.color} report-sheet-category`}>{category.label}</span></div></td><td>{formatRupiah(item.amount)}</td></tr>
            })}</tbody></table> : <div className="report-sheet-empty"><strong>{page.number > 1 && totalCount ? `Tidak ada lanjutan ${title.toLowerCase()}` : `Tidak ada transaksi ${title.toLowerCase()}`}</strong><p>{totalCount ? 'Seluruh transaksi tercantum pada halaman sebelumnya.' : 'Tidak ada transaksi pada rentang ini.'}</p></div>}
          </section>
        })}
      </div>
      {page.showSummary && <BalanceSummary summary={report.summary} period={period} variant="sheet" />}
      <footer className="report-sheet-footer"><span>{report.name} · {describeSheet(page)}</span><strong>Halaman {page.number} / {pageCount}</strong></footer>
    </article>
  )
}
