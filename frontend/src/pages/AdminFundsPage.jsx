import { useEffect, useRef, useState } from 'react'
import AdminTransactionForm from '../components/AdminTransactionForm.jsx'
import { AdminTransferDialog, AdminTransferHistory } from '../components/AdminTransfer.jsx'
import { getAdminTransfers } from '../services/adminTransferService.js'
import { getAdminRecentTransactions } from '../services/adminTransactionService.js'
import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle } from 'lucide-react'
import { useLocation, useNavigate, useOutletContext } from 'react-router'
import AdminRecentTransactions from '../components/AdminRecentTransactions.jsx'
import { dataSource } from '../utils/env.js'
import './AdminFundsPage.css'

export default function AdminFundsPage() {
  const navigate = useNavigate()
  const { pathname, search, hash, state } = useLocation()
  const requestedType = ['income', 'expense'].includes(state?.openTransaction) ? state.openTransaction : null
  const { dashboard, error, addTransaction, reloadWorkspace } = useOutletContext()
  const [transactionType, setTransactionType] = useState(requestedType)
  const [message, setMessage] = useState('')
  const incomeButton = useRef(null)
  const expenseButton = useRef(null)
  const transferButton = useRef(null)
  const transferReturnFocus = useRef(null)
  const [transfers, setTransfers] = useState(null)
  const [transferError, setTransferError] = useState('')
  const [transferDialog, setTransferDialog] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    getAdminTransfers({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setTransfers(data) })
      .catch((cause) => { if (!controller.signal.aborted) setTransferError(cause.message) })
    return () => controller.abort()
  }, [])

  function openTransferDialog(mode, transfer, event) {
    setMessage('')
    transferReturnFocus.current = event.currentTarget
    setTransferDialog({ mode, transfer })
  }

  async function handleTransferDone(mode) {
    setTransfers(await getAdminTransfers())
    await reloadWorkspace()
    setTransferDialog(null)
    const action = mode === 'delete' ? 'dihapus' : 'disimpan'
    setMessage(dataSource === 'mock'
      ? `Transfer dana ${action} pada sesi mock. Belum tersimpan ke server; snapshot saldo tetap.`
      : `Transfer dana berhasil ${action} di database dan saldo kategori diperbarui.`)
  }

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
  async function save(values, type) {
    await addTransaction(values, type)
    setTransactionType(null)
    setMessage(dataSource === 'mock'
      ? `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ditambahkan ke daftar sesi mock. Belum tersimpan ke server; snapshot saldo tetap; laporan simulasi ikut diperbarui.`
      : `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil disimpan ke database dan saldo diperbarui.`)
  }
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat data kelola dana…</p>

  return (
    <div className="admin-funds">
      <section className="admin-funds-hero" aria-labelledby="admin-funds-title">
        <span className="admin-funds-badge"><ArrowRightLeft size={15} aria-hidden="true" />MANAJEMEN TRANSAKSI</span>
        <h2 id="admin-funds-title">Kelola Dana Keuangan</h2>
        <p>{dataSource === 'mock' ? <>Catat transaksi dana masjid dalam sesi mock.<br />Tambahan sesi belum mengubah laporan snapshot.</> : <>Catat pemasukan, pengeluaran, dan transfer antar kategori dana masjid.</>}</p>
      </section>
      <section className="admin-panel admin-funds-controls" aria-labelledby="admin-funds-controls-title">
        <div className="admin-funds-controls-heading"><h2 id="admin-funds-controls-title">Kelola Transaksi</h2><p>{dataSource === 'mock' ? 'Catat pemasukan, pengeluaran, atau transfer antar kategori dalam sesi mock' : 'Catat pemasukan, pengeluaran, atau transfer dana antar kategori'}</p></div>
        <div className="admin-funds-controls-body">
          <div className="admin-funds-buttons">
            <button ref={incomeButton} type="button" onClick={() => openForm('income')}><ArrowDownCircle size={18} aria-hidden="true" />Pemasukan</button>
            <button ref={expenseButton} type="button" onClick={() => openForm('expense')}><ArrowUpCircle size={18} aria-hidden="true" />Pengeluaran</button>
            <button ref={transferButton} type="button" className="admin-funds-transfer" disabled={dashboard.categories.length < 2} title={dashboard.categories.length < 2 ? 'Transfer membutuhkan minimal dua kategori dana' : 'Pindahkan saldo antar kategori dana'} onClick={(event) => openTransferDialog('add', null, event)}><ArrowRightLeft size={18} aria-hidden="true" />Transfer Dana</button>
          </div>
          {(message || dataSource === 'mock') && <p role="status">{message || 'Simulasi sesi admin · Belum tersimpan ke server.'}</p>}
        </div>
      </section>
      <AdminRecentTransactions hasSessionChanges={Boolean(Object.keys(dashboard.transactionChanges || {}).length || dashboard.deletedTransactionIds?.length)} onViewAll={() => navigate('/admin/laporan#kas-masuk')} transactions={getAdminRecentTransactions(dashboard)} categories={dashboard.categories} />
      <AdminTransferHistory transfers={transfers} error={transferError} onDelete={(transfer, event) => openTransferDialog('delete', transfer, event)} />
      {transferDialog && <AdminTransferDialog {...transferDialog} categories={dashboard.categories} onDone={handleTransferDone} onClose={() => setTransferDialog(null)} returnFocusRef={transferReturnFocus} />}
      {transactionType && <AdminTransactionForm type={transactionType} categories={dashboard.categories} onSave={save} onClose={() => setTransactionType(null)} returnFocusRef={transactionType === 'income' ? incomeButton : expenseButton} />}
    </div>
  )
}
