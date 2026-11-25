import { getAdminRecentTransactions } from '../services/adminTransactionService.js'
import { ArrowDownCircle, ArrowUpCircle, ClipboardList, FileText, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router'
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
  { label: 'Lihat Laporan', description: 'Export & cetak', icon: FileText, color: 'blue', to: '/admin/laporan' },
  { label: 'Activity Log', description: 'Riwayat perubahan', icon: ClipboardList, color: 'purple', to: '/admin/activity-log' },
  { label: 'Kelola Akun', description: 'Pengaturan pengurus', icon: Users, color: 'orange', to: '/admin/kelola-akun' },
]

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { dashboard, error } = useOutletContext()
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat dashboard keuangan…</p>
  const { categories, totals, updatedDate } = dashboard
  const updatedLabel = formatReportDate(updatedDate)
  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero" aria-labelledby="admin-hero-title">
        <div>
          <h2 id="admin-hero-title">MASJID<br />AL-HIDAYAH</h2>
          <p>Kelola seluruh transaksi keuangan, konten website,<br className="admin-desktop-break" /> dalam satu dashboard terintegrasi.</p>
          <div className="admin-hero-actions">
            <button type="button" onClick={() => navigate('/admin/kelola-dana', { state: { openTransaction: 'income' } })}><ArrowDownCircle size={17} aria-hidden="true" />Tambah Pemasukan</button>
            <button type="button" onClick={() => navigate('/admin/kelola-dana', { state: { openTransaction: 'expense' } })}><ArrowUpCircle size={17} aria-hidden="true" />Tambah Pengeluaran</button>
          </div>
        </div>
      </section>
      <div className="admin-dashboard-status"><span className="admin-updated"><i aria-hidden="true" />Terakhir Update: <time dateTime={updatedDate}>{updatedLabel}</time></span><span>Data contoh · Interaksi admin menggunakan simulasi.</span></div>
      <section className="admin-statistics" aria-label="Ringkasan keuangan">
        {statistics.map(({ id, label, icon: Icon, color }) => <article className={`admin-statistic admin-statistic--${color}`} key={id}>
          <div className="admin-statistic-label"><span><Icon size={21} aria-hidden="true" /></span><h2>{label}</h2></div>
          <p>{formatRupiah(totals[id])}</p>
          {id === 'openingBalance' && <small>Diambil dari Saldo Akhir bulan lalu</small>}
          {id === 'closingBalance' && <small>Update: {updatedLabel}</small>}
        </article>)}
      </section>
      <AdminBalanceSummary categories={categories} totals={totals} updatedDate={updatedDate} />
      <section className="admin-transparency" aria-labelledby="admin-transparency-title"><div><h2 id="admin-transparency-title">Transparansi &amp; Akuntabilitas Keuangan</h2><p>Pantau dan ekspor laporan keuangan masjid dengan mudah.</p></div><button type="button" onClick={() => navigate('/admin/laporan')}><FileText size={16} aria-hidden="true" />Lihat Laporan</button></section>
      <AdminRecentTransactions hasSessionChanges={Boolean(Object.keys(dashboard.transactionChanges || {}).length || dashboard.deletedTransactionIds?.length)} onViewAll={() => navigate('/admin/laporan#kas-masuk')} transactions={getAdminRecentTransactions(dashboard)} categories={categories} />
      <div className="admin-shortcuts" aria-label="Pintasan admin">{shortcuts.map(({ label, description, icon: Icon, color, to }) => <button key={label} type="button" onClick={() => navigate(to)}><span className={`admin-shortcut-icon admin-shortcut-icon--${color}`}><Icon size={21} aria-hidden="true" /></span><span><strong>{label}</strong><small>{description}</small></span></button>)}</div>
    </div>
  )
}
