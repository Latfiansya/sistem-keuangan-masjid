import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import AdminTransactionFields from './AdminTransactionFields.jsx'
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

  return <dialog ref={dialogRef} className={`admin-transaction-dialog admin-transaction-dialog--${type}`} aria-labelledby="admin-transaction-title" aria-describedby="admin-transaction-note" onCancel={(event) => { event.preventDefault(); onClose() }} onKeyDown={trapFocus}>
    <header><button type="button" onClick={onClose} aria-label={`Tutup tambah ${label.toLowerCase()}`}><ChevronLeft size={22} aria-hidden="true" /></button><div><h2 id="admin-transaction-title">Tambah {label}</h2><p>Catat {label.toLowerCase()} dana masjid</p></div></header>
    <form noValidate onSubmit={submit}>
      <AdminTransactionFields values={values} errors={errors} categories={categories} type={type} change={change} />
      <p id="admin-transaction-note" className="admin-transaction-note">{income ? 'Transaksi dan pilihan nama publik hanya simulasi sesi admin, belum tersimpan ke server.' : 'Transaksi hanya simulasi sesi admin, belum tersimpan ke server.'} Daftar, laporan dan ekspor simulasi memakai data aktif; snapshot saldo Dashboard tetap.</p>
      {errors.form && <p className="admin-transaction-error" role="alert">{errors.form}</p>}
      <footer><button type="button" onClick={onClose}>Batal</button><button type="submit" className="admin-transaction-save"><Check size={16} aria-hidden="true" />Simpan {label}</button></footer>
    </form>
  </dialog>
}
