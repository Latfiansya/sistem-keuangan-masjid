import { adminCategoryColorStyle } from '../utils/adminCategoryColors.js'
import { formatReportDate, formatReportNumber } from '../utils/reportFormatters.js'

export default function AdminBalanceSummary({ categories, totals, updatedDate, showDescription = true, title = 'Resume Saldo per Kategori', titleId = 'admin-balance-title' }) {
  const updatedLabel = formatReportDate(updatedDate)
  return (
    <section className="admin-panel admin-balance" aria-labelledby={titleId}>
      <div className="admin-panel-heading"><h2 id={titleId}>{title}</h2><span className="admin-updated"><i aria-hidden="true" />Terakhir Update: {updatedLabel}</span>{showDescription && <p>Rekap pemasukan, pengeluaran, dan saldo akhir semua kotak dana.</p>}</div>
      <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
      <div className="admin-table-scroll" role="region" aria-label="Resume saldo per kategori, dapat digeser pada layar kecil" tabIndex={0}>
        <table className="admin-balance-table">
          <caption className="sr-only">Saldo awal, pemasukan, pengeluaran dan saldo akhir per kategori dalam Rupiah.</caption>
          <thead><tr><th scope="col">Kategori</th><th scope="col">Saldo Awal (Rp)</th><th scope="col">Pemasukan (Rp)</th><th scope="col">Pengeluaran (Rp)</th><th scope="col">Saldo Akhir (Rp)</th></tr></thead>
          <tbody>{categories.map((category) => <tr key={category.id}><th scope="row"><span style={adminCategoryColorStyle(category.color)} className={`admin-category-dot admin-category-dot--${category.color}`} /><span className="admin-category-name">{category.label}</span></th><td>{formatReportNumber(category.openingBalance)}</td><td className="admin-money-income">{formatReportNumber(category.income)}</td><td className="admin-money-expense">{category.expense ? formatReportNumber(category.expense) : '–'}</td><td>{formatReportNumber(category.closingBalance)}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row">TOTAL</th><td>{formatReportNumber(totals.openingBalance)}</td><td className="admin-money-income">{formatReportNumber(totals.income)}</td><td className="admin-money-expense">{formatReportNumber(totals.expense)}</td><td className="admin-money-closing">{formatReportNumber(totals.closingBalance)}</td></tr></tfoot>
        </table>
      </div>
    </section>
  )
}
