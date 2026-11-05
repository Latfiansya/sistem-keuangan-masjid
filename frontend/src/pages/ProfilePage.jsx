import { Expand, Users } from 'lucide-react'
import { useOutletContext } from 'react-router'
import Button from '../components/Button.jsx'
import VisionMission from '../components/VisionMission.jsx'

export default function ProfilePage() {
  const { content, error } = useOutletContext()
  if (error) return <p role="alert" className="profile-status page-container">{error}</p>
  if (!content) return <p role="status" className="profile-status page-container">Memuat profil masjid…</p>
  const { profile, statistics, vision, missions } = content
  if (!profile) return <p role="status" className="profile-status page-container">Profil masjid belum tersedia.</p>
  const profileStatistics = statistics.filter((statistic) => ['area', 'capacity'].includes(statistic.id))

  return (
    <>
      <header className="profile-header page-container">
        <span className="profile-badge">EST. {profile.foundedYear} · {profile.location.toUpperCase()}</span>
        <h1>Profil Masjid <span>{content.name.replace(/^Masjid\s+/, '')}</span><em>{profile.location}</em></h1>
        <p>{profile.introduction}</p>
      </header>

      <section className="profile-statistics page-container" aria-label="Fasilitas masjid">
        {profileStatistics.length ? profileStatistics.map((statistic) => {
          const Icon = statistic.id === 'area' ? Expand : Users
          return (
            <article key={statistic.id} className={`profile-statistic profile-statistic--${statistic.id}`}>
              <div className="profile-statistic-top"><span><Icon aria-hidden="true" /></span><h2>{statistic.profileLabel}</h2></div>
              <p className="profile-statistic-value">{statistic.amount}<small>{statistic.unit}</small></p>
              <p className="profile-statistic-description">{statistic.description}</p>
            </article>
          )
        }) : <p>Informasi fasilitas belum tersedia.</p>}
      </section>

      {vision && missions.length ? <VisionMission vision={vision} missions={missions} /> : <p className="page-container profile-empty">Visi dan misi belum tersedia.</p>}

      <section className="profile-history" aria-labelledby="history-heading">
        <div className="profile-wide-container">
          <p className="profile-eyebrow">PERJALANAN</p>
          <h2 id="history-heading">Sejarah &amp; Linimasa</h2>
          {profile.timeline.length ? <ol className="profile-timeline">
            {profile.timeline.map((event) => (
              <li key={event.year} className="profile-timeline-row">
                <div className="profile-era"><span className="profile-badge">{event.era}</span><p className="profile-year">Tahun {event.year}</p><p className="profile-era-name">{event.name}</p></div>
                <article className="profile-history-card"><h3>{event.title}</h3><p>{event.description}</p></article>
              </li>
            ))}
          </ol> : <p className="profile-empty">Informasi sejarah belum tersedia.</p>}
        </div>
      </section>

      <section className="profile-management" aria-labelledby="management-heading">
        <p className="profile-eyebrow">STRUKTUR ORGANISASI</p>
        <h2 id="management-heading">Pengurus Takmir {profile.managementPeriod}</h2>
        {profile.members.length ? <div className="profile-members">
          {profile.members.map((member) => (
            <article key={member.role} className="profile-member">
              <span className="profile-member-avatar" aria-hidden="true">{member.initials}</span>
              <p className="profile-member-role">{member.role}</p>
              <h3>{member.name}</h3>
              {member.note && <p className="profile-member-note">{member.note}</p>}
            </article>
          ))}
        </div> : <p className="profile-empty">Informasi pengurus belum tersedia.</p>}
      </section>

      <section className="profile-contact profile-wide-container" aria-labelledby="profile-contact-heading">
        <div className="profile-contact-panel">
          <h2 id="profile-contact-heading">{profile.contactTitle}</h2>
          <p>{profile.contactDescription}</p>
          <Button to="/kontak">Hubungi Takmir</Button>
        </div>
      </section>
    </>
  )
}
