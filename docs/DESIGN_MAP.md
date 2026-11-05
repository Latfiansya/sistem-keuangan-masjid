# Peta desain dan halaman React

Sembilan tampilan user telah dinyatakan final oleh pengguna. Referensi implementasi M1.1 adalah `design-references/user/01-beranda.png` (1728 × 4121 px). Gambar dipakai untuk pemeriksaan visual, bukan dipasang sebagai halaman atau latar aplikasi. Figma MCP tidak dipanggil pada tahap ini; node ID tidak diketahui.

| Halaman React | Route | Referensi lokal | Status implementasi |
| --- | --- | --- | --- |
| Beranda (`HomePage`) | `/` | `01-beranda.png` | Seluruh bagian HTML/CSS dan mock melalui service; foto, latar foto, logo dan font asli belum tersedia |
| Profil Masjid (`ProfilePage`) | `/profil` | `03-profil.png` | Tetap placeholder; di luar M1.1 |
| Laporan Keuangan (`FinancialReportPage`) | `/laporan-keuangan` | `05-laporan.png`, `07-token.png` | Tetap placeholder; di luar M1.1 |
| Agenda | Belum ditambahkan | `02-agenda.png` | Navigasi dan tombol detail dinonaktifkan sampai tahap berikutnya |
| Kontak | Belum ditambahkan | `04-kontak.png` | Navigasi dinonaktifkan sampai tahap berikutnya |
| Pilihan format/pratinjau | Belum diterapkan | `06-format-unduhan.png`, `08-preview-pdf.png`, `09-preview-png.png` | Di luar M1.1 |
| Halaman tidak ditemukan (`NotFoundPage`) | `*` | Belum ditentukan | Placeholder fungsional |

## Layout dan komponen M1.1

`PublicLayout` memuat konten dari `publicContentService`, menampilkan Navbar/Footer, dan membagikan konten ke Beranda melalui konteks Outlet. `Button`, `VisionMission`, dan `AgendaSummary` diekstrak untuk pola yang berulang. Statistik dan kartu kemakmuran tetap berada di Beranda tanpa abstraksi kartu generik.

Urutan Beranda: hero, tiga statistik, visi-misi, ringkasan agenda, tiga kartu kemakmuran, CTA laporan, Footer. Logo/Beranda menuju `/`, Profil menuju `/profil`, dan CTA/Footer laporan menuju `/laporan-keuangan`. Tidak ada route baru. Masuk Pengurus dinonaktifkan sampai tujuan resmi tersedia.

## Batas kesetiaan visual

- Hero memakai gradien biru dan placeholder berlabel foto; ikon Landmark berlabel placeholder menggantikan logo sementara.
- Latar foto buram belum tersedia dan diwakili gradien biru/hijau pucat. Tidak memakai foto masjid lain.
- Font memakai Arial/Helvetica sementara. Warna, spacing, radius, shadow dan kontainer adalah pendekatan dari raster, bukan token asli Figma.
- Responsive menumpuk kartu dan membungkus navigasi; desain mobile resmi belum diberikan.
- Konten mock mengikuti referensi dan bukan hasil verifikasi informasi produksi. Tidak ada data transaksi keuangan dalam M1.1.

## Refinement proporsi M1.1

Setelah koreksi pengguna, skala elemen dan jarak antarseksi diperkecil melalui `clamp()` serta breakpoint 1023/767 px. Navbar maksimum 1000 px, hero desktop 620–900 px dan mobile minimum 500 px. Heading visi dibatasi 20em dan paragraf hero 32em untuk menjaga komposisi baris. Konten/komponen tetap sama; tidak menambahkan fitur atau memakai zoom/transform skala halaman.

QA terbaru mencakup 1728 × 1080, 1366 × 768, dan 390 × 844 dengan zoom 100%. Screenshot hasil tersedia lokal di `tmp/visual-qa/final-*.png` (diabaikan Git). Detail pengukuran dan kekurangan dibanding referensi dicatat pada PROGRESS. Pendekatan skala terbaru menggantikan nilai awal M1.1; aset asli masih diperlukan untuk kesetiaan visual akhir.
