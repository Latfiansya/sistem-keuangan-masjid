import { formatReportDate, formatReportMonth, formatReportPeriod, formatReportNumber, formatRupiah } from '../utils/reportFormatters.js'
import { adminCategoryColorStyle } from '../utils/adminCategoryColors.js'

const balance = (amount) => amount === null ? 'Belum tersedia' : formatReportNumber(amount)

export function AdminDownloadTotals({ document }) {
  return <dl className="admin-download-totals">{[['openingBalance', 'Saldo Awal'], ['income', 'Pemasukan'], ['expense', 'Pengeluaran'], ['closingBalance', 'Saldo Akhir']].map(([id, label]) => <div key={id} className={`admin-download-total--${id}`}><dt>{label}</dt><dd>{document.totals[id] === null ? 'Belum tersedia' : formatRupiah(document.totals[id])}</dd></div>)}</dl>
}

export default function AdminDownloadSheet({ document, page, pageCount, measuring = false }) {
  const ledger = ['income', 'expense'].includes(page.sectionId)
  const monthly = page.sectionId === 'monthly'
  const transactionCount = document.transactions.filter((item) => !ledger || item.type === page.sectionId).length
  const headings = ledger ? ['Tanggal', 'Kategori Dana', 'Uraian', 'Jumlah (Rp)'] : [monthly ? 'Bulan / Kategori Dana' : 'Kategori Dana', 'Saldo Awal', 'Pemasukan', 'Pengeluaran', 'Saldo Akhir']
  return <article className={`admin-download-sheet${measuring ? ' admin-download-sheet--measure' : ''}`} data-section={page.sectionId} aria-label={`Halaman ${page.number} ${page.title}`}>
    <header className="admin-download-sheet-header"><img src={`${import.meta.env.BASE_URL}assets/masjid-logo.webp`} alt="" width="142" height="43" /><div><strong>MASJID AL-HIDAYAH SOROLATEN</strong><h3>Laporan Keuangan</h3><p>{formatReportPeriod(document.range)}</p></div></header>
    <div className="admin-download-sheet-content">
      <div className={`admin-download-section-title admin-download-section-title--${page.sectionId}`}><h4>{page.title}</h4><span>{transactionCount} transaksi periode · seluruh kategori</span></div>
      <AdminDownloadTotals document={document} />
      <p className="admin-download-sheet-note">SIMULASI / MOCK · Belum tersimpan ke server{document.sessionChangeCount > 0 ? ` · ${document.sessionChangeCount} perubahan sesi diperhitungkan` : ''}. {document.note}</p>
      <table className={ledger ? 'admin-download-ledger' : 'admin-download-balances'}>
        <thead><tr>{headings.map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
        <tbody>{page.rows.length ? page.rows.map((row) => {
          const category = row.kind === 'transaction' ? document.categories.find((item) => item.id === row.categoryId) : row
          const label = <span className="admin-download-category" style={adminCategoryColorStyle(category.color)}>{!row.total && <i aria-hidden="true" />}{category.label}</span>
          return <tr key={row.key} data-export-row={row.key} data-transaction-id={row.kind === 'transaction' ? row.id : undefined} className={row.total ? 'admin-download-total-row' : undefined}>
            {ledger ? <><td>{formatReportDate(row.date)}</td><td>{label}</td><td>{row.description}</td><td className={`admin-download-amount--${row.type}`}>{formatReportNumber(row.amount)}</td></> : <><th scope="row">{monthly && <small>{formatReportMonth(row.month)}</small>}{label}</th><td>{balance(row.openingBalance)}</td><td className="admin-download-amount--income">{balance(row.income)}</td><td className="admin-download-amount--expense">{balance(row.expense)}</td><td>{balance(row.closingBalance)}</td></>}
          </tr>
        }) : <tr className="admin-download-empty"><td colSpan={headings.length}>Tidak ada transaksi mock untuk jenis laporan dan periode ini.</td></tr>}</tbody>
      </table>
    </div>
    <footer className="admin-download-sheet-footer"><span>Data contoh · Bukan laporan resmi masjid · Nominal dalam Rupiah</span><strong>Halaman {page.number} / {pageCount}</strong></footer>
  </article>
}
