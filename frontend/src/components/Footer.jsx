import { FileText, LogIn, MapPin } from 'lucide-react'
import { Link } from 'react-router'

export default function Footer({ content, onReportAccess }) {
  return (
    <footer className="public-footer">
      <div className="footer-top">
        <div>
          <p className="footer-name">{content?.name || 'Masjid Al-Hidayah'}</p>
          {content && <p className="footer-address"><MapPin aria-hidden="true" />{content.address}</p>}
        </div>
        <div className="footer-links">
          <p>TAUTAN KHUSUS</p>
          <Link to="/laporan-keuangan" onClick={onReportAccess}><FileText aria-hidden="true" />Laporan Keuangan</Link>
          <Link to="/admin/login"><LogIn aria-hidden="true" />Masuk Pengurus</Link>
        </div>
      </div>
      {content && <p className="copyright">© {content.copyrightYear} Masjid Al-Hidayah Sorolaten. All rights reserved.</p>}
    </footer>
  )
}
