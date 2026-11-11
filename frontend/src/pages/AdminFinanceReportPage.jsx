import { useEffect, useRef, useState } from 'react'
import { useLocation, useOutletContext } from 'react-router'
import { ArrowDownCircle, ArrowDownRight, ArrowDownToLine, ArrowUpCircle, ArrowUpRight, CalendarDays, ChevronRight, CircleAlert, Download, FileText, Landmark, LoaderCircle, Pencil, Search, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import AdminBalanceSummary from '../components/AdminBalanceSummary.jsx'
import { buildAdminFinanceReport, buildAdminMonthlyRecap, filterAdminFinanceTransactions, getAdminFinancePreset, summarizeAdminFinanceTransactions, validateAdminFinanceRange } from '../services/adminFinanceReportService.js'
import { createAdminFinanceSummaryPng } from '../services/adminFinanceExportService.js'
import { downloadReportFile } from '../services/reportExportService.js'
import { formatReportDate, formatReportMonth, formatReportNumber, formatRupiah } from '../utils/reportFormatters.js'
import { adminCategoryColorStyle } from '../utils/adminCategoryColors.js'
import './AdminFinanceReportPage.css'

function TransactionActions({ transaction }) {
  return <span className="admin-report-actions"><button type="button" disabled title="Fitur edit transaksi belum tersedia" aria-label={`Edit ${transaction.description} (belum tersedia)`}><Pencil size={14} aria-hidden="true" /></button><button type="button" disabled title="Fitur hapus transaksi belum tersedia" aria-label={`Hapus ${transaction.description} (belum tersedia)`}><Trash2 size={14} aria-hidden="true" /></button></span>
}

function TransactionPanel({ type, transactions, categories }) {
  const items = transactions.filter((transaction) => transaction.type === type)
  const total = summarizeAdminFinanceTransactions(items)[type]
  const Icon = type === 'income' ? ArrowUpRight : ArrowDownRight
  const title = type === 'income' ? 'Pemasukan' : 'Pengeluaran'
  return <section className={`admin-report-transactions admin-report-transactions--${type}`} aria-label={`Transaksi mock ${title.toLowerCase()}`}>
    <header><div><span><Icon size={24} aria-hidden="true" /></span><div><h3>{title}</h3><p>{items.length} transaksi mock</p></div></div><strong>{formatRupiah(total)}</strong></header>
    <div className="admin-report-column-labels" aria-hidden="true"><span>Tanggal</span><span>Kategori</span><span>Uraian</span><span>Jumlah</span></div>
    {items.length ? <ul>{items.map((transaction) => {
      const category = categories.find((item) => item.id === transaction.categoryId)
      return <li key={transaction.id} data-transaction-id={transaction.id}><div><h4>{transaction.description}</h4><p><time dateTime={transaction.date}>{formatReportDate(transaction.date)}</time><span style={adminCategoryColorStyle(category.color)} className={`admin-report-category-label admin-report-category--${category.color}`}>• {category.label}</span></p></div><strong>{formatRupiah(transaction.amount)}</strong><TransactionActions transaction={transaction} /></li>
    })}</ul> : <p className="admin-report-empty">Tidak ada transaksi mock {title.toLowerCase()} pada rentang ini.</p>}
  </section>
}

const reportTabs = [
  { id: 'income', label: 'Kas Masuk', icon: ArrowUpRight },
  { id: 'expense', label: 'Kas Keluar', icon: ArrowDownRight },
  { id: 'monthly', label: 'Rekap Bulanan', icon: FileText },
]

function LedgerTable({ transactions, categories, type }) {
  const total = summarizeAdminFinanceTransactions(transactions)[type]
  return <div className="admin-panel admin-report-table-panel">
    <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
    <div className="admin-table-scroll" role="region" aria-label="Tabel transaksi mock, dapat digeser" tabIndex={0}>
      <table className="admin-report-ledger-table">
        <caption className="sr-only">Transaksi simulasi seluruh kategori sesuai jenis dan filter, bukan data resmi masjid.</caption>
        <thead><tr>{['Tanggal', 'Kategori', 'Uraian', 'Jumlah (Rp)', 'Aksi'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{transactions.length ? transactions.map((transaction) => {
          const category = categories.find((item) => item.id === transaction.categoryId)
          return <tr key={transaction.id} data-transaction-id={transaction.id}>
            <td><time dateTime={transaction.date}>{formatReportDate(transaction.date)}</time></td>
            <td><span style={adminCategoryColorStyle(category.color)} className={`admin-report-category-label admin-report-category--${category.color}`}>• {category.label}</span></td>
            <td>{transaction.description}</td>
            <td className={`admin-report-amount--${transaction.type}`}>{formatReportNumber(transaction.amount)}</td>
            <td><TransactionActions transaction={transaction} /></td>
          </tr>
        }) : <tr><td colSpan={5} className="admin-report-empty">Tidak ada transaksi mock yang sesuai filter.</td></tr>}</tbody>
        <tfoot><tr><th scope="row" colSpan={3}>Total transaksi mock ditampilkan</th><td colSpan={2} className={`admin-report-amount--${type}`}>{formatRupiah(total)}</td></tr></tfoot>
      </table>
    </div>
  </div>
}

function MonthlyRecap({ months }) {
  return <div className="admin-panel admin-report-table-panel">
    <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
    <div className="admin-table-scroll" role="region" aria-label="Rekap bulanan mock, dapat digeser" tabIndex={0}>
      <table className="admin-report-monthly-table">
        <caption className="sr-only">Saldo awal, pemasukan, pengeluaran dan saldo akhir simulasi setiap bulan dan kategori. Bulan parsial mengikuti rentang tanggal terpilih.</caption>
        <thead><tr>{['Bulan', 'Kategori', 'Saldo Awal (Rp)', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo Akhir (Rp)'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        {months.map(({ month, categories, totals }) => <tbody key={month} data-month={month}>
          {categories.map((category, index) => <tr key={category.id} data-category-id={category.id}>
            {index === 0 && <th className="admin-report-month" rowSpan={categories.length + 1} scope="rowgroup"><span>{formatReportMonth(month).slice(0, 3).toUpperCase()}</span><div>{formatReportMonth(month).split(' ')[0]}<small>{month.slice(0, 4)}</small></div></th>}
            <th scope="row"><span style={adminCategoryColorStyle(category.color)} className={`admin-report-category-label admin-report-category--${category.color}`}>• {category.label}</span></th>
            <td>{formatReportNumber(category.openingBalance)}</td><td className="admin-report-amount--income">{formatReportNumber(category.income)}</td><td className="admin-report-amount--expense">{formatReportNumber(category.expense)}</td><td>{formatReportNumber(category.closingBalance)}</td>
          </tr>)}
          <tr className="admin-report-month-total" data-month-total={month}><th scope="row">TOTAL</th><td>{formatReportNumber(totals.openingBalance)}</td><td className="admin-report-amount--income">{formatReportNumber(totals.income)}</td><td className="admin-report-amount--expense">{formatReportNumber(totals.expense)}</td><td>{formatReportNumber(totals.closingBalance)}</td></tr>
        </tbody>)}
      </table>
    </div>
  </div>
}

function AdminFinanceReportContent({ report }) {
  const { hash, key } = useLocation()
  const [range, setRange] = useState(report.range)
  const [draftRange, setDraftRange] = useState(report.range)
  const [historyRange, setHistoryRange] = useState(report.coverage)
  const [rangeError, setRangeError] = useState('')
  const [tabId, setTabId] = useState('income')
  const [query, setQuery] = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const exportSheet = useRef(null)
  const exportController = useRef(null)
  const tabPanel = useRef(null)
  const reportNavigation = useRef(null)
  const downloadButton = useRef(null)
  const periodLabel = formatReportMonth(report.month)
  const monthLabel = periodLabel.split(' ')[0]
  const snapshotLabel = formatReportDate(report.updatedDate)
  const transactions = filterAdminFinanceTransactions(report, { range })
  const selectedTab = reportTabs.find((tab) => tab.id === tabId)
  const ledgerTransactions = filterAdminFinanceTransactions(report, { range: historyRange, type: tabId === 'monthly' ? '' : tabId, query })
  const ledgerSummary = summarizeAdminFinanceTransactions(ledgerTransactions)
  const months = tabId === 'monthly' ? buildAdminMonthlyRecap(report, historyRange) : []

  useEffect(() => {
    let frame
    const controller = new AbortController()
    document.fonts.ready.then(() => {
      if (controller.signal.aborted) return
      frame = requestAnimationFrame(() => {
        if (hash === '#kas-masuk') {
          setTabId('income')
          reportNavigation.current?.scrollIntoView({ block: 'start' })
          const header = document.querySelector('.admin-topbar')
          const offset = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position) ? header.getBoundingClientRect().height : 0
          window.scrollBy(0, -offset - 16)
          document.getElementById('admin-report-tab-income')?.focus({ preventScroll: true })
        } else if (!hash) window.scrollTo(0, 0)
      })
    })
    return () => { controller.abort(); cancelAnimationFrame(frame) }
  }, [hash, key])

  useEffect(() => () => exportController.current?.abort(), [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  function applyRange(event) {
    event.preventDefault()
    try { validateAdminFinanceRange(report, draftRange); setRange({ ...draftRange }); setHistoryRange({ ...draftRange }); setRangeError('') }
    catch (cause) { setRangeError(cause.message) }
  }

  function applyPreset(preset) {
    const next = getAdminFinancePreset(report, preset)
    setRange(next); setDraftRange(next); setHistoryRange(next); setRangeError('')
  }

  function selectTab(id) { setTabId(id); setQuery('') }

  function handleTabKey(event, index) {
    let next
    if (event.key === 'ArrowRight') next = (index + 1) % reportTabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + reportTabs.length) % reportTabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = reportTabs.length - 1
    else return
    event.preventDefault()
    selectTab(reportTabs[next].id)
    event.currentTarget.parentElement.children[next].focus()
  }

  async function handleDownload() {
    if (exportController.current) return
    const controller = new AbortController()
    exportController.current = controller
    setExporting(true); setToast(null)
    if (window.innerWidth < 480) downloadButton.current?.scrollIntoView({ block: 'center' })
    try {
      const file = await createAdminFinanceSummaryPng({ sheet: exportSheet.current, updatedDate: report.updatedDate, signal: controller.signal })
      controller.signal.throwIfAborted()
      downloadReportFile(file)
      setToast({ type: 'success', message: 'Laporan berhasil diunduh' })
    } catch (cause) {
      if (!controller.signal.aborted) setToast({ type: 'error', message: `Laporan gagal diunduh. ${cause.message}` })
    } finally { exportController.current = null; if (!controller.signal.aborted) setExporting(false) }
  }

  return <div className="admin-report">
    <header className="admin-report-hero"><span><Landmark size={14} aria-hidden="true" />MASJID AL-HIDAYAH</span><h2>LAPORAN<br />KEUANGAN</h2><p>Ringkasan pemasukan, pengeluaran, dan saldo<br className="admin-desktop-break" /> dana masjid dalam satu tampilan.</p><div><button type="button" disabled title="Tambah pemasukan belum tersedia"><ArrowDownCircle size={16} aria-hidden="true" />Tambah Pemasukan</button><button type="button" disabled title="Tambah pengeluaran belum tersedia"><ArrowUpCircle size={16} aria-hidden="true" />Tambah Pengeluaran</button></div></header>
    <section className="admin-report-balance" aria-label="Total saldo seluruh dana"><p>TOTAL SALDO SELURUH DANA</p><span><i aria-hidden="true" />{periodLabel} · snapshot {snapshotLabel}</span><h2>{formatRupiah(report.totals.closingBalance)}</h2><dl>{[['openingBalance', 'Saldo Awal'], ['income', 'Pemasukan'], ['expense', 'Pengeluaran']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{formatRupiah(report.totals[key])}</dd></div>)}</dl></section>
    <div className="admin-report-category-cards">{report.categories.map((category) => <button key={category.id} type="button" style={adminCategoryColorStyle(category.color)} className={`admin-report-category-card admin-report-category--${category.color}`} onClick={() => { selectTab('monthly'); tabPanel.current?.scrollIntoView({ block: 'start' }) }} aria-label={`Lihat rincian ${category.label}`}><span><Wallet size={21} aria-hidden="true" /></span><small>{category.label}</small><strong>{formatRupiah(category.closingBalance)}</strong><footer>Saldo snapshot <ChevronRight size={16} aria-hidden="true" /></footer></button>)}</div>
    <section className="admin-report-detail" aria-labelledby="admin-report-detail-title"><div className="admin-report-detail-heading"><div><h2 id="admin-report-detail-title">Detail {range.startDate.slice(0, 7) === report.month ? periodLabel : 'Riwayat Mock'}</h2><p>Rincian pemasukan dan pengeluaran simulasi untuk rentang terpilih.</p></div><div className="admin-report-presets"><button type="button" onClick={() => applyPreset('week')}>Minggu terakhir</button><button type="button" onClick={() => applyPreset('month')}>Bulan berjalan</button><button type="button" disabled title="Preset tiga bulan belum diaktifkan">3 bulan terakhir</button><span><CalendarDays size={14} aria-hidden="true" />{periodLabel}</span></div></div>
      <form className="admin-report-filters" noValidate onSubmit={applyRange} aria-label="Filter tanggal transaksi mock"><span><CalendarDays size={16} aria-hidden="true" />Rentang transaksi:</span>{[['startDate', 'Dari tanggal'], ['endDate', 'Sampai tanggal']].map(([key, label]) => <label key={key}><span>{label}</span><input name={key} type="date" min={report.coverage.startDate} max={report.updatedDate} required value={draftRange[key]} onChange={(event) => { setDraftRange((previous) => ({ ...previous, [key]: event.target.value })); setRangeError('') }} aria-invalid={Boolean(rangeError)} aria-describedby={rangeError ? 'admin-report-range-error' : undefined} /></label>)}<button type="submit">Terapkan</button><p>{transactions.length} dari {report.transactions.length} transaksi mock</p></form>
      {rangeError && <p className="admin-report-error" id="admin-report-range-error" role="alert">{rangeError}</p>}
      <aside className="admin-report-notice"><ShieldCheck size={18} aria-hidden="true" /><p>Data mock khusus review · {report.transactions.length} transaksi simulasi Januari–Oktober, bukan riwayat resmi. Ringkasan saldo tetap snapshot {snapshotLabel}. Filter tanggal juga membatasi ketiga tampilan laporan di bawah.{report.sessionTransactions?.length > 0 && <> {report.sessionTransactions.length} tambahan sesi mock belum termasuk saldo dan laporan historis ini.</>}</p></aside>
      <div className="admin-report-transaction-panels"><TransactionPanel type="income" transactions={transactions} categories={report.categories} /><TransactionPanel type="expense" transactions={transactions} categories={report.categories} /></div>
    </section>
    <AdminBalanceSummary categories={report.categories} totals={report.totals} updatedDate={report.updatedDate} title={`Resume Saldo Bulan ${monthLabel}`} titleId="admin-report-balance-title" />
    <section className="admin-report-download"><div><h2>Unduh Ringkasan Laporan</h2><p>PNG ringkasan snapshot {snapshotLabel} · data contoh, seluruh kategori.</p></div><button ref={downloadButton} type="button" onClick={handleDownload} disabled={exporting}>{exporting ? <LoaderCircle size={16} className="admin-report-spinner" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}{exporting ? 'Membuat PNG…' : 'Unduh PNG'}</button></section>
    <div ref={reportNavigation} id="kas-masuk" role="tablist" className="admin-report-tabs" aria-label="Jenis laporan">{reportTabs.map(({ id, label, icon: Icon }, index) => <button key={id} type="button" role="tab" id={`admin-report-tab-${id}`} aria-selected={tabId === id} aria-controls="admin-report-ledger-panel" tabIndex={tabId === id ? 0 : -1} className={`admin-report-view--${id}`} onClick={() => selectTab(id)} onKeyDown={(event) => handleTabKey(event, index)}><Icon size={16} aria-hidden="true" />{label}</button>)}</div>
    <section ref={tabPanel} id="admin-report-ledger-panel" role="tabpanel" aria-labelledby={`admin-report-tab-${tabId}`} tabIndex={0} className={`admin-report-ledger admin-report-view--${tabId}`}>
      <div className="admin-report-ledger-heading"><div><h2>{selectedTab.label}{tabId === 'monthly' ? ` ${historyRange.startDate.slice(0, 4)}` : ''}</h2><p>{tabId === 'income' ? 'Semua pemasukan dana masjid' : tabId === 'expense' ? 'Semua pengeluaran dana masjid' : 'Ringkasan saldo & aliran kas setiap bulan dan kategori'} · data mock<br />{formatReportDate(historyRange.startDate)}–{formatReportDate(historyRange.endDate)}</p></div>{tabId === 'monthly' && <span><CalendarDays size={14} aria-hidden="true" />Tahun {historyRange.startDate.slice(0, 4)}</span>}</div>
      {tabId === 'monthly' ? <MonthlyRecap months={months} /> : <>
        <div className="admin-report-ledger-tools"><article className="admin-report-ledger-total"><span>TOTAL {tabId === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}</span><strong>{formatRupiah(ledgerSummary[tabId])}</strong><small>Sesuai filter · mock</small><selectedTab.icon size={72} aria-hidden="true" /></article><article className="admin-report-ledger-count"><span>JUMLAH TRANSAKSI</span><strong>{ledgerTransactions.length}</strong><small>entri mock ditampilkan</small></article><label className="admin-report-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Cari uraian transaksi</span><input type="search" maxLength={160} placeholder="Cari transaksi..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        <LedgerTable transactions={ledgerTransactions} categories={report.categories} type={tabId} />
        <p className="sr-only" role="status">{ledgerTransactions.length} transaksi mock {selectedTab.label}.</p>
      </>}
    </section>
    <div className="admin-report-export" aria-hidden="true"><div ref={exportSheet} className="admin-report-export-sheet"><header><h2>Ringkasan Laporan Keuangan</h2><p>Masjid Al-Hidayah Sorolaten · {periodLabel}</p><strong>Data contoh · Snapshot {snapshotLabel}</strong><p>Ringkasan mengikuti Dashboard admin. Transaksi sumber hanya cuplikan; dokumen ini bukan riwayat mutasi lengkap.</p></header><AdminBalanceSummary categories={report.categories} totals={report.totals} updatedDate={report.updatedDate} title="Resume Saldo Seluruh Kategori" titleId="admin-report-export-title" showDescription={false} /><footer>Nominal dalam Rupiah · Saldo akhir = saldo awal + pemasukan − pengeluaran</footer></div></div>
    {exporting && <p className="sr-only" role="status">Sedang membuat PNG ringkasan laporan.</p>}
    {toast && <div className={`admin-report-toast admin-report-toast--${toast.type}`} role="status" aria-live="polite">{toast.type === 'success' ? <ArrowDownToLine size={22} aria-hidden="true" /> : <CircleAlert size={22} aria-hidden="true" />}<span>{toast.message}</span></div>}
  </div>
}

export default function AdminFinanceReportPage() {
  const { dashboard, error } = useOutletContext()
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat laporan keuangan admin…</p>
  return <AdminFinanceReportContent report={buildAdminFinanceReport(dashboard)} />
}
