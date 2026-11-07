import Button from './Button.jsx'

export default function AgendaSummary({ agenda, asPageHeader = false }) {
  const Heading = asPageHeader ? 'h1' : 'h2'
  return (
    <section className="agenda-section page-container" aria-labelledby="agenda-heading">
      <div className="agenda-panel">
        <div className="agenda-copy">
          <Heading id="agenda-heading">Agenda &amp;<br /><span>Kegiatan Masjid</span></Heading>
          <p>{agenda.description}</p>
          {!asPageHeader && <Button to="/agenda">Lihat Detail Kegiatan</Button>}
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
