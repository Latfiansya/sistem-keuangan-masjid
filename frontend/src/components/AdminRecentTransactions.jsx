import { ChevronRight } from 'lucide-react'
import { adminCategoryColorStyle } from '../utils/adminCategoryColors.js'
import { formatReportDate, formatReportNumber } from '../utils/reportFormatters.js'

export default function AdminRecentTransactions({ transactions, categories, onViewAll, hasSessionChanges = false }) {
  const changed = hasSessionChanges || transactions.some((transaction) => transaction.source === 'session' || transaction.sessionEdited)
  const sessionCount = transactions.filter((transaction) => transaction.source === 'session').length
  return (
    <section className="admin-panel admin-recent" aria-labelledby="admin-recent-title">
      <div className="admin-recent-heading"><h2 id="admin-recent-title">Transaksi Terbaru</h2><button type="button" onClick={onViewAll} disabled={!onViewAll} title={onViewAll ? 'Lihat semua transaksi di laporan' : 'Daftar transaksi lengkap belum tersedia'}>Lihat Semua<ChevronRight size={16} aria-hidden="true" /></button></div>
      {changed && <p className="admin-session-transactions-note">{sessionCount > 0 && <>{sessionCount} tambahan sesi mock · </>}Perubahan sesi tercermin pada daftar dan laporan simulasi; snapshot saldo tetap.</p>}
      <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
      <div className="admin-table-scroll" role="region" aria-label="Transaksi terbaru, dapat digeser pada layar kecil" tabIndex={0}>
        <table className="admin-recent-table">
          <caption className="sr-only">{sessionCount ? 'Transaksi tambahan sesi mock dan cuplikan snapshot; belum tersimpan ke server.' : 'Cuplikan transaksi terbaru dari data contoh, bukan seluruh transaksi periode.'}</caption>
          <thead><tr><th scope="col">Tanggal</th><th scope="col">Kategori</th><th scope="col">Jenis</th><th scope="col">Uraian</th><th scope="col">Nominal (Rp)</th></tr></thead>
          <tbody>{transactions.map((item) => {
            const category = categories.find((entry) => entry.id === item.categoryId)
            const isIncome = item.type === 'income'
            return <tr key={item.id} data-transaction-id={item.id} data-source={item.source || 'snapshot'}><td><time dateTime={item.date}>{formatReportDate(item.date)}</time>{(item.source === 'session' || item.sessionEdited) && <small className="admin-session-transaction-label">{item.sessionEdited ? 'Edit sesi mock' : 'Sesi mock'}</small>}</td><td><span style={adminCategoryColorStyle(category.color)} className={`admin-category-badge admin-category-badge--${category.color}`}>{category.label}</span></td><td><span className={`admin-type-badge${isIncome ? '' : ' admin-type-badge--expense'}`}>{isIncome ? 'Masuk' : 'Keluar'}</span></td><td>{item.description}</td><td className={isIncome ? 'admin-money-income' : 'admin-money-expense'}>{isIncome ? '+' : '−'} {formatReportNumber(item.amount)}</td></tr>
          })}</tbody>
        </table>
      </div>
    </section>
  )
}
