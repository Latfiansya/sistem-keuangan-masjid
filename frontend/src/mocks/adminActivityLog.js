// Skenario presentasi yang berdiri sendiri, bukan catatan aktivitas asli atau data audit.
export const mockAdminActivityLog = [
  { id: 'demo-log-01', date: '2026-06-14', time: '09:35', admin: 'Ahmad', type: 'edit', typeLabel: 'Edit transaksi', module: 'Keuangan', title: 'mengubah transaksi “Beli Konsumsi Jumat Berkah”', details: [
    { label: 'Nominal sebelumnya', value: 800000, format: 'money', tone: 'old' },
    { label: 'Nominal sesudah', value: 850000, format: 'money', tone: 'positive' },
    { label: 'Kategori', value: "Kotak Jum'at Berkah" },
  ] },
  { id: 'demo-log-02', date: '2026-06-14', time: '10:12', admin: 'Ahmad', type: 'delete', typeLabel: 'Hapus transaksi', module: 'Keuangan', title: 'menghapus transaksi “Infaq Jumat”', details: [
    { label: 'Nominal', value: 1500000, format: 'money', tone: 'positive' },
    { label: 'Kategori', value: 'Kas Masjid' },
    { label: 'Waktu penghapusan', value: '14 Juni 2026, 10:12' },
  ] },
  { id: 'demo-log-03', date: '2026-06-13', time: '11:00', admin: 'Siti', type: 'add', typeLabel: 'Tambah transaksi', module: 'Keuangan', title: 'mencatat pemasukan baru “Donasi Pembangunan”', details: [
    { label: 'Nominal', value: 5000000, format: 'money', tone: 'positive' },
    { label: 'Kategori', value: 'Infaq Pembangunan' },
    { label: 'Donatur', value: 'Bapak Hendra' },
  ] },
  { id: 'demo-log-04', date: '2026-06-12', time: '08:00', admin: 'Super Admin', type: 'account', typeLabel: 'Tambah akun admin', module: 'Akun', title: 'membuat akun admin baru', details: [
    { label: 'Nama', value: 'Ahmad Fauzi' },
    { label: 'Email', value: 'ahmad@masjid.id' },
    { label: 'Status', value: 'Aktif', tone: 'positive' },
  ] },
  { id: 'demo-log-05', date: '2026-06-11', time: '08:00', admin: 'Super Admin', type: 'account', typeLabel: 'Tambah akun admin', module: 'Akun', title: 'membuat akun admin baru', details: [
    { label: 'Nama', value: 'Siti Rahmawati' },
    { label: 'Email', value: 'siti@masjid.id' },
    { label: 'Status', value: 'Aktif', tone: 'positive' },
  ] },
  { id: 'demo-log-06', date: '2026-06-10', time: '09:00', admin: 'Super Admin', type: 'code', typeLabel: 'Ubah kode akses laporan', module: 'Pengaturan', title: 'mengubah kode gate laporan publik', details: [
    { label: 'Status', value: 'Diperbarui (contoh)', tone: 'positive' },
    { label: 'Catatan', value: 'Hanya kode untuk gate UI; nilai kode tidak ditampilkan.' },
  ] },
  { id: 'demo-log-07', date: '2026-06-10', time: '10:30', admin: 'Ahmad', type: 'print', typeLabel: 'Cetak kwitansi', module: 'Keuangan', title: 'mencetak kwitansi pemasukan', details: [
    { label: 'Kode transaksi', value: 'TRX-001' },
    { label: 'Nominal', value: 1500000, format: 'money', tone: 'positive' },
    { label: 'Donatur', value: 'Hamba Allah' },
  ] },
  { id: 'demo-log-08', date: '2026-06-09', time: '14:15', admin: 'Super Admin', type: 'disable', typeLabel: 'Nonaktifkan akun admin', module: 'Akun', title: 'menonaktifkan akun admin', details: [
    { label: 'Akun', value: 'Budi Santoso (budi@masjid.id)' },
    { label: 'Status', value: 'Nonaktif (contoh)' },
  ] },
  { id: 'demo-log-09', date: '2026-06-08', time: '16:00', admin: 'Siti', type: 'content', typeLabel: 'Tambah konten', module: 'Konten', title: 'menambahkan agenda baru “Pengajian Rutin Jumat Malam”', details: [
    { label: 'Tanggal', value: '27 Juni 2026' },
    { label: 'Lokasi', value: 'Masjid Al Hidayah' },
  ] },
]
