import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, Eye, EyeOff, Info, KeyRound, Shield, X } from 'lucide-react'
import { getAdminReportAccessStatus, updateAdminReportAccess } from '../services/adminReportAccessService.js'
import { dataSource } from '../utils/env.js'
import { formatReportDate } from '../utils/reportFormatters.js'
import '../components/AdminModalDialog.css'
import './AdminReportAccessPage.css'

function ReportAccessDialog({ currentStatus, onSaved, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [publicReportEnabled, setPublicReportEnabled] = useState(currentStatus?.publicReportEnabled !== false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = returnFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector('input')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [returnFocusRef])

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    if (!code.trim()) {
      setError('Kode akses baru wajib diisi.')
      return
    }
    if (code.length < 6 || code.length > 128) {
      setError('Kode akses minimal 6 karakter dan maksimal 128 karakter.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const updated = await updateAdminReportAccess({ code, publicReportEnabled })
      onSaved(updated)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog ref={dialogRef} className="admin-crud-dialog" aria-labelledby="admin-report-access-dialog-title" onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
      <header>
        <h2 id="admin-report-access-dialog-title">Ubah Kode Akses Laporan</h2>
        <button type="button" disabled={submitting} aria-label="Tutup form kode akses" onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </header>
      <form noValidate onSubmit={submit} aria-busy={submitting}>
        <div className="admin-crud-field">
          <label htmlFor="admin-report-access-new-code">Kode Akses Baru (minimal 6 karakter) *</label>
          <div className="admin-crud-password-wrap">
            <input id="admin-report-access-new-code" name="code" type={showCode ? 'text' : 'password'} maxLength={128} disabled={submitting} value={code} onChange={(event) => { setCode(event.target.value); setError('') }} aria-invalid={Boolean(error)} />
            <button type="button" className="admin-crud-password-toggle" aria-label={showCode ? 'Sembunyikan kode' : 'Tampilkan kode'} onClick={() => setShowCode((previous) => !previous)}>
              {showCode ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <label className="admin-crud-checkbox" htmlFor="admin-report-access-public-enabled">
          <input id="admin-report-access-public-enabled" name="publicReportEnabled" type="checkbox" disabled={submitting} checked={publicReportEnabled} onChange={(event) => setPublicReportEnabled(event.target.checked)} />
          Aktifkan akses laporan keuangan di website publik
        </label>
        {error && <p className="admin-crud-error" role="alert">{error}</p>}
        <footer>
          <button type="button" disabled={submitting} onClick={onClose}>Batal</button>
          <button type="submit" className="admin-crud-save" disabled={submitting}><Check size={16} aria-hidden="true" />{submitting ? 'Menyimpan…' : 'Simpan Kode Akses'}</button>
        </footer>
      </form>
    </dialog>
  )
}

export default function AdminReportAccessPage() {
  const apiEnabled = dataSource !== 'mock'
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [editing, setEditing] = useState(false)
  const editButtonRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    getAdminReportAccessStatus({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setStatus(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  function handleSaved(updated) {
    setStatus(updated)
    setEditing(false)
    setFeedback('Kode akses laporan berhasil diperbarui di database dan disinkronkan ke gate publik.')
  }

  return (
    <div className="admin-report-access">
      <header className="admin-report-access-intro">
        <div className="admin-report-access-restriction"><Shield size={18} aria-hidden="true" /><span>Super Admin Only</span></div>
        <div className="admin-report-access-heading"><h2>Kode Akses Laporan Publik</h2><p>Kelola kode akses untuk laporan keuangan publik</p></div>
      </header>
      {feedback && <p className="admin-crud-feedback" role="status">{feedback}</p>}
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !status ? <p className="admin-dashboard-state" role="status">Memuat status kode akses contoh…</p> : (
        <section className="admin-panel admin-report-access-status" aria-labelledby="admin-report-access-status-title">
          <div className="admin-report-access-status-heading"><span className="admin-report-access-key"><KeyRound size={24} aria-hidden="true" /></span><div><h3 id="admin-report-access-status-title">Status Kode Akses</h3><span className={`admin-report-access-badge${status.active ? ' admin-report-access-badge--active' : ''}`}>{status.active ? 'Aktif' : 'Nonaktif'}</span></div></div>
          <div className="admin-report-access-code"><div><p>Kode Akses Saat Ini</p><span className="admin-report-access-mask" aria-hidden="true">••••••••</span><span className="sr-only">Placeholder kode tersamarkan, tanpa nilai kode asli.</span></div><span className="admin-report-access-badge">{apiEnabled ? (status.active ? 'Tersimpan (Hash)' : 'Belum diatur') : 'Simulasi'}</span></div>
          <div className="admin-report-access-history"><p>Terakhir diubah: {status.changedDate ? <><time dateTime={status.changedDate}>{formatReportDate(status.changedDate)}</time>{status.changedTime ? `, ${status.changedTime}` : ''}</> : 'Belum pernah diubah'}</p><p>Diubah oleh: {status.changedBy || '—'}</p></div>
          <button ref={editButtonRef} type="button" disabled={!apiEnabled} title={apiEnabled ? 'Ubah kode akses laporan publik' : 'Fitur ubah kode akses belum tersedia'} onClick={() => { setFeedback(''); setEditing(true) }}><KeyRound size={16} aria-hidden="true" />Ubah Kode Akses</button>
        </section>
      )}
      <section className="admin-panel admin-report-access-how" aria-labelledby="admin-report-access-how-title">
        <h3 id="admin-report-access-how-title"><Info size={18} aria-hidden="true" />Cara Kerja Kode Akses</h3>
        <ul>
          <li><ChevronRight size={16} aria-hidden="true" /><span>Tombol laporan di Beranda atau Footer membuka gate (permintaan kode).</span></li>
          <li><ChevronRight size={16} aria-hidden="true" /><span>Setelah integrasi, sistem memeriksa kode yang dimasukkan pengunjung.</span></li>
          <li><ChevronRight size={16} aria-hidden="true" /><span>Jika kode sesuai, gate ditutup dan pengunjung menuju <code>/laporan-keuangan</code>.</span></li>
          <li><ChevronRight size={16} aria-hidden="true" /><span>Akses langsung dan refresh <code>/laporan-keuangan</code> tetap tanpa gate; kode bukan autentikasi atau otorisasi laporan.</span></li>
          <li><ChevronRight size={16} aria-hidden="true" /><span>Ubah Kode Akses nantinya mengganti kode gate. Autentikasi Super Admin untuk mengelolanya terpisah.</span></li>
        </ul>
      </section>
      <p className="admin-report-access-note">{apiEnabled ? 'Terhubung ke database · Kode akses disimpan sebagai hash aman di PostgreSQL dan disinkronkan ke gate publik.' : 'Status, tanggal dan pengubah adalah data contoh, belum terhubung backend. Super Admin Only hanya label visual; otorisasi pengelola belum diterapkan.'}</p>
      {apiEnabled && editing && status && (
        <ReportAccessDialog
          currentStatus={status}
          onSaved={handleSaved}
          onClose={() => setEditing(false)}
          returnFocusRef={editButtonRef}
        />
      )}
    </div>
  )
}
