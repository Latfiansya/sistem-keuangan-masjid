import { Outlet } from 'react-router'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function PublicLayout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 text-gray-900">
      <a className="sr-only focus:not-sr-only" href="#konten">Lewati navigasi</a>
      <Navbar />
      <main id="konten" className="flex-1 py-8" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
