import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { getPublicContent } from '../services/publicContentService.js'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function PublicLayout() {
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const { pathname } = useLocation()

  useEffect(() => {
    const controller = new AbortController()
    getPublicContent({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setContent(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const isAgenda = pathname.replace(/\/$/, '') === '/agenda'

  return (
    <div className={`public-layout${pathname === '/' ? ' public-layout--home' : isAgenda ? ' public-layout--agenda' : ''}`}>
      <a className="skip-link" href="#konten">Lewati navigasi</a>
      <Navbar />
      <main id="konten" tabIndex={-1} className={pathname === '/' ? 'home-main' : isAgenda ? 'agenda-page' : 'placeholder-page page-container'}>
        <Outlet context={{ content, error }} />
      </main>
      <Footer content={content} />
    </div>
  )
}
