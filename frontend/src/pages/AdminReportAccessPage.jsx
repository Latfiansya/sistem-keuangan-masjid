import { useEffect, useState } from 'react'
import { ChevronRight, Info, KeyRound, Shield } from 'lucide-react'
import { getAdminReportAccessStatus } from '../services/adminReportAccessService.js'
import { formatReportDate } from '../utils/reportFormatters.js'
import './AdminReportAccessPage.css'

export default function AdminReportAccessPage() {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAdminReportAccessStatus({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setStatus(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  return (
    <div className="admin-report-access">
      <header className="admin-report-access-intro">
        <div className="admin-report-access-restriction"><Shield size={18} aria-hidden="true" /><span>Super Admin Only</span></div>
        <div className="admin-report-access-heading"><h2>Kode Akses Laporan Publik</h2><p>Kelola kode akses untuk laporan keuangan publik</p></div>
      </header>
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !status ? <p className="admin-dashboard-state" role="status">Memuat status kode akses contoh…</p> : (
        <section className="admin-panel admin-report-access-status" aria-labelledby="admin-report-access-status-title">
          <div className="admin-report-access-status-heading"><span className="admin-report-access-key"><KeyRound size={24} aria-hidden="true" /></span><div><h3 id="admin-report-access-status-title">Status Kode Akses</h3><span className={`admin-report-access-badge${status.active ? ' admin-report-access-badge--active' : ''}`}>{status.active ? 'Aktif' : 'Nonaktif'}</span></div></div>
          <div className="admin-report-access-code"><div><p>Kode Akses Saat Ini</p><span className="admin-report-access-mask" aria-hidden="true">••••••••</span><span className="sr-only">Placeholder kode tersamarkan, tanpa nilai kode asli.</span></div><span className="admin-report-access-badge">Simulasi</span></div>
          <div className="admin-report-access-history"><p>Terakhir diubah: <time dateTime={status.changedDate}>{formatReportDate(status.changedDate)}</time>, {status.changedTime}</p><p>Diubah oleh: {status.changedBy}</p></div>
          <button type="button" disabled title="Fitur ubah kode akses belum tersedia"><KeyRound size={16} aria-hidden="true" />Ubah Kode Akses</button>
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
      <p className="admin-report-access-note">Status, tanggal dan pengubah adalah data contoh, belum terhubung backend. Super Admin Only hanya label visual; otorisasi pengelola belum diterapkan.</p>
    </div>
  )
}
