import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useOutletContext } from 'react-router'
import AdminBalanceSummary from '../components/AdminBalanceSummary.jsx'
import './AdminCategoriesPage.css'

export default function AdminCategoriesPage() {
  const { dashboard, error } = useOutletContext()
  if (error) return <p className="admin-dashboard-state" role="alert">{error}</p>
  if (!dashboard) return <p className="admin-dashboard-state" role="status">Memuat kategori dana…</p>
  const { categories, totals, updatedDate } = dashboard

  return (
    <div className="admin-categories">
      <header className="admin-categories-heading">
        <div><h2>Kategori Dana</h2><p>Kelola kategori dana masjid</p></div>
        <button className="admin-categories-add" type="button" disabled title="Fitur tambah kategori belum tersedia"><Plus size={16} aria-hidden="true" />Tambah Kategori</button>
      </header>
      <section className="admin-panel admin-categories-list" aria-label="Daftar kategori dana">
        <p className="admin-table-hint">Geser tabel untuk melihat seluruh kolom.</p>
        <div className="admin-table-scroll" role="region" aria-label="Daftar kategori dana, dapat digeser pada layar kecil" tabIndex={0}>
          <table className="admin-categories-table">
            <caption className="sr-only">Tiga kategori dana dari data contoh. Aksi tambah, edit dan hapus belum tersedia.</caption>
            <thead><tr><th scope="col">No</th><th scope="col">Kategori</th><th scope="col">Aksi</th></tr></thead>
            <tbody>{categories.map((category, index) => <tr key={category.id}>
              <td>{index + 1}</td>
              <th scope="row"><span className={`admin-category-badge admin-category-badge--${category.color}`}>{category.label}</span></th>
              <td><div className="admin-category-actions">
                <button type="button" disabled aria-label={`Edit kategori ${category.label} (belum tersedia)`} title="Fitur edit kategori belum tersedia"><Pencil size={16} aria-hidden="true" /></button>
                <button type="button" disabled aria-label={`Hapus kategori ${category.label} (belum tersedia)`} title="Fitur hapus kategori belum tersedia"><Trash2 size={16} aria-hidden="true" /></button>
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <AdminBalanceSummary categories={categories} totals={totals} updatedDate={updatedDate} showDescription={false} />
    </div>
  )
}
