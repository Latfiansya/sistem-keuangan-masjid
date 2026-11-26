import { useEffect, useRef, useState } from 'react'
import { Check, Phone } from 'lucide-react'
import { getAdminWebsiteSettings, saveAdminWebsiteSettings, validateAdminWebsiteSettings } from '../services/adminWebsiteSettingsService.js'
import { dataSource } from '../utils/env.js'
import './AdminWebsiteSettingsPage.css'

export default function AdminWebsiteSettingsPage() {
  const [values, setValues] = useState(null)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const feedback = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    getAdminWebsiteSettings({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setValues(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (saved) feedback.current?.scrollIntoView({ block: 'nearest' })
  }, [saved])

  function handleChange(event) {
    const { name, type, value, checked } = event.target
    setValues((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setErrors((previous) => ({ ...previous, [name]: '' }))
    setSaved(false)
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const validation = validateAdminWebsiteSettings(values)
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
      const updated = await saveAdminWebsiteSettings(values)
      setValues(updated)
      setSaved(true)
    } catch (cause) {
      setSubmitError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-settings">
      <header className="admin-settings-heading">
        <div><h2>Kontak &amp; Pengaturan Website</h2><p>Kelola informasi kontak dan pengaturan umum website</p></div>
        <button className="admin-settings-save" type="submit" form="admin-settings-form" disabled={!values || Boolean(error) || saving}><Check size={16} aria-hidden="true" />{saving ? 'Menyimpan…' : 'Simpan Perubahan'}</button>
      </header>
      {error ? <p className="admin-dashboard-state" role="alert">{error}</p> : !values ? <p className="admin-dashboard-state" role="status">Memuat kontak dan pengaturan website…</p> : (
        <form id="admin-settings-form" className="admin-panel admin-settings-form" noValidate onSubmit={handleSubmit} aria-label="Formulir kontak dan pengaturan website" aria-describedby={dataSource === 'mock' ? 'admin-settings-note' : undefined} aria-busy={saving}>
          <h3><Phone size={18} aria-hidden="true" />Informasi Kontak</h3>
          <div className="admin-settings-field">
            <label htmlFor="admin-settings-whatsapp">Nomor WhatsApp Pengurus</label>
            <input id="admin-settings-whatsapp" name="whatsapp" type="tel" autoComplete="tel" maxLength={30} placeholder="Nomor WhatsApp belum dikonfirmasi" value={values.whatsapp} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.whatsapp)} aria-describedby={errors.whatsapp ? 'admin-settings-whatsapp-error' : undefined} />
            {errors.whatsapp && <p id="admin-settings-whatsapp-error" className="admin-settings-error" role="alert">{errors.whatsapp}</p>}
          </div>
          <div className="admin-settings-grid">
            <div className="admin-settings-field">
              <label htmlFor="admin-settings-phone">Nomor Telepon</label>
              <input id="admin-settings-phone" name="phone" type="tel" autoComplete="tel" maxLength={20} placeholder="Contoh: (0274) 123456" value={values.phone ?? ''} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'admin-settings-phone-error' : undefined} />
              {errors.phone && <p id="admin-settings-phone-error" className="admin-settings-error" role="alert">{errors.phone}</p>}
            </div>
            <div className="admin-settings-field">
              <label htmlFor="admin-settings-phoneNote">Keterangan Telepon</label>
              <input id="admin-settings-phoneNote" name="phoneNote" maxLength={100} placeholder="Contoh: Senin – Sabtu · 08.00–17.00 WIB" value={values.phoneNote ?? ''} disabled={saving} onChange={handleChange} />
            </div>
          </div>
          <div className="admin-settings-field">
            <label htmlFor="admin-settings-email">Email Pengurus</label>
            <input id="admin-settings-email" name="email" type="email" autoComplete="email" autoCapitalize="none" maxLength={254} placeholder="Email pengurus belum dikonfirmasi" value={values.email} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'admin-settings-email-error' : undefined} />
            {errors.email && <p id="admin-settings-email-error" className="admin-settings-error" role="alert">{errors.email}</p>}
          </div>
          <div className="admin-settings-field">
            <label htmlFor="admin-settings-hours">Jam Operasional</label>
            <input id="admin-settings-hours" name="hours" maxLength={150} placeholder="Contoh: Setiap hari · 04.30 – 21.00 WIB" value={values.hours ?? ''} disabled={saving} onChange={handleChange} />
          </div>
          <div className="admin-settings-field">
            <label htmlFor="admin-settings-address">Alamat Lengkap</label>
            <textarea id="admin-settings-address" name="address" rows={3} maxLength={500} autoComplete="street-address" value={values.address} disabled={saving} onChange={handleChange} />
          </div>
          <div className="admin-settings-field">
            <label htmlFor="admin-settings-mapsUrl">Link Google Maps</label>
            <input id="admin-settings-mapsUrl" name="mapsUrl" type="url" maxLength={2048} placeholder="https://maps.google.com/..." value={values.mapsUrl} disabled={saving} onChange={handleChange} aria-invalid={Boolean(errors.mapsUrl)} aria-describedby={errors.mapsUrl ? 'admin-settings-mapsUrl-error' : 'admin-settings-mapsUrl-help'} />
            <p id="admin-settings-mapsUrl-help" className="admin-settings-note">Isi tautan Google Maps resmi masjid untuk mengaktifkan peta interaktif dan tombol Buka Google Maps pada halaman Kontak.</p>
            {errors.mapsUrl && <p id="admin-settings-mapsUrl-error" className="admin-settings-error" role="alert">{errors.mapsUrl}</p>}
          </div>
          <div className="admin-settings-field">
            <label htmlFor="admin-settings-mapLabel">Label Peta</label>
            <input id="admin-settings-mapLabel" name="mapLabel" maxLength={100} placeholder="Contoh: Sorolaten, Sidokarto" value={values.mapLabel ?? ''} disabled={saving} onChange={handleChange} />
          </div>
          <label className="admin-settings-report" htmlFor="admin-settings-publicReportEnabled">
            <span><strong>Laporan Keuangan Publik</strong><span id="admin-settings-report-description" className="admin-settings-report-description">Tampilkan akses laporan di website</span></span>
            <span className="admin-settings-switch"><input id="admin-settings-publicReportEnabled" name="publicReportEnabled" type="checkbox" role="switch" checked={values.publicReportEnabled} disabled={saving} onChange={handleChange} aria-describedby={dataSource === 'mock' ? 'admin-settings-report-description admin-settings-note' : 'admin-settings-report-description'} /><span className="admin-settings-switch-track" aria-hidden="true" /></span>
          </label>
          {dataSource === 'mock' && <p id="admin-settings-note" className="admin-settings-note">Mode simulasi. Perubahan hilang saat keluar atau memuat ulang halaman. Kontak dan akses laporan publik tidak berubah; toggle ini bukan pengaman laporan.</p>}
          {submitError && <p className="admin-settings-error" role="alert">{submitError}</p>}
          {saved && <p className="admin-settings-feedback" ref={feedback} role="status">{dataSource === 'mock' ? 'Simulasi berhasil. Pengaturan tersimpan sementara di halaman ini, belum tersimpan permanen ke server. Kontak dan akses laporan publik tidak berubah.' : 'Pengaturan kontak dan website berhasil disimpan ke database.'}</p>}
        </form>
      )}
    </div>
  )
}
