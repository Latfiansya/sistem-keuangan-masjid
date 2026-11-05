import { useEffect, useRef, useState } from 'react'
import Button from '../components/Button.jsx'
import ReportAccessPanel from '../components/ReportAccessPanel.jsx'

export default function FinancialReportPage() {
  const [hasAccess, setHasAccess] = useState(false)
  const heading = useRef(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    if (hasAccess) heading.current?.focus()
  }, [hasAccess])

  return (
    <main className={`report-page${hasAccess ? ' report-page--opened' : ''}`}>
      {hasAccess ? <section className="report-placeholder">
        <h1 ref={heading} tabIndex={-1}>Laporan Keuangan</h1>
        <p>Tampilan dan kebutuhan data laporan akan disepakati pada milestone berikutnya.</p>
        <Button to="/">Kembali ke Beranda</Button>
      </section> : <ReportAccessPanel onAccessGranted={() => setHasAccess(true)} />}
    </main>
  )
}
