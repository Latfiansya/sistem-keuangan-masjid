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

  const route = pathname.replace(/\/$/, '') || '/'
  const layoutClass = { '/': 'home', '/agenda': 'agenda', '/profil': 'profile' }[route]
  const mainClass = layoutClass ? (layoutClass === 'agenda' ? 'agenda-page' : `${layoutClass}-main`) : 'placeholder-page page-container'

  return (
    <div className={`public-layout${layoutClass ? ` public-layout--${layoutClass}` : ''}`}>
      <a className="skip-link" href="#konten">Lewati navigasi</a>
      <Navbar />
      <main id="konten" tabIndex={-1} className={mainClass}>
        <Outlet context={{ content, error }} />
      </main>
      <Footer content={content} />
    </div>
  )
}
