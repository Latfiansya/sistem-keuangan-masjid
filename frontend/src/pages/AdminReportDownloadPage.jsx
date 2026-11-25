import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useOutletContext } from 'react-router'
import { ArrowDownToLine, ArrowLeft, ArrowRight, CalendarDays, ChevronRight, CircleAlert, Download, FileText, Image, LoaderCircle } from 'lucide-react'
import { adminDownloadMonthNames, adminReportTypes, ADMIN_REPORT_PAGE, buildAdminDownloadDocument, createAdminReportDownload, getAdminDownloadDefaults, getAdminDownloadMonthRange, paginateAdminDownload, validateAdminDownloadSettings } from '../services/adminReportDownloadService.js'
import { buildAdminFinanceReport, getAdminFinancePreset } from '../services/adminFinanceReportService.js'
import { downloadReportFile } from '../services/reportExportService.js'
import { validateReportRange } from '../utils/reportCalculations.js'
import { formatReportPeriod, formatReportRange } from '../utils/reportFormatters.js'
import { dataSource } from '../utils/env.js'
import AdminDownloadSheet, { AdminDownloadTotals } from '../components/AdminDownloadSheet.jsx'
import './AdminReportDownloadPage.css'

function PreviewPage({ document, page, pageCount }) {
  const frame = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / ADMIN_REPORT_PAGE.width))
    observer.observe(frame.current)
    return () => observer.disconnect()
  }, [])
  return <section className="admin-download-preview-page"><h4>Halaman {page.number} · {page.title}</h4><div ref={frame} className="admin-download-page-frame" style={{ '--admin-download-scale': scale }}><AdminDownloadSheet document={document} page={page} pageCount={pageCount} /></div></section>
}

function DownloadContent({ report, settings, onChange, preview: isPreview }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { range, types, periodMode, preset, format } = settings
  const [layout, setLayout] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [toast, setToast] = useState(null)
  const [currentYear] = useState(() => new Date().getFullYear())
  const measurement = useRef(null)
  const preview = useRef(null)
  const controller = useRef(null)
  const documentResult = useMemo(() => {
    try { validateAdminDownloadSettings(settings); return { document: buildAdminDownloadDocument(report, range, types) } }
    catch (cause) { return { error: cause.message } }
  }, [report, settings, range, types])
  const documentData = documentResult.document
  const pages = layout && layout.document === documentData ? layout.pages : []
  const layoutError = layout && layout.document === documentData ? layout.error : ''
  const preparing = isPreview && !pages.length && !layoutError
  const year = range.startDate.slice(0, 4) || report.month.slice(0, 4)
  const years = [...new Set([Number(year), ...Array.from({ length: Math.max(1, currentYear - Number(report.coverage.startDate.slice(0, 4)) + 2) }, (_, index) => Number(report.coverage.startDate.slice(0, 4)) + index)])].sort((a, b) => a - b)
  let period = 'Periode belum valid', rangeLabel = 'Pilih rentang yang valid.', periodError = ''
  try { validateReportRange(range); period = formatReportPeriod(range); rangeLabel = formatReportRange(range) }
  catch (cause) { periodError = cause.message }

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (!isPreview || !documentData) return
    const operation = new AbortController()
    async function prepare() {
      try {
        await document.fonts.ready
        await document.fonts.load('600 12px "Plus Jakarta Sans"')
        operation.signal.throwIfAborted()
        const measures = Object.fromEntries([...measurement.current.querySelectorAll('.admin-download-sheet')].map((sheet) => {
          const rows = [...sheet.querySelectorAll('[data-export-row]')]
          const table = sheet.querySelector('tbody')
          const footer = sheet.querySelector('.admin-download-sheet-footer')
          const capacity = ADMIN_REPORT_PAGE.height - (table.getBoundingClientRect().top - sheet.getBoundingClientRect().top) - footer.getBoundingClientRect().height - parseFloat(getComputedStyle(footer).marginTop) - parseFloat(getComputedStyle(sheet).paddingBottom) - 4
          return [sheet.dataset.section, { capacity, heights: rows.map((row) => row.getBoundingClientRect().height) }]
        }))
        setLayout({ document: documentData, pages: paginateAdminDownload(documentData, measures), error: '' })
      } catch (cause) { if (!operation.signal.aborted) setLayout({ document: documentData, pages: [], error: cause.message }) }
    }
    prepare()
    return () => operation.abort()
  }, [isPreview, documentData])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  function update(patch) { onChange({ ...settings, ...patch }); setError('') }
  function changeMode(mode) {
    if (mode === 'preset') update({ periodMode: mode, range: getAdminFinancePreset(preset) })
    else if (mode === 'months') {
      const fallback = getAdminDownloadDefaults(report).range
      const start = range.startDate.slice(0, 7) || fallback.startDate.slice(0, 7)
      const end = range.endDate.slice(0, 7) || fallback.endDate.slice(0, 7)
      update({ periodMode: mode, range: { startDate: getAdminDownloadMonthRange(start, start).startDate, endDate: getAdminDownloadMonthRange(end, end).endDate } })
    } else update({ periodMode: mode })
  }
  function changeMonth(which, value) {
    try { update({ range: { ...range, [which]: value ? getAdminDownloadMonthRange(value, value)[which] : '' } }) }
    catch (cause) { setError(cause.message) }
  }
  function changeYear(value) {
    const endYear = Number(value) + (Number(range.endDate.slice(0, 4) || year) - Number(year))
    try { update({ range: getAdminDownloadMonthRange(`${value}-${range.startDate.slice(5, 7) || '01'}`, `${endYear}-${range.endDate.slice(5, 7) || '01'}`) }) }
    catch (cause) { setError(cause.message) }
  }
  function next(event) {
    event.preventDefault()
    try {
      validateAdminDownloadSettings(settings)
      if (!documentData) throw new Error(documentResult.error)
      onChange(settings)
      navigate('/admin/laporan/unduh/pratinjau')
    } catch (cause) { setError(cause.message) }
  }
  async function exportFile() {
    if (controller.current || !pages.length) return
    const operation = new AbortController()
    controller.current = operation
    setBusy(true); setError(''); setToast(null); setProgress('Menyiapkan dokumen…')
    try {
      const file = await createAdminReportDownload({ document: documentData, pages, sheets: [...preview.current.querySelectorAll('.admin-download-sheet')], format, signal: operation.signal, onProgress: (message) => { if (!operation.signal.aborted) setProgress(message) } })
      operation.signal.throwIfAborted()
      downloadReportFile(file)
      setToast({ type: 'success', message: 'Laporan berhasil diunduh' })
    } catch (cause) {
      if (!operation.signal.aborted) { setError(cause.message); setToast({ type: 'error', message: `Laporan gagal diunduh. ${cause.message}` }) }
    } finally { controller.current = null; if (!operation.signal.aborted) { setBusy(false); setProgress('') } }
  }
  const backUrl = isPreview ? '/admin/laporan/unduh' : '/admin/laporan'
  if (isPreview && !documentData) return <div className="admin-download-flow"><Link to={backUrl} className="admin-download-back">Kembali ke Pengaturan Unduhan</Link><p className="admin-download-error" role="alert">{documentResult.error}</p></div>
  return <div className="admin-download-flow">
    <nav className="admin-download-breadcrumb" aria-label="Breadcrumb"><Link to="/admin/laporan">Laporan</Link><ChevronRight size={14} aria-hidden="true" />{isPreview ? <><Link to="/admin/laporan/unduh">Pengaturan Unduhan</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Pratinjau</span></> : <span aria-current="page">Pengaturan Unduhan</span>}</nav>
    <Link to={backUrl} className="admin-download-back"><ArrowLeft size={16} aria-hidden="true" />Kembali ke {isPreview ? 'Pengaturan Unduhan' : 'Laporan'}</Link>
    <header className="admin-download-heading"><div><h2>{isPreview ? 'Pratinjau & Unduh Laporan' : 'Pengaturan Unduhan'}</h2><p>{isPreview ? 'Periksa seluruh halaman dokumen sebelum mengunduh.' : 'Pilih periode, jenis laporan dan format unduhan.'}</p></div>{isPreview && <div className="admin-download-heading-actions"><Link to="/admin/laporan/unduh" data-back-settings>Ubah Pengaturan</Link><button type="button" className="admin-download-primary" onClick={exportFile} disabled={busy || preparing || !pages.length}>{busy ? <LoaderCircle size={17} className="admin-report-spinner" aria-hidden="true" /> : <Download size={17} aria-hidden="true" />}{busy ? 'Mengekspor…' : `Unduh ${format.toUpperCase()}${format === 'png' && pages.length > 1 ? ' (ZIP)' : ''}`}</button></div>}</header>
    {!isPreview ? <>
      {state?.message && <p className="admin-download-help" role="status">{state.message}</p>}
      <form className="admin-download-settings" onSubmit={next} noValidate>
        <div className="admin-download-settings-columns"><section className="admin-download-period"><h3>Periode Laporan</h3><fieldset className="admin-download-mode"><legend className="sr-only">Mode periode laporan</legend>{[['preset', 'Pilihan Cepat'], ['months', 'Rentang Bulan'], ['dates', 'Rentang Tanggal']].map(([id, label]) => <label key={id} className={periodMode === id ? 'is-selected' : ''}><input type="radio" name="periodMode" value={id} checked={periodMode === id} onChange={() => changeMode(id)} />{label}</label>)}</fieldset>
          {periodMode === 'preset' && <div><h4>Pilihan Cepat</h4><p className="admin-download-help">Kalender lokal perangkat, hingga hari ini.</p><div className="admin-download-presets">{[['week', '1 minggu'], ['month', '1 bulan'], ['quarter', '3 bulan']].map(([id, label]) => <button key={id} type="button" aria-pressed={preset === id} onClick={() => update({ preset: id, range: getAdminFinancePreset(id) })}>{label}</button>)}</div></div>}
          {periodMode === 'months' && <><h4>Bulan Laporan</h4><label className="admin-download-year"><CalendarDays size={16} aria-hidden="true" /><span className="sr-only">Tahun laporan</span><select value={year} onChange={(event) => changeYear(event.target.value)}>{years.map((value) => <option key={value} value={value}>Tahun {value}</option>)}</select></label><div className="admin-download-months">{adminDownloadMonthNames.map((label, index) => { const month = `${year}-${String(index + 1).padStart(2, '0')}`; return <button type="button" key={label} aria-pressed={range.startDate.slice(0, 7) <= month && range.endDate.slice(0, 7) >= month} onClick={() => update({ range: getAdminDownloadMonthRange(month, month) })}>{label.slice(0, 3)}</button> })}</div><div className="admin-download-month-range">{[['startDate', 'Dari bulan'], ['endDate', 'Sampai bulan']].map(([id, label]) => <label key={id}>{label}<input name={id} type="month" required value={range[id].slice(0, 7)} aria-invalid={Boolean(periodError)} onChange={(event) => changeMonth(id, event.target.value)} /></label>)}</div></>}
          {periodMode === 'dates' && <><h4>Rentang Tanggal</h4><p className="admin-download-help">Tanggal awal dan akhir ikut dihitung dalam laporan.</p><div className="admin-download-date-range">{[['startDate', 'Dari tanggal'], ['endDate', 'Sampai tanggal']].map(([id, label]) => <label key={id}>{label}<input name={id} type="date" required value={range[id]} aria-invalid={Boolean(periodError)} onChange={(event) => update({ range: { ...range, [id]: event.target.value } })} /></label>)}</div></>}
          <p className="admin-download-selected-period">Dipilih: {rangeLabel}</p><p className="admin-download-help">Cakupan transaksi tercatat: {formatReportRange(report.coverage)}.</p>
        </section><section><fieldset className="admin-download-types"><legend>Jenis Laporan</legend><p className="admin-download-help">Pilih satu atau lebih jenis laporan.</p>{adminReportTypes.map((type) => <label key={type.id} className={types.includes(type.id) ? 'is-selected' : ''}><input type="checkbox" value={type.id} checked={types.includes(type.id)} onChange={() => update({ types: types.includes(type.id) ? types.filter((id) => id !== type.id) : [...types, type.id] })} /><span><strong>{type.label}</strong><small>{type.description}</small></span></label>)}</fieldset>
          <fieldset className="admin-download-format"><legend>Format Unduhan</legend><div>{[['pdf', FileText], ['png', Image]].map(([id, Icon]) => <label key={id} className={format === id ? 'is-selected' : ''}><input type="radio" name="downloadFormat" value={id} checked={format === id} onChange={() => update({ format: id })} /><Icon size={18} aria-hidden="true" />{id.toUpperCase()}</label>)}</div></fieldset>
          <aside className="admin-download-selection"><h4>Ringkasan Pilihan</h4><dl><div><dt>Periode</dt><dd>{period}</dd></div><div><dt>Jenis</dt><dd>{adminReportTypes.filter((type) => types.includes(type.id)).map((type) => type.label).join(', ') || 'Belum dipilih'}</dd></div><div><dt>Format</dt><dd>{format.toUpperCase()}</dd></div></dl>{documentData && <><AdminDownloadTotals document={documentData} /><p>{documentData.transactions.length} transaksi aktif dalam periode. {documentData.note}</p></>}{dataSource === 'mock' && <p>Simulasi data admin · Bukan dokumen resmi.</p>}</aside>
        </section></div>{(error || documentResult.error) && <p className="admin-download-error" role="alert">{error || documentResult.error}</p>}<footer><Link to="/admin/laporan">Batal</Link><button type="submit" className="admin-download-primary">Lanjutkan<ArrowRight size={16} aria-hidden="true" /></button></footer>
      </form>
    </> : <>
      <section className="admin-download-document-summary" aria-label="Ringkasan dokumen"><dl><div><dt>Periode</dt><dd>{period}</dd></div><div><dt>Jenis laporan</dt><dd>{documentData.sections.map((section) => section.label).join(', ')}</dd></div><div><dt>Format</dt><dd>{format.toUpperCase()}{format === 'png' && pages.length > 1 ? ' dalam ZIP' : ''}</dd></div><div><dt>Jumlah halaman</dt><dd>{preparing ? 'Menghitung…' : `${pages.length} halaman`}</dd></div></dl><p>{documentData.transactions.filter((item) => item.type === 'income').length} transaksi masuk · {documentData.transactions.filter((item) => item.type === 'expense').length} transaksi keluar · A4 portrait 210 × 297 mm. {format === 'pdf' ? 'PDF berbasis gambar.' : 'PNG 1588 × 2246 piksel per halaman.'}{dataSource === 'mock' ? ' Data simulasi, termasuk perubahan sesi; bukan laporan resmi.' : ''}</p></section>
      <p className="admin-download-progress" role="status" aria-live="polite">{preparing ? 'Menyiapkan seluruh halaman pratinjau…' : progress}</p>{(error || layoutError) && <p className="admin-download-error" role="alert">{error || layoutError}</p>}
      <div className="admin-download-preview-pages" ref={preview}>{pages.map((page) => <PreviewPage key={page.number} document={documentData} page={page} pageCount={pages.length} />)}</div>
      <div ref={measurement} className="admin-download-measurement" aria-hidden="true" inert>{documentData.sections.map((section) => <AdminDownloadSheet key={section.id} document={documentData} page={{ sectionId: section.id, title: section.label, rows: section.rows, number: 1 }} pageCount={1} measuring />)}</div>
    </>}
    {toast && <div className={`admin-report-toast admin-report-toast--${toast.type}`} role="status" aria-live="polite">{toast.type === 'success' ? <ArrowDownToLine size={22} aria-hidden="true" /> : <CircleAlert size={22} aria-hidden="true" />}<span>{toast.message}</span></div>}
  </div>
}

export default function AdminReportDownloadPage({ preview = false }) {
  const { dashboard, error, reportDownload, setReportDownload } = useOutletContext()
  const report = useMemo(() => dashboard ? buildAdminFinanceReport(dashboard) : null, [dashboard])
  const defaults = useMemo(() => report ? getAdminDownloadDefaults(report) : null, [report])
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!report) return <p className="admin-dashboard-state" role="status">Memuat pengaturan laporan…</p>
  if (preview) {
    try { validateAdminDownloadSettings(reportDownload) }
    catch { return <Navigate to="/admin/laporan/unduh" replace state={{ message: 'Pilihan unduhan belum tersedia atau tidak valid. Atur kembali laporan sebelum membuka pratinjau.' }} /> }
  }
  return <DownloadContent key={preview ? 'preview' : 'settings'} report={report} settings={reportDownload || defaults} onChange={setReportDownload} preview={preview} />
}
