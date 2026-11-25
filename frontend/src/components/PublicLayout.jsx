import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { getPublicContent } from '../services/publicContentService.js'
import { isPublicReportEnabled } from '../services/reportService.js'
import { resolveUploadedImage } from '../utils/uploadedImage.js'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import ReportAccessModal from './ReportAccessModal.jsx'

export default function PublicLayout() {
  const [content, setContent] = useState(null)
  const [error, setError] = useState('')
  const [accessTrigger, setAccessTrigger] = useState(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const showPublicReport = isPublicReportEnabled(content)

  function openReportAccess(event) {
    event.preventDefault()
    if (!showPublicReport) return
    setAccessTrigger(event.currentTarget)
  }

  useEffect(() => {
    const controller = new AbortController()
    getPublicContent({ signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setContent(data) })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const route = pathname.replace(/\/$/, '') || '/'
  const layoutClass = { '/': 'home', '/agenda': 'agenda', '/profil': 'profile', '/kontak': 'contact' }[route]
  const uploadedPhoto = resolveUploadedImage(content?.photoPath)
  // Foto unggahan menggantikan latar bawaan melalui variabel CSS; tanpa unggahan tetap memakai aset bawaan.
  const layoutStyle = uploadedPhoto ? { '--public-scene-image': `url("${uploadedPhoto}")` } : undefined
  const mainClass = layoutClass ? (layoutClass === 'agenda' ? 'agenda-page' : `${layoutClass}-main`) : 'placeholder-page page-container'

  return (
    <div className={`public-layout${layoutClass ? ` public-layout--${layoutClass}` : ''}`} style={layoutStyle}>
      <a className="skip-link" href="#konten">Lewati navigasi</a>
      <Navbar logoSrc={resolveUploadedImage(content?.logoPath)} />
      <main id="konten" tabIndex={-1} className={mainClass}>
        <Outlet context={{ content, error, openReportAccess }} />
      </main>
      <Footer content={content} onReportAccess={openReportAccess} />
      {accessTrigger && showPublicReport && <ReportAccessModal returnFocusTo={accessTrigger} onClose={() => setAccessTrigger(null)} onAccessGranted={() => { setAccessTrigger(null); navigate('/laporan-keuangan') }} />}
    </div>
  )
}
