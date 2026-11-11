import AdminRupiahInput from './AdminRupiahInput.jsx'

export default function AdminTransactionFields({ values, errors, categories, type, change, multilineDescription = false }) {
  const income = type === 'income'
  const label = income ? 'Pemasukan' : 'Pengeluaran'
  const error = (name) => errors[name] && <p id={`admin-transaction-${name}-error`} className="admin-transaction-error" role="alert">{errors[name]}</p>
  const attributes = (name) => ({ id: `admin-transaction-${name}`, name, value: values[name], onChange: (event) => change(name, event.target.value), 'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `admin-transaction-${name}-error` : undefined })
  const fieldLabel = (name, text, required = false) => <label htmlFor={`admin-transaction-${name}`}>{text}{required && <span aria-hidden="true">*</span>}</label>

  return <>
      <div className="admin-transaction-field">{fieldLabel('date', 'Tanggal Transaksi', true)}<input {...attributes('date')} type="date" required />{error('date')}</div>
      <div className="admin-transaction-field">{fieldLabel('categoryId', 'Kategori Dana', true)}<select {...attributes('categoryId')} required><option value="">Pilih Kategori Dana</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select>{error('categoryId')}</div>
      <div className="admin-transaction-field">{fieldLabel('description', `Uraian ${label}`, true)}{multilineDescription ? <textarea {...attributes('description')} required rows={4} maxLength={500} /> : <input {...attributes('description')} required autoComplete="off" maxLength={500} placeholder={income ? 'Contoh: Infaq Jumat' : 'Contoh: Pembelian perlengkapan masjid'} />}{error('description')}</div>
      <div className="admin-transaction-field">{fieldLabel('amount', 'Nominal', true)}<AdminRupiahInput {...attributes('amount')} required />{error('amount')}</div>
      <div className="admin-transaction-field">{fieldLabel('personName', income ? 'Nama Donatur' : 'Nama Penerima')}<input {...attributes('personName')} autoComplete="off" maxLength={100} placeholder={income ? 'Kosongkan untuk Hamba Allah' : 'Nama penerima (opsional)'} />{error('personName')}</div>
      {income && <label className="admin-transaction-privacy"><input name="showDonorNamePublic" type="checkbox" checked={values.showDonorNamePublic} onChange={(event) => change('showDonorNamePublic', event.target.checked)} />Tampilkan nama donatur di laporan publik</label>}
      <div className="admin-transaction-field">{fieldLabel('notes', 'Keterangan')}<textarea {...attributes('notes')} rows={3} maxLength={500} placeholder="Keterangan tambahan (opsional)" />{error('notes')}</div>
  </>
}
