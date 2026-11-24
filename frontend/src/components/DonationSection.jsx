import { Info, ScanLine } from 'lucide-react'
import { resolveUploadedImage } from '../utils/uploadedImage.js'

function isVerifiedBankAccount(account) {
  return Boolean(
    account?.verified === true &&
    account?.name?.trim() &&
    account?.number?.trim() &&
    account?.recipient?.trim()
  )
}

function getVerifiedBankAccounts(donation) {
  if (!donation) return []
  const candidates = Array.isArray(donation.banks) && donation.banks.length
    ? donation.banks
    : [donation.bank, donation.bank2]
  return candidates.filter(isVerifiedBankAccount).slice(0, 4)
}

function BankAccountDetails({ account, confirmed, keyPrefix }) {
  return (
    <dl className="contact-bank">
      {[
        ['Nama bank', account?.name],
        ['Nomor rekening', account?.number],
        ['Atas nama', account?.recipient],
      ].map(([label, value]) => (
        <div key={`${keyPrefix}-${label}`}>
          <dt>{label}</dt>
          <dd>{confirmed ? value.trim() : 'Data belum dikonfirmasi'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function DonationSection({ donation }) {
  const { qris } = donation ?? {}
  const qrisSrc = resolveUploadedImage(qris?.imageSrc)
  const hasQris = qris?.verified === true && Boolean(qrisSrc)
  const verifiedBanks = getVerifiedBankAccounts(donation)
  const hasBank = verifiedBanks.length > 0

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
          <div className="contact-donation-heading"><h3>Transfer Bank</h3></div>
          <p className="contact-donation-description">Informasi rekening untuk donasi Anda.</p>
          {verifiedBanks.length === 2 ? (
            <div className="contact-bank-list">
              <BankAccountDetails account={verifiedBanks[0]} confirmed keyPrefix="bank-1" />
              <span className="contact-bank-divider" aria-hidden="true" />
              <BankAccountDetails account={verifiedBanks[1]} confirmed keyPrefix="bank-2" />
            </div>
          ) : verifiedBanks.length > 2 ? (
            <div className="contact-bank-grid">
              {verifiedBanks.map((account, index) => (
                <div className="contact-bank-item" key={`bank-item-${index + 1}`}>
                  <BankAccountDetails account={account} confirmed keyPrefix={`bank-${index + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <BankAccountDetails
              account={verifiedBanks[0] ?? null}
              confirmed={hasBank}
              keyPrefix={hasBank ? 'bank-1' : 'bank-empty'}
            />
          )}
          <p className="contact-donation-note"><Info aria-hidden="true" />{hasBank ? 'Periksa nama penerima sebelum transfer dan simpan bukti donasi.' : 'Informasi donasi menunggu konfirmasi pengurus masjid.'}</p>
        </article>
      </div>
    </section>
  )
}
