import { useEffect, useRef, useState } from 'react'
import { CircleAlert, Trash2, X } from 'lucide-react'
import { dataSource } from '../utils/env.js'
import { formatReportDate, formatRupiah } from '../utils/reportFormatters.js'

export default function AdminTransactionDeleteDialog({ transaction, category, onClose, onDelete, returnFocusRef }) {
  const dialogRef = useRef(null)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = returnFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector('input').focus()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [returnFocusRef])

  async function submit(event) {
    event.preventDefault()
    if (confirmation !== 'HAPUS' || submitting) return
    setSubmitting(true)
    try {
      await onDelete()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSubmitting(false)
    }
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return
    const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
    if (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1))) {
      event.preventDefault()
      ;(event.shiftKey ? controls.at(-1) : controls[0]).focus()
    }
  }

  return <dialog ref={dialogRef} className="admin-transaction-delete" aria-labelledby="admin-transaction-delete-title" aria-describedby="admin-transaction-delete-warning" onKeyDown={trapFocus} onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
    <span className="admin-transaction-delete-icon"><Trash2 size={24} aria-hidden="true" /></span>
    <button type="button" disabled={submitting} className="admin-transaction-delete-close" aria-label="Tutup konfirmasi hapus transaksi" onClick={onClose}><X size={22} aria-hidden="true" /></button>
    <h2 id="admin-transaction-delete-title">Hapus transaksi ini?</h2>
    <p>{dataSource === 'mock' ? 'Pastikan transaksi yang dipilih sudah benar. Penghapusan ini hanya berlaku pada simulasi sesi.' : 'Pastikan transaksi yang dipilih sudah benar. Penghapusan akan memperbarui saldo kategori dana di database.'}</p>
    <div className="admin-transaction-delete-summary"><strong>{transaction.description}</strong><b className={`admin-transaction-money--${transaction.type}`}>{formatRupiah(transaction.amount)}</b><span>{formatReportDate(transaction.date)} · {category?.label || 'Kategori'}</span></div>
    <p id="admin-transaction-delete-warning" className="admin-transaction-delete-warning"><CircleAlert size={20} aria-hidden="true" />{dataSource === 'mock' ? 'Transaksi akan disembunyikan dari data aktif sesi dan total simulasi disesuaikan. Data asli dan snapshot tetap utuh; tidak ada perubahan ke server.' : 'Transaksi akan dihapus permanen dari database dan saldo kategori dana akan dihitung ulang.'}</p>
    <form noValidate onSubmit={submit} aria-busy={submitting}>
      <label htmlFor="admin-transaction-delete-confirmation">Ketik HAPUS untuk mengonfirmasi</label>
      <input id="admin-transaction-delete-confirmation" autoComplete="off" disabled={submitting} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="HAPUS" />
      <small>Gunakan huruf kapital, tanpa spasi tambahan.</small>
      {error && <p role="alert">{error}</p>}
      <footer><button type="button" disabled={submitting} onClick={onClose}>Batal</button><button type="submit" disabled={confirmation !== 'HAPUS' || submitting}><Trash2 size={18} aria-hidden="true" />{submitting ? 'Menghapus…' : 'Hapus Transaksi'}</button></footer>
    </form>
  </dialog>
}
