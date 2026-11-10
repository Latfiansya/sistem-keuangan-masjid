import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { getAgenda } from '../services/agendaService.js'
import './AdminAgendaPage.css'

export default function AdminAgendaPage() {
  const [agenda, setAgenda] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAgenda({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setAgenda(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  return (
    <div className="admin-agenda">
      <header className="admin-agenda-heading">
        <div><h2>Agenda</h2><p>Kelola jadwal dan agenda masjid</p></div>
        <button className="admin-agenda-add" type="button" disabled title="Fitur tambah agenda belum tersedia"><Plus size={16} aria-hidden="true" />Tambah Agenda</button>
      </header>
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !agenda ? <p className="admin-dashboard-state" role="status">Memuat agenda masjid…</p> : agenda.groups.some((group) => group.items.length) ? (
        <div className="admin-agenda-list" aria-describedby="admin-agenda-note">
          {agenda.groups.map((group) => (
            <section key={group.id} className="admin-agenda-group" aria-labelledby={`admin-agenda-${group.id}`}>
              <h3 className="sr-only" id={`admin-agenda-${group.id}`}>{group.title}</h3>
              {group.items.length ? <ul>{group.items.map((item) => (
                <li key={item.name} className="admin-panel admin-agenda-card">
                  <span className="admin-agenda-icon"><CalendarDays size={20} aria-hidden="true" /></span>
                  <div className="admin-agenda-copy">
                    <h4>{item.name}</h4>
                    <div className="admin-agenda-details"><span><CalendarDays size={14} aria-hidden="true" /><span className="sr-only">Frekuensi: </span>{group.title}</span><span><Clock size={14} aria-hidden="true" /><span className="sr-only">Jadwal: </span>{item.schedule}</span></div>
                  </div>
                  <div className="admin-agenda-actions">
                    <button type="button" disabled aria-label={`Edit agenda ${item.name} (belum tersedia)`} title="Fitur edit agenda belum tersedia"><Pencil size={16} aria-hidden="true" /></button>
                    <button type="button" disabled aria-label={`Hapus agenda ${item.name} (belum tersedia)`} title="Fitur hapus agenda belum tersedia"><Trash2 size={16} aria-hidden="true" /></button>
                  </div>
                </li>
              ))}</ul> : <p className="admin-dashboard-state">Belum ada agenda pada kelompok ini.</p>}
            </section>
          ))}
          <p id="admin-agenda-note" className="admin-agenda-note">Data contoh. Fitur tambah, edit dan hapus agenda belum tersedia.</p>
        </div>
      ) : <p className="admin-dashboard-state" role="status">Belum ada agenda kegiatan.</p>}
    </div>
  )
}
