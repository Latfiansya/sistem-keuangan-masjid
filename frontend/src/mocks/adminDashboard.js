// Data tampilan dari referensi Admin 1.2; akun ini bukan kredensial login.
export const mockAdminDashboard = {
  updatedDate: '2026-10-20',
  account: { name: 'Super Admin', email: 'superadmin@masjid.id', initials: 'SA' },
  categories: [
    { id: 'mosque', label: 'Kas Masjid', color: 'green', openingBalance: 13463200, income: 682500, expense: 1427500 },
    { id: 'friday', label: "Kotak Jum'at Berkah", color: 'blue', openingBalance: 3251000, income: 403000, expense: 0 },
    { id: 'maintenance', label: 'Kotak Pembangunan & Pemeliharaan', color: 'orange', openingBalance: 150000, income: 706000, expense: 0 },
  ],
  // Lima transaksi terbaru merupakan cuplikan, bukan seluruh mutasi ringkasan.
  recentTransactions: [
    { id: 'admin-trx-01', date: '2026-10-15', categoryId: 'mosque', type: 'income', description: 'Infaq Pengajian Malam Kamis', amount: 117000 },
    { id: 'admin-trx-02', date: '2026-10-15', categoryId: 'mosque', type: 'expense', description: 'Snack Pengajian Malam Kamis', amount: 110000 },
    { id: 'admin-trx-03', date: '2026-10-15', categoryId: 'mosque', type: 'expense', description: 'Donasi Paud', amount: 100000 },
    { id: 'admin-trx-04', date: '2026-10-14', categoryId: 'mosque', type: 'expense', description: 'Pembelian Pewangi Karpet & Pembersih Lantai', amount: 118500 },
    { id: 'admin-trx-05', date: '2026-10-09', categoryId: 'maintenance', type: 'income', description: 'Kotak Pembangunan & Pemeliharaan', amount: 403000 },
  ],
}
