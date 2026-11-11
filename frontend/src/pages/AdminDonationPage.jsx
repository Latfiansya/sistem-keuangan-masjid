import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router'
import { ChevronRight, CircleAlert, Eye, EyeOff, HandHeart, ImageUp, Info, Landmark, MessageCircle, Monitor, ScanLine, ShieldCheck, Upload } from 'lucide-react'
import { adminDonationQrisAccept, getAdminDonationReadiness, getAdminDonationSettings, normalizeAdminDonationSettings, readAdminDonationQris, validateAdminDonationSettings } from '../services/adminDonationService.js'
import './AdminWebsiteSettingsPage.css'
import './AdminDonationPage.css'

function StatusBadge({ complete }) {
  return <span className={`admin-donation-badge${complete ? ' admin-donation-badge--ready' : ''}`}>{complete ? 'Lengkap' : 'Belum lengkap'}</span>
}

function VisibilityToggle({ id, title, description, method, checked, onChange }) {
  return <label className={`admin-donation-toggle${!method.complete ? ' admin-donation-toggle--disabled' : ''}`} htmlFor={id}><span><strong>{title}</strong><small id={`${id}-help`}>{description}</small></span><span className="admin-donation-toggle-control"><small>{checked ? 'Aktif' : 'Nonaktif'}</small><span className="admin-settings-switch"><input id={id} type="checkbox" role="switch" checked={checked} disabled={!method.complete} onChange={(event) => onChange(event.target.checked)} aria-describedby={`${id}-help`} /><span className="admin-settings-switch-track" aria-hidden="true" /></span></span></label>
}

export default function AdminDonationPage() {
  const { donationDraft, setDonationDraft } = useOutletContext()
  const [values, setValues] = useState(donationDraft || null)
  const [initialDraft, setInitialDraft] = useState(null)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [imageError, setImageError] = useState('')
  const [imageBusy, setImageBusy] = useState(false)
  const imageRequest = useRef(0)
  const picker = useRef(null)
  const qrisImage = useRef(null)
  const userQrisImage = useRef(null)
  const imageFile = values?.qrisFile

  useEffect(() => {
    if (donationDraft) return
    const controller = new AbortController()
    getAdminDonationSettings({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) { setValues(data); setInitialDraft(data) } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [donationDraft])

  useEffect(() => {
    if (!imageFile) return
    const url = URL.createObjectURL(imageFile)
    if (qrisImage.current) qrisImage.current.src = url
    if (userQrisImage.current) userQrisImage.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [imageFile, values?.qrisEnabled])

  useEffect(() => () => { imageRequest.current++ }, [])

  function change(name, value) {
    setValues((previous) => normalizeAdminDonationSettings({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setMessage('')
  }

  async function chooseImage(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    const request = ++imageRequest.current
    setImageBusy(true); setImageError(''); setMessage('')
    try {
      const file = await readAdminDonationQris(files)
      if (request === imageRequest.current) change('qrisFile', file)
    } catch (cause) { if (request === imageRequest.current) setImageError(cause.message) }
    finally { if (request === imageRequest.current) setImageBusy(false) }
  }

  function removeImage() {
    imageRequest.current++
    setImageBusy(false); setImageError('')
    change('qrisFile', null)
  }

  function save(event) {
    event.preventDefault()
    if (imageBusy) return
    const validation = validateAdminDonationSettings(values)
    setErrors(validation)
    if (Object.keys(validation).length) {
      document.getElementById(`admin-donation-${Object.keys(validation)[0]}`)?.focus()
      setMessage('Periksa format field yang ditandai. Field yang masih kosong boleh disimpan sebagai draf.')
      return
    }
    setDonationDraft(normalizeAdminDonationSettings({ ...values }))
    setMessage('Draf tersimpan sementara dalam sesi admin. Belum tersimpan ke server dan belum dipublikasikan. Refresh akan menghapus draf ini.')
  }

  function cancel() {
    imageRequest.current++
    setImageBusy(false); setImageError(''); setErrors({})
    setValues({ ...(donationDraft || initialDraft) })
    setMessage('Perubahan yang belum disimpan dibatalkan. Form kembali ke draf terakhir dalam sesi.')
  }

  const readiness = values ? getAdminDonationReadiness(values) : null
  const validation = values ? validateAdminDonationSettings(values) : {}
  function field(name, label, placeholder, help, maxLength, multiline = false, inputMode) {
    const attributes = { id: `admin-donation-${name}`, name, value: values[name], onChange: (event) => change(name, event.target.value), onBlur: () => setErrors((previous) => ({ ...previous, [name]: validation[name] || '' })), maxLength, placeholder, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': [help && `admin-donation-${name}-help`, errors[name] && `admin-donation-${name}-error`].filter(Boolean).join(' ') || undefined }
    return <div className={`admin-settings-field admin-donation-field--${name}`}><label htmlFor={attributes.id}>{label}</label>{multiline ? <textarea {...attributes} rows={name === 'messageTemplate' ? 8 : 3} /> : <input {...attributes} type={name === 'whatsappNumber' ? 'tel' : 'text'} inputMode={inputMode} autoComplete="off" />}{help && <p id={`${attributes.id}-help`} className="admin-donation-help">{help}</p>}{errors[name] && <p id={`${attributes.id}-error`} className="admin-settings-error" role="alert">{errors[name]}</p>}</div>
  }

  return <div className="admin-donation">
    <nav className="admin-donation-breadcrumb" aria-label="Breadcrumb"><span>Konten Website</span><ChevronRight size={14} aria-hidden="true" /><Link to="/admin/kontak-pengaturan">Kontak</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Donasi</span></nav>
    <header className="admin-donation-heading"><div><h2>Pengaturan Donasi</h2><p>Kelola metode dan informasi donasi yang tampil pada halaman Kontak Masjid Al-Hidayah.</p></div><span className={`admin-donation-badge${readiness?.paymentReadyCount ? ' admin-donation-badge--ready' : ''}`}>{readiness?.paymentReadyCount ? `Draf · ${readiness.paymentReadyCount} metode siap dipratinjau` : 'Draf · belum lengkap'}</span></header>
    {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !values ? <p className="admin-dashboard-state" role="status">Memuat pengaturan donasi…</p> : <>
      {readiness.paymentReadyCount === 0 && <aside className="admin-donation-warning"><Info size={18} aria-hidden="true" /><div><strong>Metode donasi belum ditampilkan pada pratinjau user</strong><p>Unggah QRIS atau lengkapi rekening, lalu nyalakan metode yang ingin ditampilkan. Pengaturan yang belum lengkap tetap dapat disimpan sebagai draf.</p></div></aside>}
      <form noValidate onSubmit={save} aria-label="Formulir pengaturan donasi" aria-busy={imageBusy}>
        <div className="admin-donation-columns"><div className="admin-donation-configuration">
          <section className="admin-panel admin-donation-card" aria-labelledby="admin-donation-qris-title"><header><span className="admin-donation-icon"><ScanLine size={20} aria-hidden="true" /></span><div><h3 id="admin-donation-qris-title">Scan QRIS</h3><p>Pindai kode QRIS untuk donasi cepat dan aman.</p></div><StatusBadge complete={readiness.qris.complete} /></header><div className="admin-donation-card-body"><div className="admin-donation-qris-upload"><div className="admin-donation-qris-image">{values.qrisFile ? <img ref={qrisImage} alt="Pratinjau QRIS pilihan, belum tersimpan ke server" /> : <><ImageUp size={25} aria-hidden="true" /><strong>Belum ada gambar QRIS</strong><small>Pratinjau muncul setelah unggah</small></>}</div><div><h4>Gambar QRIS donasi</h4><p className="admin-donation-help" id="admin-donation-qris-help">Unggah QRIS resmi masjid yang jelas dan tidak terpotong. PNG atau JPG, maksimal 2 MB.</p><input ref={picker} id="admin-donation-qris-file" className="sr-only" tabIndex={-1} type="file" accept={adminDonationQrisAccept} onChange={chooseImage} aria-label="Pilih satu gambar QRIS PNG atau JPG" aria-describedby="admin-donation-qris-help" /><div className="admin-donation-upload-buttons"><button type="button" className="admin-donation-primary" onClick={() => picker.current.click()} disabled={imageBusy}><Upload size={14} aria-hidden="true" />Unggah QRIS</button><button type="button" onClick={() => picker.current.click()} disabled={!values.qrisFile || imageBusy}>Ganti</button><button type="button" onClick={removeImage} disabled={!values.qrisFile}>Hapus</button></div><p className="admin-donation-help">Ganti dan hapus tersedia setelah gambar diunggah. Gambar hanya pratinjau lokal.</p>{imageBusy && <p className="admin-donation-help" role="status">Memeriksa gambar QRIS…</p>}{imageError && <p className="admin-settings-error" role="alert">{imageError}</p>}</div></div><VisibilityToggle id="admin-donation-qrisEnabled" title="Tampilkan QRIS kepada user" description={readiness.qris.complete ? 'QRIS tersedia. Toggle hanya mengubah pratinjau simulasi.' : 'Unggah gambar QRIS terlebih dahulu untuk mengaktifkan metode ini.'} method={readiness.qris} checked={values.qrisEnabled} onChange={(value) => change('qrisEnabled', value)} /></div></section>
          <section className="admin-panel admin-donation-card" aria-labelledby="admin-donation-bank-title"><header><span className="admin-donation-icon"><Landmark size={20} aria-hidden="true" /></span><div><h3 id="admin-donation-bank-title">Transfer Bank</h3><p>Transfer ke rekening resmi untuk donasi Anda.</p></div><StatusBadge complete={readiness.bank.complete} /></header><div className="admin-donation-card-body"><div className="admin-donation-bank-fields">{field('bankName', 'Nama Bank', 'Masukkan nama bank', '', 100)}{field('accountNumber', 'Nomor Rekening', 'Masukkan nomor rekening', '', 40, false, 'numeric')}{field('accountName', 'Atas Nama', 'Masukkan nama penerima sesuai rekening', '', 160)}</div><VisibilityToggle id="admin-donation-bankEnabled" title="Tampilkan transfer bank kepada user" description="Lengkapi ketiga kolom rekening sebelum metode ini dapat ditampilkan." method={readiness.bank} checked={values.bankEnabled} onChange={(value) => change('bankEnabled', value)} /></div></section>
          <section className="admin-panel admin-donation-card admin-donation-notes" aria-labelledby="admin-donation-notes-title"><h3 id="admin-donation-notes-title">Catatan donasi</h3><p>Pesan pengingat yang ditampilkan bersama metode donasi.</p>{field('donationNote', 'Catatan donasi', '', '', 1000, true)}</section>
          <section className="admin-panel admin-donation-card" aria-labelledby="admin-donation-whatsapp-title"><header><span className="admin-donation-icon"><MessageCircle size={20} aria-hidden="true" /></span><div><h3 id="admin-donation-whatsapp-title">Konfirmasi Donasi (WhatsApp)</h3><p>Tambahkan nomor WhatsApp Takmir dan template pesan untuk konfirmasi manual.</p></div><StatusBadge complete={readiness.whatsapp.complete} /></header><div className="admin-donation-card-body admin-donation-whatsapp-fields">{field('whatsappNumber', 'Nomor WhatsApp Takmir', '628xxxxxxxxxx', 'Gunakan format internasional tanpa +, spasi atau tanda baca. Nomor ini khusus konfirmasi donasi.', 15, false, 'numeric')}{field('messageTemplate', 'Template pesan konfirmasi', '', 'Placeholder seperti [Nama donatur], [Nomor WhatsApp], [Tanggal], [Nominal] dan [Metode pembayaran] dapat diedit. Tidak ada pesan yang dikirim dari pratinjau.', 2000, true)}<VisibilityToggle id="admin-donation-whatsappEnabled" title="Tampilkan konfirmasi WhatsApp kepada user" description="Isi nomor internasional yang valid dan template pesan untuk mengaktifkan konfirmasi pada pratinjau." method={readiness.whatsapp} checked={values.whatsappEnabled} onChange={(value) => change('whatsappEnabled', value)} /></div></section>
        </div><aside className="admin-donation-sidebar">
          <section className="admin-panel admin-donation-card admin-donation-preview" aria-labelledby="admin-donation-preview-title"><header><Monitor size={19} aria-hidden="true" /><h3 id="admin-donation-preview-title">Pratinjau tampilan user</h3></header><div className="admin-donation-card-body"><p className="admin-donation-help">Tampilan bagian Donasi di halaman Kontak, sesuai pengaturan saat ini.</p><div className="admin-donation-mini-site"><header><strong>MASJID AL-HIDAYAH</strong><span>Kontak</span></header><div><h4>Donasi</h4>{!readiness.qris.enabled && !readiness.bank.enabled && <div className="admin-donation-empty"><HandHeart size={22} aria-hidden="true" /><strong>Metode donasi belum tersedia</strong><p>Informasi donasi sedang disiapkan. Silakan hubungi pengurus takmir untuk informasi lebih lanjut.</p></div>}{readiness.qris.enabled && <section className="admin-donation-preview-qris"><h5>Scan QRIS</h5><img ref={userQrisImage} alt="Simulasi QRIS yang akan ditampilkan kepada user" /></section>}{readiness.bank.enabled && <section className="admin-donation-preview-bank"><h5>Transfer Bank</h5><dl>{[['Nama Bank', values.bankName], ['Nomor Rekening', values.accountNumber], ['Atas Nama', values.accountName]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value.trim()}</dd></div>)}</dl></section>}{readiness.whatsapp.enabled && <section className="admin-donation-preview-whatsapp"><button type="button" disabled title="Pratinjau saja; tidak membuka atau mengirim pesan WhatsApp"><MessageCircle size={16} aria-hidden="true" />Konfirmasi via WhatsApp</button><small>{values.whatsappNumber.trim()} · simulasi tanpa pengiriman pesan</small><p className="admin-donation-preview-template">{values.messageTemplate}</p></section>}{values.donationNote.trim() && <p className="admin-donation-preview-note"><Info size={14} aria-hidden="true" />{values.donationNote}</p>}</div></div><p className="admin-donation-help">• Pratinjau pengaturan, bukan konfirmasi publikasi.</p></div></section>
          <section className="admin-panel admin-donation-readiness" aria-labelledby="admin-donation-readiness-title" aria-live="polite"><header><h3 id="admin-donation-readiness-title">Kesiapan metode donasi</h3><strong>{readiness.paymentReadyCount} dari 2 siap</strong></header>{[['qris', 'Scan QRIS'], ['bank', 'Transfer Bank'], ['whatsapp', 'Konfirmasi WhatsApp']].map(([key, label]) => { const method = readiness[key]; const Icon = method.enabled ? Eye : EyeOff; return <div key={key} data-donation-method={key}><h4><Icon size={15} aria-hidden="true" />{label}<span>{method.enabled ? 'Aktif (simulasi)' : 'Disembunyikan'}</span></h4><p>{method.reason}</p></div> })}</section>
          <aside className="admin-donation-safety"><ShieldCheck size={19} aria-hidden="true" /><div><strong>Pastikan tujuan donasi benar</strong><p>Gunakan QRIS dan rekening resmi masjid. Periksa kembali nama penerima sebelum menampilkan metode kepada user.</p></div></aside>
        </aside></div>
        <footer className="admin-panel admin-donation-footer"><div><strong>Simpan pengaturan sebagai draf</strong><p id="admin-donation-draft-note">Simulasi sesi admin, belum tersimpan ke server atau dipublikasikan. Metode yang belum lengkap tetap boleh disimpan sebagai draf.</p></div><div><button type="button" onClick={cancel}>Batal</button><button type="submit" className="admin-donation-primary" disabled={imageBusy}>Simpan Perubahan</button></div></footer>
        {message && <p className={Object.keys(errors).some((key) => errors[key]) ? 'admin-donation-feedback admin-donation-feedback--error' : 'admin-donation-feedback'} role="status"><CircleAlert size={17} aria-hidden="true" />{message}</p>}
      </form>
    </>}
  </div>
}
