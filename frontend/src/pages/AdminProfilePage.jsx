import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Phone } from 'lucide-react'
import { adminProfilePhotoAccept, getAdminProfile, validateAdminProfile, validateAdminProfilePhoto } from '../services/adminProfileService.js'
import './AdminProfilePage.css'

export default function AdminProfilePage() {
  const [values, setValues] = useState({ name: '', description: '', address: '', contact: '' })
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const feedback = useRef(null)
  const [photo, setPhoto] = useState(null)
  const photoFile = photo?.file
  const photoPreview = photo?.url || ''
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAdminProfile({ signal: controller.signal })
      .then((profile) => { if (!controller.signal.aborted) { setValues(profile); setReady(true) } })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  useEffect(() => {
    if (saved) feedback.current?.scrollIntoView({ block: 'nearest' })
  }, [saved])

  function handlePhotoChange(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setSaved(false)
    const validation = validateAdminProfilePhoto(files)
    setPhotoError(validation)
    if (validation) return
    setPhoto({ file: files[0], url: URL.createObjectURL(files[0]) })
  }

  function cancelPhoto() {
    setPhoto(null)
    setPhotoError('')
    setSaved(false)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setSaved(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const validation = validateAdminProfile(values)
    setErrors(validation)
    setSaved(false)
    if (Object.keys(validation).length) {
      event.currentTarget.elements.namedItem(Object.keys(validation)[0]).focus()
      return
    }
    setSaved(true)
  }

  return (
    <div className="admin-profile">
      <header className="admin-profile-heading">
        <div><h2>Profil Masjid</h2><p>Kelola informasi profil Masjid Al Hidayah Sorolaten</p></div>
        <button className="admin-profile-save" type="submit" form="admin-profile-form" disabled={!ready || Boolean(error)}><Check size={16} aria-hidden="true" />Simpan Perubahan</button>
      </header>
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !ready ? <p className="admin-dashboard-state" role="status">Memuat profil masjid…</p> : (
        <form id="admin-profile-form" className="admin-panel admin-profile-form" noValidate onSubmit={handleSubmit} aria-label="Formulir profil masjid" aria-describedby="admin-profile-note">
          <div className="admin-profile-banner">
            <p>Foto / Banner Masjid</p>
            <div className="admin-profile-photo">
              <img src={photoPreview || `${import.meta.env.BASE_URL}assets/masjid-background.webp`} alt={photoPreview ? 'Pratinjau foto masjid pilihan, belum tersimpan ke server' : 'Tampak depan Masjid Al-Hidayah Sorolaten'} width="1928" height="1089" onError={() => { if (photoPreview) { setPhoto(null); setPhotoError('Gambar tidak dapat dibaca. Pilih berkas JPG, PNG atau WebP yang valid.'); setSaved(false) } }} />
              <label className="admin-profile-photo-picker"><Camera size={16} aria-hidden="true" /><span>Ganti Foto</span><input id="admin-profile-photo" name="photo" type="file" accept={adminProfilePhotoAccept} aria-label="Ganti foto masjid" aria-invalid={Boolean(photoError)} aria-describedby={`admin-profile-photo-help${photoError ? ' admin-profile-photo-error' : ''}`} onChange={handlePhotoChange} /></label>
            </div>
            <div className="admin-profile-photo-info"><p id="admin-profile-photo-help" className="admin-profile-help">Satu gambar JPG, PNG atau WebP, maksimal 5 MB.</p>{photoFile && <button className="admin-profile-photo-cancel" type="button" onClick={cancelPhoto}>Batalkan Foto</button>}</div>
            {photoError && <p id="admin-profile-photo-error" className="admin-profile-error" role="alert">{photoError}</p>}
            {photoFile && <p className="admin-profile-help" role="status">Foto baru hanya dipratinjau dan belum tersimpan ke server. Batalkan Foto untuk kembali ke foto sebelumnya.</p>}
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-name">Nama Masjid<span aria-hidden="true">*</span></label>
            <input id="admin-profile-name" name="name" required maxLength={160} value={values.name} onChange={handleChange} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'admin-profile-name-error' : undefined} />
            {errors.name && <p id="admin-profile-name-error" className="admin-profile-error" role="alert">{errors.name}</p>}
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-description">Deskripsi Singkat</label>
            <textarea id="admin-profile-description" name="description" rows={3} maxLength={1000} value={values.description} onChange={handleChange} />
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-address">Alamat</label>
            <textarea id="admin-profile-address" name="address" rows={2} maxLength={500} value={values.address} onChange={handleChange} autoComplete="street-address" />
          </div>
          <div className="admin-profile-field admin-profile-contact">
            <label htmlFor="admin-profile-contact"><Phone size={16} aria-hidden="true" />Kontak</label>
            <input id="admin-profile-contact" name="contact" type="tel" autoComplete="tel" maxLength={30} value={values.contact} onChange={handleChange} aria-invalid={Boolean(errors.contact)} aria-describedby={`admin-profile-contact-help${errors.contact ? ' admin-profile-contact-error' : ''}`} />
            {errors.contact && <p id="admin-profile-contact-error" className="admin-profile-error" role="alert">{errors.contact}</p>}
            <p id="admin-profile-contact-help" className="admin-profile-help">Opsional. Nomor telepon resmi belum tersedia.</p>
          </div>
          <p id="admin-profile-note" className="admin-profile-note">Mode simulasi: perubahan hanya berlaku di halaman ini dan akan hilang saat halaman ditinggalkan atau dimuat ulang. Profil publik tidak berubah.</p>
          {saved && <p ref={feedback} className="admin-profile-feedback" role="status">Simulasi berhasil. Perubahan tersimpan sementara di halaman ini, belum tersimpan permanen ke server.{photoFile && ' Foto baru hanya dipratinjau dan belum tersimpan ke server.'}</p>}
        </form>
      )}
    </div>
  )
}
