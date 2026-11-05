import { NavLink } from 'react-router'

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/profil', label: 'Profil Masjid' },
  { to: '/laporan-keuangan', label: 'Laporan Keuangan' },
]

export default function Navbar() {
  return (
    <header className="border-b border-gray-200 py-4">
      <p className="mb-3 font-semibold">Masjid Al-Hidayah</p>
      <nav aria-label="Navigasi utama" className="flex flex-wrap gap-4">
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => (
            isActive ? 'font-semibold underline' : 'underline'
          )}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
