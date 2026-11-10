import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'
import { ArrowDownCircle, ArrowDownRight, ArrowDownToLine, ArrowUpCircle, ArrowUpRight, CalendarDays, ChevronRight, CircleAlert, Download, FileText, Landmark, LoaderCircle, Pencil, Search, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import AdminBalanceSummary from '../components/AdminBalanceSummary.jsx'
import { buildAdminFinanceReport, filterAdminFinanceTransactions, getAdminFinancePreset, summarizeAdminFinanceTransactions, validateAdminFinanceRange } from '../services/adminFinanceReportService.js'
import { createAdminFinanceSummaryPng } from '../services/adminFinanceExportService.js'
import { downloadReportFile } from '../services/reportExportService.js'
import { formatReportDate, formatReportMonth, formatReportNumber, formatRupiah } from '../utils/reportFormatters.js'
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
      return <li key={transaction.id} data-transaction-id={transaction.id}><div><h4>{transaction.description}</h4><p><time dateTime={transaction.date}>{formatReportDate(transaction.date)}</time><span className={`admin-report-category-label admin-report-category--${category.color}`}>• {category.label}</span></p></div><strong>{formatRupiah(transaction.amount)}</strong><TransactionActions transaction={transaction} /></li>
    })}</ul> : <p className="admin-report-empty">Tidak ada transaksi mock {title.toLowerCase()} pada rentang ini.</p>}
  </section>
}

function AdminFinanceReportContent({ report }) {
  const [range, setRange] = useState(report.range)
  const [draftRange, setDraftRange] = useState(report.range)
  const [historyRange, setHistoryRange] = useState(report.coverage)
  const [rangeError, setRangeError] = useState('')
  const [categoryId, setCategoryId] = useState(report.categories[0].id)
  const [query, setQuery] = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const exportSheet = useRef(null)
  const exportController = useRef(null)
  const tabPanel = useRef(null)
  const downloadButton = useRef(null)
  const periodLabel = formatReportMonth(report.month)
  const monthLabel = periodLabel.split(' ')[0]
  const snapshotLabel = formatReportDate(report.updatedDate)
  const transactions = filterAdminFinanceTransactions(report, { range })
  const selectedCategory = report.categories.find((category) => category.id === categoryId)
  const categoryTransactions = filterAdminFinanceTransactions(report, { range: historyRange, categoryId, query })
  const categorySummary = summarizeAdminFinanceTransactions(categoryTransactions)

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

  function selectCategory(id) { setCategoryId(id); setQuery('') }

  function handleTabKey(event, index) {
    let next
    if (event.key === 'ArrowRight') next = (index + 1) % report.categories.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + report.categories.length) % report.categories.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = report.categories.length - 1
    else return
    event.preventDefault()
    selectCategory(report.categories[next].id)
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
    <div className="admin-report-category-cards">{report.categories.map((category) => <button key={category.id} type="button" className={`admin-report-category-card admin-report-category--${category.color}`} onClick={() => { selectCategory(category.id); tabPanel.current?.scrollIntoView({ block: 'start' }) }} aria-label={`Lihat rincian ${category.label}`}><span><Wallet size={21} aria-hidden="true" /></span><small>{category.label}</small><strong>{formatRupiah(category.closingBalance)}</strong><footer>Saldo snapshot <ChevronRight size={16} aria-hidden="true" /></footer></button>)}</div>
    <section className="admin-report-detail" aria-labelledby="admin-report-detail-title"><div className="admin-report-detail-heading"><div><h2 id="admin-report-detail-title">Detail {range.startDate.slice(0, 7) === report.month ? periodLabel : 'Riwayat Mock'}</h2><p>Rincian pemasukan dan pengeluaran simulasi untuk rentang terpilih.</p></div><div className="admin-report-presets"><button type="button" onClick={() => applyPreset('week')}>Minggu terakhir</button><button type="button" onClick={() => applyPreset('month')}>Bulan berjalan</button><button type="button" disabled title="Preset tiga bulan belum diaktifkan">3 bulan terakhir</button><span><CalendarDays size={14} aria-hidden="true" />{periodLabel}</span></div></div>
      <form className="admin-report-filters" noValidate onSubmit={applyRange} aria-label="Filter tanggal transaksi mock"><span><CalendarDays size={16} aria-hidden="true" />Rentang transaksi:</span>{[['startDate', 'Dari tanggal'], ['endDate', 'Sampai tanggal']].map(([key, label]) => <label key={key}>{label}<input name={key} type="date" min={report.coverage.startDate} max={report.updatedDate} required value={draftRange[key]} onChange={(event) => { setDraftRange((previous) => ({ ...previous, [key]: event.target.value })); setRangeError('') }} aria-invalid={Boolean(rangeError)} aria-describedby={rangeError ? 'admin-report-range-error' : undefined} /></label>)}<button type="submit">Terapkan</button><p>{transactions.length} dari {report.transactions.length} transaksi mock</p></form>
      {rangeError && <p className="admin-report-error" id="admin-report-range-error" role="alert">{rangeError}</p>}
      <aside className="admin-report-notice"><ShieldCheck size={18} aria-hidden="true" /><p>Data mock khusus review · {report.transactions.length} transaksi simulasi Januari–Oktober, bukan riwayat resmi. Ringkasan saldo tetap snapshot {snapshotLabel}. Filter tanggal juga membatasi riwayat kategori di bawah.</p></aside>
      <div className="admin-report-transaction-panels"><TransactionPanel type="income" transactions={transactions} categories={report.categories} /><TransactionPanel type="expense" transactions={transactions} categories={report.categories} /></div>
    </section>
    <AdminBalanceSummary categories={report.categories} totals={report.totals} updatedDate={report.updatedDate} title={`Resume Saldo Bulan ${monthLabel}`} titleId="admin-report-balance-title" />
    <section className="admin-report-download"><div><h2>Unduh Ringkasan Laporan</h2><p>PNG ringkasan snapshot {snapshotLabel} · data contoh, seluruh kategori.</p></div><button ref={downloadButton} type="button" onClick={handleDownload} disabled={exporting}>{exporting ? <LoaderCircle size={16} className="admin-report-spinner" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}{exporting ? 'Membuat PNG…' : 'Unduh PNG'}</button></section>
    <div role="tablist" className="admin-report-tabs" aria-label="Kategori dana">{report.categories.map((category, index) => <button key={category.id} type="button" role="tab" id={`admin-report-tab-${category.id}`} aria-selected={categoryId === category.id} aria-controls="admin-report-category-panel" tabIndex={categoryId === category.id ? 0 : -1} className={`admin-report-category--${category.color}`} onClick={() => selectCategory(category.id)} onKeyDown={(event) => handleTabKey(event, index)}>{category.id === 'mosque' ? <ArrowUpRight size={16} aria-hidden="true" /> : category.id === 'friday' ? <ArrowDownRight size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}{category.label}</button>)}</div>
    <section ref={tabPanel} id="admin-report-category-panel" role="tabpanel" aria-labelledby={`admin-report-tab-${categoryId}`} tabIndex={0} className={`admin-report-category-detail admin-report-category--${selectedCategory.color}`}>
      <h2>{selectedCategory.label}</h2><p>Riwayat transaksi mock · {formatReportDate(historyRange.startDate)}–{formatReportDate(historyRange.endDate)}</p>
      <div className="admin-report-category-tools"><article className="admin-report-category-total"><span>SALDO SNAPSHOT KATEGORI</span><strong>{formatRupiah(selectedCategory.closingBalance)}</strong><small>{snapshotLabel}</small></article><article className="admin-report-category-count"><span>TRANSAKSI MOCK DITAMPILKAN</span><strong>{categoryTransactions.length}</strong><small>Contoh untuk review UI</small></article><label className="admin-report-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Cari uraian transaksi kategori</span><input type="search" maxLength={160} placeholder="Cari uraian transaksi..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
      <div className="admin-panel admin-report-table-panel"><p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p><div className="admin-table-scroll" role="region" aria-label={`Tabel transaksi mock ${selectedCategory.label}, dapat digeser`} tabIndex={0}><table className="admin-report-category-table"><caption className="sr-only">Riwayat simulasi kategori yang sesuai filter, bukan data resmi masjid.</caption><thead><tr>{['Tanggal', 'Kategori', 'Uraian', 'Jumlah (Rp)', 'Aksi'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{categoryTransactions.length ? categoryTransactions.map((transaction) => <tr key={transaction.id} data-transaction-id={transaction.id}><td><time dateTime={transaction.date}>{formatReportDate(transaction.date)}</time></td><td><span className="admin-report-category-label">• {selectedCategory.label}</span></td><td>{transaction.description}</td><td className={`admin-report-amount--${transaction.type}`}><span className="sr-only">{transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} </span>{transaction.type === 'income' ? '+' : '−'}{formatReportNumber(transaction.amount)}</td><td><TransactionActions transaction={transaction} /></td></tr>) : <tr><td colSpan={5} className="admin-report-empty">Tidak ada transaksi mock yang sesuai untuk kategori ini.</td></tr>}</tbody><tfoot><tr><th scope="row" colSpan={3}>Subtotal transaksi mock ditampilkan</th><td colSpan={2}><span className="admin-report-amount--income">Masuk {formatRupiah(categorySummary.income)}</span><br /><span className="admin-report-amount--expense">Keluar {formatRupiah(categorySummary.expense)}</span></td></tr></tfoot></table></div></div>
      <p className="sr-only" role="status">{categoryTransactions.length} transaksi mock untuk {selectedCategory.label}.</p>
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
