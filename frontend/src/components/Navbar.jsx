import { Landmark } from 'lucide-react'
import { NavLink, Link } from 'react-router'

export default function Navbar() {
  return (
    <header className="public-header">
      <nav className="navbar" aria-label="Navigasi utama">
        <Link to="/" className="brand" aria-label="Masjid Al-Hidayah — Beranda">
          <Landmark aria-hidden="true" />
          <span>MASJID<br />AL-HIDAYAH<small>Placeholder logo</small></span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Beranda</NavLink>
          <button type="button" className="nav-link" disabled title="Halaman Agenda belum tersedia">Agenda</button>
          <NavLink to="/profil" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Profil Masjid</NavLink>
          <button type="button" className="nav-link" disabled title="Halaman Kontak belum tersedia">Kontak</button>
        </div>
      </nav>
    </header>
  )
}
