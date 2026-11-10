import { useEffect, useRef, useState } from 'react'
import { Building2, CircleAlert, Download, LoaderCircle, Receipt, Sparkles } from 'lucide-react'
import AdminReceiptForm from '../components/AdminReceiptForm.jsx'
import { createReceiptPng } from '../services/adminReceiptExportService.js'
import { downloadReportFile } from '../services/reportExportService.js'
import { receiptAmountInWords } from '../utils/adminReceipt.js'
import { formatRupiah } from '../utils/reportFormatters.js'
import './AdminReceiptPage.css'

function ReceiptDocument({ receipt }) {
  return <article className="admin-receipt-document" aria-label="Pratinjau draft kwitansi">
    <header className="admin-receipt-banner"><img src={`${import.meta.env.BASE_URL}assets/masjid-background.webp`} alt="" width="1928" height="1089" /><div><span><Building2 size={24} aria-hidden="true" /></span><h3>MASJID AL-HIDAYAH<br />SOROLATEN</h3></div></header>
    <div className="admin-receipt-body">
      <p className="admin-receipt-draft">Draft / Belum tersimpan ke server</p>
      <dl>{[['No', 'Belum diterbitkan'], ['Telah terima dari', receipt?.payer || 'Nama pemberi pembayaran'], ['Uang sejumlah', receipt ? formatRupiah(Number(receipt.amount)) : 'Nominal jumlah'], ['Untuk Pembayaran', receipt?.purpose || 'Keterangan pembayaran'], ['Metode Pembayaran', receipt?.method || 'Pilih metode pembayaran']].map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}</dl>
      <div className="admin-receipt-bottom"><p><span>Terbilang:</span> <strong>{receipt ? receiptAmountInWords(Number(receipt.amount)) : 'Belum diisi'}</strong></p><p><strong>Yogyakarta,</strong> {receipt?.date || 'dd/mm/yyyy'}</p></div>
      <p className="admin-receipt-generated"><Sparkles size={20} aria-hidden="true" />Kwitansi generated dengan web</p>
    </div>
  </article>
}

export default function AdminReceiptPage() {
  const [receipt, setReceipt] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [saved, setSaved] = useState(false)
  const trigger = useRef(null)
  const exportSheet = useRef(null)
  const downloadButton = useRef(null)
  const exportController = useRef(null)

  useEffect(() => () => exportController.current?.abort(), [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleDownload() {
    if (!receipt || exportController.current) return
    const controller = new AbortController()
    exportController.current = controller
    setExporting(true)
    setToast(null)
    if (window.innerWidth < 480) downloadButton.current?.scrollIntoView({ block: 'center' })
    try {
      const file = await createReceiptPng({ sheet: exportSheet.current.firstElementChild, date: receipt.date, signal: controller.signal })
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

  return <div className="admin-receipt">
    <header className="admin-receipt-heading"><div><h2>Kwitansi</h2><p>Generate dan unduh kwitansi PNG</p></div><button ref={trigger} type="button" className="admin-receipt-create" disabled={exporting} onClick={() => { setToast(null); setModalOpen(true) }}><Receipt size={20} aria-hidden="true" />Buat Kwitansi</button></header>
    <ReceiptDocument receipt={receipt} />
    <button ref={downloadButton} type="button" className="admin-receipt-download" onClick={handleDownload} disabled={!receipt || exporting} aria-describedby="admin-receipt-download-note">{exporting ? <LoaderCircle size={20} className="admin-receipt-spinner" aria-hidden="true" /> : <Download size={20} aria-hidden="true" />}{exporting ? 'Membuat PNG…' : 'Unduh PNG'}</button>
    <p id="admin-receipt-download-note" className="admin-receipt-note">{receipt ? 'PNG menyertakan penanda draft. Nomor resmi dan penyimpanan server belum tersedia.' : 'Isi kelima field melalui Buat Kwitansi sebelum mengunduh draft PNG.'}</p>
    {saved && <p className="admin-receipt-note" role="status">Pratinjau lokal diperbarui. Draft belum tersimpan ke server.</p>}
    {exporting && <p className="sr-only" role="status">Sedang membuat berkas PNG kwitansi.</p>}
    <div ref={exportSheet} className="admin-receipt-export" aria-hidden="true"><ReceiptDocument receipt={receipt} /></div>
    {toast && <div className={`admin-receipt-toast admin-receipt-toast--${toast.type}`} role="status" aria-live="polite">{toast.type === 'success' ? <Download size={22} aria-hidden="true" /> : <CircleAlert size={22} aria-hidden="true" />}<span>{toast.message}</span></div>}
    {modalOpen && <AdminReceiptForm receipt={receipt} returnFocusRef={trigger} onClose={() => setModalOpen(false)} onSave={(values) => { setReceipt(values); setSaved(true); setModalOpen(false) }} />}
  </div>
}
