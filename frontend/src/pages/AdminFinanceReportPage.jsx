import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router'
import { ArrowDownCircle, ArrowDownRight, ArrowUpCircle, ArrowUpRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, Landmark, Pencil, Search, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import { paginateAdminTransactions } from '../utils/adminPagination.js'
import AdminBalanceSummary from '../components/AdminBalanceSummary.jsx'
import AdminTransactionDeleteDialog from '../components/AdminTransactionDeleteDialog.jsx'
import { ADMIN_REPORT_MONTHS, buildAdminFinanceReport, buildAdminMonthlyRecap, filterAdminFinanceTransactions, getAdminFinanceMonthRange, getAdminFinancePreset, summarizeAdminFinanceTransactions, validateAdminFinanceRange } from '../services/adminFinanceReportService.js'
import { formatReportDate, formatReportMonth, formatReportNumber, formatRupiah, formatTransferNote } from '../utils/reportFormatters.js'
import { adminCategoryColorStyle } from '../utils/adminCategoryColors.js'
import { dataSource } from '../utils/env.js'
import './AdminTransactionPage.css'
import './AdminFinanceReportPage.css'

function TransactionActions({ transaction, onEdit, onDelete }) {
  return <span className="admin-report-actions"><button type="button" title="Edit transaksi" aria-label={`Edit ${transaction.description}`} onClick={() => onEdit(transaction)}><Pencil size={14} aria-hidden="true" /></button><button type="button" title="Hapus transaksi" aria-label={`Hapus ${transaction.description}`} onClick={(event) => onDelete(transaction, event.currentTarget)}><Trash2 size={14} aria-hidden="true" /></button></span>
}

function TransactionPanel({ type, transactions, categories, onEdit, onDelete }) {
  const items = transactions.filter((transaction) => transaction.type === type)
  const total = summarizeAdminFinanceTransactions(items)[type]
  const Icon = type === 'income' ? ArrowUpRight : ArrowDownRight
  const title = type === 'income' ? 'Pemasukan' : 'Pengeluaran'
  return <section className={`admin-report-transactions admin-report-transactions--${type}`} aria-label={`Transaksi mock ${title.toLowerCase()}`}>
    <header><div><span><Icon size={24} aria-hidden="true" /></span><div><h3>{title}</h3><p>{items.length} transaksi mock</p></div></div><strong>{formatRupiah(total)}</strong></header>
    <div className="admin-report-column-labels" aria-hidden="true"><span>Tanggal</span><span>Kategori</span><span>Uraian</span><span>Jumlah</span></div>
    {items.length ? <ul>{items.map((transaction) => {
      const category = categories.find((item) => item.id === transaction.categoryId)
      return <li key={transaction.id} data-transaction-id={transaction.id}><div><h4>{transaction.description}</h4><p><time dateTime={transaction.date}>{formatReportDate(transaction.date)}</time><span style={adminCategoryColorStyle(category.color)} className={`admin-report-category-label admin-report-category--${category.color}`}>• {category.label}</span></p></div><strong>{formatRupiah(transaction.amount)}</strong><TransactionActions transaction={transaction} onEdit={onEdit} onDelete={onDelete} /></li>
    })}</ul> : <p className="admin-report-empty">Tidak ada transaksi mock {title.toLowerCase()} pada rentang ini.</p>}
  </section>
}

const reportTabs = [
  { id: 'income', label: 'Kas Masuk', icon: ArrowUpRight },
  { id: 'expense', label: 'Kas Keluar', icon: ArrowDownRight },
  { id: 'monthly', label: 'Rekap Bulanan', icon: FileText },
]

function LedgerTable({ transactions, categories, type, page, pageSize, setPage, setPageSize, rememberView }) {
  const pagination = paginateAdminTransactions(transactions, page, pageSize)
  const total = summarizeAdminFinanceTransactions(transactions)[type]
  return <div className="admin-panel admin-report-table-panel">
    <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
    <div className="admin-table-scroll" role="region" aria-label="Tabel transaksi mock, dapat digeser" tabIndex={0}>
      <table className="admin-report-ledger-table">
        <caption className="sr-only">Transaksi simulasi seluruh kategori sesuai jenis dan filter, bukan data resmi masjid.</caption>
        <thead><tr>{['Tanggal', 'Kategori', 'Uraian', 'Jumlah (Rp)', 'Aksi'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{transactions.length ? pagination.rows.map((transaction) => {
          const category = categories.find((item) => item.id === transaction.categoryId)
          return <tr key={transaction.id} data-transaction-id={transaction.id}>
            <td><time dateTime={transaction.date}>{formatReportDate(transaction.date)}</time></td>
            <td><span style={adminCategoryColorStyle(category.color)} className={`admin-report-category-label admin-report-category--${category.color}`}>• {category.label}</span></td>
            <td>{transaction.description}</td>
            <td className={`admin-report-amount--${transaction.type}`}>{formatReportNumber(transaction.amount)}</td>
            <td><Link className="admin-report-detail-link" to={`/admin/laporan/transaksi/${encodeURIComponent(transaction.id)}`} onClick={rememberView}>Lihat Detail<ChevronRight size={15} aria-hidden="true" /></Link></td>
          </tr>
        }) : <tr><td colSpan={5} className="admin-report-empty">Tidak ada transaksi mock yang sesuai filter.</td></tr>}</tbody>
        <tfoot><tr><th scope="row" colSpan={3}>Total seluruh hasil filter (simulasi)</th><td colSpan={2} className={`admin-report-amount--${type}`}>{formatRupiah(total)}</td></tr></tfoot>
      </table>
    </div>
    <footer className="admin-report-pagination"><div><span role="status">Menampilkan {pagination.start}–{pagination.end} dari {pagination.total} transaksi</span><div className="admin-report-page-size" role="group" aria-label="Jumlah baris transaksi"><span>Tampilkan:</span>{[20, 30, 50, 'all'].map((size) => <button key={size} type="button" aria-pressed={pageSize === size} onClick={() => { setPageSize(size); setPage(1) }}>{size === 'all' ? 'Semua' : size}</button>)}</div></div>{pagination.pages.length > 0 && <nav aria-label="Halaman transaksi"><button type="button" aria-label="Halaman sebelumnya" disabled={pagination.page === 1} onClick={() => setPage(pagination.page - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>{pagination.pages.map((number, index) => number === '…' ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span> : <button type="button" key={number} aria-label={`Halaman ${number}`} aria-current={pagination.page === number ? 'page' : undefined} onClick={() => setPage(number)}>{number}</button>)}<button type="button" aria-label="Halaman berikutnya" disabled={pagination.page === pagination.pageCount} onClick={() => setPage(pagination.page + 1)}><ChevronRight size={16} aria-hidden="true" /></button></nav>}</footer>
  </div>
}

function MonthlyRecap({ months }) {
  const transferNote = formatTransferNote(months.flatMap((item) => item.transfers || []))
  return <div className="admin-panel admin-report-table-panel">
    <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
    <div className="admin-table-scroll" role="region" aria-label="Rekap bulanan mock, dapat digeser" tabIndex={0}>
      <table className="admin-report-monthly-table">
        <caption className="sr-only">Saldo awal, pemasukan, pengeluaran dan saldo akhir simulasi setiap bulan dan kategori. Bulan parsial mengikuti rentang tanggal terpilih.</caption>
        <thead><tr>{['Bulan', 'Kategori', 'Saldo Awal (Rp)', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Saldo Akhir (Rp)'].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        {months.length === 0 && <tbody><tr><td colSpan={6} className="admin-report-empty">Tidak ada transaksi mock untuk rentang ini.</td></tr></tbody>}
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
    {transferNote && <p className="admin-report-transfer-note">{transferNote}</p>}
  </div>
}

function AdminFinanceReportContent({ report, deleteTransaction }) {
  const { hash, key, state } = useLocation()
  const { reportView, setReportView } = useOutletContext()
  const [range, setRange] = useState(() => reportView?.range ?? report.range)
  const [draftRange, setDraftRange] = useState(() => reportView?.draftRange ?? report.range)
  const [historyRange, setHistoryRange] = useState(() => reportView?.historyRange ?? report.coverage)
  const [rangeError, setRangeError] = useState('')
  const [activePreset, setActivePreset] = useState(() => reportView?.activePreset ?? null)
  const [selectedMonth, setSelectedMonth] = useState(() => reportView?.selectedMonth ?? (new Date().getMonth() + 1))
  const [monthMenuOpen, setMonthMenuOpen] = useState(false)
  const [tabId, setTabId] = useState(() => reportView?.tabId ?? 'income')
  const [query, setQuery] = useState(() => reportView?.query ?? '')
  const [page, setPage] = useState(() => reportView?.page || 1)
  const [pageSize, setPageSize] = useState(() => reportView?.pageSize || 20)
  const [deletingTransaction, setDeletingTransaction] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const deleteReturnFocus = useRef(null)
  const tabPanel = useRef(null)
  const reportNavigation = useRef(null)
  const monthPickerRef = useRef(null)
  const monthTriggerRef = useRef(null)
  const navigate = useNavigate()
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
        if (hash === '#kas-masuk' || hash === '#transaksi') {
          if (hash === '#kas-masuk') { setTabId('income'); setPage(1) }
          reportNavigation.current?.scrollIntoView({ block: 'start' })
          const header = document.querySelector('.admin-topbar')
          const offset = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position) ? header.getBoundingClientRect().height : 0
          window.scrollBy(0, -offset - 16)
          document.getElementById(`admin-report-tab-${hash === '#kas-masuk' ? 'income' : reportView?.tabId || 'income'}`)?.focus({ preventScroll: true })
        } else if (!hash) window.scrollTo(0, 0)
      })
    })
    return () => { controller.abort(); cancelAnimationFrame(frame) }
  }, [hash, key, reportView?.tabId])

  useEffect(() => {
    if (!monthMenuOpen) return undefined
    function handlePointerDown(event) {
      if (!monthPickerRef.current?.contains(event.target)) {
        setMonthMenuOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMonthMenuOpen(false)
        monthTriggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [monthMenuOpen])

  function rememberView() { setReportView?.({ range, draftRange, historyRange, tabId, query, page: paginateAdminTransactions(ledgerTransactions, page, pageSize).page, pageSize, activePreset, selectedMonth }) }

  function editTransactionItem(transaction) {
    rememberView()
    navigate(`/admin/laporan/transaksi/${encodeURIComponent(transaction.id)}/edit`)
  }

  function requestDeleteTransaction(transaction, triggerElement) {
    deleteReturnFocus.current = triggerElement
    setDeletingTransaction(transaction)
  }

  async function confirmDeleteTransaction() {
    if (!deletingTransaction || typeof deleteTransaction !== 'function') return
    await deleteTransaction(deletingTransaction.id)
    setDeletingTransaction(null)
    setActionMessage(
      dataSource === 'mock'
        ? 'Transaksi dihapus dari simulasi sesi. Data asli dan snapshot tetap utuh.'
        : 'Transaksi berhasil dihapus dari database.'
    )
  }

  function resolveActiveYear(currentRange) {
    const candidate = Number(currentRange?.startDate?.slice(0, 4) || currentRange?.endDate?.slice(0, 4))
    return Number.isInteger(candidate) && candidate >= 1900 && candidate <= 9999
      ? candidate
      : new Date().getFullYear()
  }

  function applyRange(event) {
    event.preventDefault()
    setMonthMenuOpen(false)
    try { validateAdminFinanceRange(report, draftRange); setRange({ ...draftRange }); setHistoryRange({ ...draftRange }); setRangeError(''); setActivePreset(null); setPage(1) }
    catch (cause) { setRangeError(cause.message) }
  }

  function applyPreset(preset) {
    const next = getAdminFinancePreset(preset)
    setRange(next); setDraftRange(next); setHistoryRange(next); setRangeError(''); setActivePreset(preset); setPage(1); setMonthMenuOpen(false)
  }

  function applyMonth(monthNumber) {
    const activeYear = resolveActiveYear(range)
    const next = getAdminFinanceMonthRange(monthNumber, activeYear)
    setSelectedMonth(monthNumber)
    setRange(next); setDraftRange(next); setHistoryRange(next); setRangeError(''); setActivePreset('monthSelect'); setPage(1); setMonthMenuOpen(false)
  }

  function selectTab(id) { setTabId(id); setQuery(''); setPage(1) }

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

  const noticeMessage = actionMessage || state?.message

  return <div className="admin-report">
    {noticeMessage && <p className="admin-report-notice" role="status">{noticeMessage}</p>}
    <header className="admin-report-hero"><span><Landmark size={14} aria-hidden="true" />MASJID AL-HIDAYAH</span><h2>LAPORAN<br />KEUANGAN</h2><p>Ringkasan pemasukan, pengeluaran, dan saldo<br className="admin-desktop-break" /> dana masjid dalam satu tampilan.</p><div><button type="button" onClick={() => navigate('/admin/kelola-dana', { state: { openTransaction: 'income' } })}><ArrowDownCircle size={16} aria-hidden="true" />Tambah Pemasukan</button><button type="button" onClick={() => navigate('/admin/kelola-dana', { state: { openTransaction: 'expense' } })}><ArrowUpCircle size={16} aria-hidden="true" />Tambah Pengeluaran</button></div></header>
    <section className="admin-report-balance" aria-label="Total saldo seluruh dana"><p>TOTAL SALDO SELURUH DANA</p><span><i aria-hidden="true" />{periodLabel} · snapshot {snapshotLabel}</span><h2>{formatRupiah(report.totals.closingBalance)}</h2><dl>{[['openingBalance', 'Saldo Awal'], ['income', 'Pemasukan'], ['expense', 'Pengeluaran']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{formatRupiah(report.totals[key])}</dd></div>)}</dl></section>
    <div className="admin-report-category-cards">{report.categories.map((category) => <button key={category.id} type="button" style={adminCategoryColorStyle(category.color)} className={`admin-report-category-card admin-report-category--${category.color}`} onClick={() => { selectTab('monthly'); tabPanel.current?.scrollIntoView({ block: 'start' }) }} aria-label={`Lihat rincian ${category.label}`}><span><Wallet size={21} aria-hidden="true" /></span><small>{category.label}</small><strong>{formatRupiah(category.closingBalance)}</strong></button>)}</div>
    <section className="admin-report-detail" aria-labelledby="admin-report-detail-title"><div className="admin-report-detail-heading"><div><h2 id="admin-report-detail-title">Detail Laporan</h2><p>Rincian pemasukan dan pengeluaran simulasi untuk rentang terpilih.</p></div><div className="admin-report-presets"><div className="admin-report-month-picker" ref={monthPickerRef}><span id="admin-report-month-label" className="admin-report-month-label">Pilih bulan</span><div className="admin-report-month-dropdown"><button ref={monthTriggerRef} type="button" className={`admin-report-month-trigger${activePreset === 'monthSelect' ? ' is-active' : ''}`} aria-labelledby="admin-report-month-label admin-report-month-value" aria-haspopup="listbox" aria-expanded={monthMenuOpen} aria-controls="admin-report-month-listbox" onClick={() => setMonthMenuOpen((open) => !open)}><CalendarDays size={14} aria-hidden="true" /><span id="admin-report-month-value">{ADMIN_REPORT_MONTHS[selectedMonth - 1]}</span><ChevronDown size={14} aria-hidden="true" className={monthMenuOpen ? 'is-open' : undefined} /></button>{monthMenuOpen && <ul id="admin-report-month-listbox" role="listbox" aria-labelledby="admin-report-month-label" className="admin-report-month-menu">{ADMIN_REPORT_MONTHS.map((label, index) => { const monthNumber = index + 1; return <li key={label}><button type="button" role="option" aria-selected={selectedMonth === monthNumber} className={selectedMonth === monthNumber ? 'is-selected' : undefined} onClick={() => applyMonth(monthNumber)}>{label}</button></li> })}</ul>}</div></div>{[['week', '1 minggu terakhir'], ['month', '1 bulan terakhir'], ['quarter', '3 bulan terakhir']].map(([id, label]) => <button key={id} type="button" aria-pressed={activePreset === id} onClick={() => applyPreset(id)}>{label}</button>)}</div></div>
      <form className="admin-report-filters" noValidate onSubmit={applyRange} aria-label="Filter tanggal transaksi mock"><span><CalendarDays size={16} aria-hidden="true" />Rentang transaksi:</span>{[['startDate', 'Dari tanggal'], ['endDate', 'Sampai tanggal']].map(([key, label]) => <label key={key}><span>{label}</span><input name={key} type="date" required value={draftRange[key]} onChange={(event) => { setDraftRange((previous) => ({ ...previous, [key]: event.target.value })); setRangeError(''); setActivePreset(null); setMonthMenuOpen(false); setPage(1) }} aria-invalid={Boolean(rangeError)} aria-describedby={rangeError ? 'admin-report-range-error' : undefined} /></label>)}<button type="submit">Terapkan</button><p>{transactions.length} dari {report.transactions.length} transaksi mock</p></form>
      {rangeError && <p className="admin-report-error" id="admin-report-range-error" role="alert">{rangeError}</p>}
      <aside className="admin-report-notice"><ShieldCheck size={18} aria-hidden="true" /><p>Data mock khusus review · {report.historicalTransactionCount} transaksi historis mock, {report.transactions.length} transaksi aktif; bukan riwayat resmi. Ringkasan saldo tetap snapshot {snapshotLabel}. Filter tanggal juga membatasi ketiga tampilan laporan di bawah.{report.sessionChangeCount > 0 && <> Ada perubahan sesi: tabel, total filter, dan rekap memakai data aktif. Saldo snapshot tetap memakai baseline; ekspor dokumen menggunakan transaksi aktif.</>}</p></aside>
      <div className="admin-report-transaction-panels"><TransactionPanel type="income" transactions={transactions} categories={report.categories} onEdit={editTransactionItem} onDelete={requestDeleteTransaction} /><TransactionPanel type="expense" transactions={transactions} categories={report.categories} onEdit={editTransactionItem} onDelete={requestDeleteTransaction} /></div>
    </section>
    <AdminBalanceSummary categories={report.categories} totals={report.totals} updatedDate={report.updatedDate} title={`Resume Saldo Bulan ${monthLabel}`} titleId="admin-report-balance-title" />
    <section className="admin-report-download"><div><h2>Unduh Laporan Keuangan</h2><p>Pilih periode dan jenis laporan, lalu pratinjau PDF atau PNG.</p></div><button type="button" onClick={() => { rememberView(); navigate('/admin/laporan/unduh') }}><Download size={16} aria-hidden="true" />Unduh Laporan</button></section>
    <div ref={reportNavigation} id="kas-masuk" role="tablist" className="admin-report-tabs" aria-label="Jenis laporan">{reportTabs.map(({ id, label, icon: Icon }, index) => <button key={id} type="button" role="tab" id={`admin-report-tab-${id}`} aria-selected={tabId === id} aria-controls="admin-report-ledger-panel" tabIndex={tabId === id ? 0 : -1} className={`admin-report-view--${id}`} onClick={() => selectTab(id)} onKeyDown={(event) => handleTabKey(event, index)}><Icon size={16} aria-hidden="true" />{label}</button>)}</div>
    <section ref={tabPanel} id="admin-report-ledger-panel" role="tabpanel" aria-labelledby={`admin-report-tab-${tabId}`} tabIndex={0} className={`admin-report-ledger admin-report-view--${tabId}`}>
      <div className="admin-report-ledger-heading"><div><h2>{selectedTab.label}{tabId === 'monthly' ? ` ${historyRange.startDate.slice(0, 4)}` : ''}</h2><p>{tabId === 'income' ? 'Semua pemasukan dana masjid' : tabId === 'expense' ? 'Semua pengeluaran dana masjid' : 'Ringkasan saldo & aliran kas setiap bulan dan kategori'} · data mock<br />{formatReportDate(historyRange.startDate)}–{formatReportDate(historyRange.endDate)}</p></div>{tabId === 'monthly' && <span><CalendarDays size={14} aria-hidden="true" />Tahun {historyRange.startDate.slice(0, 4)}</span>}</div>
      {tabId === 'monthly' ? <MonthlyRecap months={months} /> : <>
        <div className="admin-report-ledger-tools"><article className="admin-report-ledger-total"><span>TOTAL {tabId === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}</span><strong>{formatRupiah(ledgerSummary[tabId])}</strong><small>Sesuai filter · mock</small><selectedTab.icon size={72} aria-hidden="true" /></article><article className="admin-report-ledger-count"><span>JUMLAH TRANSAKSI</span><strong>{ledgerTransactions.length}</strong><small>hasil filter · simulasi</small></article><label className="admin-report-search"><Search size={18} aria-hidden="true" /><span className="sr-only">Cari uraian transaksi</span><input type="search" maxLength={160} placeholder="Cari transaksi..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} /></label></div>
        <p className="admin-report-ledger-hint"><ShieldCheck size={14} aria-hidden="true" />Lihat Detail untuk melihat transaksi. Edit dan hapus tersedia di halaman detail · simulasi sesi.</p>
        <LedgerTable transactions={ledgerTransactions} categories={report.categories} type={tabId} page={page} pageSize={pageSize} setPage={setPage} setPageSize={setPageSize} rememberView={rememberView} />
        <p className="sr-only" role="status">{ledgerTransactions.length} transaksi mock {selectedTab.label}.</p>
      </>}
    </section>
    {deletingTransaction && <AdminTransactionDeleteDialog transaction={deletingTransaction} category={report.categories.find((item) => item.id === deletingTransaction.categoryId)} onClose={() => setDeletingTransaction(null)} onDelete={confirmDeleteTransaction} returnFocusRef={deleteReturnFocus} />}
  </div>
}

export default function AdminFinanceReportPage() {
  const { dashboard, error, deleteTransaction } = useOutletContext()
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat laporan keuangan admin…</p>
  return <AdminFinanceReportContent report={buildAdminFinanceReport(dashboard)} deleteTransaction={deleteTransaction} />
}
