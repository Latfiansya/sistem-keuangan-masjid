import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NavLink, Link } from 'react-router'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigation = useRef(null)
  const toggle = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function closeOutside(event) {
      if (!navigation.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [menuOpen])

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !menuOpen) return
    event.preventDefault()
    setMenuOpen(false)
    toggle.current?.focus()
  }

  return (
    <header className="public-header">
      <nav ref={navigation} className="navbar" aria-label="Navigasi utama" onKeyDown={handleKeyDown} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false) }}>
        <Link to="/" className="brand" aria-label="Masjid Al-Hidayah — Beranda" onClick={() => setMenuOpen(false)}>
          <img src="/assets/masjid-logo.webp" width="640" height="191" alt="Masjid Al-Hidayah" />
        </Link>
        <button ref={toggle} type="button" className="nav-toggle" aria-expanded={menuOpen} aria-controls="public-navigation" aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'} onClick={() => setMenuOpen((previous) => !previous)}>{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}Menu</button>
        <div id="public-navigation" className={`nav-links${menuOpen ? ' is-open' : ''}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Beranda</NavLink>
          <NavLink to="/agenda" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Agenda</NavLink>
          <NavLink to="/profil" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Profil Masjid</NavLink>
          <NavLink to="/kontak" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>Kontak</NavLink>
        </div>
      </nav>
    </header>
  )
}
