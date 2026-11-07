import { Clock } from 'lucide-react'

export default function AgendaGroup({ group }) {
  const headingId = `agenda-${group.id}`
  return (
    <section className={`agenda-group${group.id === 'monthly' ? ' agenda-group--lime' : ''}`} aria-labelledby={headingId}>
      <header className="agenda-group-header">
        <div className="agenda-group-identity">
          <span className="agenda-group-icon"><Clock aria-hidden="true" /></span>
          <div><h2 id={headingId}>{group.title}</h2><p>{group.subtitle}</p></div>
        </div>
        <span className="agenda-group-count">{group.items.length} Kegiatan</span>
      </header>
      {group.items.length ? (
        <>
          <div className="agenda-columns" aria-hidden="true"><span>NO</span><span>NAMA KEGIATAN</span><span>WAKTU</span></div>
          <ol className="agenda-rows">
            {group.items.map((item, index) => (
              <li key={item.name} className="agenda-row">
                <span className="agenda-row-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div className="agenda-row-content">
                  <span className="agenda-row-name">{item.name}</span>
                  <span className="agenda-row-time"><Clock aria-hidden="true" />{item.schedule}</span>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : <p className="agenda-group-empty">Belum ada kegiatan pada kelompok ini.</p>}
    </section>
  )
}
