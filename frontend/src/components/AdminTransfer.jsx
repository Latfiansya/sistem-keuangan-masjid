import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowRightLeft, Check, Trash2, TriangleAlert, X } from 'lucide-react'
import AdminRupiahInput from './AdminRupiahInput.jsx'
import { getLocalTransactionDate } from '../services/adminTransactionService.js'
import { createAdminTransfer, deleteAdminTransfer, getCategoryBalance, validateAdminTransfer } from '../services/adminTransferService.js'
import { formatReportDate, formatRupiah } from '../utils/reportFormatters.js'
import { dataSource } from '../utils/env.js'
import './AdminModalDialog.css'
import './AdminTransfer.css'

// Dialog tambah transfer dana atau konfirmasi hapus transfer.
export function AdminTransferDialog({ mode, transfer, categories, onDone, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const deleting = mode === 'delete'
  const [values, setValues] = useState(() => ({ date: getLocalTransactionDate(), fromCategoryId: '', toCategoryId: '', amount: '', note: '' }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const fromCategory = categories.find((category) => category.id === values.fromCategoryId)

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = returnFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector(deleting ? '.admin-crud-cancel' : 'input')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [deleting, returnFocusRef])

  function change(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '', form: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    if (!deleting) {
      const validation = validateAdminTransfer(values, categories)
      setErrors(validation)
      const firstInvalid = Object.keys(validation)[0]
      if (firstInvalid) {
        dialogRef.current.querySelector(`[name="${firstInvalid}"]`)?.focus()
        return
      }
    }
    setSubmitting(true)
    try {
      if (deleting) await deleteAdminTransfer(transfer.id)
      else await createAdminTransfer(values, categories)
      await onDone(mode)
    } catch (cause) {
      setErrors({ form: cause.message })
    } finally {
      setSubmitting(false)
    }
  }

  const field = (name) => ({
    id: `admin-transfer-${name}`,
    name,
    disabled: submitting,
    value: values[name],
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `admin-transfer-${name}-error` : undefined,
    onChange: (event) => change(name, event.target.value),
  })
  const error = (name) => errors[name] && <p id={`admin-transfer-${name}-error`} className="admin-crud-error" role="alert">{errors[name]}</p>

  return (
    <dialog ref={dialogRef} className={`admin-crud-dialog${deleting ? ' admin-crud-dialog--delete' : ''}`} aria-labelledby="admin-transfer-dialog-title" onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
      <header>
        <h2 id="admin-transfer-dialog-title">{deleting ? 'Hapus Transfer Dana?' : 'Transfer Dana'}</h2>
        <button type="button" disabled={submitting} aria-label="Tutup dialog transfer dana" onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </header>
      <form noValidate onSubmit={submit} aria-busy={submitting}>
        {deleting ? (
          <div className="admin-crud-warning">
            <TriangleAlert size={22} aria-hidden="true" />
            <p>Hapus transfer <strong>{formatRupiah(transfer.amount)}</strong> dari {transfer.fromCategoryLabel} ke {transfer.toCategoryLabel} ({formatReportDate(transfer.date)})? Saldo kedua kategori akan dikembalikan. Penghapusan ditolak bila saldo kategori tujuan sudah terpakai.</p>
          </div>
        ) : (
          <>
            <div className="admin-crud-field">
              <label htmlFor="admin-transfer-date">Tanggal Transfer *</label>
              <input {...field('date')} type="date" />
              {error('date')}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-transfer-fromCategoryId">Dari Kategori *</label>
              <select {...field('fromCategoryId')}>
                <option value="">Pilih kategori asal</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.label} · {formatRupiah(getCategoryBalance(category))}</option>)}
              </select>
              {error('fromCategoryId')}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-transfer-toCategoryId">Ke Kategori *</label>
              <select {...field('toCategoryId')}>
                <option value="">Pilih kategori tujuan</option>
                {categories.filter((category) => category.id !== values.fromCategoryId).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
              </select>
              {error('toCategoryId')}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-transfer-amount">Nominal *</label>
              <AdminRupiahInput {...field('amount')} />
              <p className="admin-transfer-help">{fromCategory ? `Saldo ${fromCategory.label} saat ini: ${formatRupiah(getCategoryBalance(fromCategory))}` : 'Pilih kategori asal untuk melihat saldo yang tersedia.'}</p>
              {error('amount')}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-transfer-note">Keterangan (Opsional)</label>
              <textarea {...field('note')} rows={2} maxLength={255} placeholder="Contoh: Dana tambahan untuk pemeliharaan" />
              {error('note')}
            </div>
            <p className="admin-transfer-help">{dataSource === 'mock' ? 'Mode simulasi: transfer hanya tercatat selama sesi admin dan tidak mengubah snapshot saldo.' : 'Transfer langsung tersimpan ke database; saldo kedua kategori diperbarui otomatis dan tercatat di Activity Log.'}</p>
          </>
        )}
        {errors.form && <p className="admin-crud-error" role="alert">{errors.form}</p>}
        <footer>
          <button type="button" className="admin-crud-cancel" disabled={submitting} onClick={onClose}>Batal</button>
          <button type="submit" className={deleting ? 'admin-crud-delete-confirm' : 'admin-crud-save'} disabled={submitting}>
            {deleting ? <Trash2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            {submitting ? 'Memproses…' : deleting ? 'Ya, Hapus Transfer' : 'Simpan Transfer'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

// Panel riwayat transfer dana antar kategori.
export function AdminTransferHistory({ transfers, error, onDelete }) {
  return (
    <section className="admin-panel admin-transfer-history" aria-labelledby="admin-transfer-history-title">
      <div className="admin-transfer-history-heading">
        <h2 id="admin-transfer-history-title">Riwayat Transfer Dana</h2>
        <p>Perpindahan saldo antar kategori dana; tidak dihitung sebagai pemasukan atau pengeluaran.</p>
      </div>
      {error ? <p className="admin-transfer-state" role="alert">{error}</p>
        : !transfers ? <p className="admin-transfer-state" role="status">Memuat riwayat transfer…</p>
          : !transfers.length ? <p className="admin-transfer-state">Belum ada transfer dana.</p>
            : (
              <ul className="admin-transfer-list">
                {transfers.map((transfer) => (
                  <li key={transfer.id} className="admin-transfer-item">
                    <span className="admin-transfer-icon"><ArrowRightLeft size={18} aria-hidden="true" /></span>
                    <div className="admin-transfer-copy">
                      <p className="admin-transfer-route">{transfer.fromCategoryLabel}<ArrowRight size={14} aria-label="ke" />{transfer.toCategoryLabel}</p>
                      <p className="admin-transfer-meta"><time dateTime={transfer.date}>{formatReportDate(transfer.date)}</time>{transfer.note && <> · {transfer.note}</>}</p>
                    </div>
                    <strong className="admin-transfer-amount">{formatRupiah(transfer.amount)}</strong>
                    <button type="button" className="admin-transfer-delete" aria-label={`Hapus transfer ${formatRupiah(transfer.amount)} dari ${transfer.fromCategoryLabel} ke ${transfer.toCategoryLabel}`} title="Hapus transfer" onClick={(event) => onDelete(transfer, event)}><Trash2 size={16} aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
    </section>
  )
}
