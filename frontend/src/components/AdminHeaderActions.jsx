import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Bell, ChevronRight } from 'lucide-react'
import { getAdminActivityLog, getAdminHeaderActivities } from '../services/adminActivityLogService.js'
import { getActiveAdminTransactions } from '../services/adminTransactionData.js'
import { formatReportDate } from '../utils/reportFormatters.js'
import './AdminHeaderActions.css'

export default function AdminHeaderActions({ account, dashboard, onOpen }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [activities, setActivities] = useState(null)
  const [error, setError] = useState('')
  const root = useRef(null)
  const panel = useRef(null)
  const notificationButton = useRef(null)
  const keyboardOpen = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    getAdminActivityLog({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setActivities(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!notificationsOpen) return
    if (keyboardOpen.current) { panel.current?.querySelector('a')?.focus(); keyboardOpen.current = false }
    function outside(event) { if (!root.current?.contains(event.target)) setNotificationsOpen(false) }
    function escape(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setNotificationsOpen(false)
      notificationButton.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [notificationsOpen])

  function toggle() {
    onOpen?.()
    setNotificationsOpen((previous) => !previous)
  }

  function openWithKeyboard(event) {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    onOpen?.()
    if (notificationsOpen) panel.current?.querySelector('a')?.focus()
    else { keyboardOpen.current = true; setNotificationsOpen(true) }
  }

  const notifications = getAdminHeaderActivities(activities || [], dashboard ? getActiveAdminTransactions(dashboard) : [])
  const close = () => setNotificationsOpen(false)
  return <div ref={root} className="admin-topbar-actions admin-header-actions" onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close() }}>
    <button ref={notificationButton} type="button" aria-label="Buka notifikasi aktivitas terbaru" aria-expanded={notificationsOpen} aria-controls="admin-header-notifications" onClick={toggle} onKeyDown={openWithKeyboard}><Bell size={22} aria-hidden="true" /></button>
    <span className="admin-header-avatar" aria-label="Profil akun pengurus"><span className="admin-avatar">{account?.initials || '—'}</span></span>
    {notificationsOpen && <section ref={panel} id="admin-header-notifications" className="admin-header-dropdown admin-header-notifications" aria-labelledby="admin-header-notifications-title">
      <header><h2 id="admin-header-notifications-title">Aktivitas Terbaru</h2><p>Ringkasan 5 aktivitas terbaru dari Activity Log.</p></header>
      {error ? <p className="admin-header-state" role="alert">{error}</p> : !activities ? <p className="admin-header-state" role="status">Memuat aktivitas terbaru…</p> : notifications.length === 0 ? <p className="admin-header-state" role="status">Belum ada aktivitas terbaru.</p> : <ul>{notifications.map((activity) => <li key={activity.id}><Link to={activity.to} onClick={close}><strong>{activity.admin}</strong><span>{activity.title}</span><small><time dateTime={`${activity.date}T${activity.time}`}>{formatReportDate(activity.date)} · {activity.time}</time>{activity.module && <span>{activity.module}</span>}</small></Link></li>)}</ul>}
      <Link className="admin-header-view-all" to="/admin/activity-log" onClick={close}>Lihat Semua Aktivitas<ChevronRight size={15} aria-hidden="true" /></Link>
    </section>}
  </div>
}
