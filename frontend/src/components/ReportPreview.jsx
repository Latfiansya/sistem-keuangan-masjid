import { useEffect, useRef, useState } from 'react'
import { Copy, FileText, Images, Maximize } from 'lucide-react'
import ReportExportLayout, { ReportPaginationNotice } from './ReportExportLayout.jsx'
import ReportSheet from './ReportSheet.jsx'
import { formatReportRange, formatReportPeriod } from '../utils/reportFormatters.js'
import { describeSheet, REPORT_SHEET_LAYOUT } from '../utils/reportPagination.js'

export default function ReportPreview({ report, pages, format, onFormatChange, onBack, headingRef }) {
  const [fitWidth, setFitWidth] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)
  const [availableWidth, setAvailableWidth] = useState(0)
  const sheetsContainer = useRef(null)
  useEffect(() => {
    if (!sheetsContainer.current) return
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width))
    observer.observe(sheetsContainer.current)
    return () => observer.disconnect()
  }, [])
  if (!pages.length || report?.status !== 'ready') return <p role="status">Pratinjau belum tersedia untuk periode ini.</p>
  const count = pages.length
  const period = formatReportPeriod(report.range)
  const isPdf = format === 'pdf'
  const downloadLabel = isPdf ? `Unduh PDF · ${count} halaman` : `Unduh ${count} gambar PNG`
  const filename = `Laporan_Al-Hidayah_${report.range.startDate}_${report.range.endDate}`
  const readingScale = availableWidth && availableWidth < 768 ? 1.25 : 1
  const scale = fitWidth && availableWidth ? availableWidth / REPORT_SHEET_LAYOUT.width : readingScale
  return (
    <ReportExportLayout report={report} headingRef={headingRef} step={2} onBack={onBack} title="Pratinjau sebelum unduh" description={`Periksa ${count} lembar laporan ${period} sebelum mengunduh.`}>
      <div className="report-preview-toolbar"><div className="report-preview-format"><small>Format unduhan</small><div>{[['pdf', FileText], ['png', Images]].map(([id, Icon]) => <button key={id} type="button" aria-pressed={format === id} className={format === id ? 'is-selected' : ''} onClick={() => onFormatChange(id)}><Icon aria-hidden="true" />{id.toUpperCase()}</button>)}</div></div><div className="report-preview-meta"><strong>{isPdf ? `1 dokumen PDF · ${count} halaman` : `${count} gambar PNG terpisah`}</strong><p id="report-export-unavailable">Pratinjau saja · fitur ekspor belum tersedia.</p><small>A4 lanskap · 297 × 210 mm · {formatReportRange(report.range)}</small></div><div className="report-preview-toolbar-actions"><button type="button" className="export-button" onClick={onBack}>Ubah format</button><button type="button" className="export-button export-button--primary" disabled aria-describedby="report-export-unavailable">{downloadLabel}</button></div></div>
      <ReportPaginationNotice />
      <div className={`report-preview-workspace${fitWidth ? ' is-fit-width' : ''}`}>
        <header className="report-preview-workspace-header"><Copy aria-hidden="true" /><div><strong>{count} halaman · Semua halaman ditampilkan</strong><p>Rencana nama berkas: {filename}{isPdf ? '.pdf' : '_[nomor halaman].png'}</p></div><button type="button" onClick={() => setFitWidth((previous) => !previous)} aria-pressed={fitWidth}><Maximize aria-hidden="true" />Lebar halaman</button><span>A4 lanskap</span></header>
        <p className="report-preview-scroll-hint">Geser lembar ke samping untuk membaca seluruh isi.</p>
        <div className="report-preview-sheets" ref={sheetsContainer}>{pages.map((page) => <section key={page.number} className="report-preview-page"><div className="report-preview-page-label"><h3>{isPdf ? `Halaman ${page.number} dari ${count}` : `Gambar ${page.number} dari ${count} · Halaman ${page.number}`}</h3><p>{describeSheet(page)}</p></div><div className="report-sheet-scroll" role="region" tabIndex={0} aria-label={`Pratinjau lembar ${page.number}, dapat digeser`}><div className="report-sheet-size" style={{ width: REPORT_SHEET_LAYOUT.width * scale, height: REPORT_SHEET_LAYOUT.height * scale, '--report-preview-scale': scale }}><ReportSheet report={report} page={page} pageCount={count} /></div></div></section>)}</div>
      </div>
      <div className="report-export-actions"><button type="button" className="export-button" onClick={onBack}>Kembali ke pilihan format</button><div><p>{isPdf ? `1 berkas PDF berisi ${count} halaman` : `${count} berkas PNG, masing-masing 1 halaman`}</p><button type="button" className="export-button export-button--primary" disabled aria-describedby="report-export-unavailable">{downloadLabel}</button></div></div>
    </ReportExportLayout>
  )
}
