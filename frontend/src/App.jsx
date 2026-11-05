import { Route, Routes } from 'react-router'
import PublicLayout from './components/PublicLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import FinancialReportPage from './pages/FinancialReportPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="laporan-keuangan" element={<FinancialReportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
