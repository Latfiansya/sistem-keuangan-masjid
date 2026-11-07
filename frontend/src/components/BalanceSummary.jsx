import { formatReportNumber } from '../utils/reportFormatters.js'

export default function BalanceSummary({ summary, period, variant = 'screen' }) {
  const isSheet = variant === 'sheet'
  const headingId = isSheet ? 'report-sheet-summary-heading' : 'financial-summary-heading'
  return (
    <section className={`financial-summary${isSheet ? ' financial-summary--sheet' : ''}`} aria-labelledby={headingId}>
      <h2 id={headingId}>Resume Saldo {period}</h2>
      <p>Rekapitulasi per kategori dana</p>
      <div className="financial-summary-scroll" role={isSheet ? undefined : 'region'} aria-label={isSheet ? undefined : 'Tabel ringkasan saldo, dapat digeser pada layar kecil'} tabIndex={isSheet ? undefined : 0}>
        <table className="financial-summary-table">
          <caption className="sr-only">Saldo awal, pemasukan, pengeluaran, dan saldo akhir dalam Rupiah.</caption>
          <thead><tr><th scope="col">Kategori</th><th scope="col">Saldo awal (Rp)</th><th scope="col">Pemasukan (Rp)</th><th scope="col">Pengeluaran (Rp)</th><th scope="col">Saldo akhir (Rp)</th></tr></thead>
          <tbody>{summary.rows.map((row) => <tr key={row.id}>
            <th scope="row"><span className={`financial-category financial-category--${row.color}`}>{row.label}</span></th>
            <td>{formatReportNumber(row.openingBalance)}</td><td className="financial-amount-income">{formatReportNumber(row.income)}</td><td className="financial-amount-expense">{formatReportNumber(row.expense)}</td><td className="financial-closing-balance">{formatReportNumber(row.closingBalance)}</td>
          </tr>)}</tbody>
          <tfoot><tr><th scope="row">TOTAL</th><td>{formatReportNumber(summary.totals.openingBalance)}</td><td className="financial-amount-income">{formatReportNumber(summary.totals.income)}</td><td className="financial-amount-expense">{formatReportNumber(summary.totals.expense)}</td><td>{formatReportNumber(summary.totals.closingBalance)}</td></tr></tfoot>
        </table>
      </div>
    </section>
  )
}
