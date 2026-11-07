import { CalendarDays, Expand, Users, Heart, HeartPulse, Coins } from 'lucide-react'
import { useOutletContext } from 'react-router'
import Button from '../components/Button.jsx'
import VisionMission from '../components/VisionMission.jsx'
import AgendaSummary from '../components/AgendaSummary.jsx'

const icons = { calendar: CalendarDays, expand: Expand, users: Users, heart: Heart, health: HeartPulse, economy: Coins }

export default function HomePage() {
  const { content, error, openReportAccess } = useOutletContext()
  if (error) return <p role="alert" className="page-container content-status">{error}</p>
  if (!content) return <p role="status" className="page-container content-status">Memuat konten Beranda…</p>

  return (
    <>
      <section className="hero" aria-labelledby="hero-heading">
        <img className="hero-image" src="/assets/masjid-background.webp" width="1928" height="1089" alt="Masjid Al-Hidayah Sorolaten" fetchPriority="high" />
        <div className="hero-copy">
          <h1 id="hero-heading">MASJID<br />AL-HIDAYAH</h1>
          <p>{content.heroDescription}</p>
          <div className="hero-actions">
            <Button to="/agenda">Lihat Agenda</Button>
            <Button to="/profil" variant="glass">Profil Masjid</Button>
          </div>
        </div>
      </section>

      <section className="statistics page-container" aria-label="Sekilas masjid">
        {content.statistics.map(({ label, value, icon }) => {
          const Icon = icons[icon]
          return <div className="stat-card" key={label}><Icon aria-hidden="true" /><p>{label}</p><strong>{value}</strong></div>
        })}
      </section>

      <VisionMission vision={content.vision} missions={content.missions} />
      <AgendaSummary agenda={content.agenda} />

      <section className="prosperity-section" aria-labelledby="prosperity-heading">
        <h2 id="prosperity-heading">Kemakmuran Masjid</h2>
        <div className="program-grid">
          {content.programs.map(({ title, description, icon }, index) => {
            const Icon = icons[icon]
            return (
              <article key={title} className={`program-card${index === 1 ? ' program-card--featured' : ''}`}>
                <div className="program-heading"><h3>{title}</h3><Icon aria-hidden="true" /></div>
                <p>{description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="finance-cta" aria-labelledby="finance-heading">
        <div>
          <h2 id="finance-heading">Transparansi &amp; Akuntabilitas Keuangan</h2>
          <p>Lihat ringkasan pemasukan dan pengeluaran dana Masjid Al-Hidayah menggunakan sandi akses bersama yang dibagikan pengurus masjid.</p>
          <Button to="/laporan-keuangan" onClick={openReportAccess}>Lihat Laporan Keuangan</Button>
        </div>
      </section>
    </>
  )
}
