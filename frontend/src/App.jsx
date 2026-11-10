import { Route, Routes } from 'react-router'
import PublicLayout from './components/PublicLayout.jsx'
import AgendaPage from './pages/AgendaPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import FinancialReportPage from './pages/FinancialReportPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminFundsPage from './pages/AdminFundsPage.jsx'
import AdminCategoriesPage from './pages/AdminCategoriesPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="kontak" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="laporan-keuangan" element={<FinancialReportPage />} />
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="kelola-dana" element={<AdminFundsPage />} />
        <Route path="kategori-dana" element={<AdminCategoriesPage />} />
      </Route>
    </Routes>
  )
}
