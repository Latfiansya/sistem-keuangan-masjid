import { useRef, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useOutletContext } from 'react-router'
import AdminCategoryDialog from '../components/AdminCategoryDialog.jsx'
import AdminBalanceSummary from '../components/AdminBalanceSummary.jsx'
import { adminCategoryColorStyle } from '../utils/adminCategoryColors.js'
import { dataSource } from '../utils/env.js'
import './AdminCategoriesPage.css'

export default function AdminCategoriesPage() {
  const { dashboard, error, saveCategory, deleteCategory } = useOutletContext()
  const [dialog, setDialog] = useState(null)
  const [message, setMessage] = useState('')
  const returnFocusRef = useRef(null)
  const addButton = useRef(null)
  function openDialog(mode, category, event) {
    returnFocusRef.current = event.currentTarget
    setMessage('')
    setDialog({ mode, category })
  }
  async function save(values, id) {
    await saveCategory(values, id)
    setDialog(null)
    setMessage(dataSource === 'mock'
      ? `Kategori ${id ? 'diperbarui' : 'ditambahkan'} pada sesi mock. Belum tersimpan ke server.`
      : `Kategori berhasil ${id ? 'diperbarui' : 'ditambahkan'} di database.`)
  }
  async function remove(id) {
    await deleteCategory(id)
    setDialog(null)
    setMessage(dataSource === 'mock'
      ? 'Kategori dihapus dari sesi mock. Belum tersimpan ke server.'
      : 'Kategori berhasil dihapus dari database.')
  }
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat kategori dana…</p>
  const { categories, totals, updatedDate } = dashboard

  return (
    <div className="admin-categories">
      <header className="admin-categories-heading">
        <div><h2>Kategori Dana</h2><p>Kelola kategori dana masjid</p></div>
        <button className="admin-categories-add" type="button" ref={addButton} onClick={(event) => openDialog('add', null, event)}><Plus size={16} aria-hidden="true" />Tambah Kategori</button>
      </header>
      {(message || dataSource === 'mock') && <p className="admin-category-session-note" role="status">{message || 'Data mock · Perubahan hanya selama sesi admin dan hilang setelah muat ulang.'}</p>}
      <section className="admin-panel admin-categories-list" aria-label="Daftar kategori dana">
        <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
        <div className="admin-table-scroll" role="region" aria-label="Daftar kategori dana, dapat digeser pada layar kecil" tabIndex={0}>
          <table className="admin-categories-table">
            <caption className="sr-only">Kategori dana dalam sistem. Kategori yang digunakan transaksi dilindungi dari penghapusan.</caption>
            <thead><tr><th scope="col">No</th><th scope="col">Kategori</th><th scope="col">Aksi</th></tr></thead>
            <tbody>{categories.map((category, index) => <tr key={category.id} data-category-id={category.id}>
              <td>{index + 1}</td>
              <th scope="row"><span style={adminCategoryColorStyle(category.color)} className={`admin-category-badge admin-category-badge--${category.color}`}>{category.label}</span></th>
              <td><div className="admin-category-actions">
                <button type="button" aria-label={`Edit kategori ${category.label}`} onClick={(event) => openDialog('edit', category, event)}><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" aria-label={`Hapus kategori ${category.label}`} onClick={(event) => openDialog('delete', category, event)}><Trash2 size={16} aria-hidden="true" /></button>
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <AdminBalanceSummary categories={categories} totals={totals} updatedDate={updatedDate} showDescription={false} />
      {dialog && <AdminCategoryDialog {...dialog} dashboard={dashboard} onSave={save} onDelete={remove} onClose={() => setDialog(null)} returnFocusRef={returnFocusRef} fallbackFocusRef={addButton} />}
    </div>
  )
}
