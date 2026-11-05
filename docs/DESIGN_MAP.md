# Peta desain dan halaman React

Sembilan tampilan user telah dinyatakan final oleh pengguna. Referensi implementasi M1.1 adalah `design-references/user/01-beranda.png` (1728 × 4121 px). Gambar dipakai untuk pemeriksaan visual, bukan dipasang sebagai halaman atau latar aplikasi. Figma MCP tidak dipanggil pada tahap ini; node ID tidak diketahui.

| Halaman React | Route | Referensi lokal | Status implementasi |
| --- | --- | --- | --- |
| Beranda (`HomePage`) | `/` | `01-beranda.png` | HTML/CSS dan mock melalui service; foto/logo Blade serta Plus Jakarta Sans lokal terintegrasi pada M1.1a |
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

- Hero memakai foto masjid asli dengan crop `cover` posisi tengah bawah; mobile memakai titik horizontal 72%. Overlay biru menjaga keterbacaan teks.
- Navbar memakai logo asli transparan, lebar 155 px desktop, 140 px tablet dan 125 px mobile.
- Foto yang sama dipakai pada lapisan latar Beranda dengan blur 10 px serta overlay pucat. Tidak memakai screenshot halaman atau foto masjid lain.
- Plus Jakarta Sans variabel dimuat lokal, bobot 200–800, khusus kelas `public-layout--home`. Halaman placeholder lain mempertahankan font/latar sebelumnya. Warna, spacing, radius, shadow dan kontainer tetap pendekatan dari raster.
- Responsive menumpuk kartu dan membungkus navigasi; desain mobile resmi belum diberikan.
- Konten mock mengikuti referensi dan bukan hasil verifikasi informasi produksi. Tidak ada data transaksi keuangan dalam M1.1.

## Refinement proporsi M1.1

Setelah koreksi pengguna, skala elemen dan jarak antarseksi diperkecil melalui `clamp()` serta breakpoint 1023/767 px. Navbar maksimum 1000 px, hero desktop 620–900 px dan mobile minimum 500 px. Heading visi dibatasi 20em dan paragraf hero 32em untuk menjaga komposisi baris. Konten/komponen tetap sama; tidak menambahkan fitur atau memakai zoom/transform skala halaman.

QA terbaru mencakup 1728 × 1080, 1366 × 768, dan 390 × 844 dengan zoom 100%. Screenshot hasil tersedia lokal di `tmp/visual-qa/final-*.png` (diabaikan Git). Detail pengukuran dan kekurangan dibanding referensi dicatat pada PROGRESS. Pendekatan skala terbaru menggantikan nilai awal M1.1; integrasi aset berikut melengkapi hasil refinement tanpa memperbesar kembali komponen.


## M1.1a — Sumber dan pengolahan aset

Repository sumber: [Puong206/UI-Keu-Masjid](https://github.com/Puong206/UI-Keu-Masjid/tree/12e0155f6a5aba59f4776403c711082f27fa2dce), commit `12e0155f6a5aba59f4776403c711082f27fa2dce`. Salinan referensi berada di luar repository utama, `/Users/nobody79/Project/referensi-ui-keu-masjid-m11a`, pada detached HEAD commit tersebut. Tidak mengimpor histori, backend, atau stylesheet Laravel.

| Aset aplikasi | Sumber | Pengolahan |
| --- | --- | --- |
| `frontend/public/assets/masjid-background.webp` | `public/images/Background Pict.png`, 1928 × 1089, 2.290.895 byte | cwebp kualitas 90, dimensi/alpha dipertahankan; 156.332 byte (hemat 93,2%) |
| `frontend/public/assets/masjid-logo.webp` | `public/images/Logo Masjid.png`, 2131 × 635, 604.092 byte | Resize 640 × 191 dan WebP lossless setelah resize, alpha dipertahankan; 34.240 byte (hemat 94,3%) |
| `frontend/public/assets/fonts/plus-jakarta-sans-latin-variable.woff2` | Google Fonts, Plus Jakarta Sans v12, subset Latin, normal variabel 200–800 | WOFF2 resmi tanpa modifikasi, 27.272 byte; `font-display: swap` |
| `frontend/public/assets/fonts/OFL.txt` | Lisensi resmi Plus Jakarta Sans | Salinan utuh copyright dan SIL OFL 1.1 |

Font direferensikan oleh layout Blade melalui Google Fonts. Berkas WOFF2 diambil dari `https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yygg_vb.woff2`; lisensi berasal dari `https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/OFL.txt`. Font disajikan dari aplikasi sendiri, tanpa permintaan Google Fonts saat runtime. Subset Latin mencakup karakter konten Beranda saat ini; karakter lain memakai fallback.

Foto dan logo cocok secara visual dengan objek/identitas dalam referensi final. Ketajaman foto dan efek bayangan pada logo sudah terdapat pada sumber; tidak dibuat ulang atau dihilangkan. Repository sumber tidak menyertakan lisensi khusus foto/logo yang ditemukan dalam pemeriksaan. Penggunaan pada proyek ini mengikuti instruksi pengguna; tidak menganggapnya sebagai aset bebas untuk redistribusi umum. Lisensi MIT Laravel tidak dianggap sebagai lisensi foto/logo. Font memakai SIL OFL 1.1 dan salinan lisensinya disertakan.

QA M1.1a: 1728 × 1080, 1366 × 768, 390 × 844; zoom 100%; screenshot viewport dan halaman penuh di `tmp/m11a-qa/final-*.png` (diabaikan Git). Crop mobile memotong sisi foto untuk mempertahankan fasad; belum ada frame mobile resmi. Skala refinement dan struktur konten tetap dipertahankan; posisi foto, overlay, dan pemenggalan teks belum merupakan kesamaan piksel dengan Figma.
