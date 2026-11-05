import { NavLink, Link } from 'react-router'

export default function Navbar() {
  return (
    <header className="public-header">
      <nav className="navbar" aria-label="Navigasi utama">
        <Link to="/" className="brand" aria-label="Masjid Al-Hidayah — Beranda">
          <img src="/assets/masjid-logo.webp" width="640" height="191" alt="Masjid Al-Hidayah" />
        </Link>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Beranda</NavLink>
          <NavLink to="/agenda" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Agenda</NavLink>
          <NavLink to="/profil" className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Profil Masjid</NavLink>
          <button type="button" className="nav-link" disabled title="Halaman Kontak belum tersedia">Kontak</button>
        </div>
      </nav>
    </header>
  )
}
