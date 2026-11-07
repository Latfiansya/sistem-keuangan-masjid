import { ArrowRight, CalendarDays, FileText, Images, Layers } from 'lucide-react'
import ReportExportLayout, { ReportPaginationNotice } from './ReportExportLayout.jsx'
import { formatReportRange, formatReportPeriod } from '../utils/reportFormatters.js'

export default function ReportFormatPicker({ report, pages, format, onFormatChange, onBack, onNext, headingRef }) {
  if (!pages.length || report?.status !== 'ready') return <p role="status">Pratinjau belum tersedia untuk periode ini.</p>
  const count = pages.length
  return (
    <ReportExportLayout report={report} headingRef={headingRef} step={1} title="Unduh laporan keuangan" description={`Pilih format untuk menyimpan laporan ${formatReportPeriod(report.range)}.`}>
      <div className="report-export-period"><div><CalendarDays aria-hidden="true" /><span><small>Periode laporan</small><strong>{formatReportRange(report.range)}</strong></span></div><p>{report.transactions.filter((item) => item.type === 'income').length} transaksi masuk · {report.transactions.filter((item) => item.type === 'expense').length} transaksi keluar · {count} lembar</p></div>
      <fieldset className="report-format-options"><legend>Format unduhan</legend><div className="report-format-grid">
        {[
          { id: 'pdf', Icon: FileText, description: 'Satu dokumen untuk dibaca, diarsipkan, atau dicetak. Semua halaman tersimpan dalam satu berkas.', detail: `1 dokumen PDF · ${count} halaman` },
          { id: 'png', Icon: Images, description: count > 1 ? 'Gambar terpisah untuk setiap halaman laporan, dikemas dalam satu berkas ZIP.' : 'Satu gambar PNG untuk satu halaman laporan. Praktis untuk dibagikan sebagai foto.', detail: `${count} gambar PNG · ${count > 1 ? 'dalam 1 ZIP' : 'unduh langsung'}` },
        ].map(({ id, Icon, description, detail }) => <label key={id} className={`report-format-card${format === id ? ' is-selected' : ''}`}>
          <div className="report-format-title"><span><Icon aria-hidden="true" /></span><strong>{id.toUpperCase()}</strong><input type="radio" name="report-format" value={id} checked={format === id} onChange={() => onFormatChange(id)} aria-label={id.toUpperCase()} /></div>
          <p>{description}</p><span className="report-format-detail"><Layers aria-hidden="true" />{detail}</span>
        </label>)}
      </div></fieldset>
      <ReportPaginationNotice />
      <div className="report-export-actions"><button type="button" className="export-button" onClick={onBack}>Kembali ke laporan</button><div><p>Periksa isi laporan sebelum mengunduh.</p><button type="button" className="export-button export-button--primary" onClick={onNext}>Lanjut ke pratinjau <ArrowRight aria-hidden="true" /></button></div></div>
    </ReportExportLayout>
  )
}
