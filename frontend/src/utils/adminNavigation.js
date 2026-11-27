import {
  ArrowRightLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  Contact,
  FileText,
  Folder,
  HandHeart,
  KeyRound,
  LayoutDashboard,
  LayoutList,
  Receipt,
  Users,
} from 'lucide-react'
import { dataSource } from './env.js'

export const adminNavigation = [
  {
    label: 'Keuangan', items: [
      { label: 'Dashboard Keuangan', icon: LayoutDashboard, to: '/admin/dashboard' },
      { label: 'Laporan', title: 'Laporan Keuangan', icon: FileText, to: '/admin/laporan' },
      { label: 'Kelola Dana', title: 'Kelola Dana Keuangan', icon: ArrowRightLeft, to: '/admin/kelola-dana' },
      { label: 'Kategori Dana', icon: Folder, to: '/admin/kategori-dana' },
      { label: 'Kwitansi', icon: Receipt, to: '/admin/kwitansi' },
      { label: 'Activity Log', icon: ClipboardList, to: '/admin/activity-log' },
    ]
  },
  {
    label: 'Konten Website', items: [
      { label: 'Profil Masjid', icon: Building2, to: '/admin/profil-masjid' },
      { label: 'Konten Profil', title: 'Konten Profil Masjid', icon: LayoutList, to: '/admin/konten-profil' },
      { label: 'Agenda', icon: CalendarDays, to: '/admin/agenda' },
      { label: 'Kontak & Pengaturan', title: 'Kontak & Pengaturan Website', icon: Contact, to: '/admin/kontak-pengaturan' },
      { label: 'Donasi', icon: HandHeart, to: '/admin/donasi' },
    ]
  },
  {
    label: 'Pengaturan', items: [
      { label: 'Kelola Akun', icon: Users, to: '/admin/kelola-akun', superAdminOnly: true },
      { label: 'Kode Akses Laporan', icon: KeyRound, to: '/admin/kode-akses-laporan' },
    ]
  },
]

// Menyembunyikan menu khusus Super Admin ketika login sebagai Admin biasa pada mode API.
export function getVisibleAdminNavigation(role, source = dataSource) {
  const allowSuperAdminMenu = source === 'mock' ? (!role || role === 'Super Admin') : role === 'Super Admin'
  return adminNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.superAdminOnly || allowSuperAdminMenu),
    }))
    .filter((group) => group.items.length > 0)
}
