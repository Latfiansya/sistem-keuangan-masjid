import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, Download } from 'lucide-react'
import { Link } from 'react-router'
import FinancialTable from '../components/FinancialTable.jsx'
import BalanceSummary from '../components/BalanceSummary.jsx'
import ReportFormatPicker from '../components/ReportFormatPicker.jsx'
import ReportPreview from '../components/ReportPreview.jsx'
import { getPublicContent } from '../services/publicContentService.js'
import { getReport, isPublicReportDisabledError, isPublicReportEnabled, PUBLIC_REPORT_DISABLED_MESSAGE } from '../services/reportService.js'
import { dataSource } from '../utils/env.js'
import { DEFAULT_REPORT_RANGE, getMonthRange, getPresetRange, validateReportRange } from '../utils/reportCalculations.js'
import { formatReportMonth, formatReportPeriod, formatReportYear } from '../utils/reportFormatters.js'
import { paginateReport } from '../utils/reportPagination.js'

const isMockSource = dataSource === 'mock'

export default function FinancialReportPage() {
  const [view, setView] = useState('report')
  const [format, setFormat] = useState('pdf')
  const [range, setRange] = useState(() => (isMockSource ? { ...DEFAULT_REPORT_RANGE } : undefined))
  const [draft, setDraft] = useState({ startDate: '', endDate: '' })
  const [activePreset, setActivePreset] = useState('1m')
  const [showCustomRange, setShowCustomRange] = useState(true)
  const [filterError, setFilterError] = useState('')
  const [reportDisabled, setReportDisabled] = useState(false)
  const [mosqueName, setMosqueName] = useState('Masjid Al-Hidayah')
  const [reportState, setReportState] = useState({ report: null, loading: true, error: '' })
  const heading = useRef(null)
  useEffect(() => {
    window.scrollTo(0, 0)
    heading.current?.focus()
  }, [view])

  useEffect(() => {
    const controller = new AbortController()
    getPublicContent({ signal: controller.signal })
      .then((content) => {
        if (controller.signal.aborted) return
        if (content?.name) setMosqueName(content.name)
        if (!isPublicReportEnabled(content)) setReportDisabled(true)
      })
      .catch(() => { /* fallback tetap mengandalkan hasil endpoint laporan */ })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (reportDisabled) return
    const controller = new AbortController()
    const params = range ? { ...range, signal: controller.signal } : { signal: controller.signal }
    getReport(params)
      .then((report) => {
        if (!controller.signal.aborted) setReportState({ report, loading: false, error: '' })
      })
      .catch((cause) => {
        if (controller.signal.aborted) return
        if (isPublicReportDisabledError(cause)) {
          setReportDisabled(true)
          setReportState({ report: null, loading: false, error: '' })
          return
        }
        setReportState({ report: null, loading: false, error: cause.message })
      })
    return () => controller.abort()
  }, [range, reportDisabled])

  function applyRange(nextRange, preset, showCustom) {
    try {
      validateReportRange(nextRange)
      setReportState((previous) => ({ ...previous, loading: true, error: '' }))
      setRange(nextRange)
      setDraft(preset === 'custom' ? nextRange : { startDate: '', endDate: '' })
      setActivePreset(preset)
      setShowCustomRange(showCustom)
      setFilterError('')
    } catch (cause) { setFilterError(cause.message) }
  }

  const { report, loading, error } = reportState
  const activeRange = range ?? report?.range ?? null
  const pages = useMemo(() => paginateReport(report), [report])
  const canPreview = !loading && !error && pages.length > 0
  const period = activeRange ? formatReportPeriod(activeRange) : 'Periode Terbaru'
  const year = activeRange ? formatReportYear(activeRange) : ''
  const presetAnchorEnd = report?.coverage?.endDate ?? activeRange?.endDate ?? (isMockSource ? DEFAULT_REPORT_RANGE.endDate : '')
  const availableMonths = report?.months ?? (isMockSource ? ['2026-04'] : [])

  if (reportDisabled) {
    return (
      <main className="report-page report-page--opened">
        <div className="financial-report">
          <header className="financial-header">
            <Link to="/" className="financial-navigation"><ArrowLeft aria-hidden="true" />Beranda</Link>
            <div className="financial-header-identity"><h1 ref={heading} tabIndex={-1}>Laporan Keuangan</h1><p>{mosqueName}</p></div>
          </header>
          <section className="financial-status" role="status" aria-live="polite">
            <p>{PUBLIC_REPORT_DISABLED_MESSAGE}</p>
            <p><Link to="/" className="financial-navigation"><ArrowLeft aria-hidden="true" />Kembali ke Beranda</Link></p>
          </section>
        </div>
      </main>
    )
  }

  if (canPreview && view !== 'report') {
    return <main className="report-page report-page--opened">{view === 'format' ? <ReportFormatPicker report={report} pages={pages} format={format} onFormatChange={setFormat} onBack={() => setView('report')} onNext={() => setView('preview')} headingRef={heading} /> : <ReportPreview report={report} pages={pages} format={format} onFormatChange={setFormat} onBack={() => setView('format')} headingRef={heading} />}</main>
  }

  return (
    <main className="report-page report-page--opened">
      <div className="financial-report">
        <header className="financial-header">
          <Link to="/" className="financial-navigation"><ArrowLeft aria-hidden="true" />Beranda</Link>
          <div className="financial-header-identity"><h1 ref={heading} tabIndex={-1}>Laporan Keuangan{year ? ` ${year}` : ''}</h1><p>{report?.name ?? mosqueName}</p><small>Laporan keuangan resmi · diperbarui berkala</small></div>
          <div className="financial-export"><button type="button" className="financial-navigation" disabled={!canPreview} onClick={() => { if (canPreview) setView('format') }} aria-describedby={!canPreview ? 'financial-export-status' : undefined}><Download aria-hidden="true" />Unduh</button>{!canPreview && <small id="financial-export-status">Pratinjau belum tersedia.</small>}</div>
        </header>

        <section className="financial-filters" aria-labelledby="financial-detail-heading">
          <div className="financial-filters-top"><div><h2 id="financial-detail-heading">Detail {period}</h2><p>Rincian pemasukan, pengeluaran, dan resume saldo bulan berjalan</p></div><div className="financial-presets" aria-label="Pilihan periode">
            {[['1w', '1 minggu terakhir'], ['1m', '1 bulan terakhir'], ['3m', '3 bulan terakhir']].map(([id, label]) => <button key={id} type="button" className={activePreset === id ? 'is-active' : ''} aria-pressed={activePreset === id} disabled={!presetAnchorEnd} onClick={() => applyRange(getPresetRange(id, presetAnchorEnd), id, false)}>{label}</button>)}
            <button type="button" className={activePreset === 'custom' ? 'is-active' : ''} aria-pressed={activePreset === 'custom'} onClick={() => { setActivePreset('custom'); setShowCustomRange(true) }}><CalendarDays aria-hidden="true" />Pilih Tanggal</button>
          </div></div>
          <div className="financial-filters-bottom">
            <form className="financial-custom-range" onSubmit={(event) => { event.preventDefault(); applyRange({ ...draft }, 'custom', true) }} noValidate>
              {showCustomRange && <><span className="financial-range-label"><CalendarDays aria-hidden="true" />Rentang Kustom:</span>
                <label className="financial-date-control"><CalendarDays aria-hidden="true" /><span><small>Tanggal Awal</small><input type="date" aria-label="Tanggal awal" value={draft.startDate} onChange={(event) => setDraft((previous) => ({ ...previous, startDate: event.target.value }))} /></span></label>
                <label className="financial-date-control"><CalendarDays aria-hidden="true" /><span><small>Tanggal Akhir</small><input type="date" aria-label="Tanggal akhir" value={draft.endDate} onChange={(event) => setDraft((previous) => ({ ...previous, endDate: event.target.value }))} /></span></label>
                <button type="submit" className="financial-apply">Terapkan</button></>}
            </form>
            <label className="financial-month">Pilih Bulan:<select aria-label="Pilih bulan laporan" disabled={!availableMonths.length} value={activeRange?.endDate?.slice(0, 7) ?? ''} onChange={(event) => event.target.value && applyRange(getMonthRange(event.target.value), 'month', false)}>{availableMonths.map((month) => <option key={month} value={month}>{formatReportMonth(month)}</option>)}</select></label>
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
