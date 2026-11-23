import { Info, ScanLine } from 'lucide-react'
import { resolveUploadedImage } from '../utils/uploadedImage.js'

export default function DonationSection({ donation }) {
  const { qris, bank } = donation ?? {}
  const qrisSrc = resolveUploadedImage(qris?.imageSrc)
  const hasQris = qris?.verified === true && Boolean(qrisSrc)
  const hasBank = bank?.verified === true && Boolean(bank.name && bank.number && bank.recipient)

  return (
    <section className="contact-donation" aria-labelledby="donation-heading">
      <h2 id="donation-heading">Donasi</h2>
      <div className="contact-donation-grid">
        <article className="contact-donation-card">
          <div className="contact-donation-heading"><h3>Scan QRIS</h3><span className="contact-chip">{hasQris ? 'QRIS' : 'Belum dikonfirmasi'}</span></div>
          <p className="contact-donation-description">Pindai kode QRIS untuk donasi cepat dan aman.</p>
          <figure className="contact-qris">
            {hasQris ? <img src={qrisSrc} alt="QRIS donasi Masjid Al-Hidayah" /> : <div className="contact-qris-placeholder"><ScanLine aria-hidden="true" /></div>}
            <figcaption>{hasQris ? 'QRIS Donasi' : 'Data belum dikonfirmasi'}</figcaption>
          </figure>
        </article>
        <article className="contact-donation-card">
          <div className="contact-donation-heading"><h3>Transfer Bank</h3><span className="contact-chip">{hasBank ? 'Terkonfirmasi' : 'Belum dikonfirmasi'}</span></div>
          <p className="contact-donation-description">Informasi rekening untuk donasi Anda.</p>
          <dl className="contact-bank">
            {[
              ['Nama bank', bank?.name],
              ['Nomor rekening', bank?.number],
              ['Atas nama', bank?.recipient],
            ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{hasBank ? value : 'Data belum dikonfirmasi'}</dd></div>)}
          </dl>
          <p className="contact-donation-note"><Info aria-hidden="true" />{hasBank ? 'Periksa nama penerima sebelum transfer dan simpan bukti donasi.' : 'Informasi donasi menunggu konfirmasi pengurus masjid.'}</p>
        </article>
      </div>
    </section>
  )
}
