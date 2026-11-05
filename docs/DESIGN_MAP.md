# Peta desain dan halaman React

Sembilan tampilan user telah dinyatakan final oleh pengguna. Referensi implementasi M1.1 adalah `design-references/user/01-beranda.png` (1728 × 4121 px). Gambar dipakai untuk pemeriksaan visual, bukan dipasang sebagai halaman atau latar aplikasi. Figma MCP tidak dipanggil pada tahap ini; node ID tidak diketahui.

| Halaman React | Route | Referensi lokal | Status implementasi |
| --- | --- | --- | --- |
| Beranda (`HomePage`) | `/` | `01-beranda.png` | HTML/CSS dan mock melalui service; foto/logo Blade serta Plus Jakarta Sans lokal terintegrasi pada M1.1a |
| Profil Masjid (`ProfilePage`) | `/profil` | `03-profil.png` | M1.3: header, statistik bersama, visi-misi, linimasa, tujuh pengurus, CTA Kontak |
| Laporan Keuangan (`FinancialReportPage`) | `/laporan-keuangan` | `05-laporan.png`, `07-token.png` | M1.5a: gate sandi bersama; laporan setelah akses masih placeholder M1.5b |
| Agenda (`AgendaPage`) | `/agenda` | `02-agenda.png` | M1.2: banner dan kelompok 5/2/5, mock/service bersama Beranda, responsive |
| Kontak (`ContactPage`) | `/kontak` | `04-kontak.png` | M1.4: Donasi, informasi takmir dan placeholder lokasi; data transaksi/kontak menunggu konfirmasi |
| Pilihan format/pratinjau | Belum diterapkan | `06-format-unduhan.png`, `08-preview-pdf.png`, `09-preview-png.png` | Di luar M1.1 |
| Halaman tidak ditemukan (`NotFoundPage`) | `*` | Belum ditentukan | Placeholder fungsional |

## Layout dan komponen M1.1

`PublicLayout` memuat konten dari `publicContentService`, menampilkan Navbar/Footer, dan membagikan konten ke Beranda melalui konteks Outlet. `Button`, `VisionMission`, dan `AgendaSummary` diekstrak untuk pola yang berulang. Statistik dan kartu kemakmuran tetap berada di Beranda tanpa abstraksi kartu generik.

Urutan Beranda: hero, tiga statistik, visi-misi, ringkasan agenda, tiga kartu kemakmuran, CTA laporan, Footer. Logo/Beranda menuju `/`, Profil menuju `/profil`, dan CTA/Footer laporan menuju `/laporan-keuangan`. M1.2 menambahkan `/agenda` untuk Navbar serta kedua CTA Agenda pada Beranda. Masuk Pengurus dinonaktifkan sampai tujuan resmi tersedia.

## Batas kesetiaan visual

- Hero memakai foto masjid asli dengan crop `cover` posisi tengah bawah; mobile memakai titik horizontal 72%. Overlay biru menjaga keterbacaan teks.
- Navbar memakai logo asli transparan, lebar 155 px desktop, 140 px tablet dan 125 px mobile.
- Foto yang sama dipakai pada lapisan latar Beranda dengan blur 10 px serta overlay pucat. Tidak memakai screenshot halaman atau foto masjid lain.
- Plus Jakarta Sans variabel dimuat lokal, bobot 200–800, pada Beranda, Agenda, Profil, dan Kontak melalui kelas layout masing-masing. Halaman placeholder lain mempertahankan font/latar sebelumnya. Warna, spacing, radius, shadow dan kontainer tetap pendekatan dari raster.
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


## M1.2 — Agenda

Referensi final `design-references/user/02-agenda.png` (1728 × 2895 px); struktur dan konten diperiksa terhadap `resources/views/pages/users/agenda.blade.php`, layout dan CSS pada commit Blade `12e0155f6a5aba59f4776403c711082f27fa2dce`. Repository sumber tidak diubah. Tidak mengimpor stylesheet Laravel.

- `AgendaPage` memakai `AgendaSummary` sebagai banner h1 tanpa tombol ke dirinya sendiri; versi h2 dan tombol detail tetap dipakai Beranda.
- `AgendaGroup` dipakai tiga kali: Mingguan (hijau, 5), Bulanan (lime, 2), Tahunan/PHBI (hijau, 5). Nomor, nama kegiatan, label jadwal, judul kelompok dan badge jumlah mengikuti referensi. Tanda baca diseragamkan tanpa mengubah nama/waktu kegiatan.
- Navbar, Footer, Button, logo, font lokal dan latar masjid dari M1.1a digunakan kembali. Kelas Agenda terpisah dari styling placeholder; latarnya sedikit dipucatkan khusus Agenda. CSS daftar dibatasi kelas `agenda-*`.
- Navbar Agenda, tombol Lihat Agenda, dan Lihat Detail Kegiatan menuju `/agenda`. Logo/Beranda kembali ke `/`; perubahan pathname mengembalikan scroll ke atas agar navigasi dari CTA tengah halaman tidak membuka Agenda pada posisi lama.
- Daftar dan statistik berasal dari satu mock melalui `agendaService`, digabungkan `publicContentService` lalu dikonsumsi melalui konteks Outlet. Ada state loading, error, daftar kosong dan kelompok kosong.

QA browser development dan hasil build mencakup 1728 × 1080, 1366 × 768, 390 × 844, zoom 100%. Dua iterasi merapikan banner, panjang baris deskripsi, jarak/tinggi kegiatan dan latar. Screenshot di `tmp/m12-qa/final-*.png` dan regresi Beranda di `tmp/m12-qa/home-*.png`, tidak di-stage. Tinggi halaman desktop sekitar 2923 px, dibanding raster 2895 px. Proporsi mendekati referensi, tetapi crop/blur latar, border, bayangan dan pemenggalan teks belum identik piksel. Tidak tersedia frame mobile resmi; nama dan jadwal ditumpuk agar tetap terbaca tanpa overflow.

Geometri Beranda M1.1a tetap sama pada tiga viewport; screenshot desktop/laptop identik dengan baseline lokal, mobile ditinjau visual tanpa regresi komposisi. Perubahan Beranda hanya mengaktifkan tautan Agenda dan mengambil ringkasan dari sumber data bersama.


## M1.3 — Profil Masjid

Referensi final `design-references/user/03-profil.png` (1728 × 3905 px), dengan konten dari `resources/views/pages/users/profil.blade.php` pada commit `12e0155f6a5aba59f4776403c711082f27fa2dce`. Layout/CSS Blade dan aset sebelumnya dipakai sebagai referensi tanpa mengubah repository sumber atau mengimpor stylesheet Laravel.

- Mengembangkan `ProfilePage` pada route `/profil` yang sudah ada; tidak membuat halaman/route duplikat.
- Header identitas, luas/kapasitas, VisionMission bersama, linimasa 1980/2000, pengurus 4+3 pada desktop dan CTA Hubungi Takmir menggunakan array konten dari publicContentService. Navbar, Footer, PublicLayout dan Button digunakan kembali; tidak menambah komponen untuk setiap kartu kecil.
- Nilai luas 265 m², kapasitas 290 Jamaah dan tahun berdiri 1980 memakai konstanta mock yang sama dengan Beranda. Field amount/unit dipakai pada kartu Profil; value untuk Beranda diturunkan dari nilai yang sama. Visi/misi tetap satu sumber.
- Periode **2023–2025** mengikuti desain final, menggantikan teks **2023–2026** yang tertulis pada Blade. Tujuh nama/jabatan serta catatan Kepala Dukuh/Ketua LPMD mengikuti sumber Blade. Tidak menyatakan periode tersebut sebagai pengurus terkini yang telah diverifikasi.
- Navbar Profil serta tombol Profil Beranda tetap menuju `/profil`; CTA menuju `/kontak`. Karena M1.4 belum dikerjakan, `/kontak` masih ditangani 404 yang sudah ada; tidak menambahkan implementasi Kontak.
- Font lokal, logo dan foto M1.1a digunakan kembali. Latar Profil serta foto buram pada sejarah diberi overlay dan transisi transparan. CSS khusus `profile-*`; ukuran bersama Beranda/Agenda tetap dipertahankan.
- Mobile menumpuk statistik dan linimasa; pengurus memakai dua kolom dengan kartu terakhir di tengah. Loading/error/empty keseluruhan serta bagian data yang belum tersedia memiliki pesan jelas.

QA browser development dan preview build dilakukan pada 1728 × 1080, 1366 × 768 dan 390 × 844, zoom 100%. Hasil setelah iterasi linimasa/latar tersimpan di `tmp/m13-qa/final-*.png`, tidak di-stage. Tinggi desktop sekitar 3741 px, laptop 3392 px, mobile 3800 px. Belum identik piksel dengan raster final: crop/blur foto, shadow, proporsi/pemenggalan teks dan ruang antarseksi masih pendekatan. Tidak tersedia desain mobile resmi.

Regresi Beranda/Agenda diperiksa menggunakan screenshot dan geometri pada ketiga viewport. Geometri seluruhnya identik dengan baseline M1.2; PNG Beranda identik pada tiga viewport, PNG Agenda identik pada desktop/laptop; mobile Agenda ditinjau visual tanpa perubahan komposisi. Perubahan pemetaan kelas PublicLayout tetap menjaga font/latar halaman placeholder lain.


## M1.4 — Kontak dan Donasi

Referensi final `design-references/user/04-kontak.png` (1728 × 3090 px). Konten, layout, CSS `kt-*` dan kedua aset QRIS diperiksa pada repository Blade commit `12e0155f6a5aba59f4776403c711082f27fa2dce`, tanpa mengubah sumber. Tidak memakai Figma MCP atau menyalin stylesheet Laravel.

- `ContactPage` pada `/kontak` memakai Navbar, Footer, PublicLayout, Button, font lokal, foto dan logo M1.1a. Header Kontak, panel Donasi, tiga kartu informasi takmir dan panel lokasi mengikuti susunan desain. `DonationSection` mengelompokkan dua kartu QRIS/rekening tanpa abstraksi kartu generik.
- CSS dibatasi `contact-*` dan kelas layout Kontak; tidak mengubah ukuran komponen bersama. Donasi desktop memakai dua kolom dengan rasio 0,6:1; mobile ditumpuk. Iterasi kedua merapatkan jarak panel, mengoreksi posisi heading dan mengatur foto buram khusus Kontak agar tidak terpotong oleh tinggi seluruh halaman.
- Menu Kontak aktif menuju `/kontak`; CTA Hubungi Takmir dari Profil kini membuka halaman tersebut. Route langsung `/kontak/` juga berfungsi.
- Final desain menampilkan placeholder QRIS/rekening, sedangkan Blade menampilkan gambar QRIS, detail bank dan unduhan. Mengikuti final desain dan ketentuan verifikasi pengguna, tidak menambahkan unduhan, salin rekening, WhatsApp atau iframe peta.
- `qris-donasi.png` dan `.jpg` ternyata **JPEG identik, 1024 × 1024 px**, SHA-256 `3f5f4418efc39a1e2e4addb3bd3fc7069ade9b61d243d6c4c8c649cee65ace85`. Gambar menampilkan materi QRIS berlabel nama masjid; tampilan tersebut bukan bukti validitas transaksi atau kepemilikan. Tidak disalin ke aset aplikasi/staging dan tidak digunakan sebagai QR yang dapat dipindai. Jika kelak disetujui, gunakan ekstensi `.jpg` sesuai format sebenarnya. Lisensi khusus materi QRIS belum ditemukan; izin publikasi perlu dikonfirmasi bersama pengurus.
- QRIS, bank, penerima, telepon, jam layanan, alamat kontak dan tujuan peta belum dikonfirmasi. Placeholder terlihat jelas; badge tidak menyatakan “Resmi”. Peta mempertahankan ukuran/warna/posisi tombol, memakai placeholder tanpa geometri jalan atau koordinat karangan; tombol Google Maps nonaktif. Footer bersama mempertahankan alamat mock referensi sebelumnya, bukan hasil verifikasi baru.

QA Chrome headless development dan preview build pada 1728 × 1080, 1366 × 768, 390 × 844, zoom 100%: PASS. Screenshot iterasi/final di `tmp/m14-qa/`, diabaikan Git. Tinggi akhir Kontak sekitar 3105/2670/2454 px; Navbar 60/60/97 px; tidak ada overflow horizontal. Desktop panel Donasi mulai pada 516 px, dibanding sekitar 515 px pada raster final. Geometri Beranda/Agenda/Profil identik dengan baseline M1.3; PNG identik kecuali Agenda mobile, yang ditinjau visual tanpa perubahan komposisi.

Perbedaan tersisa: placeholder menggantikan data belum terverifikasi, panel peta belum menampilkan jalan/lokasi nyata, crop/blur foto dan pemenggalan teks masih pendekatan raster. Navbar/Footer mempertahankan refinement sebelumnya. Belum ada desain mobile resmi; layout mobile merupakan adaptasi responsive desktop.


## M1.5a — Gate sandi laporan

Referensi final `design-references/user/07-token.png` (3632 × 1380 px) berupa panel akses. Struktur form dan CSS akses dalam `resources/views/layouts/app.blade.php` serta `public/css/app.css` diperiksa pada commit Blade `12e0155f6a5aba59f4776403c711082f27fa2dce`. Sumber tidak diubah; tidak menggunakan Figma MCP, stylesheet Laravel utuh, atau screenshot sebagai halaman.

- `/laporan-keuangan` dipindahkan keluar dari PublicLayout, tetap memakai FinancialReportPage yang sama. Gate menjadi halaman khusus tanpa Navbar/Footer; empat halaman publik sebelumnya tidak berubah. CTA transparansi Beranda serta tautan Footer tetap menuju route tersebut.
- `ReportAccessPanel` menggunakan ikon perisai Lucide, badge, judul lime/putih, input password, tombol lime dan keterangan bawah. Panel HTML/CSS berada di tengah latar gelap; font Plus Jakarta Sans lokal. Semua CSS dibatasi `report-*`.
- Teks “Kode Akses” mengikuti desain tetapi mekanismenya sandi bersama. Teks bawah diganti menjadi “Akses menggunakan sandi bersama” sesuai instruksi; tidak mengklaim enkripsi atau perlindungan API. Tidak menambahkan tombol tampilkan sandi/tutup modal dari Blade karena tidak terlihat pada frame final. Setelah berhasil tersedia tautan kembali Beranda di placeholder laporan.
- State React mengatur input, pemeriksaan, error dan akses berhasil. Form native mendukung Enter; ref menahan submit berulang sebelum render state berikutnya. Pemeriksaan dibatalkan saat panel dilepas. Sandi benar membersihkan input dan membuka placeholder lama; fokus dipindahkan ke heading laporan.
- `checkReportPassword()` melalui service memakai mock `demo123`, khusus pengembangan, dengan jeda simulasi 300 ms. Pencocokan persis memperhatikan kapital/spasi. Refresh dan keluar–masuk route meminta sandi kembali. Tidak ada URL akses, storage, cookie, session Laravel, JWT atau proses backend.

QA Chrome headless development dan preview build pada 1728 × 1080, 1366 × 768 dan 390 × 844, zoom 100%: PASS. Iterasi pertama panel desktop 627 px; iterasi kedua merapatkan ruang bawah, deskripsi, label dan form menjadi sekitar 584 px. Panel laptop sekitar 571 px, mobile 544 px; input 60/60/54 px dan tombol 54/54/50 px. Kondisi awal, loading dan error diperiksa tanpa overflow. Screenshot iterasi/final serta error ada di `tmp/m15a-qa/`, tidak di-stage.

Regresi empat halaman publik: geometri identik dengan baseline M1.4 pada ketiga viewport. Sembilan dari 12 PNG identik; Beranda mobile, Profil desktop dan Kontak laptop yang berbeda ditinjau visual tanpa perubahan komposisi. Belum merupakan kesamaan piksel dengan raster akses: halo/shadow, bentuk ikon dan pemenggalan teks masih pendekatan CSS. Frame akses tidak menunjukkan seluruh tinggi viewport dan belum tersedia desain mobile resmi.

Laporan tetap placeholder; tabel/filter M1.5b dan ekspor M1.6 belum dibuat. Gate hanya pembatas antarmuka; endpoint laporan tanpa autentikasi tetap dapat diakses langsung jika nanti tersedia.
