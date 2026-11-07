import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { useOutletContext } from 'react-router'
import Button from '../components/Button.jsx'
import DonationSection from '../components/DonationSection.jsx'

const informationIcons = { address: MapPin, phone: Phone, hours: Clock }

export default function ContactPage() {
  const { content, error } = useOutletContext()
  if (error) return <p role="alert" className="contact-status page-container">{error}</p>
  if (!content) return <p role="status" className="contact-status page-container">Memuat informasi kontak dan donasi…</p>
  const { contact } = content
  if (!contact) return <p role="status" className="contact-status page-container">Informasi kontak dan donasi belum tersedia.</p>

  return (
    <>
      <header className="contact-header page-container">
        <span className="contact-badge"><Mail aria-hidden="true" />KONTAK KAMI</span>
        <h1>Mari <em>Terhubung</em> Bersama Kami</h1>
        <p>{contact.introduction}</p>
      </header>

      <DonationSection donation={contact.donation} />

      <section className="contact-takmir" aria-labelledby="takmir-heading">
        <div className="page-container">
          <h2 id="takmir-heading">Hubungi Pengurus Takmir</h2>
          <p className="contact-takmir-description">Informasi kontak dan jam layanan menunggu konfirmasi pengurus masjid.</p>
          {contact.information?.length ? <div className="contact-information">
            {contact.information.map((item) => {
              const Icon = informationIcons[item.id] ?? MapPin
              const note = item.verified === true ? item.note : item.id === 'phone' ? 'Jam layanan belum dikonfirmasi.' : null
              return (
                <article className="contact-information-row" key={item.id}>
                  <span className="contact-information-icon"><Icon aria-hidden="true" /></span>
                  <div><h3>{item.label}</h3><p>{item.verified === true && item.value ? item.value : 'Data belum dikonfirmasi'}</p>{note && <small>{note}</small>}</div>
                </article>
              )
            })}
          </div> : <p className="contact-empty">Informasi kontak belum tersedia.</p>}

          <div className="contact-map" aria-label="Lokasi masjid belum dikonfirmasi">
            <span className="contact-map-label"><Navigation aria-hidden="true" />Lokasi masjid</span>
            <div className="contact-map-placeholder"><MapPin aria-hidden="true" /><p>Data belum dikonfirmasi</p><small>Pratinjau lokasi belum tersedia.</small></div>
            <Button disabled aria-describedby="map-status">Buka Google Maps <Navigation aria-hidden="true" /></Button>
            <span id="map-status" className="sr-only">Tautan peta belum diaktifkan karena lokasi belum dikonfirmasi.</span>
          </div>
        </div>
      </section>
    </>
  )
}
