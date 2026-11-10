import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle } from 'lucide-react'
import { useOutletContext } from 'react-router'
import AdminRecentTransactions from '../components/AdminRecentTransactions.jsx'
import './AdminFundsPage.css'

export default function AdminFundsPage() {
  const { dashboard, error } = useOutletContext()
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat data kelola dana…</p>

  return (
    <div className="admin-funds">
      <section className="admin-funds-hero" aria-labelledby="admin-funds-title">
        <span className="admin-funds-badge"><ArrowRightLeft size={15} aria-hidden="true" />MANAJEMEN TRANSAKSI</span>
        <h2 id="admin-funds-title">Kelola Dana Keuangan</h2>
        <p>Tambah, ubah, dan hapus transaksi, <br />perubahan langsung memperbarui seluruh laporan.</p>
      </section>
      <section className="admin-panel admin-funds-controls" aria-labelledby="admin-funds-controls-title">
        <div className="admin-funds-controls-heading"><h2 id="admin-funds-controls-title">Kelola Transaksi</h2><p>Catat pemasukan atau pengeluaran — saldo otomatis diperbarui</p></div>
        <div className="admin-funds-controls-body">
          <div className="admin-funds-buttons">
            <button type="button" disabled title="Fitur pemasukan belum tersedia"><ArrowDownCircle size={18} aria-hidden="true" />Pemasukan</button>
            <button type="button" disabled title="Fitur pengeluaran belum tersedia"><ArrowUpCircle size={18} aria-hidden="true" />Pengeluaran</button>
          </div>
          <p>Data contoh · Fitur transaksi belum tersedia.</p>
        </div>
      </section>
      <AdminRecentTransactions transactions={dashboard.recentTransactions} categories={dashboard.categories} />
    </div>
  )
}
