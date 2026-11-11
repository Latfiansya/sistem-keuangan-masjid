import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Filter, KeyRound, Pencil, Plus, Receipt, Search, Shield, Trash2, UserRoundX } from 'lucide-react'
import { filterAdminActivities, getAdminActivityLog, groupAdminActivities } from '../services/adminActivityLogService.js'
import { formatReportDate, formatRupiah } from '../utils/reportFormatters.js'
import './AdminActivityLogPage.css'

const activityStyles = {
  edit: { icon: Pencil, color: 'amber' }, delete: { icon: Trash2, color: 'red' },
  add: { icon: Plus, color: 'green' }, account: { icon: Plus, color: 'green' },
  code: { icon: KeyRound, color: 'purple' }, print: { icon: Receipt, color: 'blue' },
  disable: { icon: UserRoundX, color: 'indigo' }, content: { icon: Plus, color: 'green' },
}

export default function AdminActivityLogPage() {
  const [activities, setActivities] = useState(null)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ admin: '', type: '', date: '', module: '', query: '' })

  useEffect(() => {
    const controller = new AbortController()
    getAdminActivityLog({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setActivities(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  function handleFilter(event) {
    const { name, value } = event.target
    setFilters((previous) => ({ ...previous, [name]: value }))
  }

  const source = activities || []
  const admins = [...new Set(source.map((activity) => activity.admin))]
  const types = [...new Map(source.map((activity) => [activity.type, activity.typeLabel]))]
  const modules = [...new Set(source.map((activity) => activity.module))]
  const visible = filterAdminActivities(source, filters)
  const groups = groupAdminActivities(visible)

  return (
    <div className="admin-activity">
      <header className="admin-activity-hero">
        <span className="admin-activity-hero-badge"><Shield size={14} aria-hidden="true" />APPEND-ONLY · TIDAK DAPAT DIHAPUS</span>
        <h2>Activity Log</h2>
        <p>Data contoh aktivitas pengurus untuk meninjau konsep pencatatan<br className="admin-activity-desktop-break" /> perubahan yang tidak menyediakan fitur ubah/hapus riwayat.</p>
      </header>
      <section className="admin-panel admin-activity-filters" aria-labelledby="admin-activity-filters-title">
        <h3 id="admin-activity-filters-title"><Filter size={16} aria-hidden="true" />Filter Aktivitas</h3>
        <div className="admin-activity-filter-grid">
          <div><label htmlFor="admin-activity-admin">Nama Admin</label><select id="admin-activity-admin" name="admin" value={filters.admin} onChange={handleFilter} disabled={!activities || Boolean(error)}><option value="">Semua admin</option>{admins.map((admin) => <option key={admin}>{admin}</option>)}</select></div>
          <div><label htmlFor="admin-activity-type">Jenis Aktivitas</label><select id="admin-activity-type" name="type" value={filters.type} onChange={handleFilter} disabled={!activities || Boolean(error)}><option value="">Semua aktivitas</option>{types.map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></div>
          <div><label htmlFor="admin-activity-date">Tanggal</label><input id="admin-activity-date" name="date" type="date" value={filters.date} onChange={handleFilter} disabled={!activities || Boolean(error)} /></div>
          <div><label htmlFor="admin-activity-module">Modul</label><select id="admin-activity-module" name="module" value={filters.module} onChange={handleFilter} disabled={!activities || Boolean(error)}><option value="">Semua modul</option>{modules.map((module) => <option key={module}>{module}</option>)}</select></div>
        </div>
        <div className="admin-activity-search"><Search size={16} aria-hidden="true" /><label htmlFor="admin-activity-query" className="sr-only">Cari nama admin atau judul aktivitas</label><input id="admin-activity-query" name="query" type="search" maxLength={160} autoComplete="off" placeholder="Cari nama admin atau judul aktivitas..." value={filters.query} onChange={handleFilter} disabled={!activities || Boolean(error)} /></div>
      </section>
      <aside className="admin-activity-system"><span><Shield size={22} aria-hidden="true" /></span><div><h3>Sistem Append-Only</h3><p>Konsep riwayat tanpa fitur ubah/hapus log. Saat ini hanya data contoh; integritas dan kelengkapan pencatatan belum ditegakkan.</p></div></aside>
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !activities ? <p className="admin-dashboard-state" role="status">Memuat aktivitas contoh…</p> : groups.length ? (
        <div className="admin-activity-timeline" aria-label="Timeline aktivitas contoh">
          {groups.map((group) => <section key={group.date} className="admin-activity-date-group" aria-labelledby={`admin-activity-day-${group.date}`}>
            <div className="admin-activity-day-heading"><h3 id={`admin-activity-day-${group.date}`}><span><CalendarDays size={16} aria-hidden="true" /></span><time dateTime={group.date}>{formatReportDate(group.date)}</time></h3><i aria-hidden="true" /><span>{group.items.length} aktivitas</span></div>
            <ol className="admin-activity-events">{group.items.map((activity) => {
              const { icon: Icon, color } = activityStyles[activity.type]
              return <li className={`admin-activity-event admin-activity-event--${color}`} key={activity.id}>
                <span className="admin-activity-marker"><Icon size={18} aria-hidden="true" /></span>
                <article className="admin-panel admin-activity-card">
                  <header><div className="admin-activity-author"><span className="admin-activity-avatar" aria-hidden="true">{activity.admin.split(' ').map((part) => part[0]).join('')}</span><div><strong>{activity.admin}</strong><p><Clock size={12} aria-hidden="true" /><time dateTime={`${activity.date}T${activity.time}`}>{formatReportDate(activity.date)}, {activity.time}</time></p></div></div><div className="admin-activity-tags"><span className="admin-activity-type">{activity.typeLabel}</span><span className="admin-activity-module">{activity.module}</span></div></header>
                  <h4><strong>{activity.admin}</strong> {activity.title}</h4>
                  <dl className="admin-activity-details">{activity.details.map((detail) => <div className={`admin-activity-detail${detail.tone ? ` admin-activity-detail--${detail.tone}` : ''}`} key={detail.label}><dt>{detail.label}:</dt><dd>{detail.tone === 'old' ? <del>{formatRupiah(detail.value)}</del> : detail.format === 'money' ? formatRupiah(detail.value) : detail.value}</dd></div>)}</dl>
                </article>
              </li>
            })}</ol>
          </section>)}
        </div>
      ) : <p className="admin-dashboard-state" role="status">Tidak ada aktivitas yang sesuai. Sesuaikan filter atau kata pencarian.</p>}
      {activities && <p className="sr-only" role="status">{visible.length} aktivitas contoh dalam {groups.length} kelompok tanggal.</p>}
    </div>
  )
}
