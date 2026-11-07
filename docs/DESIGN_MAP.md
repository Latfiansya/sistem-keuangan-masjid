# Peta desain dan halaman React

Sembilan tampilan user telah dinyatakan final oleh pengguna. Referensi implementasi M1.1 adalah `design-references/user/01-beranda.png` (1728 × 4121 px). Gambar dipakai untuk pemeriksaan visual, bukan dipasang sebagai halaman atau latar aplikasi. Figma MCP tidak dipanggil pada tahap ini; node ID tidak diketahui.

| Halaman React | Route | Referensi lokal | Status implementasi |
| --- | --- | --- | --- |
| Beranda (`HomePage`) | `/` | `01-beranda.png` | HTML/CSS dan mock melalui service; foto/logo Blade serta Plus Jakarta Sans lokal terintegrasi pada M1.1a |
| Profil Masjid (`ProfilePage`) | `/profil` | `03-profil.png` | M1.3: header, statistik bersama, visi-misi, linimasa, tujuh pengurus, CTA Kontak |
| Laporan Keuangan (`FinancialReportPage`) | `/laporan-keuangan` | `05-laporan.png`, `07-token.png` | M1.5a: gate sandi; M1.5b: laporan mock April 2026, filter tanggal, dua tabel dan ringkasan |
| Agenda (`AgendaPage`) | `/agenda` | `02-agenda.png` | M1.2: banner dan kelompok 5/2/5, mock/service bersama Beranda, responsive |
| Kontak (`ContactPage`) | `/kontak` | `04-kontak.png` | M1.4: Donasi, informasi takmir dan placeholder lokasi; data transaksi/kontak menunggu konfirmasi |
| Pilihan format (`ReportFormatPicker`) dan pratinjau (`ReportPreview`) | State pada `/laporan-keuangan` | `06-format-unduhan.png`, `08-preview-pdf.png`, `09-preview-png.png` | M1.6a/b: pilihan PDF/PNG, lembar A4 dinamis, unduhan PDF atau PNG/ZIP nyata |
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


## M1.5b — Laporan keuangan publik

Referensi final `design-references/user/05-laporan.png` (1728 × 3225 px). Struktur/konten/interaksi diperiksa pada `resources/views/pages/laporan/index.blade.php`, partial `trx-row`/`resume-table`, `data.php` dan CSS/JavaScript terkait, commit Blade `12e0155f6a5aba59f4776403c711082f27fa2dce`. Tidak mengubah repository sumber, menggunakan Figma MCP, atau mengimpor stylesheet Laravel utuh.

- FinancialReportPage mempertahankan state gate M1.5a dan route `/laporan-keuangan`. Setelah sandi benar, placeholder diganti laporan putih tanpa Navbar/Footer. ReportAccessPanel dan fungsi pengecekan sandi tidak diubah; refresh dan keluar–masuk route tetap meminta sandi.
- Header berisi Beranda, identitas/tahun dan Unduh; informasi periode, tiga preset dan Pilih Tanggal mengikuti posisi final. Rentang kustom terlihat pada awal April. Pilihan bulan mengikuti opsi referensi Blade, tetapi hanya April memiliki data. Tidak memigrasikan filter kategori atau sorting tambahan dari Blade.
- `FinancialTable` dipakai dua kali: pemasukan teal, pengeluaran merah. Setiap transaksi berisi uraian, tanggal, badge kategori dan nominal, dengan jumlah/subtotal pada header. `BalanceSummary` memakai tabel semantik untuk tiga kategori dan total. Tidak membuat komponen untuk tiap baris/label.
- Satu mock berisi 50 transaksi integer melalui getReport; fungsi kalkulasi sederhana menyediakan saldo awal/akhir, subtotal dan total. Keterangan “Data contoh pengembangan · bukan laporan produksi” terlihat pada halaman. Unduh nonaktif dengan status “Unduhan belum tersedia”; tidak membuat state/route format atau ekspor.
- Kas Masjid memakai pengeluaran hasil transaksi **Rp5.791.500**, sesuai final, menggantikan angka keliru **Rp6.791.500** pada resume Blade. Tanggal **Beli Sapu mengikuti 26 April 2026 pada final**, sementara Blade menuliskan 25 April; nominal Rp22.000 tidak diubah. Uraian yang sudah disingkat pada sumber tidak dikarang kepanjangannya.
- Filter tanggal inklusif; draft kustom baru berlaku setelah Terapkan. Saldo awal rentang di dalam April dihitung dari saldo 1 April ditambah pemasukan/pengeluaran sebelumnya. Preset mingguan 24–30 April, bulanan 1–30 April, tiga bulan 1 Februari–30 April. Rentang melampaui cakupan menampilkan status data belum lengkap dan menyembunyikan angka/tabel; hari kosong di dalam cakupan menampilkan transaksi nol dengan saldo terbawa.

CSS terbatas kelas `financial-*` dan kondisi report-page--opened; gate tidak berubah. Desktop memakai dua kolom dengan baris sekitar 70,5 px, laptop 64 px; mobile menumpuk pemasukan lalu pengeluaran, dengan baris 78 px dan scroll horizontal lokal hanya pada tabel resume. Iterasi merapatkan resume, memperbaiki padding ganda mobile, dan menjaga preset satu baris di laptop.

QA Chrome development dan preview build pada 1728 × 1080, 1366 × 768, 390 × 844, zoom 100%: PASS. Panjang akhir sekitar 3239/2952/5104 px. Desktop sangat dekat dengan panjang raster 3225 px; tambahan keterangan mock dan status unduhan tetap terlihat. Pemeriksaan meliputi 17/33 baris, subtotal/saldo, loading/empty/error tanggal/periode tidak lengkap, header tidak bertabrakan dan scroll lokal resume tanpa overflow halaman. Screenshot di `tmp/m15b-qa/`, tidak di-stage.

Regresi Beranda/Agenda/Profil/Kontak serta gate: geometri identik pada semua viewport. Sebanyak 13 dari 15 PNG identik; Beranda mobile dan Profil desktop ditinjau visual tanpa perubahan komposisi. Perbedaan visual tersisa: pemformatan input tanggal native browser, pemenggalan/ellipsis uraian dan kategori panjang, detail tipografi/border. Belum tersedia desain mobile resmi. Fokus keyboard pada heading mempertahankan indikator fokus bersama.


## M1.6a — Pilihan format dan pratinjau PDF/PNG

Referensi final `06-format-unduhan.png` (1728 × 1200 px), `08-preview-pdf.png` dan `09-preview-png.png` (keduanya 1728 × 3056 px). Struktur, konten, CSS dan interaksi diperiksa pada `export-format.blade.php`, `export-preview.blade.php`, partial laporan dan `public/css/app.css`, commit Blade `12e0155f6a5aba59f4776403c711082f27fa2dce`. Tidak mengubah sumber atau menggunakan Figma MCP. Pembatasan dua halaman, slice transaksi pada indeks 21 dan toast unduhan semu dari Blade tidak dimigrasikan.

- FinancialReportPage tetap memiliki gate dan satu route `/laporan-keuangan`. State `report → format → preview` serta format PDF/PNG disimpan pada induk yang sama dengan rentang, draft tanggal dan preset. Kembali tidak mereset filter/format; refresh atau keluar route mengembalikan gate tanpa storage.
- `ReportExportLayout` menggabungkan header identitas, penanda mock dan indikator dua langkah. `ReportFormatPicker` memakai radio native, kartu aktif, periode dan jumlah transaksi/lembar aktual. Tidak menambah format atau route.
- `ReportPreview` menerima report/pages/format; toggle format hanya mengubah keterangan format, label lembar dan rencana nama berkas. `ReportSheet` tidak menerima format, sehingga kedua pratinjau memakai HTML, nominal dan ringkasan yang sama.
- Sumber data tetap getReport dan reportCalculations M1.5b. reportFormatters digunakan kembali untuk Rupiah/tanggal/periode, ditambah format rentang singkat dan tahun bersama. Tidak ada mock pratinjau terpisah, penghitungan uang ulang atau perubahan transaksi.
- ReportSheet berupa HTML/CSS A4 lanskap 297 × 210 mm, sebanding 1122,52 × 793,7 piksel CSS pada 96 dpi. Pemasukan kiri, pengeluaran kanan, jumlah/subtotal seluruh periode pada tiap header; BalanceSummary dengan varian sheet hanya pada lembar terakhir. FinancialTable tetap untuk laporan utama karena struktur tabel cetak berbeda. Tidak membuat komponen setiap baris/label.
- reportPagination menghitung kapasitas dari tinggi lembar, padding, header, baris, footer dan ruang resume berdasarkan jumlah kategori. Nilai geometri diteruskan menjadi variabel CSS yang sama. Dengan tiga kategori saat ini tersedia 21 baris biasa dan 15 baris pada lembar terakhir; bukan indeks pemotongan permanen. Data April menghasilkan dua lembar (17/21 lalu 0/12); rentang 3–5 April satu lembar. Fixture test mencakup nol, batas kapasitas dan lebih dari dua lembar; seluruh ID tetap berurutan dan muncul sekali.
- Baris memiliki tinggi tetap 28 px dan tidak terpotong antarlembar; uraian panjang memakai ellipsis sesuai referensi, dengan teks lengkap pada atribut title. Ringkasan dan nominal tetap berasal dari keseluruhan rentang terpilih. Rentang unavailable tidak memiliki lembar/pratinjau; hari kosong di dalam cakupan tetap dapat menampilkan saldo terbawa.
- CSS baru dibatasi `report-export-*`, `report-format-*`, `report-preview-*`, `report-sheet-*` dan turunan BalanceSummary di dalam sheet. Desktop menyesuaikan lebar lembar ke kontainer. Mobile menumpuk kartu/kontrol dan mempertahankan komposisi cetak dengan scroll horizontal lokal; skala baca lembar 1,25 serta tombol Lebar halaman untuk melihat seluruh lembar. Transform hanya pada lembar pratinjau, tanpa mengubah zoom/skala halaman aplikasi.
- Tombol Unduh pada laporan kini membuka pilihan format. Kedua tombol Unduh pada pratinjau nonaktif dan dijelaskan dengan “Pratinjau saja · fitur ekspor belum tersedia”. Nama berkas berlabel rencana; tidak membuat Blob, canvas ekspor, berkas PDF/PNG, library atau pesan unduhan berhasil.

QA aktual Chrome development dan preview build, zoom 100% pada 1728 × 1080, 1366 × 768 dan 390 × 844: tidak ada overflow halaman, baris keluar dari lembar, tabrakan ringkasan/footer, atau error aset/runtime aplikasi. PDF/PNG memiliki isi lembar identik. Setelah iterasi spacing/header dan skala baca mobile, tinggi pilihan format sekitar 1201/1083/1284 px dan pratinjau 3081/2611/3321 px. Desktop dekat dengan tinggi raster 1200/3056 px; penanda mock/status ekspor, detail font, border, ellipsis dan pemenggalan teks belum identik piksel. Desain mobile resmi belum tersedia. Screenshot tersimpan lokal di `tmp/m16a-qa/`, diabaikan Git.

Regresi Beranda, Agenda, Profil, Kontak dan gate: geometri identik dengan baseline M1.5b pada seluruh viewport; 12 dari 15 PNG identik. Agenda/Profil/Kontak desktop ditinjau visual tanpa perubahan komposisi. Tinggi laporan utama tetap 3239/2952/5104 px dan total keuangan tidak berubah.

### Persiapan M1.6b, belum diimplementasikan

Gunakan ReportSheet dengan data dan hasil reportPagination yang sama sebagai sumber ekspor, tanpa transform pratinjau. Tunggu font lokal selesai dimuat, lalu render tiap lembar secara utuh pada resolusi keluaran yang disepakati: satu PNG per lembar, atau rangkaian lembar yang sama menjadi satu PDF A4 lanskap. Pemilihan pustaka/adaptor render dan pengemasan berkas dibahas pada M1.6b; tidak menambah dependency sekarang. Verifikasi hasil berkas terhadap pratinjau termasuk font, ellipsis, baris, resume dan nominal sebelum mengaktifkan tombol unduhan. Tidak memerlukan perubahan API hanya untuk pratinjau ini.


## M1.6b — Ekspor berkas nyata

Pendekatan persiapan M1.6a kini diterapkan melalui `reportExportService`. ReportSheet, data laporan, pembagian lembar, kalkulasi keuangan, route dan gate tidak diubah. ReportPreview mengirim elemen lembar yang sedang ditampilkan beserta report/pages yang sama; tidak meminta data baru saat ekspor. Service memeriksa kelengkapan data, kesamaan field transaksi, ID tepat sekali dan urutan baris DOM sebelum merender.

- Dependency frontend dikunci pada html-to-image 1.11.13, jsPDF 4.2.1 dan JSZip 3.10.2 setelah membaca dokumentasi resmi. Import dinamis menunda pemuatan library sampai diperlukan; ZIP hanya digunakan untuk PNG jamak. Tidak membawa stylesheet atau backend Laravel.
- Font Plus Jakarta Sans lokal ditunggu dan CSS font disematkan ke gambar; aset gambar pada lembar ditunggu. html-to-image menyalin hanya ReportSheet dengan transform responsif/margin/shadow dilepas, ukuran tetap A4 dan pixelRatio 2. PNG nyata berukuran 2245 × 1587 px pada semua viewport. Tidak mengambil kontainer pratinjau, tombol atau screenshot browser.
- PDF menggunakan satu gambar PNG untuk satu halaman A4 landscape 297 × 210 mm, sesuai urutan. Gambar dipasang proporsional dan dipusatkan, tanpa distorsi atau halaman kosong tambahan. Teks PDF berbasis raster, belum dapat diseleksi/dicari.
- PNG satu lembar diunduh langsung; beberapa lembar menjadi satu ZIP dengan halaman-01.png, halaman-02.png dan seterusnya. Kartu PNG, toolbar, footer dan tombol menjelaskan ZIP secara eksplisit. Nama berkas mengikuti bulan penuh atau tanggal awal/akhir rentang khusus.
- Dua tombol unduh aktif. Status proses, gagal dan unduhan dimulai ditampilkan seperlunya. Ref menahan submit ganda sebelum render state berikutnya; tombol format/kembali juga dinonaktifkan selama proses. Navigasi keluar membatalkan pengiriman hasil. Kanvas diperiksa agar tidak kosong dan dilepas setelah tiap lembar; URL Blob dibersihkan setelah browser diberi waktu mengambil berkas.

QA aktual development dan preview build pada 1728 × 1080, 1366 × 768 dan 390 × 844, zoom 100%: PASS. PDF/PNG di mobile tetap berukuran cetak yang sama, termasuk ketika pratinjau berganti dari skala baca ke Lebar halaman. Tidak ada overflow halaman, teks/nominal sumber yang terpotong tambahan, baris keluar lembar atau tabrakan ringkasan/footer. Uraian yang sudah memakai titik-titik pada sumber tetap dipertahankan. Status mock ada pada pratinjau dan setiap lembar ekspor.

Pemeriksaan berkas memakai pembaca/render PDF PyMuPDF dan dekoder PNG/ZIP pada alat QA sementara di tmp, tanpa menambah dependency aplikasi untuk inspeksi. Development menghasilkan 14 berkas uji (April, rentang 3–5 April pada tiga viewport, serta fixture QA 60 transaksi/3 lembar). Seluruh 12 halaman PDF dan 12 gambar PNG diperiksa; gambar yang dipakai tiap halaman PDF identik piksel dengan PNG pasangannya. Preview build menghasilkan 12 berkas tambahan dan lulus pemeriksaan yang sama. PNG identik piksel lintas viewport dan antara development/build. Halaman pertama/terakhir PDF, seluruh gambar dalam ZIP, resume dan fixture lembar tengah ditinjau; tidak kosong atau terpotong. Hasil QA di `tmp/m16b-qa/`, tidak di-stage.

Regresi Beranda/Agenda/Profil/Kontak dan gate: geometri identik dengan baseline M1.6a pada tiga viewport, tanpa overflow. Sebanyak 12 dari 15 PNG identik; tiga halaman desktop berbeda tipis dalam raster dan ditinjau visual tanpa perubahan komposisi. Tidak ada perubahan desain atau kode halaman tersebut.

Batasan: resolusi raster 2× sekitar 192 dpi; ukuran teks kecil mengikuti komposisi cetak final. PDF belum menyediakan teks/cari atau aksesibilitas dokumen berbasis teks. Browser lain dan perangkat mobile fisik belum diuji. Waktu/memori ekspor mengikuti panjang laporan dan kemampuan perangkat. Status unduhan berarti berkas sudah dibuat dan pemicu browser dijalankan, bukan konfirmasi penyimpanan akhir pada disk. Gate tetap hanya pembatas antarmuka, bukan perlindungan endpoint laporan.


## M1.7 — Audit final frontend publik

Seluruh sembilan raster lokal dibandingkan dengan render React melalui pasangan screenshot desktop. Audit geometri/aset, screenshot panjang penuh dan pemeriksaan responsive mencakup 360 × 800, 390 × 844, 768 × 1024, 1024 × 768, 1366 × 768 dan 1728 × 1080 pada zoom 100%, masing-masing sembilan tampilan, baik development maupun preview build. Tidak menggunakan Figma MCP atau mengganti UI dengan gambar referensi.

Perbaikan yang dibuktikan screenshot/browser:

- Subtotal laporan terpotong di dalam header kartu pada 360/768 px, walaupun document tidak overflow. Header mobile sekarang membungkus nominal jika perlu; pada 768–1023 px pemasukan/pengeluaran ditumpuk dan filter mendapat ruang penuh. Dua kolom desktop mulai 1024 px tetap dipertahankan. Test membandingkan batas nominal dengan kartu, bukan hanya lebar dokumen.
- Petunjuk scroll pratinjau hanya dirender saat mode baca, bukan ketika Lebar halaman aktif. Susunan cetak A4 dan skala ekspor tetap sama.
- Favicon 404 diperbaiki dengan menunjuk logo asli yang sudah tersedia; tidak menambah aset baru. CTA Beranda memakai keterangan netral sandi bersama dan menghapus klaim realtime yang belum didukung sumber mock.

Struktur/warna/font/komponen mengikuti referensi dan refinement yang disetujui sebelumnya. Tidak memperbesar kembali seluruh halaman: perbedaan crop/blur foto, wrapping, spacing/panjang Beranda dan Profil terhadap raster tetap dicatat sebagai pendekatan visual sebelumnya, bukan kesamaan piksel. Placeholder Kontak, catatan data contoh dan informasi ZIP merupakan perbedaan yang diperlukan oleh keputusan milestone terdahulu. Desain mobile resmi belum tersedia.

Setelah perbaikan, 54 kombinasi development dan 54 kombinasi production preview tidak menunjukkan overflow halaman, tabrakan navigasi atau subtotal terpotong; font/aset termuat dan tidak ada HTTP gagal/exception runtime aplikasi. Keyboard mencakup skip link, fokus terlihat, aktivasi CTA dan scroll lokal resume/lembar. Semua komponen cetak dan perhitungan dipertahankan; PNG/PDF tetap sama pada enam viewport. Bukti lokal ada di tmp/m17-qa/ dan tidak di-stage. Audit ini bukan sertifikasi WCAG menyeluruh.

Safari ditemukan tetapi sesi WebDriver tidak dapat dibuat dalam batas 20 detik; smoke test Safari belum terlaksana. Firefox tidak ditemukan pada lokasi aplikasi standar. Tidak memasang browser tambahan atau mengubah pengaturan otomatisasi sistem. Kesesuaian visual dinilai mendekati desain dengan batasan yang dicatat; review PIC terhadap raster tetap diperlukan sebelum publikasi produksi.

## M1.8a — Refinement desktop layout, Beranda dan Agenda

Mengikuti catatan pengguna dan raster 01-beranda/02-agenda, tanpa perubahan struktur React, data, route atau dependency:

- Geometri Navbar desktop terakhir menggunakan grid dua kolom, bukan distribusi space-between. Lebar clamp(720px, 63vw, 1088px): sekitar 1088 × 64 px pada viewport 1728 dan 907 × 56 px pada 1440. Logo memakai kolom clamp(170px, 13vw, 224px), area gambar 38–48 px dengan object-fit cover untuk merapikan padding transparan tanpa meregangkan/memotong tulisan atau ikon. Lebar visual identitas sekitar 18% panel. Beranda mulai sekitar 33% dan Kontak berakhir sekitar 93% panel. Empat tombol mengikuti rasio lebar 147:140:190:131 dengan gap 8–12 px dan font 17–24 px; hanya tipografi Navbar yang berubah. Breakpoint ≤1023 px dipertahankan.
- Navbar tetap fixed dan terpusat, dengan jarak atas 41/43/48 px pada lebar 1366/1440/1728. Glass sebelumnya dipertahankan: opasitas lapisan 20%–12%, blur 12 px/saturasi 125%, border 1 px putih sekitar 22% dan highlight/shadow lembut. Wrapper transparan tidak menangkap klik di luar panel. Scroll margin membantu target navigasi/fokus tetap di bawah Navbar. Layout laporan terpisah tidak mendapat Navbar.
- Gradasi langit biru hanya ditambahkan di bagian atas Agenda/Profil/Kontak. Refinement tambahan memperkuat warna/opasitas atas dan memperluas tinggi clamp(320px, 32vw, 550px) menjadi clamp(420px, 42vw, 720px), tetap memudar transparan. Foto Agenda mempunyai skala tersendiri agar nuansa hijau dinding berada di sekitar Bulanan; seluruh crop/posisi foto yang sudah disetujui dipertahankan. Beranda tidak menerima gradasi biru tambahan di atas hero.
- Hero Beranda desktop (≥1024 px) memakai min-height max(100svh, 64.5vw), foto asli object-fit cover dengan posisi kanan bawah, serta padding atas clamp(164px, 13.4vw, 232px). Foto tampak lebih dekat melalui crop/tinggi hero yang seimbang; statistik berada setelah layar pertama pada ketiga desktop acuan. Fade bawah desktop dipersempit menjadi 48–72 px pada iterasi kedua agar anak tangga tidak terlalu pudar. Judul, ukuran tombol dan statistik tidak diperbesar; hero mobile tetap 500 px dengan crop 72% bawah.
- Tombol Profil pada hero berbagi dua token permukaan/filter glass dengan Navbar, memakai tint tipis untuk teks putih, border/highlight dan shadow lembut serta hover/fokus sederhana. Tombol Lihat Agenda tetap putih. Aturan tambahan dibatasi .hero-actions.
- Kemakmuran mengikuti lebar panel Agenda di atasnya, min(85%, 1464px), menggantikan min(93%, 1608px); padding/gap kartu dirapikan dan shadow dibuat subtil. Breakpoint mobile tetap menumpuk kartu.
- CTA transparansi mempertahankan hijau lebih lama, dengan sisi kanan hijau yang lebih terang tanpa memudarkan teks. Copyright bersama berubah dari 14 ke 12 px desktop, bobot variabel 350; ukuran mobile 11 px dipertahankan.
- Badge jumlah dan label jadwal Agenda memakai lapisan transparan, blur 8 px, border/highlight dan shadow tipis. Warna kelompok hijau/lime, urutan kolom, ukuran dan 12 kegiatan tetap sama.

Screenshot sebelum, iterasi dan final disimpan di tmp/m18a-qa/, tidak di-stage. Chrome zoom 100%: QA desktop 1728 × 1080 dan 1366 × 768 serta smoke mobile 390 × 844. Tiap lingkungan development/production preview mencakup sembilan tampilan (27 kombinasi) dan 36 posisi scroll publik. Navbar tetap terlihat/dapat diklik, tidak ada overflow halaman atau kegagalan aset/runtime. Profil/Kontak hanya menerima perubahan bersama yang diminta; gate/laporan/format/pratinjau tidak berubah struktur/geometrinya.

Pada refinement Navbar/background sebelumnya, bukti di tmp/m18a-refinement-qa/ menunjukkan panel lebih ringkas/transparan tanpa perubahan hero. Refinement hero/distribusi/tombol kemudian dicatat di tmp/m18a-hero-qa/: baseline dan dua iterasi dibandingkan pada 1728 × 1080, 1440 × 900, 1366 × 768, serta smoke 390 × 844. Referensi dinormalisasi ke lebar pembanding untuk menilai rasio komposisi; ukuran raster yang diperkecil tidak dianggap ukuran CSS. Hero akhir sekitar 1115/929/881 px, awal kartu statistik 1187/991/940 px. Pada tahap hero, Navbar masih 880 × 52 px desktop sebelum koreksi geometri terakhir di atas; mobile sekitar 358 × 97 px. Development dan production preview masing-masing memeriksa 36 kombinasi tampilan dan 48 posisi scroll, tanpa overflow atau error aset/runtime. Isi/geometri halaman lain tetap, selain distribusi internal Navbar bersama yang diminta.

Koreksi geometri terakhir memiliki baseline/screenshot di tmp/m18a-navbar-qa/. Logo dan menu dibandingkan sebagai rasio panel terhadap raster lokal 01-beranda; screenshot perbandingan terbaru yang disebut pengguna tidak terlihat sebagai lampiran pada pesan yang diterima. Screenshot desktop ditinjau kembali setelah penyesuaian. Hanya aturan geometri Navbar ≥1024 px ditambahkan; hero, background, section lain dan tombol hero tidak berubah. Lint, seluruh test/build, regresi sembilan tampilan, fixed scroll, hover, Tab/Enter dan klik menu diuji ulang. Smoke 390 px serta pemeriksaan tambahan 768/1024 px tanpa overflow.

Belum merupakan kesamaan piksel terhadap raster; crop/blur dan panjang halaman mengikuti refinement sebelumnya. Glass dinilai melalui render Chrome, bukan simulasi optik Figma. Mobile menyeluruh tetap M1.8c; refinement khusus Profil/Kontak/laporan tidak dikerjakan pada tahap ini.
