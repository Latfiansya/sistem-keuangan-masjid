import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { loginAdmin, validateAdminLogin } from '../services/adminAuthService.js'
import './AdminLoginPage.css'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(state?.message || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pending = useRef(null)

  useEffect(() => () => pending.current?.abort(), [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending.current) return
    const form = event.currentTarget
    const validation = validateAdminLogin({ email, password })
    setErrors(validation)
    setError('')
    if (Object.keys(validation).length) {
      form.elements.namedItem(Object.keys(validation)[0]).focus()
      return
    }

    const controller = new AbortController()
    pending.current = controller
    setIsSubmitting(true)
    try {
      await loginAdmin({ email: email.trim(), password }, { signal: controller.signal })
      if (!controller.signal.aborted) {
        pending.current = null
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause.message)
    } finally {
      if (!controller.signal.aborted) {
        setPassword('')
        setShowPassword(false)
        setIsSubmitting(false)
        pending.current = null
      }
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login-brand" aria-labelledby="admin-login-brand-title">
        <div className="admin-login-brand-copy">
          <img className="admin-login-logo" src={`${import.meta.env.BASE_URL}assets/masjid-logo.webp`} alt="Masjid Al-Hidayah" width="640" height="191" />
          <h2 id="admin-login-brand-title">Sistem Informasi <br />Keuangan Masjid</h2>
          <p>Platform pengelolaan keuangan dan konten website Masjid Al Hidayah Sorolaten yang transparan dan terpercaya.</p>
        </div>
      </section>
      <section className="admin-login-content" aria-labelledby="admin-login-title">
        <div className="admin-login-card">
          <h1 id="admin-login-title">Masuk Pengurus</h1>
          <p className="admin-login-description">Masuk ke dashboard pengelolaan keuangan dan konten website Masjid Al Hidayah Sorolaten.</p>
          <form className="admin-login-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <div className="admin-login-field">
              <label htmlFor="admin-email">Email<span aria-hidden="true">*</span></label>
              <input id="admin-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} disabled={isSubmitting} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'admin-email-error' : undefined} onChange={(event) => { setEmail(event.target.value); setErrors((previous) => ({ ...previous, email: '' })); setError('') }} />
              {errors.email && <p id="admin-email-error" className="admin-login-error" role="alert">{errors.email}</p>}
            </div>
            <div className="admin-login-field">
              <label htmlFor="admin-password">Password<span aria-hidden="true">*</span></label>
              <div className="admin-login-password">
                <input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} disabled={isSubmitting} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'admin-password-error' : undefined} onChange={(event) => { setPassword(event.target.value); setErrors((previous) => ({ ...previous, password: '' })); setError('') }} />
                <button className="admin-login-password-toggle" type="button" disabled={isSubmitting} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-controls="admin-password" title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPassword((previous) => !previous)}>
                  {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="admin-password-error" className="admin-login-error" role="alert">{errors.password}</p>}
            </div>
            {error && <p className="admin-login-error admin-login-submit-error" role="alert">{error}</p>}
            <button className="admin-login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Memeriksa akses…' : 'Masuk Dashboard'}</button>
            {isSubmitting && <span className="sr-only" role="status">Sedang memeriksa akses pengurus.</span>}
          </form>
        </div>
      </section>
    </main>
  )
}
