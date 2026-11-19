import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, CircleX, Eye, EyeOff, Pencil, Plus, RotateCcw, Search, Shield, Trash2, TriangleAlert, X } from 'lucide-react'
import { createAdminAccount, deleteAdminAccount, filterAdminAccounts, getAdminAccounts, setAdminAccountStatus, updateAdminAccount, validateAdminAccountForm } from '../services/adminAccountsService.js'
import { dataSource } from '../utils/env.js'
import { formatReportDate } from '../utils/reportFormatters.js'
import '../components/AdminModalDialog.css'
import './AdminAccountsPage.css'

function AccountDialog({ mode, account, onDone, onClose, returnFocusRef, fallbackFocusRef }) {
  const dialogRef = useRef(null)
  const deleting = mode === 'delete'
  const isEdit = mode === 'edit'
  const [values, setValues] = useState(() => ({
    name: account?.name || '',
    email: account?.email || '',
    password: '',
    role: account?.role || 'Admin',
    active: account ? account.active === true : true,
  }))
  const [showPassword, setShowPassword] = useState(false)
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
      const validation = validateAdminAccountForm(values, { isEdit })
      setErrors(validation)
      if (Object.keys(validation).length) {
        dialogRef.current.elements.namedItem(Object.keys(validation)[0])?.focus()
        return
      }
    }
    setSubmitting(true)
    try {
      if (deleting) {
        await deleteAdminAccount(account.id)
        await onDone(`Akun "${account.name}" berhasil dihapus dari database.`)
      } else if (isEdit) {
        const updated = await updateAdminAccount(account.id, values)
        await onDone(`Akun "${updated.name}" berhasil diperbarui di database.`)
      } else {
        const created = await createAdminAccount(values)
        await onDone(`Akun baru "${created.name}" berhasil ditambahkan ke database.`)
      }
    } catch (cause) {
      setErrors({ form: cause.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className={`admin-crud-dialog${deleting ? ' admin-crud-dialog--delete' : ''}`} aria-labelledby="admin-account-dialog-title" onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
      <header>
        <h2 id="admin-account-dialog-title">{deleting ? 'Hapus Akun Pengurus?' : isEdit ? 'Edit Akun Pengurus' : 'Tambah Akun Admin'}</h2>
        <button type="button" disabled={submitting} aria-label="Tutup dialog akun" onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </header>
      <form noValidate onSubmit={submit} aria-busy={submitting}>
        {deleting ? (
          <div className="admin-crud-warning">
            <TriangleAlert size={22} aria-hidden="true" />
            <p>Hapus akun <strong>{account.name}</strong> ({account.email})? Jika akun sudah pernah mencatat transaksi/aktivitas, sistem akan menolak penghapusan dan menyarankan nonaktifkan akun.</p>
          </div>
        ) : (
          <>
            <div className="admin-crud-field">
              <label htmlFor="admin-account-name">Nama Pengurus *</label>
              <input id="admin-account-name" name="name" maxLength={100} disabled={submitting} value={values.name} onChange={(event) => change('name', event.target.value)} aria-invalid={Boolean(errors.name)} />
              {errors.name && <p className="admin-crud-error" role="alert">{errors.name}</p>}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-account-email">Email *</label>
              <input id="admin-account-email" name="email" type="email" maxLength={150} disabled={submitting} value={values.email} onChange={(event) => change('email', event.target.value)} aria-invalid={Boolean(errors.email)} />
              {errors.email && <p className="admin-crud-error" role="alert">{errors.email}</p>}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-account-password">{isEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password *'}</label>
              <div className="admin-crud-password-wrap">
                <input id="admin-account-password" name="password" type={showPassword ? 'text' : 'password'} maxLength={128} disabled={submitting} value={values.password} onChange={(event) => change('password', event.target.value)} aria-invalid={Boolean(errors.password)} />
                <button type="button" className="admin-crud-password-toggle" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPassword((previous) => !previous)}>
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p className="admin-crud-error" role="alert">{errors.password}</p>}
            </div>
            <div className="admin-crud-field">
              <label htmlFor="admin-account-role">Role *</label>
              <select id="admin-account-role" name="role" disabled={submitting} value={values.role} onChange={(event) => change('role', event.target.value)} aria-invalid={Boolean(errors.role)}>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
              </select>
              {errors.role && <p className="admin-crud-error" role="alert">{errors.role}</p>}
            </div>
            <label className="admin-crud-checkbox" htmlFor="admin-account-active">
              <input id="admin-account-active" name="active" type="checkbox" disabled={submitting} checked={values.active} onChange={(event) => change('active', event.target.checked)} />
              Akun aktif (dapat login ke dashboard)
            </label>
          </>
        )}
        {errors.form && <p className="admin-crud-error" role="alert">{errors.form}</p>}
        <footer>
          <button type="button" className="admin-crud-cancel" disabled={submitting} onClick={onClose}>Batal</button>
          <button type="submit" className={deleting ? 'admin-crud-delete-confirm' : 'admin-crud-save'} disabled={submitting}>
            {deleting ? <Trash2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            {submitting ? 'Memproses…' : deleting ? 'Ya, Hapus Akun' : 'Simpan Akun'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

export default function AdminAccountsPage() {
  const apiEnabled = dataSource !== 'mock'
  const [accounts, setAccounts] = useState(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dialog, setDialog] = useState(null)
  const [busyId, setBusyId] = useState('')
  const returnFocusRef = useRef(null)
  const addButtonRef = useRef(null)

  const reloadAccounts = useCallback(async ({ signal } = {}) => {
    const list = await getAdminAccounts({ signal })
    setAccounts(list)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getAdminAccounts({ signal: controller.signal })
      .then((list) => { if (!controller.signal.aborted) setAccounts(list) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  function openDialog(mode, account, event) {
    if (!apiEnabled) return
    returnFocusRef.current = event.currentTarget
    setFeedback(null)
    setDialog({ mode, account })
  }

  async function handleDialogDone(message) {
    await reloadAccounts()
    setDialog(null)
    setFeedback({ type: 'success', message })
  }

  async function toggleStatus(account) {
    if (!apiEnabled || busyId) return
    setBusyId(account.id)
    setFeedback(null)
    try {
      await setAdminAccountStatus(account.id, !account.active)
      await reloadAccounts()
      setFeedback({ type: 'success', message: `Akun "${account.name}" sekarang berstatus ${account.active ? 'Nonaktif' : 'Aktif'}.` })
    } catch (cause) {
      setFeedback({ type: 'error', message: cause.message })
    } finally {
      setBusyId('')
    }
  }

  const visibleAccounts = accounts ? filterAdminAccounts(accounts, searchTerm) : []
  return (
    <div className="admin-accounts">
      <div className="admin-accounts-intro">
        <div className="admin-accounts-restriction"><Shield size={18} aria-hidden="true" /><span>Super Admin Only</span></div>
        <header className="admin-accounts-heading">
          <div><h2>Kelola Akun</h2><p>Kelola akun pengurus masjid</p></div>
          <button ref={addButtonRef} className="admin-accounts-add" type="button" disabled={!apiEnabled || Boolean(error)} title={apiEnabled ? 'Tambah akun pengurus baru' : 'Fitur tambah akun belum tersedia'} onClick={(event) => openDialog('add', null, event)}><Plus size={16} aria-hidden="true" />Tambah Akun Admin</button>
        </header>
      </div>
      <form className="admin-panel admin-accounts-search" role="search" aria-label={apiEnabled ? 'Pencarian akun pengurus' : 'Pencarian akun contoh'} onSubmit={(event) => { event.preventDefault(); setSearchTerm(query.trim()) }}>
        <span className="admin-accounts-search-icon"><Search size={18} aria-hidden="true" /></span>
        <label className="sr-only" htmlFor="admin-accounts-query">Cari akun berdasarkan nama atau email</label>
        <input id="admin-accounts-query" type="search" maxLength={160} autoComplete="off" placeholder="Cari nama atau email..." value={query} onChange={(event) => setQuery(event.target.value)} disabled={!accounts || Boolean(error)} />
        <button type="submit" disabled={!accounts || Boolean(error)}>Pencarian</button>
      </form>
      {feedback && <p className={`admin-crud-feedback${feedback.type === 'error' ? ' admin-crud-feedback--error' : ''}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !accounts ? <p className="admin-dashboard-state" role="status">Memuat daftar akun contoh…</p> : visibleAccounts.length ? (
        <ul className="admin-accounts-list" aria-label={apiEnabled ? 'Daftar akun pengurus' : 'Daftar akun contoh'}>
          {visibleAccounts.map((account) => <li className="admin-panel admin-accounts-card" key={account.id}>
            <span className="admin-accounts-avatar" aria-hidden="true">{account.initials}</span>
            <div className="admin-accounts-copy">
              <div className="admin-accounts-identity"><h3>{account.name}</h3><span className={`admin-accounts-status${account.active ? ' admin-accounts-status--active' : ''}`}>{account.active ? 'Aktif' : 'Nonaktif'}</span></div>
              <p className="admin-accounts-email">{account.email}</p>
              <p className="admin-accounts-meta">Role: <span>{account.role}</span> · Dibuat: {account.createdDate ? <time dateTime={account.createdDate}>{formatReportDate(account.createdDate)}</time> : '—'}</p>
            </div>
            <div className="admin-accounts-actions">
              <button type="button" disabled={!apiEnabled || busyId === account.id} title={apiEnabled ? `Edit akun ${account.name}` : 'Fitur edit akun belum tersedia'} aria-label={apiEnabled ? `Edit akun ${account.name}` : `Edit akun ${account.name} (belum tersedia)`} onClick={(event) => openDialog('edit', account, event)}><Pencil size={14} aria-hidden="true" />Edit</button>
              {account.active ? <button className="admin-accounts-action--danger" type="button" disabled={!apiEnabled || busyId === account.id} title={apiEnabled ? `Nonaktifkan akun ${account.name}` : 'Fitur nonaktifkan akun belum tersedia'} aria-label={apiEnabled ? `Nonaktifkan akun ${account.name}` : `Nonaktifkan akun ${account.name} (belum tersedia)`} onClick={() => toggleStatus(account)}><CircleX size={14} aria-hidden="true" />Nonaktifkan</button> : <>
                <button className="admin-accounts-action--danger" type="button" disabled={!apiEnabled || busyId === account.id} title={apiEnabled ? `Hapus akun ${account.name}` : 'Fitur hapus akun belum tersedia'} aria-label={apiEnabled ? `Hapus akun ${account.name}` : `Hapus akun ${account.name} (belum tersedia)`} onClick={(event) => openDialog('delete', account, event)}><CircleX size={14} aria-hidden="true" />Hapus</button>
                <button className="admin-accounts-action--activate" type="button" disabled={!apiEnabled || busyId === account.id} title={apiEnabled ? `Aktifkan akun ${account.name}` : 'Fitur aktifkan akun belum tersedia'} aria-label={apiEnabled ? `Aktifkan akun ${account.name}` : `Aktifkan akun ${account.name} (belum tersedia)`} onClick={() => toggleStatus(account)}><RotateCcw size={14} aria-hidden="true" />Aktifkan</button>
              </>}
            </div>
          </li>)}
        </ul>
      ) : <p className="admin-dashboard-state" role="status">{accounts.length ? 'Tidak ada akun yang cocok. Gunakan nama atau email lain, lalu tekan Pencarian.' : 'Belum ada akun pengurus.'}</p>}
      {accounts && <p className="admin-accounts-note">{apiEnabled ? 'Terhubung ke database · Pengelolaan akun pengurus hanya diizinkan untuk role Super Admin saat autentikasi diaktifkan.' : 'Data contoh tampilan, bukan akun login. Super Admin Only adalah label visual; izin akses belum diterapkan. Fitur tambah, edit, aktivasi, nonaktifkan dan hapus belum tersedia.'}</p>}
      {accounts && <span className="sr-only" role="status">{visibleAccounts.length} akun ditampilkan.</span>}
      {apiEnabled && dialog && (
        <AccountDialog
          {...dialog}
          onDone={handleDialogDone}
          onClose={() => setDialog(null)}
          returnFocusRef={returnFocusRef}
          fallbackFocusRef={addButtonRef}
        />
      )}
    </div>
  )
}
