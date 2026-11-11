import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import AdminRupiahInput from './AdminRupiahInput.jsx'
import { emptyReceipt, getLocalReceiptDate, receiptDateFromIso, receiptDateToIso, receiptMethods, validateReceipt } from '../utils/adminReceipt.js'

export default function AdminReceiptForm({ receipt, onSave, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const [values, setValues] = useState(() => receipt || { ...emptyReceipt, date: getLocalReceiptDate() })
  const [errors, setErrors] = useState({})

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
    setErrors((previous) => ({ ...previous, [name]: '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const validation = validateReceipt(values)
    setErrors(validation)
    if (Object.keys(validation).length) { event.currentTarget.elements.namedItem(Object.keys(validation)[0]).focus(); return }
    onSave({ ...values, payer: values.payer.trim(), purpose: values.purpose.trim(), amount: String(Number(values.amount)) })
  }

  function handleKeyDown(event) {
    if (event.key !== 'Tab') return
    const controls = [...dialogRef.current.querySelectorAll('button, input, select')]
    const boundary = event.shiftKey ? controls[0] : controls.at(-1)
    if (document.activeElement === boundary) {
      event.preventDefault()
      ;(event.shiftKey ? controls.at(-1) : controls[0]).focus()
    }
  }

  function field(name, label, placeholder, maxLength, inputMode) {
    return <div className="admin-receipt-field"><label htmlFor={`admin-receipt-${name}`}>{label}<span aria-hidden="true">*</span></label><input id={`admin-receipt-${name}`} name={name} required maxLength={maxLength} inputMode={inputMode} autoComplete="off" placeholder={placeholder} value={values[name]} onChange={handleChange} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `admin-receipt-${name}-error` : undefined} />{errors[name] && <p id={`admin-receipt-${name}-error`} className="admin-receipt-error" role="alert">{errors[name]}</p>}</div>
  }

  return <dialog ref={dialogRef} className="admin-receipt-dialog" aria-labelledby="admin-receipt-form-title" aria-describedby="admin-receipt-form-note" onKeyDown={handleKeyDown} onCancel={(event) => { event.preventDefault(); onClose() }}>
    <header><h2 id="admin-receipt-form-title">Buat Kwitansi</h2><button type="button" aria-label="Tutup buat kwitansi" onClick={onClose}><X size={20} aria-hidden="true" /></button></header>
    <form noValidate onSubmit={handleSubmit}>
      {field('payer', 'Telah terima dari', 'Nama pemberi pembayaran', 100)}
      <div className="admin-receipt-field"><label htmlFor="admin-receipt-amount">Nominal<span aria-hidden="true">*</span></label><AdminRupiahInput id="admin-receipt-amount" name="amount" required value={values.amount} onChange={handleChange} aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'admin-receipt-amount-error' : undefined} />{errors.amount && <p id="admin-receipt-amount-error" className="admin-receipt-error" role="alert">{errors.amount}</p>}</div>
      {field('purpose', 'Untuk Pembayaran', 'Keterangan pembayaran', 500)}
      <div className="admin-receipt-field"><label htmlFor="admin-receipt-method">Metode Pembayaran<span aria-hidden="true">*</span></label><select id="admin-receipt-method" name="method" required value={values.method} onChange={handleChange} aria-invalid={Boolean(errors.method)} aria-describedby={errors.method ? 'admin-receipt-method-error' : undefined}><option value="">Pilih Metode Pembayaran</option>{receiptMethods.map((method) => <option key={method}>{method}</option>)}</select>{errors.method && <p id="admin-receipt-method-error" className="admin-receipt-error" role="alert">{errors.method}</p>}</div>
      <div className="admin-receipt-field"><label htmlFor="admin-receipt-date">Tanggal<span aria-hidden="true">*</span></label><input id="admin-receipt-date" name="date" type="date" required value={receiptDateToIso(values.date)} onChange={handleChange} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? 'admin-receipt-date-error' : undefined} />{errors.date && <p id="admin-receipt-date-error" className="admin-receipt-error" role="alert">{errors.date}</p>}</div>
      <p id="admin-receipt-form-note" className="admin-receipt-note">Simpan hanya memperbarui pratinjau lokal. Draft belum tersimpan ke server dan akan hilang saat halaman dimuat ulang atau ditinggalkan.</p>
      <footer><button type="button" onClick={onClose}>Batal</button><button type="submit" className="admin-receipt-confirm">Simpan Kwitansi</button></footer>
    </form>
  </dialog>
}
