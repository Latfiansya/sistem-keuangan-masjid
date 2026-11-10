import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { getLocalTransactionDate, validateAdminTransaction } from '../services/adminTransactionService.js'

export default function AdminTransactionForm({ type, categories, onSave, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const [values, setValues] = useState(() => ({ date: getLocalTransactionDate(), categoryId: '', description: '', amount: '', personName: '', showDonorNamePublic: false, notes: '' }))
  const [errors, setErrors] = useState({})
  const income = type === 'income'
  const label = income ? 'Pemasukan' : 'Pengeluaran'

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = returnFocusRef.current
    const overflow = document.body.style.overflow
    const viewport = window.visualViewport
    function updateViewport() {
      dialog.style.setProperty('--transaction-viewport-height', `${viewport?.height ?? window.innerHeight}px`)
      dialog.style.setProperty('--transaction-viewport-top', `${viewport?.offsetTop ?? 0}px`)
    }
    updateViewport()
    viewport?.addEventListener('resize', updateViewport)
    viewport?.addEventListener('scroll', updateViewport)
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector('input')?.focus()
    return () => {
      viewport?.removeEventListener('resize', updateViewport)
      viewport?.removeEventListener('scroll', updateViewport)
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [returnFocusRef])

  function change(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '', form: '' }))
  }

  function submit(event) {
    event.preventDefault()
    const validation = validateAdminTransaction(values, categories, type)
    setErrors(validation)
    if (Object.keys(validation).length) {
      event.currentTarget.elements.namedItem(Object.keys(validation)[0])?.focus()
      return
    }
    try { onSave(values, type) }
    catch (cause) { setErrors({ form: cause.message }) }
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return
    const controls = [...dialogRef.current.querySelectorAll('button, input, select, textarea')]
    if (document.activeElement === (event.shiftKey ? controls[0] : controls.at(-1))) {
      event.preventDefault()
      ;(event.shiftKey ? controls.at(-1) : controls[0]).focus()
    }
  }

  const error = (name) => errors[name] && <p id={`admin-transaction-${name}-error`} className="admin-transaction-error" role="alert">{errors[name]}</p>
  const attributes = (name) => ({ id: `admin-transaction-${name}`, name, value: values[name], onChange: (event) => change(name, event.target.value), 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `admin-transaction-${name}-error` : undefined })
  const fieldLabel = (name, text, required = false) => <label htmlFor={`admin-transaction-${name}`}>{text}{required && <span aria-hidden="true">*</span>}</label>

  return <dialog ref={dialogRef} className={`admin-transaction-dialog admin-transaction-dialog--${type}`} aria-labelledby="admin-transaction-title" aria-describedby="admin-transaction-note" onCancel={(event) => { event.preventDefault(); onClose() }} onKeyDown={trapFocus}>
    <header><button type="button" onClick={onClose} aria-label={`Tutup tambah ${label.toLowerCase()}`}><ChevronLeft size={22} aria-hidden="true" /></button><div><h2 id="admin-transaction-title">Tambah {label}</h2><p>Catat {label.toLowerCase()} dana masjid</p></div></header>
    <form noValidate onSubmit={submit}>
      <div className="admin-transaction-field">{fieldLabel('date', 'Tanggal Transaksi', true)}<input {...attributes('date')} type="date" required />{error('date')}</div>
      <div className="admin-transaction-field">{fieldLabel('categoryId', 'Kategori Dana', true)}<select {...attributes('categoryId')} required><option value="">Pilih Kategori Dana</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>{error('categoryId')}</div>
      <div className="admin-transaction-field">{fieldLabel('description', `Uraian ${label}`, true)}<input {...attributes('description')} required autoComplete="off" maxLength={500} placeholder={income ? 'Contoh: Infaq Jumat' : 'Contoh: Pembelian perlengkapan masjid'} />{error('description')}</div>
      <div className="admin-transaction-field">{fieldLabel('amount', 'Nominal', true)}<input {...attributes('amount')} required inputMode="numeric" autoComplete="off" maxLength={20} placeholder="Rp0" />{error('amount')}</div>
      <div className="admin-transaction-field">{fieldLabel('personName', income ? 'Nama Donatur' : 'Nama Penerima')}<input {...attributes('personName')} autoComplete="off" maxLength={100} placeholder={income ? 'Kosongkan untuk Hamba Allah' : 'Nama penerima (opsional)'} />{error('personName')}</div>
      {income && <label className="admin-transaction-privacy"><input name="showDonorNamePublic" type="checkbox" checked={values.showDonorNamePublic} onChange={(event) => change('showDonorNamePublic', event.target.checked)} />Tampilkan nama donatur di laporan publik</label>}
      <div className="admin-transaction-field">{fieldLabel('notes', 'Keterangan')}<textarea {...attributes('notes')} rows={3} maxLength={500} placeholder="Keterangan tambahan (opsional)" />{error('notes')}</div>
      <p id="admin-transaction-note" className="admin-transaction-note">{income ? 'Transaksi dan pilihan nama publik hanya simulasi sesi admin, belum tersimpan ke server.' : 'Transaksi hanya simulasi sesi admin, belum tersimpan ke server.'} Saldo dan laporan historis tetap memakai snapshot.</p>
      {errors.form && <p className="admin-transaction-error" role="alert">{errors.form}</p>}
      <footer><button type="button" onClick={onClose}>Batal</button><button type="submit" className="admin-transaction-save"><Check size={16} aria-hidden="true" />Simpan {label}</button></footer>
    </form>
  </dialog>
}
