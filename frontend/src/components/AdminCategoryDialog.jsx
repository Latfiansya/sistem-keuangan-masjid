import { useEffect, useRef, useState } from 'react'
import { Check, TriangleAlert, Trash2, X } from 'lucide-react'
import { adminCategoryColors } from '../utils/adminCategoryColors.js'
import { isAdminCategoryUsed, validateAdminCategory } from '../services/adminCategoryService.js'
import { dataSource } from '../utils/env.js'

export default function AdminCategoryDialog({ mode, category, dashboard, onSave, onDelete, onClose, returnFocusRef, fallbackFocusRef }) {
  const dialogRef = useRef(null)
  const [values, setValues] = useState({ name: category?.label || '', color: category?.color || '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const deleting = mode === 'delete'
  const blocked = deleting && isAdminCategoryUsed(dashboard, category.id)
  const title = deleting ? 'Hapus Kategori?' : mode === 'edit' ? 'Edit Kategori' : 'Tambah Kategori'

  useEffect(() => {
    const dialog = dialogRef.current
    const returnFocusTo = returnFocusRef.current
    const fallbackFocusTo = fallbackFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector(deleting ? '.admin-category-cancel' : 'input[name="name"]')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      const target = returnFocusTo?.isConnected ? returnFocusTo : fallbackFocusTo
      if (target?.isConnected) target.focus({ preventScroll: true })
    }
  }, [deleting, returnFocusRef, fallbackFocusRef])

  function change(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '', form: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (blocked || submitting) return
    if (!deleting) {
      const validation = validateAdminCategory(values, dashboard.categories, category?.id)
      setErrors(validation)
      if (Object.keys(validation).length) {
        dialogRef.current.querySelector(validation.name ? 'input[name="name"]' : 'input[name="color"]')?.focus()
        return
      }
    }
    setSubmitting(true)
    try {
      if (deleting) await onDelete(category.id)
      else await onSave(values, category?.id)
    } catch (cause) {
      setErrors({ form: cause.message })
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

  return <dialog ref={dialogRef} className={`admin-category-dialog${deleting ? ' admin-category-dialog--delete' : ''}`} aria-labelledby="admin-category-dialog-title" aria-describedby="admin-category-dialog-note" onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }} onKeyDown={trapFocus}>
    <header><h2 id="admin-category-dialog-title">{title}</h2><button type="button" disabled={submitting} aria-label={`Tutup ${deleting ? 'konfirmasi hapus' : 'form kategori'}`} onClick={onClose}><X size={24} aria-hidden="true" /></button></header>
    <form noValidate onSubmit={submit} aria-busy={submitting}>
      {deleting ? <div className="admin-category-warning"><TriangleAlert size={22} aria-hidden="true" /><p id="admin-category-dialog-note"><strong>{category.label}</strong><br />{blocked ? 'Kategori ini digunakan transaksi atau memiliki saldo sehingga tidak dapat dihapus. Riwayat keuangan tetap dipertahankan.' : dataSource === 'mock' ? 'Kategori ini hanya akan dihapus dari state mock pada sesi ini. Belum ada penyimpanan ke server.' : 'Kategori ini akan dihapus secara permanen dari database.'}</p></div> : <>
        <div className="admin-category-field"><label htmlFor="admin-category-name">Nama Kategori</label><input id="admin-category-name" name="name" required autoComplete="off" maxLength={100} value={values.name} disabled={submitting} placeholder="Contoh: Dana Sosial" onChange={(event) => change('name', event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'admin-category-name-error' : undefined} />{errors.name && <p id="admin-category-name-error" className="admin-category-error" role="alert">{errors.name}</p>}</div>
        <fieldset aria-describedby={errors.color ? 'admin-category-color-error' : undefined} aria-invalid={Boolean(errors.color)}><legend>Warna</legend><div className="admin-category-swatches">{adminCategoryColors.map((color) => <label key={color.id} title={color.label}><input type="radio" name="color" required value={color.id} checked={values.color === color.id} disabled={submitting} onChange={() => change('color', color.id)} aria-label={color.label} /><span style={{ background: color.swatch }}>{values.color === color.id && <Check size={24} aria-hidden="true" />}</span></label>)}</div>{errors.color && <p id="admin-category-color-error" className="admin-category-error" role="alert">{errors.color}</p>}</fieldset>
        <p id="admin-category-dialog-note" className="admin-category-note">{dataSource === 'mock' ? 'Simulasi sesi admin · Perubahan belum tersimpan ke server.' : 'Perubahan kategori akan langsung disimpan ke database (catatan: warna kategori dipetakan otomatis oleh backend karena kolom warna belum tersedia di DB).'}</p>
      </>}
      {errors.form && <p className="admin-category-error" role="alert">{errors.form}</p>}
      <footer><button type="button" className="admin-category-cancel" disabled={submitting} onClick={onClose}>{deleting ? 'Batalkan' : 'Batal'}</button><button type="submit" className={deleting ? 'admin-category-delete-confirm' : 'admin-category-save'} disabled={blocked || submitting}>{deleting ? <Trash2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{submitting ? 'Menyimpan…' : deleting ? 'Ya, Hapus Kategori' : 'Simpan Kategori'}</button></footer>
    </form>
  </dialog>
}
