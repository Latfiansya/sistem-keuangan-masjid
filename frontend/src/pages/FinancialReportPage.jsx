import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, Download } from 'lucide-react'
import { Link } from 'react-router'
import FinancialTable from '../components/FinancialTable.jsx'
import BalanceSummary from '../components/BalanceSummary.jsx'
import ReportFormatPicker from '../components/ReportFormatPicker.jsx'
import ReportPreview from '../components/ReportPreview.jsx'
import { getReport } from '../services/reportService.js'
import { DEFAULT_REPORT_RANGE, getMonthRange, getPresetRange, validateReportRange } from '../utils/reportCalculations.js'
import { formatReportMonth, formatReportPeriod, formatReportYear } from '../utils/reportFormatters.js'
import { paginateReport } from '../utils/reportPagination.js'

export default function FinancialReportPage() {
  const [view, setView] = useState('report')
  const [format, setFormat] = useState('pdf')
  const [range, setRange] = useState({ ...DEFAULT_REPORT_RANGE })
  const [draft, setDraft] = useState({ ...DEFAULT_REPORT_RANGE })
  const [activePreset, setActivePreset] = useState('custom')
  const [showCustomRange, setShowCustomRange] = useState(true)
  const [filterError, setFilterError] = useState('')
  const [reportState, setReportState] = useState({ report: null, loading: true, error: '' })
  const heading = useRef(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    heading.current?.focus()
  }, [view])

  useEffect(() => {
    const controller = new AbortController()
    getReport({ ...range, signal: controller.signal })
      .then((report) => { if (!controller.signal.aborted) setReportState({ report, loading: false, error: '' }) })
      .catch((cause) => { if (!controller.signal.aborted) setReportState({ report: null, loading: false, error: cause.message }) })
    return () => controller.abort()
  }, [range])

  function applyRange(nextRange, preset, showCustom) {
    try {
      validateReportRange(nextRange)
      setReportState((previous) => ({ ...previous, loading: true, error: '' }))
      setRange(nextRange)
      setDraft(nextRange)
      setActivePreset(preset)
      setShowCustomRange(showCustom)
      setFilterError('')
    } catch (cause) { setFilterError(cause.message) }
  }

  const { report, loading, error } = reportState
  const pages = useMemo(() => paginateReport(report), [report])
  const canPreview = !loading && !error && pages.length > 0
  const period = formatReportPeriod(range)
  const year = formatReportYear(range)

  if (canPreview && view !== 'report') {
    return <main className="report-page report-page--opened">{view === 'format' ? <ReportFormatPicker report={report} pages={pages} format={format} onFormatChange={setFormat} onBack={() => setView('report')} onNext={() => setView('preview')} headingRef={heading} /> : <ReportPreview report={report} pages={pages} format={format} onFormatChange={setFormat} onBack={() => setView('format')} headingRef={heading} />}</main>
  }

  return (
    <main className="report-page report-page--opened">
      <div className="financial-report">
        <header className="financial-header">
          <Link to="/" className="financial-navigation"><ArrowLeft aria-hidden="true" />Beranda</Link>
          <div className="financial-header-identity"><h1 ref={heading} tabIndex={-1}>Laporan Keuangan {year}</h1><p>{report?.name ?? 'Masjid Al-Hidayah'}</p><small>Data contoh pengembangan · bukan laporan produksi</small></div>
          <div className="financial-export"><button type="button" className="financial-navigation" disabled={!canPreview} onClick={() => { if (canPreview) setView('format') }} aria-describedby="financial-export-status"><Download aria-hidden="true" />Unduh</button><small id="financial-export-status">{canPreview ? 'Pilih format laporan.' : 'Pratinjau belum tersedia.'}</small></div>
        </header>

        <section className="financial-filters" aria-labelledby="financial-detail-heading">
          <div className="financial-filters-top"><div><h2 id="financial-detail-heading">Detail {period}</h2><p>Rincian pemasukan, pengeluaran, dan resume saldo bulan berjalan</p></div><div className="financial-presets" aria-label="Pilihan periode">
            {[['1w', '1 minggu terakhir'], ['1m', '1 bulan terakhir'], ['3m', '3 bulan terakhir']].map(([id, label]) => <button key={id} type="button" className={activePreset === id ? 'is-active' : ''} aria-pressed={activePreset === id} onClick={() => applyRange(getPresetRange(id), id, false)}>{label}</button>)}
            <button type="button" className={activePreset === 'custom' ? 'is-active' : ''} aria-pressed={activePreset === 'custom'} onClick={() => { setActivePreset('custom'); setShowCustomRange(true) }}><CalendarDays aria-hidden="true" />Pilih Tanggal</button>
          </div></div>
          <div className="financial-filters-bottom">
            <form className="financial-custom-range" onSubmit={(event) => { event.preventDefault(); applyRange({ ...draft }, 'custom', true) }} noValidate>
              {showCustomRange && <><span className="financial-range-label"><CalendarDays aria-hidden="true" />Rentang Kustom:</span>
                <label className="financial-date-control"><CalendarDays aria-hidden="true" /><span><small>Tanggal Awal</small><input type="date" aria-label="Tanggal awal" value={draft.startDate} onChange={(event) => setDraft((previous) => ({ ...previous, startDate: event.target.value }))} /></span></label>
                <label className="financial-date-control"><CalendarDays aria-hidden="true" /><span><small>Tanggal Akhir</small><input type="date" aria-label="Tanggal akhir" value={draft.endDate} onChange={(event) => setDraft((previous) => ({ ...previous, endDate: event.target.value }))} /></span></label>
                <button type="submit" className="financial-apply">Terapkan</button></>}
            </form>
            <label className="financial-month">Pilih Bulan:<select aria-label="Pilih bulan laporan" value={range.endDate.slice(0, 7)} onChange={(event) => applyRange(getMonthRange(event.target.value), 'month', false)}>{(report?.months ?? ['2026-04']).map((month) => <option key={month} value={month}>{formatReportMonth(month)}</option>)}</select></label>
          </div>
          {filterError && <p role="alert" className="financial-filter-error">{filterError}</p>}
        </section>

        <div className="financial-results" aria-busy={loading}>
          {loading ? <p role="status" className="financial-status">Memuat laporan keuangan…</p> : error ? <p role="alert" className="financial-status">{error}</p> : !report ? <p role="status" className="financial-status">Laporan belum tersedia.</p> : report.status === 'unavailable' ? <p role="status" className="financial-status">{report.message}</p> : <>
            <div className="financial-transactions-grid">{['income', 'expense'].map((type) => <FinancialTable key={type} type={type} transactions={report.transactions.filter((item) => item.type === type)} subtotal={report.summary.totals[type]} categories={report.summary.rows} />)}</div>
            <BalanceSummary summary={report.summary} period={formatReportPeriod(report.range)} />
          </>}
        </div>
      </div>
    </main>
  )
}
