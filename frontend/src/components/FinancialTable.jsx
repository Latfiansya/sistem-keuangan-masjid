import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatReportDate, formatRupiah } from '../utils/reportFormatters.js'

export default function FinancialTable({ type, transactions, subtotal, categories }) {
  const isIncome = type === 'income'
  const title = isIncome ? 'Pemasukan' : 'Pengeluaran'
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight

  return (
    <section className={`financial-table financial-table--${type}`} aria-labelledby={`financial-${type}-heading`}>
      <header className="financial-table-header">
        <div className="financial-table-identity"><span className="financial-table-icon"><Icon aria-hidden="true" /></span><div><h3 id={`financial-${type}-heading`}>{title}</h3><p>{transactions.length} transaksi</p></div></div>
        <p className="financial-subtotal">{formatRupiah(subtotal)}</p>
      </header>
      {transactions.length ? <table className="financial-transactions-table">
        <caption className="sr-only">Rincian {title.toLowerCase()}: uraian, tanggal, kategori dana, dan nominal Rupiah.</caption>
        <thead className="sr-only"><tr><th scope="col">Transaksi</th><th scope="col">Nominal</th></tr></thead>
        <tbody>{transactions.map((item) => {
          const category = categories.find((entry) => entry.id === item.categoryId)
          return <tr key={item.id}>
            <td><span className="financial-transaction-description" title={item.description}>{item.description}</span><div className="financial-transaction-meta"><time dateTime={item.date}>{formatReportDate(item.date)}</time><span className={`financial-category financial-category--${category.color}`} title={category.label}>{category.label}</span></div></td>
            <td className="financial-transaction-amount">{formatRupiah(item.amount)}</td>
          </tr>
        })}</tbody>
      </table> : <p role="status" className="financial-table-empty">Tidak ada transaksi {title.toLowerCase()} pada rentang ini.</p>}
    </section>
  )
}
