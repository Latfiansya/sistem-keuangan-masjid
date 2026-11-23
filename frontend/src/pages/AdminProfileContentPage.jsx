import { useEffect, useRef, useState } from 'react'
import { BookOpen, Check, History, ListChecks, Pencil, Plus, Trash2, TriangleAlert, Users, X } from 'lucide-react'
import {
  createAdminProfileContent,
  deleteAdminProfileContent,
  emptyProfileContentValues,
  getAdminProfileContent,
  profileContentSections,
  updateAdminProfileContent,
  validateProfileContent,
} from '../services/adminProfileContentService.js'
import { dataSource } from '../utils/env.js'
import '../components/AdminModalDialog.css'
import './AdminProfileContentPage.css'

const sectionIcons = { missions: ListChecks, programs: BookOpen, history: History, officers: Users }

// Judul dan keterangan singkat tiap kartu sesuai jenis konten.
function describeItem(sectionId, item) {
  if (sectionId === 'missions') return { title: item.text, details: [`Urutan ${item.order}`] }
  if (sectionId === 'programs') return { title: item.title, details: [item.description, `Urutan ${item.order}`] }
  if (sectionId === 'history') return { title: `${item.year} · ${item.title}`, details: [item.era, item.placeName, `Urutan ${item.order}`].filter(Boolean) }
  return { title: item.name, details: [item.role, item.note, `Urutan ${item.order}`].filter(Boolean) }
}

function ProfileContentDialog({ mode, section, item, onDone, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const deleting = mode === 'delete'
  const [values, setValues] = useState(() => (item ? { ...item } : emptyProfileContentValues(section.id)))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const label = section.singular.toLowerCase()

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = returnFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector(deleting ? '.admin-crud-cancel' : 'input, textarea')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [deleting, returnFocusRef])

  function change(key, value) {
    setValues((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: '', form: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    if (!deleting) {
      const validation = validateProfileContent(section.id, values)
      setErrors(validation)
      const firstInvalid = Object.keys(validation)[0]
      if (firstInvalid) {
        dialogRef.current.querySelector(`[name="${firstInvalid}"]`)?.focus()
        return
      }
    }
    setSubmitting(true)
    try {
      if (deleting) await deleteAdminProfileContent(section.id, item.id)
      else if (mode === 'edit') await updateAdminProfileContent(section.id, item.id, values)
      else await createAdminProfileContent(section.id, values)
      await onDone(mode)
    } catch (cause) {
      setErrors({ form: cause.message })
    } finally {
      setSubmitting(false)
    }
  }

  const titleId = 'admin-content-dialog-title'
  const heading = deleting ? `Hapus ${section.singular}?` : `${mode === 'edit' ? 'Edit' : 'Tambah'} ${section.singular}`
  return (
    <dialog ref={dialogRef} className={`admin-crud-dialog${deleting ? ' admin-crud-dialog--delete' : ''}`} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
      <header>
        <h2 id={titleId}>{heading}</h2>
        <button type="button" disabled={submitting} aria-label={`Tutup dialog ${label}`} onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </header>
      <form noValidate onSubmit={submit} aria-busy={submitting}>
        {deleting ? (
          <div className="admin-crud-warning">
            <TriangleAlert size={22} aria-hidden="true" />
            <p>Hapus {label} <strong>{describeItem(section.id, item).title}</strong>? Data akan hilang dari halaman publik.</p>
          </div>
        ) : section.fields.map((field) => {
          const id = `admin-content-${field.key}`
          if (field.type === 'boolean') {
            return (
              <label key={field.key} className="admin-crud-checkbox" htmlFor={id}>
                <input id={id} name={field.key} type="checkbox" disabled={submitting} checked={values[field.key] !== false} onChange={(event) => change(field.key, event.target.checked)} />
                {field.label}
              </label>
            )
          }
          const common = {
            id,
            name: field.key,
            disabled: submitting,
            value: values[field.key] ?? '',
            placeholder: field.placeholder,
            'aria-invalid': Boolean(errors[field.key]),
            'aria-describedby': errors[field.key] ? `${id}-error` : undefined,
            onChange: (event) => change(field.key, event.target.value),
          }
          return (
            <div key={field.key} className="admin-crud-field">
              <label htmlFor={id}>{field.label}{field.required ? ' *' : field.type === 'integer' ? '' : ' (Opsional)'}</label>
              {field.type === 'textarea'
                ? <textarea {...common} rows={3} maxLength={field.max} />
                : field.type === 'integer'
                  ? <input {...common} type="number" inputMode="numeric" min={field.min} max={field.max} step={1} />
                  : <input {...common} maxLength={field.max} />}
              {errors[field.key] && <p id={`${id}-error`} className="admin-crud-error" role="alert">{errors[field.key]}</p>}
            </div>
          )
        })}
        {errors.form && <p className="admin-crud-error" role="alert">{errors.form}</p>}
        <footer>
          <button type="button" className="admin-crud-cancel" disabled={submitting} onClick={onClose}>Batal</button>
          <button type="submit" className={deleting ? 'admin-crud-delete-confirm' : 'admin-crud-save'} disabled={submitting}>
            {deleting ? <Trash2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            {submitting ? 'Memproses…' : deleting ? `Ya, Hapus ${section.singular}` : `Simpan ${section.singular}`}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

export default function AdminProfileContentPage() {
  const mock = dataSource === 'mock'
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [dialog, setDialog] = useState(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    getAdminProfileContent({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setContent(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  function openDialog(mode, section, item, event) {
    returnFocusRef.current = event.currentTarget
    setFeedback('')
    setDialog({ mode, section, item })
  }

  async function handleDone(mode) {
    const { section } = dialog
    setContent(await getAdminProfileContent())
    setDialog(null)
    const action = mode === 'delete' ? 'dihapus' : mode === 'edit' ? 'diperbarui' : 'ditambahkan'
    setFeedback(`${section.singular} berhasil ${action}${mock ? ' (simulasi, belum tersimpan ke server).' : ' di database.'}`)
  }

  return (
    <div className="admin-content">
      <header className="admin-content-heading">
        <div><h2>Konten Profil</h2><p>Kelola misi, program, sejarah, dan pengurus yang tampil di website</p></div>
      </header>
      {feedback && <p className="admin-crud-feedback" role="status">{feedback}</p>}
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !content ? <p className="admin-dashboard-state" role="status">Memuat konten profil…</p> : (
        <>
          {profileContentSections.map((section) => {
            const Icon = sectionIcons[section.id]
            const items = content[section.id]
            return (
              <section key={section.id} className="admin-panel admin-content-section" aria-labelledby={`admin-content-${section.id}`}>
                <header className="admin-content-section-heading">
                  <span className="admin-content-icon"><Icon size={20} aria-hidden="true" /></span>
                  <div>
                    <h3 id={`admin-content-${section.id}`}>{section.title} <span className="admin-content-count">{items.length}</span></h3>
                    <p>{section.description}</p>
                  </div>
                  <button className="admin-content-add" type="button" disabled={Boolean(dialog)} onClick={(event) => openDialog('add', section, null, event)}><Plus size={16} aria-hidden="true" />Tambah {section.singular}</button>
                </header>
                {items.length ? (
                  <ul className="admin-content-list">
                    {items.map((item) => {
                      const { title, details } = describeItem(section.id, item)
                      return (
                        <li key={item.id} className="admin-content-item">
                          <div className="admin-content-copy">
                            <h4>{title}{item.active === false && <span className="admin-content-hidden">Disembunyikan</span>}</h4>
                            {details.length > 0 && <p>{details.join(' · ')}</p>}
                          </div>
                          <div className="admin-content-actions">
                            <button type="button" aria-label={`Edit ${section.singular.toLowerCase()} ${title}`} title={`Edit ${section.singular.toLowerCase()}`} onClick={(event) => openDialog('edit', section, item, event)}><Pencil size={16} aria-hidden="true" /></button>
                            <button type="button" aria-label={`Hapus ${section.singular.toLowerCase()} ${title}`} title={`Hapus ${section.singular.toLowerCase()}`} onClick={(event) => openDialog('delete', section, item, event)}><Trash2 size={16} aria-hidden="true" /></button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : <p className="admin-content-empty">Belum ada data {section.singular.toLowerCase()}.</p>}
              </section>
            )
          })}
          <p className="admin-content-note">{mock ? 'Mode simulasi: perubahan hanya berlaku selama halaman admin terbuka dan hilang saat dimuat ulang. Halaman publik tidak berubah.' : 'Terhubung ke database · Perubahan langsung tersimpan ke PostgreSQL dan tercatat di Activity Log. Visi diatur pada menu Profil Masjid.'}</p>
        </>
      )}
      {dialog && <ProfileContentDialog {...dialog} onDone={handleDone} onClose={() => setDialog(null)} returnFocusRef={returnFocusRef} />}
    </div>
  )
}
