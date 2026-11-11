import { useEffect, useRef, useState } from 'react'
import AdminTransactionForm from '../components/AdminTransactionForm.jsx'
import { getAdminRecentTransactions } from '../services/adminTransactionService.js'
import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle } from 'lucide-react'
import { useLocation, useNavigate, useOutletContext } from 'react-router'
import AdminRecentTransactions from '../components/AdminRecentTransactions.jsx'
import './AdminFundsPage.css'

export default function AdminFundsPage() {
  const navigate = useNavigate()
  const { pathname, search, hash, state } = useLocation()
  const requestedType = ['income', 'expense'].includes(state?.openTransaction) ? state.openTransaction : null
  const { dashboard, error, addTransaction } = useOutletContext()
  const [transactionType, setTransactionType] = useState(requestedType)
  const [message, setMessage] = useState('')
  const incomeButton = useRef(null)
  const expenseButton = useRef(null)

  useEffect(() => {
    if (!requestedType) return
    const nextState = { ...state }
    delete nextState.openTransaction
    navigate({ pathname, search, hash }, { replace: true, state: Object.keys(nextState).length ? nextState : null })
  }, [requestedType, state, navigate, pathname, search, hash])
  function openForm(type) {
    setMessage('')
    setTransactionType(type)
  }
  function save(values, type) {
    addTransaction(values, type)
    setTransactionType(null)
    setMessage(`${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ditambahkan ke daftar sesi mock. Belum tersimpan ke server; snapshot saldo tetap; laporan simulasi ikut diperbarui.`)
  }
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat data kelola dana…</p>

  return (
    <div className="admin-funds">
      <section className="admin-funds-hero" aria-labelledby="admin-funds-title">
        <span className="admin-funds-badge"><ArrowRightLeft size={15} aria-hidden="true" />MANAJEMEN TRANSAKSI</span>
        <h2 id="admin-funds-title">Kelola Dana Keuangan</h2>
        <p>Catat transaksi dana masjid dalam sesi mock.<br />Tambahan sesi belum mengubah laporan snapshot.</p>
      </section>
      <section className="admin-panel admin-funds-controls" aria-labelledby="admin-funds-controls-title">
        <div className="admin-funds-controls-heading"><h2 id="admin-funds-controls-title">Kelola Transaksi</h2><p>Catat pemasukan atau pengeluaran dalam sesi mock</p></div>
        <div className="admin-funds-controls-body">
          <div className="admin-funds-buttons">
            <button ref={incomeButton} type="button" onClick={() => openForm('income')}><ArrowDownCircle size={18} aria-hidden="true" />Pemasukan</button>
            <button ref={expenseButton} type="button" onClick={() => openForm('expense')}><ArrowUpCircle size={18} aria-hidden="true" />Pengeluaran</button>
          </div>
          <p role="status">{message || 'Simulasi sesi admin · Belum tersimpan ke server.'}</p>
        </div>
      </section>
      <AdminRecentTransactions hasSessionChanges={Boolean(Object.keys(dashboard.transactionChanges || {}).length || dashboard.deletedTransactionIds?.length)} onViewAll={() => navigate('/admin/laporan#kas-masuk')} transactions={getAdminRecentTransactions(dashboard)} categories={dashboard.categories} />
      {transactionType && <AdminTransactionForm type={transactionType} categories={dashboard.categories} onSave={save} onClose={() => setTransactionType(null)} returnFocusRef={transactionType === 'income' ? incomeButton : expenseButton} />}
    </div>
  )
}
