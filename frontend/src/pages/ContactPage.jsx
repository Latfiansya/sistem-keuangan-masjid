import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { useOutletContext } from 'react-router'
import Button from '../components/Button.jsx'
import DonationSection from '../components/DonationSection.jsx'

const informationIcons = { address: MapPin, phone: Phone, hours: Clock }

const GOOGLE_MAPS_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'google.co.id',
  'www.google.co.id',
  'maps.google.com',
  'maps.google.co.id',
])

function resolveContactMapEmbedUrl(location) {
  if (location?.verified !== true || !location?.url) return null

  const rawEmbed = typeof location.embedUrl === 'string' ? location.embedUrl.trim() : ''
  if (rawEmbed) {
    try {
      const parsed = new URL(rawEmbed)
      if (
        parsed.protocol === 'https:' &&
        GOOGLE_MAPS_HOSTS.has(parsed.hostname) &&
        (parsed.pathname.startsWith('/maps/embed') || parsed.searchParams.get('output') === 'embed')
      ) {
        return parsed.toString()
      }
    } catch {
      // Abaikan embedUrl tidak valid dan turunkan dari url utama bila memungkinkan.
    }
  }

  try {
    const parsed = new URL(String(location.url).trim())
    if (parsed.protocol !== 'https:' || !GOOGLE_MAPS_HOSTS.has(parsed.hostname)) return null
    if (parsed.pathname.startsWith('/maps/embed') || parsed.searchParams.get('output') === 'embed') {
      return parsed.toString()
    }
    const queryParam =
      parsed.searchParams.get('q') ||
      parsed.searchParams.get('query') ||
      parsed.searchParams.get('destination') ||
      parsed.searchParams.get('ll')
    const coordMatch = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(parsed.pathname)
    const placeMatch = /\/maps\/place\/([^/]+)/.exec(parsed.pathname)
    const query =
      queryParam?.trim() ||
      (coordMatch ? `${coordMatch[1]},${coordMatch[2]}` : '') ||
      (placeMatch?.[1] ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim() : '')
    if (!query) return null
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
  } catch {
    return null
  }
}

export default function ContactPage() {
  const { content, error } = useOutletContext()
  if (error) return <p role="alert" className="contact-status page-container">{error}</p>
  if (!content) return <p role="status" className="contact-status page-container">Memuat informasi kontak dan donasi…</p>
  const { contact } = content
  if (!contact) return <p role="status" className="contact-status page-container">Informasi kontak dan donasi belum tersedia.</p>
  const hasLocation = contact.location?.verified === true && Boolean(contact.location.url)
  const mapEmbedUrl = hasLocation ? resolveContactMapEmbedUrl(contact.location) : null
  const locationLabel = hasLocation && contact.location.label?.trim() ? contact.location.label.trim() : ''
  const hasVerifiedInfo = Array.isArray(contact.information) && contact.information.some((item) => item?.verified === true && Boolean(item?.value))
  const takmirDescription = contact.introduction?.trim()
    || (hasVerifiedInfo
      ? 'Silakan hubungi pengurus takmir melalui informasi kontak dan jam layanan berikut.'
      : 'Informasi kontak dan jam layanan menunggu konfirmasi pengurus masjid.')

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
          <p className="contact-takmir-description">{takmirDescription}</p>
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

          <div className="contact-map" aria-label={hasLocation ? 'Lokasi masjid terkonfirmasi' : 'Lokasi masjid belum dikonfirmasi'}>
            {hasLocation && mapEmbedUrl ? (
              <iframe
                className="contact-map-frame"
                title={locationLabel ? `Peta ${locationLabel}` : 'Peta lokasi Masjid Al-Hidayah'}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="contact-map-placeholder"><MapPin aria-hidden="true" /><p>{hasLocation ? (locationLabel || 'Lokasi Masjid Al-Hidayah Sorolaten') : 'Data belum dikonfirmasi'}</p><small>{hasLocation ? 'Klik tombol di bawah untuk membuka Google Maps.' : 'Pratinjau lokasi belum tersedia.'}</small></div>
            )}
            <span className="contact-map-label"><Navigation aria-hidden="true" />{locationLabel || 'Lokasi masjid'}</span>
            {hasLocation ? (
              <a className="action-button action-button--solid" href={contact.location.url} target="_blank" rel="noopener noreferrer">Buka Google Maps <Navigation aria-hidden="true" /></a>
            ) : (
              <>
                <Button disabled aria-describedby="map-status">Buka Google Maps <Navigation aria-hidden="true" /></Button>
                <span id="map-status" className="sr-only">Tautan peta belum diaktifkan karena lokasi belum dikonfirmasi.</span>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
