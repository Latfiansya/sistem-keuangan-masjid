import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { ArrowRightLeft, Bell, Building2, CalendarDays, ClipboardList, Contact, FileText, Folder, HandHeart, KeyRound, LayoutDashboard, LogOut, Menu, Receipt, Users, X } from 'lucide-react'
import { addMockAdminTransaction, deleteMockAdminTransaction, editMockAdminTransaction } from '../services/adminTransactionService.js'
import { getAdminDashboard } from '../services/adminDashboardService.js'
import { deleteMockAdminCategory, saveMockAdminCategory } from '../services/adminCategoryService.js'
import './AdminLayout.css'

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
  const { pathname } = useLocation()
  const transactionPage = pathname.startsWith('/admin/laporan/transaksi/')
  const currentPage = navigation.flatMap((group) => group.items).find((item) => item.to === (transactionPage ? '/admin/laporan' : pathname.replace(/\/$/, '')))
  const title = transactionPage ? 'Transaksi' : currentPage?.title || currentPage?.label || 'Dashboard Keuangan'
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [reportView, setReportView] = useState(null)
  const [donationDraft, setDonationDraft] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef(null)
  const navigationPanel = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    getAdminDashboard({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setDashboard(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

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

  function saveCategory(values, id) {
    setDashboard(saveMockAdminCategory(dashboard, values, id))
  }

  function deleteCategory(id) {
    setDashboard(deleteMockAdminCategory(dashboard, id))
  }

  function addTransaction(values, type) {
    setDashboard(addMockAdminTransaction(dashboard, values, type))
  }

  function editTransaction(id, values) { setDashboard(editMockAdminTransaction(dashboard, id, values)) }
  function deleteTransaction(id) { setDashboard(deleteMockAdminTransaction(dashboard, id)) }

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
          <div><strong>{account?.name || 'Pengurus'}</strong><span>{account?.email || 'Akun contoh'}</span></div>
          <button type="button" disabled aria-label="Logout belum tersedia" title="Logout belum tersedia"><LogOut size={18} aria-hidden="true" /></button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button className="admin-menu-toggle" type="button" ref={menuButton} aria-expanded={menuOpen} aria-controls="admin-navigation" aria-label={menuOpen ? 'Tutup menu admin' : 'Buka menu admin'} onClick={() => setMenuOpen((previous) => !previous)}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
          <h1>{title}</h1>
          <div className="admin-topbar-actions">
            <button type="button" disabled aria-label="Notifikasi belum tersedia" title="Notifikasi belum tersedia"><Bell size={22} aria-hidden="true" /></button>
            <span className="admin-avatar" aria-label="Inisial akun contoh">{account?.initials || '—'}</span>
          </div>
        </header>
        <main id="admin-content" className="admin-content" tabIndex={-1}><Outlet context={{ dashboard, error, saveCategory, deleteCategory, addTransaction, editTransaction, deleteTransaction, reportView, setReportView, donationDraft, setDonationDraft }} /></main>
      </div>
    </div>
  )
}
