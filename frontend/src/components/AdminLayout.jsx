import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { ArrowRightLeft, Building2, CalendarDays, ClipboardList, Contact, FileText, Folder, HandHeart, KeyRound, LayoutDashboard, LogOut, Menu, Receipt, Users, X } from 'lucide-react'
import { getAdminSession, logoutAdmin } from '../services/adminAuthService.js'
import { deleteApiAdminCategory, deleteMockAdminCategory, saveApiAdminCategory, saveMockAdminCategory } from '../services/adminCategoryService.js'
import { getAdminDashboard } from '../services/adminDashboardService.js'
import { getAdminFinanceReport } from '../services/adminFinanceReportService.js'
import { addMockAdminTransaction, createApiAdminTransaction, deleteApiAdminTransaction, deleteMockAdminTransaction, editMockAdminTransaction, updateApiAdminTransaction } from '../services/adminTransactionService.js'
import { dataSource } from '../utils/env.js'
import AdminHeaderActions from './AdminHeaderActions.jsx'
import './AdminLayout.css'

const buildInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'PG'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const navigation = [
  { label: 'Keuangan', items: [
    { label: 'Dashboard Keuangan', icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Kelola Dana', title: 'Kelola Dana Keuangan', icon: ArrowRightLeft, to: '/admin/kelola-dana' },
    { label: 'Kategori Dana', icon: Folder, to: '/admin/kategori-dana' },
    { label: 'Laporan', title: 'Laporan Keuangan', icon: FileText, to: '/admin/laporan' },
    { label: 'Kwitansi', icon: Receipt, to: '/admin/kwitansi' },
    { label: 'Activity Log', icon: ClipboardList, to: '/admin/activity-log' },
  ] },
  { label: 'Konten Website', items: [
    { label: 'Profil Masjid', icon: Building2, to: '/admin/profil-masjid' },
    { label: 'Agenda', icon: CalendarDays, to: '/admin/agenda' },
    { label: 'Kontak & Pengaturan', title: 'Kontak & Pengaturan Website', icon: Contact, to: '/admin/kontak-pengaturan' },
    { label: 'Donasi', icon: HandHeart, to: '/admin/donasi' },
  ] },
  { label: 'Pengaturan', items: [
    { label: 'Kelola Akun', icon: Users, to: '/admin/kelola-akun' },
    { label: 'Kode Akses Laporan', icon: KeyRound, to: '/admin/kode-akses-laporan' },
  ] },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const transactionPage = pathname.startsWith('/admin/laporan/transaksi/')
  const downloadPage = pathname.startsWith('/admin/laporan/unduh')
  const currentPage = navigation.flatMap((group) => group.items).find((item) => item.to === (transactionPage || downloadPage ? '/admin/laporan' : pathname.replace(/\/$/, '')))
  const title = transactionPage ? 'Transaksi' : downloadPage ? (pathname.includes('/pratinjau') ? 'Pratinjau & Unduh Laporan' : 'Pengaturan Unduhan') : currentPage?.title || currentPage?.label || 'Dashboard Keuangan'
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [reportView, setReportView] = useState(null)
  const [reportDownload, setReportDownload] = useState(null)
  const [donationDraft, setDonationDraft] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const navigationPanel = useRef(null)

  const loadWorkspace = useCallback(async ({ signal } = {}) => {
    if (dataSource === 'mock') {
      return getAdminDashboard({ signal })
    }
    const [summary, report, sessionUser] = await Promise.all([
      getAdminDashboard({ signal }),
      getAdminFinanceReport({ signal }),
      getAdminSession({ signal }),
    ])
    const account = sessionUser
      ? { name: sessionUser.name, email: sessionUser.email, role: sessionUser.role, initials: buildInitials(sessionUser.name) }
      : summary.account
    return {
      ...summary,
      account,
      apiTransactions: report.transactions,
      apiCoverage: report.coverage,
      historicalTransactionCount: report.historicalTransactionCount,
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadWorkspace({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setDashboard(data) })
      .catch((cause) => {
        if (controller.signal.aborted) return
        if (cause?.status === 401) {
          navigate('/admin/login', { replace: true, state: { message: cause.message } })
          return
        }
        setError(cause.message)
      })
    return () => controller.abort()
  }, [loadWorkspace, navigate])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const trigger = menuButton.current
    const isMobile = window.matchMedia('(max-width: 1023px)').matches
    if (isMobile) navigationPanel.current?.querySelector('a[aria-current="page"]')?.focus({ preventScroll: true })
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        trigger?.focus()
      }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      if (isMobile && trigger?.isConnected) trigger.focus()
    }
  }, [menuOpen])

  async function saveCategory(values, id) {
    if (dataSource === 'mock') {
      setDashboard(saveMockAdminCategory(dashboard, values, id))
      return
    }
    await saveApiAdminCategory(values, id)
    setDashboard(await loadWorkspace())
  }

  async function deleteCategory(id) {
    if (dataSource === 'mock') {
      setDashboard(deleteMockAdminCategory(dashboard, id))
      return
    }
    await deleteApiAdminCategory(id)
    setDashboard(await loadWorkspace())
  }

  async function addTransaction(values, type) {
    if (dataSource === 'mock') {
      setDashboard(addMockAdminTransaction(dashboard, values, type))
      return
    }
    await createApiAdminTransaction(values, type)
    setDashboard(await loadWorkspace())
  }

  async function editTransaction(id, values, type) {
    if (dataSource === 'mock') {
      setDashboard(editMockAdminTransaction(dashboard, id, values))
      return
    }
    await updateApiAdminTransaction(id, values, type)
    setDashboard(await loadWorkspace())
  }

  async function deleteTransaction(id) {
    if (dataSource === 'mock') {
      setDashboard(deleteMockAdminTransaction(dashboard, id))
      return
    }
    await deleteApiAdminTransaction(id)
    setDashboard(await loadWorkspace())
  }

  // Memuat ulang ringkasan saldo setelah perubahan di luar transaksi (misalnya transfer dana); mode mock memakai snapshot tetap.
  async function reloadWorkspace() {
    if (dataSource === 'mock') return
    setDashboard(await loadWorkspace())
  }

  async function handleLogout() {
    if (dataSource !== 'mock') {
      try { await logoutAdmin() } catch { /* tetap arahkan ke login */ }
    }
    navigate('/admin/login')
  }

  const account = dashboard?.account
  return (
    <div className="admin-shell">
      <a className="admin-skip-link" href="#admin-content">Lewati navigasi</a>
      {menuOpen && <button type="button" className="admin-sidebar-backdrop" aria-label="Tutup menu admin" tabIndex={-1} onClick={() => setMenuOpen(false)} />}
      <aside id="admin-navigation" ref={navigationPanel} className={`admin-sidebar${menuOpen ? ' admin-sidebar--open' : ''}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== menuButton.current) setMenuOpen(false) }}>
        <div className="admin-sidebar-brand"><img src={`${import.meta.env.BASE_URL}assets/masjid-logo.webp`} alt="Masjid Al-Hidayah" width="640" height="191" /></div>
        <nav className="admin-navigation" aria-label="Navigasi admin">
          {navigation.map((group) => <div className="admin-nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map(({ label, icon: Icon, to }) => to
              ? <NavLink className="admin-nav-link" key={label} to={to} onClick={() => setMenuOpen(false)}><Icon size={18} aria-hidden="true" />{label}</NavLink>
              : <button className="admin-nav-link" key={label} type="button" disabled title={`${label} belum tersedia`}><Icon size={18} aria-hidden="true" />{label}</button>)}
          </div>)}
        </nav>
        <div className="admin-account">
          <span className="admin-avatar" aria-hidden="true">{account?.initials || '—'}</span>
          <div><strong>{account?.name || 'Pengurus'}</strong><span>{account?.email || (dataSource === 'mock' ? 'Akun contoh' : 'Mode API')}</span></div>
          <button type="button" aria-label="Logout — kembali ke Login" title={dataSource === 'mock' ? 'Kembali ke Login · Autentikasi masih stub, belum ada sesi nyata' : 'Keluar dan kembali ke halaman Login'} onClick={handleLogout}><LogOut size={18} aria-hidden="true" /></button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button className="admin-menu-toggle" type="button" ref={menuButton} aria-expanded={menuOpen} aria-controls="admin-navigation" aria-label={menuOpen ? 'Tutup menu admin' : 'Buka menu admin'} onClick={() => setMenuOpen((previous) => !previous)}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
          <h1>{title}</h1>
          <AdminHeaderActions key={pathname} account={account} dashboard={dashboard} onOpen={() => setMenuOpen(false)} />
        </header>
        <main id="admin-content" className="admin-content" tabIndex={-1}><Outlet context={{ dashboard, error, saveCategory, deleteCategory, addTransaction, editTransaction, deleteTransaction, reloadWorkspace, reportView, setReportView, reportDownload, setReportDownload, donationDraft, setDonationDraft }} /></main>
      </div>
    </div>
  )
}
