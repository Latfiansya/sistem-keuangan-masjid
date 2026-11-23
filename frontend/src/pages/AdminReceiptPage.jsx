import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'
import { Ban, Building2, CircleAlert, Download, Eye, LoaderCircle, Pencil, Receipt, Sparkles, TriangleAlert, X } from 'lucide-react'
import AdminReceiptForm from '../components/AdminReceiptForm.jsx'
import { createReceiptPng } from '../services/adminReceiptExportService.js'
import { cancelAdminReceipt, createAdminReceipt, getAdminReceipts, updateAdminReceipt } from '../services/adminReceiptService.js'
import { downloadReportFile } from '../services/reportExportService.js'
import { receiptAmountInWords } from '../utils/adminReceipt.js'
import { dataSource } from '../utils/env.js'
import { formatRupiah } from '../utils/reportFormatters.js'
import '../components/AdminModalDialog.css'
import './AdminReceiptPage.css'

function ReceiptDocument({ receipt }) {
  const issued = Boolean(receipt?.number)
  return <article className="admin-receipt-document" aria-label={issued ? `Kwitansi ${receipt.number}` : 'Pratinjau draft kwitansi'}>
    <header className="admin-receipt-banner"><img src={`${import.meta.env.BASE_URL}assets/masjid-background.webp`} alt="" width="1928" height="1089" /><div><span><Building2 size={24} aria-hidden="true" /></span><h3>MASJID AL-HIDAYAH<br />SOROLATEN</h3></div></header>
    <div className="admin-receipt-body">
      {!issued && <p className="admin-receipt-draft">Draft / Belum tersimpan ke server</p>}
      {receipt?.status === 'Dibatalkan' && <p className="admin-receipt-cancelled">Dibatalkan — kwitansi ini tidak berlaku</p>}
      <dl>{[['No', receipt?.number || 'Belum diterbitkan'], ['Telah terima dari', receipt?.payer || 'Nama pemberi pembayaran'], ['Uang sejumlah', receipt ? formatRupiah(Number(receipt.amount)) : 'Nominal jumlah'], ['Untuk Pembayaran', receipt?.purpose || 'Keterangan pembayaran'], ['Metode Pembayaran', receipt?.method || 'Pilih metode pembayaran']].map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}</dl>
      <div className="admin-receipt-bottom"><p><span>Terbilang:</span> <strong>{receipt ? receiptAmountInWords(Number(receipt.amount)) : 'Belum diisi'}</strong></p><p><strong>Yogyakarta,</strong> {receipt?.date || 'dd/mm/yyyy'}</p></div>
      <p className="admin-receipt-generated"><Sparkles size={20} aria-hidden="true" />Kwitansi generated dengan web</p>
    </div>
  </article>
}

// Riwayat kwitansi tersimpan (mode API), termasuk yang dibatalkan; memilih baris menampilkan kwitansi di pratinjau.
function ReceiptHistory({ receipts, error, selectedId, onSelect, onEdit, onCancel }) {
  return <section className="admin-panel admin-receipt-history" aria-labelledby="admin-receipt-history-title">
    <div className="admin-receipt-history-heading"><h2 id="admin-receipt-history-title">Riwayat Kwitansi</h2><p>Kwitansi yang sudah diterbitkan beserta pemasukannya.</p></div>
    {error ? <p className="admin-receipt-history-state" role="alert">{error}</p>
      : !receipts ? <p className="admin-receipt-history-state" role="status">Memuat riwayat kwitansi…</p>
        : !receipts.length ? <p className="admin-receipt-history-state">Belum ada kwitansi yang diterbitkan.</p>
          : <ul className="admin-receipt-history-list">{receipts.map((item) => <li key={item.id} className={[item.id === selectedId && 'is-selected', item.status === 'Dibatalkan' && 'is-cancelled'].filter(Boolean).join(' ') || undefined}>
            <div><strong>{item.number}{item.status === 'Dibatalkan' && <span className="admin-receipt-history-badge">Dibatalkan</span>}</strong><span>{[item.payer, item.date, item.categoryLabel || (item.status === 'Dibatalkan' ? 'pemasukan dihapus' : '')].filter(Boolean).join(' · ')}</span></div>
            <span className="admin-receipt-history-amount">{formatRupiah(Number(item.amount))}</span>
            <div className="admin-receipt-history-actions">
              <button type="button" aria-label={`Tampilkan kwitansi ${item.number}`} aria-pressed={item.id === selectedId} onClick={() => onSelect(item)}><Eye size={16} aria-hidden="true" />Tampilkan</button>
              {item.status === 'Aktif' && <>
                <button type="button" className="admin-receipt-history-icon" aria-label={`Edit kwitansi ${item.number}`} title="Edit kwitansi" onClick={(event) => onEdit(item, event)}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" className="admin-receipt-history-icon admin-receipt-history-icon--delete" aria-label={`Batalkan kwitansi ${item.number}`} title="Batalkan kwitansi" onClick={(event) => onCancel(item, event)}><Ban size={16} aria-hidden="true" /></button>
              </>}
            </div>
          </li>)}</ul>}
  </section>
}

// Konfirmasi pembatalan kwitansi (baris tetap tersimpan); pemasukan tetap tercatat kecuali pengurus memilih ikut menghapusnya.
function ReceiptCancelDialog({ receipt, onConfirm, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const [withTransaction, setWithTransaction] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = returnFocusRef.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector('.admin-crud-cancel')?.focus()
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [returnFocusRef])

  async function submit(event) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await onConfirm({ withTransaction })
    } catch (cause) {
      setError(cause.message)
      setSubmitting(false)
    }
  }

  return <dialog ref={dialogRef} className="admin-crud-dialog admin-crud-dialog--delete" aria-labelledby="admin-receipt-delete-title" onCancel={(event) => { event.preventDefault(); if (!submitting) onClose() }}>
    <header><h2 id="admin-receipt-delete-title">Batalkan Kwitansi?</h2><button type="button" disabled={submitting} aria-label="Tutup dialog batalkan kwitansi" onClick={onClose}><X size={22} aria-hidden="true" /></button></header>
    <form noValidate onSubmit={submit} aria-busy={submitting}>
      <div className="admin-crud-warning"><TriangleAlert size={22} aria-hidden="true" /><p>Batalkan kwitansi <strong>{receipt.number}</strong> untuk {receipt.payer} sebesar {formatRupiah(Number(receipt.amount))}? Kwitansi tetap tersimpan berstatus Dibatalkan, nomornya tidak dipakai ulang, dan pembatalan tidak dapat diurungkan.</p></div>
      <label className="admin-crud-checkbox" htmlFor="admin-receipt-delete-transaction">
        <input id="admin-receipt-delete-transaction" type="checkbox" checked={withTransaction} disabled={submitting} onChange={(event) => setWithTransaction(event.target.checked)} />
        Hapus juga transaksi pemasukannya ({receipt.categoryLabel})
      </label>
      <p className="admin-receipt-delete-note">{withTransaction ? 'Pemasukan ikut dihapus dari laporan dan saldo kategori berkurang. Ditolak bila saldo kategori sudah terpakai.' : 'Pemasukan tetap tercatat di laporan; hanya kwitansinya yang dibatalkan.'}</p>
      {error && <p className="admin-crud-error" role="alert">{error}</p>}
      <footer><button type="button" className="admin-crud-cancel" disabled={submitting} onClick={onClose}>Batal</button><button type="submit" className="admin-crud-delete-confirm" disabled={submitting}><Ban size={16} aria-hidden="true" />{submitting ? 'Membatalkan…' : 'Ya, Batalkan Kwitansi'}</button></footer>
    </form>
  </dialog>
}

export default function AdminReceiptPage() {
  const apiMode = dataSource !== 'mock'
  const { dashboard, reloadWorkspace } = useOutletContext() || {}
  const [receipt, setReceipt] = useState(null)
  const [receipts, setReceipts] = useState(apiMode ? null : [])
  const [historyError, setHistoryError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [historyMessage, setHistoryMessage] = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [saved, setSaved] = useState(false)
  const trigger = useRef(null)
  const rowTrigger = useRef(null)
  const exportSheet = useRef(null)
  const downloadButton = useRef(null)
  const exportController = useRef(null)

  useEffect(() => () => exportController.current?.abort(), [])
  useEffect(() => {
    if (!apiMode) return
    const controller = new AbortController()
    getAdminReceipts({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setReceipts(data) })
      .catch((cause) => { if (!controller.signal.aborted) setHistoryError(cause.message) })
    return () => controller.abort()
  }, [apiMode])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleSave(values) {
    if (!apiMode) {
      setReceipt(values)
      setSaved(true)
      setModalOpen(false)
      return
    }
    const created = await createAdminReceipt(values)
    setReceipt(created)
    setReceipts((previous) => [created, ...(previous || [])])
    setSaved(true)
    setModalOpen(false)
    setHistoryMessage('')
    await reloadWorkspace?.()
  }

  async function handleEditSave(values) {
    const updated = await updateAdminReceipt(editing.id, values)
    setReceipts((previous) => (previous || []).map((item) => (item.id === updated.id ? updated : item)))
    if (receipt?.id === updated.id) setReceipt(updated)
    setEditing(null)
    setSaved(false)
    setHistoryMessage(`Kwitansi ${updated.number} diperbarui beserta transaksi pemasukannya.`)
    await reloadWorkspace?.()
  }

  async function handleCancel({ withTransaction }) {
    const result = await cancelAdminReceipt(cancelling.id, { withTransaction })
    setReceipts((previous) => (previous || []).map((item) => (item.id === result.receipt.id ? result.receipt : item)))
    if (receipt?.id === result.receipt.id) setReceipt(result.receipt)
    setCancelling(null)
    setSaved(false)
    setHistoryMessage(`Kwitansi ${result.receipt.number} dibatalkan${withTransaction ? ' dan transaksi pemasukannya dihapus' : '; pemasukannya tetap tercatat'}.`)
    await reloadWorkspace?.()
  }

  function openRowDialog(setter, item, event) {
    rowTrigger.current = event.currentTarget
    setToast(null)
    setHistoryMessage('')
    setter(item)
  }

  async function handleDownload() {
    if (!receipt || exportController.current) return
    const controller = new AbortController()
    exportController.current = controller
    setExporting(true)
    setToast(null)
    if (window.innerWidth < 480) downloadButton.current?.scrollIntoView({ block: 'center' })
    try {
      const file = await createReceiptPng({ sheet: exportSheet.current.firstElementChild, date: receipt.date, number: receipt.number, signal: controller.signal })
      controller.signal.throwIfAborted()
      downloadReportFile(file)
      setToast({ type: 'success', message: 'Kwitansi berhasil diunduh' })
    } catch (cause) {
      if (!controller.signal.aborted) setToast({ type: 'error', message: `Kwitansi gagal diunduh. ${cause.message}` })
    } finally {
      exportController.current = null
      if (!controller.signal.aborted) setExporting(false)
    }
  }

  const cancelled = receipt?.status === 'Dibatalkan'
  const note = !receipt
    ? 'Isi field melalui Buat Kwitansi sebelum mengunduh PNG.'
    : cancelled ? `Kwitansi ${receipt.number} sudah dibatalkan sehingga tidak dapat diunduh.`
    : receipt.number ? `Kwitansi ${receipt.number} tersimpan di database. Nomor memakai format sementara sampai format resmi ditetapkan.` : 'PNG menyertakan penanda draft. Nomor resmi dan penyimpanan server hanya tersedia pada mode API.'

  return <div className="admin-receipt">
    <header className="admin-receipt-heading"><div><h2>Kwitansi</h2><p>Generate dan unduh kwitansi PNG</p></div><button ref={trigger} type="button" className="admin-receipt-create" disabled={exporting} onClick={() => { setToast(null); setModalOpen(true) }}><Receipt size={20} aria-hidden="true" />Buat Kwitansi</button></header>
    <ReceiptDocument receipt={receipt} />
    <button ref={downloadButton} type="button" className="admin-receipt-download" onClick={handleDownload} disabled={!receipt || cancelled || exporting} aria-describedby="admin-receipt-download-note">{exporting ? <LoaderCircle size={20} className="admin-receipt-spinner" aria-hidden="true" /> : <Download size={20} aria-hidden="true" />}{exporting ? 'Membuat PNG…' : 'Unduh PNG'}</button>
    <p id="admin-receipt-download-note" className="admin-receipt-note">{note}</p>
    {saved && <p className="admin-receipt-note" role="status">{receipt?.number ? `Kwitansi ${receipt.number} diterbitkan dan pemasukannya tercatat di laporan.` : 'Pratinjau lokal diperbarui. Draft belum tersimpan ke server.'}</p>}
    {historyMessage && <p className="admin-crud-feedback" role="status">{historyMessage}</p>}
    {apiMode && <ReceiptHistory receipts={receipts} error={historyError} selectedId={receipt?.id} onSelect={(item) => { setReceipt(item); setSaved(false); setToast(null); setHistoryMessage('') }} onEdit={(item, event) => openRowDialog(setEditing, item, event)} onCancel={(item, event) => openRowDialog(setCancelling, item, event)} />}
    {exporting && <p className="sr-only" role="status">Sedang membuat berkas PNG kwitansi.</p>}
    <div ref={exportSheet} className="admin-receipt-export" aria-hidden="true"><ReceiptDocument receipt={receipt} /></div>
    {toast && <div className={`admin-receipt-toast admin-receipt-toast--${toast.type}`} role="status" aria-live="polite">{toast.type === 'success' ? <Download size={22} aria-hidden="true" /> : <CircleAlert size={22} aria-hidden="true" />}<span>{toast.message}</span></div>}
    {modalOpen && <AdminReceiptForm receipt={receipt} categories={dashboard?.categories || []} apiMode={apiMode} returnFocusRef={trigger} onClose={() => setModalOpen(false)} onSave={handleSave} />}
    {editing && <AdminReceiptForm mode="edit" receipt={editing} categories={dashboard?.categories || []} apiMode returnFocusRef={rowTrigger} onClose={() => setEditing(null)} onSave={handleEditSave} />}
    {cancelling && <ReceiptCancelDialog receipt={cancelling} returnFocusRef={rowTrigger} onClose={() => setCancelling(null)} onConfirm={handleCancel} />}
  </div>
}
