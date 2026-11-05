import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { checkReportPassword } from '../services/reportService.js'

export default function ReportAccessPanel({ onAccessGranted }) {
  const [password, setPassword] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(null)

  useEffect(() => () => pending.current?.abort(), [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending.current) return
    if (!password.trim()) {
      setError('Sandi wajib diisi.')
      return
    }
    const controller = new AbortController()
    pending.current = controller
    setIsChecking(true)
    setError('')
    try {
      const { valid } = await checkReportPassword(password, { signal: controller.signal })
      if (controller.signal.aborted) return
      if (valid) {
        setPassword('')
        onAccessGranted()
      } else {
        setError('Sandi tidak cocok. Silakan coba lagi.')
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause.message || 'Pemeriksaan sandi gagal. Silakan coba lagi.')
    } finally {
      if (!controller.signal.aborted) {
        pending.current = null
        setIsChecking(false)
      }
    }
  }

  return (
    <section className="report-access-panel" aria-labelledby="report-access-heading">
      <span className="report-access-icon"><ShieldCheck aria-hidden="true" /></span>
      <span className="report-access-badge">LAPORAN KEUANGAN</span>
      <h1 id="report-access-heading">Jendela <span>Transparansi</span> Keuangan</h1>
      <p className="report-access-description">Masukkan kode akses laporan untuk melihat transparansi kas berjalan.</p>
      <form className="report-access-form" onSubmit={handleSubmit} noValidate aria-busy={isChecking}>
        <label htmlFor="report-password">Kode Akses</label>
        <input id="report-password" type="password" name="password" value={password} placeholder="••••" autoComplete="off" required disabled={isChecking} aria-describedby={error ? 'report-access-error' : undefined} aria-invalid={Boolean(error)} onChange={(event) => { setPassword(event.target.value); setError('') }} />
        {error && <p id="report-access-error" className="report-access-error" role="alert">{error}</p>}
        <button type="submit" disabled={isChecking}>{isChecking ? 'Memeriksa sandi…' : 'Buka Laporan Keuangan'}<ArrowRight aria-hidden="true" /></button>
        {isChecking && <span role="status" className="sr-only">Pemeriksaan sandi sedang berlangsung.</span>}
      </form>
      <p className="report-access-note">Akses menggunakan sandi bersama</p>
    </section>
  )
}
