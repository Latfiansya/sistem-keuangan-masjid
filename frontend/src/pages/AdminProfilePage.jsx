import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Phone } from 'lucide-react'
import { adminProfilePhotoAccept, getAdminProfile, saveAdminProfile, validateAdminProfile, validateAdminProfileLogo, validateAdminProfilePhoto } from '../services/adminProfileService.js'
import { removeAdminFile, resolveUploadedImage, uploadAdminFile } from '../services/adminFileService.js'
import { dataSource } from '../utils/env.js'
import './AdminProfilePage.css'

export default function AdminProfilePage() {
  const [values, setValues] = useState({ name: '', tagline: '', description: '', location: '', foundedYear: '', buildingArea: '', buildingAreaNote: '', capacity: '', capacityNote: '', vision: '', managementPeriod: '', address: '', contact: '', photoPath: null })
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const feedback = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [photoLoadFallback, setPhotoLoadFallback] = useState(false)
  const photoFile = photo?.file
  const photoPreview = photo?.url || ''
  const [photoError, setPhotoError] = useState('')
  const [photoReset, setPhotoReset] = useState(false)
  const [logo, setLogo] = useState(null)
  const [logoError, setLogoError] = useState('')
  const [logoReset, setLogoReset] = useState(false)
  const logoFile = logo?.file
  const logoPreview = logo?.url || ''
  const [uploadNote, setUploadNote] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getAdminProfile({ signal: controller.signal })
      .then((profile) => {
        if (!controller.signal.aborted) {
          setValues((previous) => ({ ...previous, ...profile }))
          setReady(true)
        }
      })
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
    setSubmitError('')
    const validation = validateAdminProfilePhoto(files)
    setPhotoError(validation)
    if (validation) return
    setPhoto({ file: files[0], url: URL.createObjectURL(files[0]) })
    setPhotoReset(false)
  }

  function cancelPhoto() {
    setPhoto(null)
    setPhotoError('')
    setPhotoReset(false)
    setSaved(false)
  }

  function handleLogoChange(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setSaved(false)
    setSubmitError('')
    const validation = validateAdminProfileLogo(files)
    setLogoError(validation)
    if (validation) return
    setLogo({ file: files[0], url: URL.createObjectURL(files[0]) })
    setLogoReset(false)
  }

  function cancelLogo() {
    setLogo(null)
    setLogoError('')
    setLogoReset(false)
    setSaved(false)
  }

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
  }, [logoPreview])

  // Unggah atau hapus berkas sebelum profil disimpan; mengembalikan catatan untuk pesan sukses.
  async function applyFileChanges() {
    const notes = []
    let changes = {}
    if (photoFile) {
      const result = await uploadAdminFile('masjid-photo', photoFile)
      changes = { ...changes, photoPath: result.path }
      notes.push('foto masjid diunggah')
    } else if (photoReset) {
      await removeAdminFile('masjid-photo')
      changes = { ...changes, photoPath: null }
      notes.push('foto masjid dikembalikan ke bawaan')
    }
    if (logoFile) {
      const result = await uploadAdminFile('logo', logoFile)
      changes = { ...changes, logoPath: result.path }
      notes.push('logo diunggah')
    } else if (logoReset) {
      await removeAdminFile('logo')
      changes = { ...changes, logoPath: null }
      notes.push('logo dikembalikan ke bawaan')
    }
    return { changes, notes }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setSaved(false)
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const validation = validateAdminProfile(values)
    setErrors(validation)
    setSaved(false)
    setSubmitError('')
    if (Object.keys(validation).length) {
      event.currentTarget.elements.namedItem(Object.keys(validation)[0]).focus()
      return
    }
    if (dataSource === 'mock') {
      setSaved(true)
      return
    }
    setSaving(true)
    try {
      const { changes, notes } = await applyFileChanges()
      if (Object.keys(changes).length) setValues((previous) => ({ ...previous, ...changes }))
      setPhoto(null)
      setLogo(null)
      setPhotoReset(false)
      setLogoReset(false)
      const updated = await saveAdminProfile(values)
      setValues((previous) => ({ ...previous, ...updated }))
      setUploadNote(notes.length ? ` Berkas: ${notes.join(', ')}.` : '')
      setSaved(true)
    } catch (cause) {
      setSubmitError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  const fallbackPhoto = `${import.meta.env.BASE_URL}assets/masjid-background.webp`
  const uploadedPhoto = photoReset ? null : resolveUploadedImage(values.photoPath)
  const currentServerPhoto = !photoLoadFallback && uploadedPhoto ? uploadedPhoto : fallbackPhoto
  const fallbackLogo = `${import.meta.env.BASE_URL}assets/masjid-logo.webp`
  const uploadedLogo = logoReset ? null : resolveUploadedImage(values.logoPath)

  return (
    <div className="admin-profile">
      <header className="admin-profile-heading">
        <div><h2>Profil Masjid</h2><p>Kelola informasi profil Masjid Al Hidayah Sorolaten</p></div>
        <button className="admin-profile-save" type="submit" form="admin-profile-form" disabled={!ready || Boolean(error) || saving}><Check size={16} aria-hidden="true" />{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</button>
      </header>
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !ready ? <p className="admin-dashboard-state" role="status">Memuat profil masjid…</p> : (
        <form id="admin-profile-form" className="admin-panel admin-profile-form" noValidate onSubmit={handleSubmit} aria-label="Formulir profil masjid" aria-describedby={dataSource === 'mock' ? 'admin-profile-note' : undefined} aria-busy={saving}>
          <div className="admin-profile-banner">
            <p>Foto / Banner Masjid</p>
            <div className="admin-profile-photo">
              <img src={photoPreview || currentServerPhoto} alt={photoPreview ? 'Pratinjau foto masjid pilihan, belum tersimpan ke server' : 'Tampak depan Masjid Al-Hidayah Sorolaten'} width="1928" height="1089" onError={() => { if (photoPreview) { setPhoto(null); setPhotoError('Gambar tidak dapat dibaca. Pilih berkas JPG, PNG atau WebP yang valid.'); setSaved(false) } else if (values.photoPath && !photoLoadFallback) { setPhotoLoadFallback(true) } }} />
              <label className="admin-profile-photo-picker"><Camera size={16} aria-hidden="true" /><span>Ganti Foto</span><input id="admin-profile-photo" name="photo" type="file" accept={adminProfilePhotoAccept} aria-label="Ganti foto masjid" aria-invalid={Boolean(photoError)} aria-describedby={`admin-profile-photo-help${photoError ? ' admin-profile-photo-error' : ''}`} onChange={handlePhotoChange} /></label>
            </div>
            <div className="admin-profile-photo-info"><p id="admin-profile-photo-help" className="admin-profile-help">Satu gambar JPG, PNG atau WebP, maksimal 5 MB. Dipakai sebagai latar halaman publik.</p>{photoFile || photoReset ? <button className="admin-profile-photo-cancel" type="button" disabled={saving} onClick={cancelPhoto}>Batalkan</button> : uploadedPhoto && dataSource !== 'mock' && <button className="admin-profile-photo-cancel" type="button" disabled={saving} onClick={() => { setPhotoReset(true); setSaved(false) }}>Pakai Foto Bawaan</button>}</div>
            {photoError && <p id="admin-profile-photo-error" className="admin-profile-error" role="alert">{photoError}</p>}
            {(photoFile || photoReset) && <p className="admin-profile-help" role="status">{dataSource === 'mock' ? 'Mode simulasi: foto baru hanya dipratinjau dan tidak diunggah.' : photoReset ? 'Foto bawaan akan dipakai kembali setelah Simpan Perubahan.' : 'Foto baru akan diunggah ke server saat Simpan Perubahan.'}</p>}
          </div>
          <div className="admin-profile-logo">
            <p>Logo Masjid</p>
            <div className="admin-profile-logo-row">
              <img src={logoPreview || uploadedLogo || fallbackLogo} alt={logoPreview ? 'Pratinjau logo masjid pilihan, belum tersimpan ke server' : 'Logo Masjid Al-Hidayah'} width="640" height="191" onError={() => { if (logoPreview) { setLogo(null); setLogoError('Gambar tidak dapat dibaca. Pilih berkas JPG, PNG atau WebP yang valid.') } }} />
              <div className="admin-profile-logo-actions">
                <label className="admin-profile-photo-cancel admin-profile-logo-picker"><Camera size={16} aria-hidden="true" /><span>Ganti Logo</span><input id="admin-profile-logo" name="logo" type="file" accept={adminProfilePhotoAccept} aria-label="Ganti logo masjid" aria-invalid={Boolean(logoError)} aria-describedby={`admin-profile-logo-help${logoError ? ' admin-profile-logo-error' : ''}`} disabled={saving} onChange={handleLogoChange} /></label>
                {logoFile || logoReset ? <button className="admin-profile-photo-cancel" type="button" disabled={saving} onClick={cancelLogo}>Batalkan</button> : uploadedLogo && dataSource !== 'mock' && <button className="admin-profile-photo-cancel" type="button" disabled={saving} onClick={() => { setLogoReset(true); setSaved(false) }}>Pakai Logo Bawaan</button>}
              </div>
            </div>
            <p id="admin-profile-logo-help" className="admin-profile-help">Satu gambar JPG, PNG atau WebP, maksimal 2 MB; disarankan latar transparan dan rasio lebar seperti logo bawaan. Dipakai pada Navbar halaman publik.</p>
            {logoError && <p id="admin-profile-logo-error" className="admin-profile-error" role="alert">{logoError}</p>}
            {(logoFile || logoReset) && <p className="admin-profile-help" role="status">{dataSource === 'mock' ? 'Mode simulasi: logo baru hanya dipratinjau dan tidak diunggah.' : logoReset ? 'Logo bawaan akan dipakai kembali setelah Simpan Perubahan.' : 'Logo baru akan diunggah ke server saat Simpan Perubahan.'}</p>}
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-name">Nama Masjid<span aria-hidden="true">*</span></label>
            <input id="admin-profile-name" name="name" required maxLength={160} value={values.name} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'admin-profile-name-error' : undefined} />
            {errors.name && <p id="admin-profile-name-error" className="admin-profile-error" role="alert">{errors.name}</p>}
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-tagline">Tagline Beranda</label>
            <textarea id="admin-profile-tagline" name="tagline" rows={2} maxLength={255} value={values.tagline ?? ''} disabled={saving} onChange={handleChange} aria-describedby="admin-profile-tagline-help" />
            <p id="admin-profile-tagline-help" className="admin-profile-help">Kalimat singkat di bawah nama masjid pada Beranda. Maksimal 255 karakter.</p>
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-description">Deskripsi Singkat</label>
            <textarea id="admin-profile-description" name="description" rows={3} maxLength={1000} value={values.description ?? ''} disabled={saving} onChange={handleChange} aria-describedby="admin-profile-description-help" />
            <p id="admin-profile-description-help" className="admin-profile-help">Pengantar pada halaman Profil.</p>
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-vision">Visi</label>
            <textarea id="admin-profile-vision" name="vision" rows={2} maxLength={255} value={values.vision ?? ''} disabled={saving} onChange={handleChange} aria-describedby="admin-profile-vision-help" />
            <p id="admin-profile-vision-help" className="admin-profile-help">Daftar misi, program, sejarah, dan pengurus diatur di menu Konten Profil.</p>
          </div>
          <div className="admin-profile-grid">
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-location">Lokasi Singkat</label>
              <input id="admin-profile-location" name="location" maxLength={100} placeholder="Contoh: Sorolaten" value={values.location ?? ''} disabled={saving} onChange={handleChange} />
            </div>
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-foundedYear">Tahun Berdiri</label>
              <input id="admin-profile-foundedYear" name="foundedYear" type="number" inputMode="numeric" min={1800} max={2100} step={1} value={values.foundedYear ?? ''} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.foundedYear)} aria-describedby={errors.foundedYear ? 'admin-profile-foundedYear-error' : undefined} />
              {errors.foundedYear && <p id="admin-profile-foundedYear-error" className="admin-profile-error" role="alert">{errors.foundedYear}</p>}
            </div>
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-managementPeriod">Periode Pengurus</label>
              <input id="admin-profile-managementPeriod" name="managementPeriod" maxLength={20} placeholder="Contoh: 2023–2026" value={values.managementPeriod ?? ''} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.managementPeriod)} aria-describedby={errors.managementPeriod ? 'admin-profile-managementPeriod-error' : undefined} />
              {errors.managementPeriod && <p id="admin-profile-managementPeriod-error" className="admin-profile-error" role="alert">{errors.managementPeriod}</p>}
            </div>
          </div>
          <div className="admin-profile-grid admin-profile-grid--stat">
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-buildingArea">Luas Bangunan (m²)</label>
              <input id="admin-profile-buildingArea" name="buildingArea" type="number" inputMode="numeric" min={0} max={1000000} step={1} value={values.buildingArea ?? ''} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.buildingArea)} aria-describedby={errors.buildingArea ? 'admin-profile-buildingArea-error' : undefined} />
              {errors.buildingArea && <p id="admin-profile-buildingArea-error" className="admin-profile-error" role="alert">{errors.buildingArea}</p>}
            </div>
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-buildingAreaNote">Keterangan Luas</label>
              <textarea id="admin-profile-buildingAreaNote" name="buildingAreaNote" rows={2} maxLength={255} value={values.buildingAreaNote ?? ''} disabled={saving} onChange={handleChange} />
            </div>
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-capacity">Kapasitas Jamaah</label>
              <input id="admin-profile-capacity" name="capacity" type="number" inputMode="numeric" min={0} max={1000000} step={1} value={values.capacity ?? ''} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.capacity)} aria-describedby={errors.capacity ? 'admin-profile-capacity-error' : undefined} />
              {errors.capacity && <p id="admin-profile-capacity-error" className="admin-profile-error" role="alert">{errors.capacity}</p>}
            </div>
            <div className="admin-profile-field">
              <label htmlFor="admin-profile-capacityNote">Keterangan Kapasitas</label>
              <textarea id="admin-profile-capacityNote" name="capacityNote" rows={2} maxLength={255} value={values.capacityNote ?? ''} disabled={saving} onChange={handleChange} />
            </div>
          </div>
          <div className="admin-profile-field">
            <label htmlFor="admin-profile-address">Alamat</label>
            <textarea id="admin-profile-address" name="address" rows={2} maxLength={500} value={values.address} disabled={saving} onChange={handleChange} autoComplete="street-address" />
          </div>
          <div className="admin-profile-field admin-profile-contact">
            <label htmlFor="admin-profile-contact"><Phone size={16} aria-hidden="true" />Telepon</label>
            <input id="admin-profile-contact" name="contact" type="tel" autoComplete="tel" maxLength={30} value={values.contact} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.contact)} aria-describedby={`admin-profile-contact-help${errors.contact ? ' admin-profile-contact-error' : ''}`} />
            {errors.contact && <p id="admin-profile-contact-error" className="admin-profile-error" role="alert">{errors.contact}</p>}
            <p id="admin-profile-contact-help" className="admin-profile-help">Opsional.{dataSource === 'mock' ? ' Nomor telepon resmi belum tersedia.' : ''}</p>
          </div>
          {dataSource === 'mock' && <p id="admin-profile-note" className="admin-profile-note">Mode simulasi: perubahan hanya berlaku di halaman ini dan akan hilang saat halaman ditinggalkan atau dimuat ulang. Profil publik tidak berubah.</p>}
          {submitError && <p className="admin-profile-error" role="alert">{submitError}</p>}
          {saved && <p ref={feedback} className="admin-profile-feedback" role="status">{dataSource === 'mock' ? `Simulasi berhasil. Perubahan tersimpan sementara di halaman ini, belum tersimpan permanen ke server.${photoFile || logoFile ? ' Foto/logo baru hanya dipratinjau dan belum tersimpan ke server.' : ''}` : `Perubahan profil masjid berhasil disimpan ke database.${uploadNote}`}</p>}
        </form>
      )}
    </div>
  )
}
