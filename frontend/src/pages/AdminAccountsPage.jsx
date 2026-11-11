import { useEffect, useState } from 'react'
import { CircleX, Pencil, Plus, RotateCcw, Search, Shield } from 'lucide-react'
import { getAdminAccounts, filterAdminAccounts } from '../services/adminAccountsService.js'
import { formatReportDate } from '../utils/reportFormatters.js'
import './AdminAccountsPage.css'

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAdminAccounts({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setAccounts(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  const visibleAccounts = accounts ? filterAdminAccounts(accounts, searchTerm) : []
  return (
    <div className="admin-accounts">
      <div className="admin-accounts-intro">
        <div className="admin-accounts-restriction"><Shield size={18} aria-hidden="true" /><span>Super Admin Only</span></div>
        <header className="admin-accounts-heading">
          <div><h2>Kelola Akun</h2><p>Kelola akun pengurus masjid</p></div>
          <button className="admin-accounts-add" type="button" disabled title="Fitur tambah akun belum tersedia"><Plus size={16} aria-hidden="true" />Tambah Akun Admin</button>
        </header>
      </div>
      <form className="admin-panel admin-accounts-search" role="search" aria-label="Pencarian akun contoh" onSubmit={(event) => { event.preventDefault(); setSearchTerm(query.trim()) }}>
        <span className="admin-accounts-search-icon"><Search size={18} aria-hidden="true" /></span>
        <label className="sr-only" htmlFor="admin-accounts-query">Cari akun berdasarkan nama atau email</label>
        <input id="admin-accounts-query" type="search" maxLength={160} autoComplete="off" placeholder="Cari nama atau email..." value={query} onChange={(event) => setQuery(event.target.value)} disabled={!accounts || Boolean(error)} />
        <button type="submit" disabled={!accounts || Boolean(error)}>Pencarian</button>
      </form>
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !accounts ? <p className="admin-dashboard-state" role="status">Memuat daftar akun contoh…</p> : visibleAccounts.length ? (
        <ul className="admin-accounts-list" aria-label="Daftar akun contoh">
          {visibleAccounts.map((account) => <li className="admin-panel admin-accounts-card" key={account.id}>
            <span className="admin-accounts-avatar" aria-hidden="true">{account.initials}</span>
            <div className="admin-accounts-copy">
              <div className="admin-accounts-identity"><h3>{account.name}</h3><span className={`admin-accounts-status${account.active ? ' admin-accounts-status--active' : ''}`}>{account.active ? 'Aktif' : 'Nonaktif'}</span></div>
              <p className="admin-accounts-email">{account.email}</p>
              <p className="admin-accounts-meta">Role: <span>{account.role}</span> · Dibuat: <time dateTime={account.createdDate}>{formatReportDate(account.createdDate)}</time></p>
            </div>
            <div className="admin-accounts-actions">
              <button type="button" disabled title="Fitur edit akun belum tersedia" aria-label={`Edit akun ${account.name} (belum tersedia)`}><Pencil size={14} aria-hidden="true" />Edit</button>
              {account.active ? <button className="admin-accounts-action--danger" type="button" disabled title="Fitur nonaktifkan akun belum tersedia" aria-label={`Nonaktifkan akun ${account.name} (belum tersedia)`}><CircleX size={14} aria-hidden="true" />Nonaktifkan</button> : <>
                <button className="admin-accounts-action--danger" type="button" disabled title="Fitur hapus akun belum tersedia" aria-label={`Hapus akun ${account.name} (belum tersedia)`}><CircleX size={14} aria-hidden="true" />Hapus</button>
                <button className="admin-accounts-action--activate" type="button" disabled title="Fitur aktifkan akun belum tersedia" aria-label={`Aktifkan akun ${account.name} (belum tersedia)`}><RotateCcw size={14} aria-hidden="true" />Aktifkan</button>
              </>}
            </div>
          </li>)}
        </ul>
      ) : <p className="admin-dashboard-state" role="status">{accounts.length ? 'Tidak ada akun yang cocok. Gunakan nama atau email lain, lalu tekan Pencarian.' : 'Belum ada akun contoh.'}</p>}
      {accounts && <p className="admin-accounts-note">Data contoh tampilan, bukan akun login. Super Admin Only adalah label visual; izin akses belum diterapkan. Fitur tambah, edit, aktivasi, nonaktifkan dan hapus belum tersedia.</p>}
      {accounts && <span className="sr-only" role="status">{visibleAccounts.length} akun contoh ditampilkan.</span>}
    </div>
  )
}
