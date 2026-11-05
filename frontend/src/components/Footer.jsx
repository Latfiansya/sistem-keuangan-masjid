import { FileText, LogIn, MapPin } from 'lucide-react'
import { Link } from 'react-router'

export default function Footer({ content }) {
  return (
    <footer className="public-footer">
      <div className="footer-top">
        <div>
          <p className="footer-name">{content?.name || 'Masjid Al-Hidayah'}</p>
          {content && <p className="footer-address"><MapPin aria-hidden="true" />{content.address}</p>}
        </div>
        <div className="footer-links">
          <p>TAUTAN KHUSUS</p>
          <Link to="/laporan-keuangan"><FileText aria-hidden="true" />Laporan Keuangan</Link>
          <button type="button" disabled title="Tujuan Masuk Pengurus belum tersedia"><LogIn aria-hidden="true" />Masuk Pengurus</button>
        </div>
      </div>
      {content && <p className="copyright">© {content.copyrightYear} Masjid Al-Hidayah Sorolaten. All rights reserved.</p>}
    </footer>
  )
}
