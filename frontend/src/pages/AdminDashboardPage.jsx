import { ArrowDownCircle, ArrowUpCircle, ChevronRight, ClipboardList, FileText, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { useOutletContext } from 'react-router'
import { formatReportDate, formatReportNumber, formatRupiah } from '../utils/reportFormatters.js'

const statistics = [
  { id: 'openingBalance', label: 'Saldo Awal', icon: Wallet, color: 'green' },
  { id: 'income', label: 'Pemasukan', icon: TrendingUp, color: 'income' },
  { id: 'expense', label: 'Pengeluaran', icon: TrendingDown, color: 'expense' },
  { id: 'closingBalance', label: 'Saldo Akhir', icon: Wallet, color: 'green' },
]
const shortcuts = [
  { label: 'Lihat Laporan', description: 'Export & cetak', icon: FileText, color: 'blue' },
  { label: 'Activity Log', description: 'Riwayat perubahan', icon: ClipboardList, color: 'purple' },
  { label: 'Kelola Akun', description: 'Pengaturan pengurus', icon: Users, color: 'orange' },
]

export default function AdminDashboardPage() {
  const { dashboard, error } = useOutletContext()
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat dashboard keuangan…</p>
  const { categories, totals, recentTransactions, updatedDate } = dashboard
  const updatedLabel = formatReportDate(updatedDate)
  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero" aria-labelledby="admin-hero-title">
        <div>
          <h2 id="admin-hero-title">MASJID<br />AL-HIDAYAH</h2>
          <p>Kelola seluruh transaksi keuangan, konten website,<br className="admin-desktop-break" /> dalam satu dashboard terintegrasi.</p>
          <div className="admin-hero-actions">
            <button type="button" disabled title="Tambah pemasukan belum tersedia"><ArrowDownCircle size={17} aria-hidden="true" />Tambah Pemasukan</button>
            <button type="button" disabled title="Tambah pengeluaran belum tersedia"><ArrowUpCircle size={17} aria-hidden="true" />Tambah Pengeluaran</button>
          </div>
        </div>
      </section>
      <div className="admin-dashboard-status"><span className="admin-updated"><i aria-hidden="true" />Terakhir Update: <time dateTime={updatedDate}>{updatedLabel}</time></span><span>Data contoh · Menu dan aksi lainnya belum tersedia.</span></div>
      <section className="admin-statistics" aria-label="Ringkasan keuangan">
        {statistics.map(({ id, label, icon: Icon, color }) => <article className={`admin-statistic admin-statistic--${color}`} key={id}>
          <div className="admin-statistic-label"><span><Icon size={21} aria-hidden="true" /></span><h2>{label}</h2></div>
          <p>{formatRupiah(totals[id])}</p>
          {id === 'openingBalance' && <small>Diambil dari Saldo Akhir bulan lalu</small>}
          {id === 'closingBalance' && <small>Update: {updatedLabel}</small>}
        </article>)}
      </section>
      <section className="admin-panel admin-balance" aria-labelledby="admin-balance-title">
        <div className="admin-panel-heading"><h2 id="admin-balance-title">Resume Saldo per Kategori</h2><span className="admin-updated"><i aria-hidden="true" />Terakhir Update: {updatedLabel}</span><p>Rekap pemasukan, pengeluaran, dan saldo akhir semua kotak dana.</p></div>
        <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
        <div className="admin-table-scroll" role="region" aria-label="Resume saldo per kategori, dapat digeser pada layar kecil" tabIndex={0}>
          <table className="admin-balance-table">
            <caption className="sr-only">Saldo awal, pemasukan, pengeluaran dan saldo akhir per kategori dalam Rupiah.</caption>
            <thead><tr><th scope="col">Kategori</th><th scope="col">Saldo Awal (Rp)</th><th scope="col">Pemasukan (Rp)</th><th scope="col">Pengeluaran (Rp)</th><th scope="col">Saldo Akhir (Rp)</th></tr></thead>
            <tbody>{categories.map((category) => <tr key={category.id}><th scope="row"><span className={`admin-category-dot admin-category-dot--${category.color}`} /><span className="admin-category-name">{category.label}</span></th><td>{formatReportNumber(category.openingBalance)}</td><td className="admin-money-income">{formatReportNumber(category.income)}</td><td className="admin-money-expense">{category.expense ? formatReportNumber(category.expense) : '–'}</td><td>{formatReportNumber(category.closingBalance)}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">TOTAL</th><td>{formatReportNumber(totals.openingBalance)}</td><td className="admin-money-income">{formatReportNumber(totals.income)}</td><td className="admin-money-expense">{formatReportNumber(totals.expense)}</td><td className="admin-money-closing">{formatReportNumber(totals.closingBalance)}</td></tr></tfoot>
          </table>
        </div>
      </section>
      <section className="admin-transparency" aria-labelledby="admin-transparency-title"><div><h2 id="admin-transparency-title">Transparansi &amp; Akuntabilitas Keuangan</h2><p>Pantau dan ekspor laporan keuangan masjid dengan mudah.</p></div><button type="button" disabled title="Laporan admin belum tersedia"><FileText size={16} aria-hidden="true" />Lihat Laporan</button></section>
      <section className="admin-panel admin-recent" aria-labelledby="admin-recent-title">
        <div className="admin-recent-heading"><h2 id="admin-recent-title">Transaksi Terbaru</h2><button type="button" disabled title="Daftar transaksi lengkap belum tersedia">Lihat Semua<ChevronRight size={16} aria-hidden="true" /></button></div>
        <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
        <div className="admin-table-scroll" role="region" aria-label="Transaksi terbaru, dapat digeser pada layar kecil" tabIndex={0}>
          <table className="admin-recent-table">
            <caption className="sr-only">Lima transaksi terbaru dari data contoh, bukan seluruh transaksi periode.</caption>
            <thead><tr><th scope="col">Tanggal</th><th scope="col">Kategori</th><th scope="col">Jenis</th><th scope="col">Uraian</th><th scope="col">Nominal (Rp)</th></tr></thead>
            <tbody>{recentTransactions.map((item) => {
              const category = categories.find((entry) => entry.id === item.categoryId)
              const isIncome = item.type === 'income'
              return <tr key={item.id}><td><time dateTime={item.date}>{formatReportDate(item.date)}</time></td><td><span className={`admin-category-badge admin-category-badge--${category.color}`}>{category.label}</span></td><td><span className={`admin-type-badge${isIncome ? '' : ' admin-type-badge--expense'}`}>{isIncome ? 'Masuk' : 'Keluar'}</span></td><td>{item.description}</td><td className={isIncome ? 'admin-money-income' : 'admin-money-expense'}>{isIncome ? '+' : '−'} {formatReportNumber(item.amount)}</td></tr>
            })}</tbody>
          </table>
        </div>
      </section>
      <div className="admin-shortcuts" aria-label="Pintasan admin belum tersedia">{shortcuts.map(({ label, description, icon: Icon, color }) => <button key={label} type="button" disabled title={`${label} belum tersedia`}><span className={`admin-shortcut-icon admin-shortcut-icon--${color}`}><Icon size={21} aria-hidden="true" /></span><span><strong>{label}</strong><small>{description}</small></span></button>)}</div>
    </div>
  )
}
