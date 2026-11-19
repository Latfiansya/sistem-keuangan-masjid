import { useCallback, useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, Clock, Pencil, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import { createAdminAgenda, deleteAdminAgenda, getAdminAgenda, updateAdminAgenda, validateAdminAgenda } from '../services/agendaService.js'
import { dataSource } from '../utils/env.js'
import '../components/AdminModalDialog.css'
import './AdminAgendaPage.css'

function AgendaDialog({ mode, item, onSaved, onDeleted, onClose, returnFocusRef, fallbackFocusRef }) {
  const dialogRef = useRef(null)
  const deleting = mode === 'delete'
  const [values, setValues] = useState(() => ({
    name: item?.name || '',
    frequency: item?.frequency || 'weekly',
    schedule: item?.schedule || '',
    description: item?.description || '',
    order: item?.order ?? 1,
    active: item?.active !== false,
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = returnFocusRef.current
    const fallback = fallbackFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector(deleting ? '.admin-crud-cancel' : 'input[name="name"]')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      const target = trigger?.isConnected ? trigger : fallback
      if (target?.isConnected) target.focus({ preventScroll: true })
    }
  }, [deleting, returnFocusRef, fallbackFocusRef])

  function change(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '', form: '' }))
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    if (!deleting) {
      const validation = validateAdminAgenda(values)
      setErrors(validation)
      if (Object.keys(validation).length) {
        dialogRef.current.elements.namedItem(Object.keys(validation)[0])?.focus()
        return
      }
    }
    setSubmitting(true)
    try {
      if (deleting) {
        await deleteAdminAgenda(item.id)
        await onDeleted(item)
      } else if (mode === 'edit') {
        const updated = await updateAdminAgenda(item.id, values)
        await onSaved(updated, 'edit')
      } else {
        const created = await createAdminAgenda(values)
        await onSaved(created, 'add')
      }
    } catch (cause) {
      setErrors({ form: cause.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className={`admin-crud-dialog${deleting ? ' admin-crud-dialog--delete' : ''}`} aria-labelledby="admin-agenda-dialog-title" onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
      <header>
        <h2 id="admin-agenda-dialog-title">{deleting ? 'Hapus Agenda?' : mode === 'edit' ? 'Edit Agenda' : 'Tambah Agenda'}</h2>
        <button type="button" disabled={submitting} aria-label="Tutup dialog agenda" onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </header>
      <form noValidate onSubmit={submit} aria-busy={submitting}>
        {deleting ? (
          <div className="admin-crud-warning">
            <TriangleAlert size={22} aria-hidden="true" />
            <p>Hapus kegiatan <strong>{item.name}</strong> ({item.schedule}) dari daftar agenda?</p>
          </div>
        ) : (
          <>
            <div className="admin-crud-field">
              <label htmlFor="admin-agenda-name">Nama Kegiatan *</label>
              <input id="admin-agenda-name" name="name" maxLength={150} disabled={submitting} value={values.name} onChange={(event) => change('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
              {errors.name && <p className="admin-crud-error" role="alert">{errors.name}</p>}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-agenda-frequency">Frekuensi *</label>
              <select id="admin-agenda-frequency" name="frequency" disabled={submitting} value={values.frequency} onChange={(event) => change('frequency', event.target.value)} aria-invalid={Boolean(errors.frequency)}>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan / PHBI</option>
              </select>
              {errors.frequency && <p className="admin-crud-error" role="alert">{errors.frequency}</p>}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-agenda-schedule">Jadwal / Waktu Pelaksanaan *</label>
              <input id="admin-agenda-schedule" name="schedule" maxLength={150} placeholder="Contoh: Rabu Malam atau Bulan Ramadhan" disabled={submitting} value={values.schedule} onChange={(event) => change('schedule', event.target.value)} aria-invalid={Boolean(errors.schedule)} />
              {errors.schedule && <p className="admin-crud-error" role="alert">{errors.schedule}</p>}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-agenda-description">Keterangan (Opsional)</label>
              <textarea id="admin-agenda-description" name="description" rows={2} maxLength={1000} disabled={submitting} value={values.description} onChange={(event) => change('description', event.target.value)} aria-invalid={Boolean(errors.description)} />
              {errors.description && <p className="admin-crud-error" role="alert">{errors.description}</p>}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-agenda-order">Urutan Tampil</label>
              <input id="admin-agenda-order" name="order" type="number" min={0} max={32767} disabled={submitting} value={values.order} onChange={(event) => change('order', Number(event.target.value))} aria-invalid={Boolean(errors.order)} />
              {errors.order && <p className="admin-crud-error" role="alert">{errors.order}</p>}
            </div>
            <label className="admin-crud-checkbox" htmlFor="admin-agenda-active">
              <input id="admin-agenda-active" name="active" type="checkbox" disabled={submitting} checked={values.active} onChange={(event) => change('active', event.target.checked)} />
              Tampilkan agenda di website publik
            </label>
          </>
        )}
        {errors.form && <p className="admin-crud-error" role="alert">{errors.form}</p>}
        <footer>
          <button type="button" className="admin-crud-cancel" disabled={submitting} onClick={onClose}>Batal</button>
          <button type="submit" className={deleting ? 'admin-crud-delete-confirm' : 'admin-crud-save'} disabled={submitting}>
            {deleting ? <Trash2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            {submitting ? 'Memproses…' : deleting ? 'Ya, Hapus Agenda' : 'Simpan Agenda'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

export default function AdminAgendaPage() {
  const apiEnabled = dataSource !== 'mock'
  const [agenda, setAgenda] = useState(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [dialog, setDialog] = useState(null)
  const returnFocusRef = useRef(null)
  const addButtonRef = useRef(null)

  const reloadAgenda = useCallback(async ({ signal } = {}) => {
    const data = await getAdminAgenda({ signal })
    setAgenda(data)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getAdminAgenda({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setAgenda(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  function openDialog(mode, item, groupId, event) {
    if (!apiEnabled) return
    returnFocusRef.current = event.currentTarget
    setFeedback('')
    setDialog({ mode, item: item ? { ...item, frequency: item.frequency || groupId } : null })
  }

  async function handleSaved(savedItem, mode) {
    await reloadAgenda()
    setDialog(null)
    setFeedback(`Agenda "${savedItem.name}" berhasil ${mode === 'edit' ? 'diperbarui' : 'ditambahkan'} di database.`)
  }

  async function handleDeleted(removedItem) {
    await reloadAgenda()
    setDialog(null)
    setFeedback(`Agenda "${removedItem.name}" berhasil dihapus dari database.`)
  }

  return (
    <div className="admin-agenda">
      <header className="admin-agenda-heading">
        <div><h2>Agenda</h2><p>Kelola jadwal dan agenda masjid</p></div>
        <button ref={addButtonRef} className="admin-agenda-add" type="button" disabled={!apiEnabled || Boolean(error)} title={apiEnabled ? 'Tambah agenda masjid' : 'Fitur tambah agenda belum tersedia'} onClick={(event) => openDialog('add', null, 'weekly', event)}><Plus size={16} aria-hidden="true" />Tambah Agenda</button>
      </header>
      {feedback && <p className="admin-crud-feedback" role="status">{feedback}</p>}
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !agenda ? <p className="admin-dashboard-state" role="status">Memuat agenda masjid…</p> : agenda.groups.some((group) => group.items.length) ? (
        <div className="admin-agenda-list" aria-describedby="admin-agenda-note">
          {agenda.groups.map((group) => (
            <section key={group.id} className="admin-agenda-group" aria-labelledby={`admin-agenda-${group.id}`}>
              <h3 className="sr-only" id={`admin-agenda-${group.id}`}>{group.title}</h3>
              {group.items.length ? <ul>{group.items.map((item) => (
                <li key={item.id || item.name} className="admin-panel admin-agenda-card">
                  <span className="admin-agenda-icon"><CalendarDays size={20} aria-hidden="true" /></span>
                  <div className="admin-agenda-copy">
                    <h4>{item.name}</h4>
                    <div className="admin-agenda-details"><span><CalendarDays size={14} aria-hidden="true" /><span className="sr-only">Frekuensi: </span>{group.title}</span><span><Clock size={14} aria-hidden="true" /><span className="sr-only">Jadwal: </span>{item.schedule}</span></div>
                  </div>
                  <div className="admin-agenda-actions">
                    <button type="button" disabled={!apiEnabled} aria-label={apiEnabled ? `Edit agenda ${item.name}` : `Edit agenda ${item.name} (belum tersedia)`} title={apiEnabled ? `Edit agenda ${item.name}` : 'Fitur edit agenda belum tersedia'} onClick={(event) => openDialog('edit', item, group.id, event)}><Pencil size={16} aria-hidden="true" /></button>
                    <button type="button" disabled={!apiEnabled} aria-label={apiEnabled ? `Hapus agenda ${item.name}` : `Hapus agenda ${item.name} (belum tersedia)`} title={apiEnabled ? `Hapus agenda ${item.name}` : 'Fitur hapus agenda belum tersedia'} onClick={(event) => openDialog('delete', item, group.id, event)}><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                </li>
              ))}</ul> : <p className="admin-dashboard-state">Belum ada agenda pada kelompok ini.</p>}
            </section>
          ))}
          <p id="admin-agenda-note" className="admin-agenda-note">{apiEnabled ? 'Terhubung ke database · Perubahan agenda tersimpan langsung ke PostgreSQL.' : 'Data contoh. Fitur tambah, edit dan hapus agenda belum tersedia.'}</p>
        </div>
      ) : <p className="admin-dashboard-state" role="status">Belum ada agenda kegiatan.</p>}
      {apiEnabled && dialog && (
        <AgendaDialog
          {...dialog}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => setDialog(null)}
          returnFocusRef={returnFocusRef}
          fallbackFocusRef={addButtonRef}
        />
      )}
    </div>
  )
}
