import Button from './Button.jsx'

export default function AgendaSummary({ agenda }) {
  return (
    <section className="agenda-section page-container" aria-labelledby="agenda-heading">
      <div className="agenda-panel">
        <div className="agenda-copy">
          <h2 id="agenda-heading">Agenda &amp;<br /><span>Kegiatan Masjid</span></h2>
          <p>{agenda.description}</p>
          <Button disabled title="Halaman Agenda belum tersedia">Lihat Detail Kegiatan</Button>
        </div>
        <dl className="agenda-counts">
          {agenda.counts.map(({ label, value }) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </div>
    </section>
  )
}
