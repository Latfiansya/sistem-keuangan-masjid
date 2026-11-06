import { ArrowLeft, Check, Info } from 'lucide-react'
import { formatReportYear } from '../utils/reportFormatters.js'

export default function ReportExportLayout({ report, headingRef, title, description, step, onBack, children }) {
  return (
    <div className={`report-export report-export--${step === 1 ? 'picker' : 'preview'}`}>
      <header className="report-export-header">
        {onBack && <button type="button" className="export-button export-button--back" onClick={onBack}><ArrowLeft aria-hidden="true" />Kembali</button>}
        <div><h1 ref={headingRef} tabIndex={-1}>Laporan Keuangan {formatReportYear(report.range)}</h1><p>{report.name}</p><small>Data contoh pengembangan · bukan laporan produksi</small></div>
      </header>
      <div className="report-export-introduction"><div><h2>{title}</h2><p>{description}</p></div>
        <ol className="report-export-steps" aria-label="Tahapan unduhan">
          <li aria-current={step === 1 ? 'step' : undefined} className="is-complete"><span>{step === 2 ? <Check aria-label="Selesai" /> : '1'}</span>Pilih format</li>
          <li aria-current={step === 2 ? 'step' : undefined} className={step === 2 ? 'is-complete' : ''}><span>2</span>Pratinjau &amp; unduh</li>
        </ol>
      </div>
      {children}
    </div>
  )
}

export function ReportPaginationNotice() {
  return <aside className="report-pagination-notice"><Info aria-hidden="true" /><div><h3>Dibagi otomatis sesuai panjang data</h3><p>Setiap lembar berukuran A4 lanskap (297 × 210 mm). Transaksi tetap utuh di setiap halaman, dengan pemasukan di kiri, pengeluaran di kanan, dan resume saldo periode pada halaman terakhir.</p></div></aside>
}
