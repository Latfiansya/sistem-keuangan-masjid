# Handoff frontend publik — diperbarui M1.8b

Frontend publik selesai untuk **mode mock**, dengan gate dan ekspor lokal. Backend bisnis belum terhubung; ini bukan pernyataan siap produksi. Hasil audit/QA terperinci ada di [PROGRESS](PROGRESS.md), pemetaan visual di [DESIGN_MAP](DESIGN_MAP.md), dan field/payload di [API_CONTRACT](API_CONTRACT.md).

## Route dan tampilan

| Route | Tampilan/status |
| --- | --- |
| / | Beranda: hero, statistik, visi-misi, ringkasan agenda, kemakmuran, CTA laporan |
| /agenda | Kegiatan mingguan 5, bulanan 2, tahunan/PHBI 5 |
| /profil | Statistik/visi bersama Beranda, sejarah 1980/2000, tujuh pengurus, CTA Kontak |
| /kontak | Kontak/Donasi dan lokasi; data yang belum dikonfirmasi tetap placeholder |
| Halaman publik | Klik CTA laporan Beranda/Footer membuka modal gate di atas halaman asal |
| /laporan-keuangan | Laporan → format → pratinjau PDF/PNG. Akses langsung/refresh menampilkan laporan tanpa gate; tanpa Navbar/Footer publik |
| * | Halaman tidak ditemukan dengan tautan Beranda |

Komponen bersama: PublicLayout memuat konten melalui service dan konteks Outlet; Navbar/Footer, Button, VisionMission, AgendaSummary/AgendaGroup. PublicLayout membuka ReportAccessModal yang menggunakan kembali ReportAccessPanel. Laporan memakai FinancialReportPage, FinancialTable, BalanceSummary, ReportFormatPicker, ReportPreview dan ReportSheet. Jangan membuat halaman duplikat untuk modal atau state format/pratinjau.

## Service dan sumber data

| Modul service | Fungsi/sumber sekarang |
| --- | --- |
| publicContentService | getPublicContent({ signal }); mocks/publicContent.js dan hasil getAgenda |
| agendaService | getAgenda({ signal }); mocks/agenda.js; counts diturunkan dari daftar |
| reportService | checkReportPassword(password, { signal }) dan getReport({ startDate, endDate, signal }); mocks/reportAccess.js dan report.js |
| reportExportService | createReportExport, downloadReportFile, getReportExportName; memakai snapshot report/pages dan elemen ReportSheet, tanpa HTTP/data baru |
| healthService | getHealth({ signal }); health mock atau GET /api/health. Utilitas fondasi, bukan pemuat halaman publik |

Komponen tidak mengimpor mock atau menghubungi database/Laravel. Struktur field lengkap mengikuti tabel API_CONTRACT dan file mocks yang disebut di atas. Profil/visi/statistik serta agenda Beranda memakai sumber bersama. Nominal integer Rupiah, tanggal kalender YYYY-MM-DD; pemformatan hanya di presentasi. reportCalculations menghitung saldo awal terfilter, mutasi dan saldo akhir; reportPagination mengatur lembar A4 tanpa membagi baris transaksi.

## Langkah integrasi Express

1. Jalankan proyek sesuai README dengan Node ≥24/npm ≥10. Pertahankan mode mock sebagai baseline mandiri.
2. GET /api/health sudah tersedia. Tinjau usulan GET /api/public/content dan /api/public/agenda, serta POST /api/public/report/check-password dan GET /api/public/finance/report pada API_CONTRACT. Endpoint bisnis itu **belum tersedia**; nama konten/agenda masih perlu persetujuan tim.
3. Buat endpoint pada pekerjaan backend terpisah. Cocokkan envelope success/data/error, field wajib, kategori dan safe integer, cakupan data, tanggal inklusif serta saldo awal rentang dengan mock/test yang ada.
4. Setelah kontrak siap, ganti cabang API pada service terkait, gunakan apiBaseUrl dan AbortSignal; gabungkan konten + hasil agenda di getPublicContent. Jangan mengganti komponen dengan fetch langsung atau memakai mock diam-diam saat API gagal.
5. Set konfigurasi frontend dan restart Vite/build ulang:

```dotenv
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=/api
```

Saat ini mode itu hanya mengaktifkan HTTP health; service bisnis menampilkan error integrasi yang jelas. Mengubah environment saja tidak membuat backend terhubung. Proxy Vite /api menuju 127.0.0.1:3000; preview build tidak memiliki proxy. Konfigurasi hosting/CORS/fallback BrowserRouter perlu disepakati terpisah. Variabel VITE_* masuk bundle; jangan menyimpan rahasia di sana.

## Gate, laporan dan ekspor

- Sandi demo **demo123** hanya untuk pengembangan. Gate muncul hanya dari CTA laporan publik. Native dialog berada pada top layer di atas Navbar fixed, mengunci scroll/fokus, mendukung Escape/tutup dan mengembalikan fokus/posisi scroll pemicu. Menutup saat loading membatalkan service; sandi benar menutup modal dan menavigasi ke laporan. Tidak ada storage, cookie, akun, JWT atau session.
- Akses URL langsung dan refresh /laporan-keuangan sengaja melewati gate. FinancialReportPage langsung memanggil getReport; tidak mempunyai hasAccess. Refresh dari pratinjau/format menampilkan laporan/periode default, tanpa mempertahankan filter lewat storage. Ini pembatas interaksi CTA, bukan proteksi akses data.
- Backend kelak cukup memeriksa sandi bersama dari environment backend biasa. Respons valid bukan otorisasi: **gate hanya pembatas antarmuka dan tidak melindungi endpoint laporan publik**.
- April 2026: 17 pemasukan/33 pengeluaran. Saldo awal 18.590.700 + pemasukan 10.665.500 − pengeluaran 8.771.500 = saldo akhir 20.484.700. Jangan menyalin kesalahan subtotal Kas Masjid dari Blade; rekonsiliasi ada di API_CONTRACT.
- Filter inklusif; draft berlaku setelah Terapkan. Periode di luar cakupan berstatus unavailable, bukan nol. Hari kosong di dalam cakupan membawa saldo sebelumnya. Default/preset masih memakai acuan 30 April 2026; label contoh masih statis. Sepakati metadata data resmi dan periode produksi pada pekerjaan integrasi.
- Format/kembali mempertahankan filter. PDF/PNG memakai report/pages/ReportSheet yang sama. PDF A4 landscape berbasis gambar 2×; PNG satu lembar langsung, lebih dari satu lembar menjadi ZIP berurutan. Ekspor tidak membutuhkan endpoint atau upload; tombol dikunci selama proses dan error dapat dicoba lagi.
- Kategori transaksi pada ReportSheet berupa teks berwarna tanpa capsule; CSS yang sama ikut dirender ke PDF/PNG. Tinggi baris dan pagination tetap, jangan membuat versi kategori atau data kedua khusus ekspor.

## Verifikasi dan pekerjaan tertunda

Jalankan lint, seluruh test, build, audit dependency dan suite Chrome menurut README. Test mencakup rekonsiliasi, filter, gate, ekspor berkas nyata, navigasi keyboard, error API dan enam lebar viewport. Rujuk PROGRESS untuk hasil audit aktual; artefak QA berada di tmp/ dan tidak masuk Git.

- Konfirmasi QRIS, rekening/penerima, alamat/kontak/jam layanan dan tujuan peta bersama pengurus. verified bukan bukti validitas transaksi. Maps/Masuk Pengurus tetap nonaktif; jangan mengaktifkan tautan fiktif. Periode/nama pengurus dan konten referensi belum menjadi data produksi terverifikasi.
- Foto/logo sudah terintegrasi; izin publikasi aset perlu dipastikan tim. Font lokal disertai lisensi OFL. Belum ada frame mobile resmi; responsive mengikuti desktop dan refinement sebelumnya.
- PDF belum mendukung seleksi/cari teks; kapasitas memori/waktu mengikuti perangkat. Status unduhan mengonfirmasi pembuatan berkas dan pemicu browser, bukan penyimpanan akhir di disk.
- Chrome menjadi baseline QA. Safari WebDriver tidak berhasil membuat sesi pada lingkungan audit; Firefox tidak ditemukan pada lokasi aplikasi standar. Pengujian lintas browser/perangkat fisik masih perlu dilakukan sebelum menyatakan dukungan tersebut.
- Merge ke main memerlukan review manual tim; audit ini tidak melakukan merge, deployment, integrasi bisnis atau pekerjaan admin.
