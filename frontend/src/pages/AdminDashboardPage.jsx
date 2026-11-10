import { ArrowDownCircle, ArrowUpCircle, ClipboardList, FileText, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { useOutletContext } from 'react-router'
import { formatReportDate, formatRupiah } from '../utils/reportFormatters.js'
import AdminRecentTransactions from '../components/AdminRecentTransactions.jsx'
import AdminBalanceSummary from '../components/AdminBalanceSummary.jsx'

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
      <AdminBalanceSummary categories={categories} totals={totals} updatedDate={updatedDate} />
      <section className="admin-transparency" aria-labelledby="admin-transparency-title"><div><h2 id="admin-transparency-title">Transparansi &amp; Akuntabilitas Keuangan</h2><p>Pantau dan ekspor laporan keuangan masjid dengan mudah.</p></div><button type="button" disabled title="Laporan admin belum tersedia"><FileText size={16} aria-hidden="true" />Lihat Laporan</button></section>
      <AdminRecentTransactions transactions={recentTransactions} categories={categories} />
      <div className="admin-shortcuts" aria-label="Pintasan admin belum tersedia">{shortcuts.map(({ label, description, icon: Icon, color }) => <button key={label} type="button" disabled title={`${label} belum tersedia`}><span className={`admin-shortcut-icon admin-shortcut-icon--${color}`}><Icon size={21} aria-hidden="true" /></span><span><strong>{label}</strong><small>{description}</small></span></button>)}</div>
    </div>
  )
}
