import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, CalendarDays, ChevronRight, Info, Pencil, Save, ShieldCheck, Trash2 } from 'lucide-react'
import AdminTransactionFields from '../components/AdminTransactionFields.jsx'
import AdminTransactionDeleteDialog from '../components/AdminTransactionDeleteDialog.jsx'
import { getActiveAdminTransactions } from '../services/adminTransactionData.js'
import { validateAdminTransaction } from '../services/adminTransactionService.js'
import { adminCategoryColorStyle } from '../utils/adminCategoryColors.js'
import { formatReportDate, formatRupiah } from '../utils/reportFormatters.js'
import './AdminFundsPage.css'
import './AdminTransactionPage.css'

function TransactionContent({ transaction, dashboard, edit, editTransaction, deleteTransaction, reportView, setReportView }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [values, setValues] = useState(() => ({ ...transaction, amount: String(transaction.amount), personName: transaction.personName || '', notes: transaction.notes || '', showDonorNamePublic: transaction.showDonorNamePublic === true }))
  const [errors, setErrors] = useState({})
  const [deleting, setDeleting] = useState(false)
  const deleteButton = useRef(null)
  const income = transaction.type === 'income'
  const kind = income ? 'Kas Masuk' : 'Kas Keluar'
  const category = dashboard.categories.find((item) => item.id === transaction.categoryId)
  const detailUrl = `/admin/laporan/transaksi/${encodeURIComponent(transaction.id)}`
  const backUrl = '/admin/laporan#transaksi'
  const Icon = income ? ArrowDownLeft : ArrowUpRight

  function prepareReturn() {
    setReportView({ ...reportView, tabId: transaction.type })
  }

  function change(name, value) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: '', form: '' }))
  }

  function submit(event) {
    event.preventDefault()
    const validation = validateAdminTransaction(values, dashboard.categories, transaction.type)
    setErrors(validation)
    if (Object.keys(validation).length) {
      event.currentTarget.elements.namedItem(Object.keys(validation)[0])?.focus()
      return
    }
    try { editTransaction(transaction.id, values); navigate(detailUrl, { replace: true, state: { message: 'Perubahan simulasi sesi diterapkan. Belum tersimpan ke server.' } }) }
    catch (cause) { setErrors({ form: cause.message }) }
  }

  function remove() {
    deleteTransaction(transaction.id)
    prepareReturn()
    navigate(backUrl, { replace: true, state: { message: 'Transaksi dihapus dari simulasi sesi. Data asli dan snapshot tetap utuh.' } })
  }

  return <div className={`admin-transaction-page admin-transaction-page--${transaction.type}`}>
    <nav className="admin-transaction-breadcrumb" aria-label="Breadcrumb"><Link to="/admin/laporan">Laporan</Link><ChevronRight size={15} aria-hidden="true" /><Link to={backUrl} onClick={prepareReturn}>{kind}</Link><ChevronRight size={15} aria-hidden="true" />{edit ? <><Link to={detailUrl}>Detail Transaksi</Link><ChevronRight size={15} aria-hidden="true" /><span aria-current="page">Edit Transaksi</span></> : <span aria-current="page">Detail Transaksi</span>}</nav>
    <Link className="admin-transaction-back" to={edit ? detailUrl : backUrl} onClick={edit ? undefined : prepareReturn}><ArrowLeft size={18} aria-hidden="true" />Kembali ke {edit ? 'Detail Transaksi' : kind}</Link>
    <header className="admin-transaction-heading"><div><h2>{edit ? 'Edit' : 'Detail'} Transaksi</h2><p>{edit ? 'Perbarui informasi transaksi. Pastikan data sudah sesuai sebelum disimpan.' : `Lihat informasi ${kind.toLowerCase()} sebelum mengubah atau menghapus data.`}</p></div>{!edit && <div><button ref={deleteButton} type="button" className="admin-transaction-danger" onClick={() => setDeleting(true)}><Trash2 size={18} aria-hidden="true" />Hapus</button><Link className="admin-transaction-primary" to={`${detailUrl}/edit`}><Pencil size={18} aria-hidden="true" />Edit Transaksi</Link></div>}</header>
    <p className="admin-transaction-session-note" role="status">{state?.message && <>{state.message} </>}Simulasi sesi · Belum tersimpan ke server. Edit/hapus memengaruhi data aktif dan total simulasi; snapshot saldo Dashboard tetap. Ekspor laporan memakai data aktif.</p>
    <div className="admin-transaction-columns">
      <section className="admin-panel admin-transaction-information">
        <header><h3>Informasi {kind}</h3><span className={`admin-type-badge${income ? '' : ' admin-type-badge--expense'}`}>{income ? 'Masuk' : 'Keluar'}</span></header>
        {edit ? <form className="admin-transaction-edit-form" noValidate onSubmit={submit}><p>Kolom bertanda * wajib diisi.</p><div className="admin-transaction-edit-fields"><AdminTransactionFields values={values} errors={errors} categories={dashboard.categories} type={transaction.type} change={change} multilineDescription /></div>{errors.form && <p className="admin-transaction-error" role="alert">{errors.form}</p>}<footer><Link to={detailUrl}>Batal</Link><button type="submit" className="admin-transaction-primary"><Save size={18} aria-hidden="true" />Simpan Perubahan</button></footer></form> : <div className="admin-transaction-information-body">
          <div><p>Uraian transaksi</p><h3>{transaction.description}</h3></div>
          <dl><div><dt>Tanggal transaksi</dt><dd><CalendarDays size={18} aria-hidden="true" /><time dateTime={transaction.date}>{formatReportDate(transaction.date)}</time></dd></div><div><dt>Kategori dana</dt><dd><span className="admin-category-badge" style={adminCategoryColorStyle(category.color)}>{category.label}</span></dd></div></dl>
          <div><p>Jumlah {income ? 'pemasukan' : 'pengeluaran'}</p><strong className={`admin-transaction-amount admin-transaction-money--${transaction.type}`}>{formatRupiah(transaction.amount)}</strong></div>
          {(transaction.personName || transaction.notes || (income && typeof transaction.showDonorNamePublic === 'boolean')) && <dl className="admin-transaction-optional">{transaction.personName && <div><dt>{income ? 'Nama Donatur' : 'Nama Penerima'}</dt><dd>{transaction.personName}</dd></div>}{income && typeof transaction.showDonorNamePublic === 'boolean' && <div><dt>Nama donatur di laporan publik</dt><dd>{transaction.showDonorNamePublic ? 'Diizinkan (simulasi)' : 'Tidak ditampilkan'}</dd></div>}{transaction.notes && <div><dt>Keterangan</dt><dd>{transaction.notes}</dd></div>}</dl>}
        </div>}
      </section>
      <aside className="admin-transaction-summary"><section className="admin-transaction-summary-main">{edit ? <><small>TRANSAKSI YANG DIEDIT</small><h3>{transaction.description}</h3><p>{formatReportDate(transaction.date)} · {category.label}</p><strong>{formatRupiah(transaction.amount)}</strong></> : <><Icon size={26} aria-hidden="true" /><h3>{income ? 'Pemasukan' : 'Pengeluaran'} dana masjid</h3><p>Transaksi simulasi {kind.toLowerCase()} pada kategori {category.label}.</p></>}</section><section className="admin-panel admin-transaction-summary-help">{edit ? <Info size={22} aria-hidden="true" /> : <ShieldCheck size={22} aria-hidden="true" />}<h3>{edit ? 'Periksa kembali data' : 'Kelola dengan hati-hati'}</h3><p>{edit ? 'Perubahan nominal, tanggal, dan kategori akan menghitung ulang total simulasi sesi.' : 'Gunakan Edit Transaksi untuk memperbaiki tanggal, kategori, uraian, atau jumlah.'}</p><p>{edit ? 'Pilih Batal untuk kembali tanpa menyimpan perubahan.' : 'Penghapusan memerlukan konfirmasi HAPUS. Refresh mengembalikan data mock awal.'}</p></section></aside>
    </div>
    {deleting && <AdminTransactionDeleteDialog transaction={transaction} category={category} onClose={() => setDeleting(false)} onDelete={remove} returnFocusRef={deleteButton} />}
  </div>
}

export default function AdminTransactionPage({ edit = false }) {
  const context = useOutletContext()
  const { id } = useParams()
  if (context.error || !context.dashboard) return <p className="admin-dashboard-state" role={context.error ? 'alert' : 'status'}>{context.error || 'Memuat transaksi admin…'}</p>
  const transaction = getActiveAdminTransactions(context.dashboard).find((item) => item.id === id)
  if (!transaction) return <section className="admin-panel admin-transaction-not-found"><h2>Transaksi tidak ditemukan</h2><p>Transaksi tidak tersedia dalam sesi ini. Tambahan dan perubahan mock akan hilang setelah refresh.</p><Link to="/admin/laporan#transaksi">Kembali ke Laporan</Link></section>
  return <TransactionContent key={`${id}-${edit}`} {...context} transaction={transaction} edit={edit} />
}
