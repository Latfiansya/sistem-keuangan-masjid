import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import AdminRupiahInput from './AdminRupiahInput.jsx'
import { validateReceiptCategory } from '../services/adminReceiptService.js'
import { emptyReceipt, getLocalReceiptDate, receiptDateFromIso, receiptDateToIso, receiptMethods, receiptTextLimits, validateReceipt } from '../utils/adminReceipt.js'

// Mode API: kwitansi disimpan ke server sekaligus mencatat pemasukan pada kategori dana terpilih.
// Mode mock: hanya memperbarui pratinjau lokal.
// mode "edit": mengubah kwitansi tersimpan (nomor tetap) beserta transaksi pemasukannya.
export default function AdminReceiptForm({ receipt, mode = 'create', categories = [], apiMode = false, onSave, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const editing = mode === 'edit'
  const [values, setValues] = useState(() => (editing || (receipt && !receipt.number) ? { ...receipt } : { ...emptyReceipt, categoryId: '', date: getLocalReceiptDate() }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    const returnFocusTo = returnFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const viewport = window.visualViewport
    function updateViewport() {
      dialog.style.setProperty('--receipt-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
      dialog.style.setProperty('--receipt-viewport-top', `${viewport?.offsetTop ?? 0}px`)
    }
    updateViewport()
    viewport?.addEventListener('resize', updateViewport)
    viewport?.addEventListener('scroll', updateViewport)
    dialog.showModal()
    dialog.querySelector('input')?.focus()
    return () => {
      viewport?.removeEventListener('resize', updateViewport)
      viewport?.removeEventListener('scroll', updateViewport)
      dialog.close()
      document.body.style.overflow = overflow
      if (returnFocusTo?.isConnected) returnFocusTo.focus({ preventScroll: true })
    }
  }, [returnFocusRef])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: name === 'date' ? receiptDateFromIso(value) : value }))
    setErrors((previous) => ({ ...previous, [name]: '', form: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const validation = { ...validateReceipt(values), ...(apiMode ? validateReceiptCategory(values, categories) : {}) }
    setErrors(validation)
    const firstInvalid = Object.keys(validation)[0]
    if (firstInvalid) { event.currentTarget.elements.namedItem(firstInvalid)?.focus(); return }
    setSubmitting(true)
    try {
      await onSave({ ...values, payer: values.payer.trim(), purpose: values.purpose.trim(), amount: String(Number(values.amount)) })
    } catch (cause) {
      setErrors({ form: cause.message })
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key !== 'Tab') return
    const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled)')]
    const boundary = event.shiftKey ? controls[0] : controls.at(-1)
    if (document.activeElement === boundary) {
      event.preventDefault()
      ;(event.shiftKey ? controls.at(-1) : controls[0]).focus()
    }
  }

  const describedBy = (name) => (errors[name] ? `admin-receipt-${name}-error` : undefined)
  const error = (name) => errors[name] && <p id={`admin-receipt-${name}-error`} className="admin-receipt-error" role="alert">{errors[name]}</p>

  function field(name, label, placeholder, maxLength, inputMode) {
    return <div className="admin-receipt-field"><label htmlFor={`admin-receipt-${name}`}>{label}<span aria-hidden="true">*</span></label><input id={`admin-receipt-${name}`} name={name} required maxLength={maxLength} inputMode={inputMode} autoComplete="off" placeholder={placeholder} value={values[name]} disabled={submitting} onChange={handleChange} aria-invalid={Boolean(errors[name])} aria-describedby={describedBy(name)} />{error(name)}</div>
  }

  return <dialog ref={dialogRef} className="admin-receipt-dialog" aria-labelledby="admin-receipt-form-title" aria-describedby="admin-receipt-form-note" onKeyDown={handleKeyDown} onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
    <header><h2 id="admin-receipt-form-title">{editing ? `Edit Kwitansi ${receipt.number}` : 'Buat Kwitansi'}</h2><button type="button" aria-label={editing ? 'Tutup edit kwitansi' : 'Tutup buat kwitansi'} disabled={submitting} onClick={onClose}><X size={20} aria-hidden="true" /></button></header>
    <form noValidate onSubmit={handleSubmit} aria-busy={submitting}>
      {field('payer', 'Telah terima dari', 'Nama pemberi pembayaran', receiptTextLimits.payer)}
      <div className="admin-receipt-field"><label htmlFor="admin-receipt-amount">Nominal<span aria-hidden="true">*</span></label><AdminRupiahInput id="admin-receipt-amount" name="amount" required value={values.amount} disabled={submitting} onChange={handleChange} aria-invalid={Boolean(errors.amount)} aria-describedby={describedBy('amount')} />{error('amount')}</div>
      {field('purpose', 'Untuk Pembayaran', 'Keterangan pembayaran', receiptTextLimits.purpose)}
      <div className="admin-receipt-field"><label htmlFor="admin-receipt-method">Metode Pembayaran<span aria-hidden="true">*</span></label><select id="admin-receipt-method" name="method" required value={values.method} disabled={submitting} onChange={handleChange} aria-invalid={Boolean(errors.method)} aria-describedby={describedBy('method')}><option value="">Pilih Metode Pembayaran</option>{receiptMethods.map((method) => <option key={method}>{method}</option>)}</select>{error('method')}</div>
      {apiMode && <div className="admin-receipt-field"><label htmlFor="admin-receipt-categoryId">Masuk ke Kategori Dana<span aria-hidden="true">*</span></label><select id="admin-receipt-categoryId" name="categoryId" required value={values.categoryId || ''} disabled={submitting} onChange={handleChange} aria-invalid={Boolean(errors.categoryId)} aria-describedby={describedBy('categoryId')}><option value="">Pilih Kategori Dana</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>{error('categoryId')}</div>}
      <div className="admin-receipt-field"><label htmlFor="admin-receipt-date">Tanggal<span aria-hidden="true">*</span></label><input id="admin-receipt-date" name="date" type="date" required value={receiptDateToIso(values.date)} disabled={submitting} onChange={handleChange} aria-invalid={Boolean(errors.date)} aria-describedby={describedBy('date')} />{error('date')}</div>
      <p id="admin-receipt-form-note" className="admin-receipt-note">{editing ? 'Perubahan nominal, tanggal, dan kategori dana ikut memperbarui transaksi pemasukannya. Nomor kwitansi tidak berubah.' : apiMode ? 'Simpan akan mencatat pemasukan pada kategori dana terpilih sekaligus menerbitkan kwitansi bernomor. Nominal dan tanggal mengikuti transaksi tersebut.' : 'Simpan hanya memperbarui pratinjau lokal. Draft belum tersimpan ke server dan akan hilang saat halaman dimuat ulang atau ditinggalkan.'}</p>
      {error('form')}
      <footer><button type="button" disabled={submitting} onClick={onClose}>Batal</button><button type="submit" className="admin-receipt-confirm" disabled={submitting}>{submitting ? 'Menyimpan…' : editing ? 'Simpan Perubahan' : 'Simpan Kwitansi'}</button></footer>
    </form>
  </dialog>
}
