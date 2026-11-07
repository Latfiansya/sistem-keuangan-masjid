import { useEffect, useRef, useState } from 'react'
import { Copy, FileText, Images, Maximize } from 'lucide-react'
import ReportExportLayout, { ReportPaginationNotice } from './ReportExportLayout.jsx'
import ReportSheet from './ReportSheet.jsx'
import { formatReportRange, formatReportPeriod } from '../utils/reportFormatters.js'
import { describeSheet, REPORT_SHEET_LAYOUT } from '../utils/reportPagination.js'
import { createReportExport, downloadReportFile, getReportExportName } from '../services/reportExportService.js'

export default function ReportPreview({ report, pages, format, onFormatChange, onBack, headingRef }) {
  const [fitWidth, setFitWidth] = useState(() => typeof window === 'undefined' || window.innerWidth >= 768)
  const [availableWidth, setAvailableWidth] = useState(0)
  const sheetsContainer = useRef(null)
  const exportController = useRef(null)
  const [exportState, setExportState] = useState({ busy: false, message: '', error: '' })
  useEffect(() => () => exportController.current?.abort(), [])
  useEffect(() => {
    if (!sheetsContainer.current) return
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width))
    observer.observe(sheetsContainer.current)
    return () => observer.disconnect()
  }, [])

  function changeFormat(nextFormat) {
    if (exportController.current) return
    onFormatChange(nextFormat)
    setExportState({ busy: false, message: '', error: '' })
  }

  async function handleExport() {
    if (exportController.current) return
    const controller = new AbortController()
    exportController.current = controller
    setExportState({ busy: true, message: 'Menyiapkan ekspor laporan…', error: '' })
    try {
      const file = await createReportExport({ report, pages, format,
        sheets: [...sheetsContainer.current.querySelectorAll('.report-sheet')], signal: controller.signal,
        onProgress: (message) => { if (!controller.signal.aborted) setExportState({ busy: true, message, error: '' }) },
      })
      controller.signal.throwIfAborted()
      downloadReportFile(file)
      setExportState({ busy: false, message: `Berkas ${file.filename} telah dibuat; unduhan dimulai. Periksa unduhan browser.`, error: '' })
    } catch (cause) {
      if (!controller.signal.aborted) setExportState({ busy: false, message: '', error: `Ekspor gagal. ${cause.message} Silakan coba lagi.` })
    } finally {
      exportController.current = null
    }
  }

  if (!pages.length || report?.status !== 'ready') return <p role="status">Pratinjau belum tersedia untuk periode ini.</p>
  const count = pages.length
  const period = formatReportPeriod(report.range)
  const isPdf = format === 'pdf'
  const { busy, message, error } = exportState
  const downloadLabel = busy ? 'Mengekspor…' : isPdf ? `Unduh PDF · ${count} halaman` : count > 1 ? `Unduh ZIP · ${count} PNG` : 'Unduh PNG'
  const filename = getReportExportName(report.range, format, count)
  const exportDescription = isPdf ? 'PDF berbasis gambar · teks belum dapat diseleksi.' : count > 1 ? `1 ZIP berisi ${count} gambar PNG, masing-masing 1 halaman.` : '1 gambar PNG · unduh langsung.'
  const readingScale = availableWidth && availableWidth < 768 ? 1.25 : 1
  const scale = fitWidth && availableWidth ? availableWidth / REPORT_SHEET_LAYOUT.width : readingScale
  return (
    <ReportExportLayout report={report} headingRef={headingRef} step={2} onBack={onBack} busy={busy} title="Pratinjau sebelum unduh" description={`Periksa ${count} lembar laporan ${period} sebelum mengunduh.`}>
      <div className="report-preview-toolbar"><div className="report-preview-format"><small>Format unduhan</small><div>{[['pdf', FileText], ['png', Images]].map(([id, Icon]) => <button key={id} type="button" aria-pressed={format === id} className={format === id ? 'is-selected' : ''} disabled={busy} onClick={() => changeFormat(id)}><Icon aria-hidden="true" />{id.toUpperCase()}</button>)}</div></div><div className="report-preview-meta"><strong>{isPdf ? `1 dokumen PDF · ${count} halaman` : `${count} gambar PNG${count > 1 ? ' dalam ZIP' : ''}`}</strong><p>{exportDescription}</p><small>A4 lanskap · 297 × 210 mm · {formatReportRange(report.range)}</small></div><div className="report-preview-toolbar-actions" aria-busy={busy}><button type="button" className="export-button" onClick={onBack} disabled={busy}>Ubah format</button><button type="button" className="export-button export-button--primary" onClick={handleExport} disabled={busy} aria-describedby="report-export-status">{downloadLabel}</button></div></div>
      <p id="report-export-status" className={`report-export-status${error ? ' report-export-status--error' : ''}`} role={error ? 'alert' : 'status'}>{error || message}</p>
      <ReportPaginationNotice />
      <div className={`report-preview-workspace${fitWidth ? ' is-fit-width' : ''}`}>
        <header className="report-preview-workspace-header"><Copy aria-hidden="true" /><div><strong>{count} halaman · Semua halaman ditampilkan</strong><p>Nama berkas: {filename}</p></div><button type="button" onClick={() => setFitWidth((previous) => !previous)} aria-pressed={fitWidth} disabled={busy}><Maximize aria-hidden="true" />Lebar halaman</button><span>A4 lanskap</span></header>
        {!fitWidth && <p className="report-preview-scroll-hint">Geser lembar ke samping untuk membaca seluruh isi.</p>}
        <div className="report-preview-sheets" ref={sheetsContainer}>{pages.map((page) => <section key={page.number} className="report-preview-page"><div className="report-preview-page-label"><h3>{isPdf ? `Halaman ${page.number} dari ${count}` : `Gambar ${page.number} dari ${count} · Halaman ${page.number}`}</h3><p>{describeSheet(page)}</p></div><div className="report-sheet-scroll" role="region" tabIndex={0} aria-label={`Pratinjau lembar ${page.number}, dapat digeser`}><div className="report-sheet-size" style={{ width: REPORT_SHEET_LAYOUT.width * scale, height: REPORT_SHEET_LAYOUT.height * scale, '--report-preview-scale': scale }}><ReportSheet report={report} page={page} pageCount={count} /></div></div></section>)}</div>
      </div>
      <div className="report-export-actions"><button type="button" className="export-button" onClick={onBack} disabled={busy}>Kembali ke pilihan format</button><div><p>{isPdf ? `1 berkas PDF berisi ${count} halaman` : count > 1 ? `1 ZIP berisi ${count} gambar PNG` : '1 gambar PNG'}</p><button type="button" className="export-button export-button--primary" onClick={handleExport} disabled={busy} aria-describedby="report-export-status">{downloadLabel}</button></div></div>
    </ReportExportLayout>
  )
}
