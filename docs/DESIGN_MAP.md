# Peta desain dan halaman React

Sembilan tampilan user telah dinyatakan final oleh pengguna. Referensi implementasi M1.1 adalah `design-references/user/01-beranda.png` (1728 × 4121 px). Gambar dipakai untuk pemeriksaan visual, bukan dipasang sebagai halaman atau latar aplikasi. Figma MCP tidak dipanggil pada tahap ini; node ID tidak diketahui.

Keputusan aktif M1.8b menggantikan gate halaman penuh M1.5a: CTA laporan Beranda/Footer membuka modal di atas halaman asal. Route laporan dapat dibuka langsung dan tetap menampilkan laporan saat refresh. Catatan gate halaman penuh/refresh pada milestone lama di bawah merupakan riwayat keputusan, bukan perilaku terkini.

| Halaman React | Route | Referensi lokal | Status implementasi |
| --- | --- | --- | --- |
| Beranda (`HomePage`) | `/` | `01-beranda.png` | HTML/CSS dan mock melalui service; foto/logo Blade serta Plus Jakarta Sans lokal terintegrasi pada M1.1a |
| Profil Masjid (`ProfilePage`) | `/profil` | `03-profil.png` | M1.3: header, statistik bersama, visi-misi, linimasa, tujuh pengurus, CTA Kontak |
| Laporan Keuangan (`FinancialReportPage`) | `/laporan-keuangan` | `05-laporan.png` | Laporan mock April 2026, filter tanggal, dua tabel dan ringkasan; akses langsung/refresh tanpa gate |
| Modal akses (`ReportAccessModal` + `ReportAccessPanel`) | State pada halaman publik pemicu | `07-token.png` | M1.8b: overlay gelap di atas halaman asal/Navbar, tutup/Escape/fokus/scroll; berhasil menuju laporan |
| Agenda (`AgendaPage`) | `/agenda` | `02-agenda.png` | M1.2: banner dan kelompok 5/2/5, mock/service bersama Beranda, responsive |
| Kontak (`ContactPage`) | `/kontak` | `04-kontak.png` | M1.4: Donasi, informasi takmir dan placeholder lokasi; data transaksi/kontak menunggu konfirmasi |
| Pilihan format (`ReportFormatPicker`) dan pratinjau (`ReportPreview`) | State pada `/laporan-keuangan` | `06-format-unduhan.png`, `08-preview-pdf.png`, `09-preview-png.png` | M1.6a/b: pilihan PDF/PNG, lembar A4 dinamis, unduhan PDF atau PNG/ZIP nyata |
| Halaman tidak ditemukan (`NotFoundPage`) | `*` | Belum ditentukan | Placeholder fungsional |

## Layout dan komponen M1.1

`PublicLayout` memuat konten dari `publicContentService`, menampilkan Navbar/Footer, dan membagikan konten ke Beranda melalui konteks Outlet. `Button`, `VisionMission`, dan `AgendaSummary` diekstrak untuk pola yang berulang. Statistik dan kartu kemakmuran tetap berada di Beranda tanpa abstraksi kartu generik.

Urutan Beranda: hero, tiga statistik, visi-misi, ringkasan agenda, tiga kartu kemakmuran, CTA laporan, Footer. Logo/Beranda menuju `/`, Profil menuju `/profil`, dan CTA/Footer laporan menuju `/laporan-keuangan`. M1.2 menambahkan `/agenda` untuk Navbar serta kedua CTA Agenda pada Beranda. Masuk Pengurus pada Footer menuju `/admin/login` memakai React Router Link.

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

## M1.8b — Polishing dan perubahan gate menjadi modal

Baseline visual cbe90ea (M1.8a) dipertahankan untuk Navbar/geometri/glass, hero/fade/crop, gradasi biru atas, Beranda dan Agenda. Permintaan tambahan M1.8b mengizinkan penyesuaian latar dekoratif Profil/Kontak serta tipografi header yang dijelaskan di bawah. Referensi lokal 03/04/07/05/06/08/09 ditinjau; tidak menggunakan Figma MCP.

- Profil: shadow lembut pada tujuh kartu pengurus; grid/konten tetap. CTA kontribusi memakai hijau masjid dengan gradasi yang dipertahankan, deskripsi lebih jelas.
- Kontak: border lebih lembut, surface putih ke hijau sangat pucat dan shadow tipis pada panel/kartu Donasi. Judul dinaikkan 8 px dengan kompensasi margin bawah; posisi kartu dan komposisi dua kolom tetap. Semua data belum terkonfirmasi tetap placeholder.
- Gate: native dialog maksimum 1120 px menggunakan kembali ReportAccessPanel, berada pada top layer di atas Navbar dengan backdrop gelap. Scroll belakang dikunci; Tab/Shift+Tab, fokus awal, Escape/tutup dan pengembalian fokus/scroll dikelola. Menutup saat loading membatalkan service. Salah/error tetap di modal, benar menutup modal dan menavigasi ke laporan. Tidak ada state otorisasi atau penyimpanan browser.
- Laporan/format: shadow tipis pada tabel/resume, panel kontrol periode dan kartu format tanpa mengganti layout putih, ukuran tabel atau warna transaksi. Route laporan langsung memuat data termasuk setelah refresh; format/filter kembali ke default saat refresh, tanpa gate.
- ReportSheet: kategori transaksi/resume menjadi teks berwarna tanpa capsule, font 7,5 px dan line-height 10 px, tanpa mengubah tinggi baris/pagination. Gaya dibatasi seluruh lembar agar tidak diwarisi berbeda dari breakpoint layar. Pratinjau dan ekspor memakai komponen/data yang sama.

QA Chrome zoom 100% mencakup 1728 × 1080, 1366 × 768 dan smoke 390 × 844. Screenshot before/iterasi/final serta inspeksi ekspor berada di tmp/m18b-qa/, tidak masuk staging. Beranda/Agenda mempunyai geometri identik dengan baseline; sebagian screenshot identik piksel, selisih raster kecil pada lainnya ditinjau tanpa perubahan komposisi. Pengujian file PDF/PNG memeriksa dua lembar April, satu lembar kustom, fixture tiga lembar, semua transaksi dan kesamaan gambar antarformat. Batasan pixel-perfect/cross-browser sebelumnya tetap berlaku; mobile menyeluruh tidak dikerjakan.

### Refinement tambahan header, kartu statistik dan latar

- H1 Profil/Kontak desktop ≥1024 px memakai clamp(39px, 4vw, 69px): sekitar 63,94 → 69 px pada 1728 dan 50,54 → 54,64 px pada 1366 (+sekitar 8%). Plus Jakarta Sans, weight 800 dan hijau/oranye tetap. Font mobile Profil 32/Kontak 34 px tetap.
- Subtitle kedua halaman dan Sorolaten memakai #385464 (biru keabu-abuan); Sorolaten tetap italic/weight 400. Sampel latar render aktual menunjukkan rasio minimum sekitar 5,14:1. Warna teks sekunder lain tidak diubah.
- Badge header berbagi surface #fffaf0f2 (off-white sekitar 95%), border #dfc6a8 dan shadow 0 2px 6px #5b452018; oranye/padding/radius tetap. Aturan Profil hanya mengenai badge header, bukan badge era linimasa. Stat cards hanya diberi shadow 0 6px 18px #2547351a dan highlight inset, tanpa mengubah warna/ukuran/konten.
- Latar non-Beranda memakai konfigurasi CSS bersama dengan variabel scene. Default foto Profil/Kontak: auto 120% tinggi lapisan, opacity .65, blur 8 px, lapisan putih tengah #edf5fab8 (sebelumnya #edf5fac9). Kontak memakai 72% bottom; Profil memakai 72% 65% desktop besar/72% 80% ≤1399 px agar atap sejajar area Sejarah. Lapisan foto kedua Sejarah dihapus, menyisakan gradient ringan supaya tidak menutupi scene bersama. Hasil belum identik piksel; aset WebP asli 1928 × 1089 membatasi ketajaman ketika diperbesar.
- Agenda mempertahankan ukuran, posisi, overlay, opacity .75 dan blur 10 px sebelumnya melalui override scene; ini diperlukan untuk menjaga crop hijau Bulanan yang sudah disetujui. Foto/hero/latar Beranda dan gradasi biru atas non-Beranda tidak diubah.

Baseline, dua iterasi dan hasil production diperiksa pada 1728 × 1080, 1366 × 768 serta smoke 390 × 844; screenshot/kontras di tmp/m18b-refinement-qa/, tidak di-stage. Navbar tetap terbaca/fixed, tanpa overflow atau tabrakan. Gate/filter/pratinjau/ekspor memakai source/logika yang sama; test dan build diulang. Mobile menyeluruh tetap M1.8c.

### Koreksi final surface badge header

Badge header Profil/Kontak kini memakai satu aturan frosted glass yang menggantikan surface solid di atas: gradient rgba(255,255,255,.76) → rgba(255,246,234,.62), backdrop blur 12 px/saturasi 115%, border putih transparan 1 px/55%, highlight inset putih 65% dan shadow kecil rgba(20,55,45,.12). Tidak ada override surface per halaman. Teks/ikon oranye, tipografi, radius dan ukuran tetap; padding Profil mengompensasi tambahan border 1 px agar geometri tidak berubah. Badge era linimasa dan badge lainnya tidak terkena aturan ini. Screenshot sebelum/sesudah serta pengukuran pada 1728, 1366 dan 390 px berada di tmp/m18b-badge-qa/ (tidak di-stage); Beranda/Agenda identik dengan baseline pada ketiga viewport.

## M1.8c — adaptasi responsive tanpa frame mobile resmi

Desktop ≥1024 px tetap memakai baseline M1.8a/M1.8b. Aturan baru dibatasi breakpoint mobile/tablet, tanpa mengubah foto/crop hero desktop, background bersama atau ukuran lembar cetak.

| Tampilan | Adaptasi |
| --- | --- |
| Layout publik | <768 px: Navbar satu baris dengan Menu collapsible dua kolom, target klik 44 px. Tablet: tinggi klik menu 44 px dan gutter 32 px. |
| Beranda | Mobile: jarak hero di bawah Navbar ringkas dan statistik dengan ikon di samping. Tablet: program dua kolom, kartu terakhir selebar baris. |
| Agenda | Mobile: header mengikuti Navbar ringkas, nama kegiatan 15 px dan waktu dapat membungkus. Tablet: panel pengantar lebih lega. |
| Profil | Mobile: nama/jabatan pengurus 14/11 px; tujuh pengurus dan grid tetap. Tablet: jarak statistik/CTA disesuaikan. |
| Kontak/Donasi | Mobile mempertahankan satu kolom, header mengikuti Navbar dan informasi kontak rata atas; tablet mendapat gutter/padding lebih lega. Placeholder tetap. |
| Gate modal | Mobile: tinggi/posisi mengikuti visualViewport, scrolling lokal dan toolbar sticky dengan tombol tutup 44 px. Gate tetap hanya dari CTA. |
| Laporan | <480 px: tanggal satu kolom; mobile: input 16 px, tombol ≥44 px, uraian/kategori membungkus. Resume tetap scroll lokal. |
| Format/PDF/PNG | Mobile: tombol pratinjau bertumpuk dan kontrol lebar halaman ≥44 px. Tablet: pengantar/tombol dapat membungkus. ReportSheet A4, skala baca lokal, pagination dan ekspor tetap. |

Screenshot sebelum/iterasi/final pada 360×800, 390×844, 768×1024, 1024×768, 1366×768 dan 1728×1080 berada di tmp/m18c-qa/ (diabaikan Git). Adaptasi ini belum menjadi desain mobile resmi/pixel-perfect.

## Admin 1.1 — Login Pengurus

Referensi resmi pengguna: `design-references/user/10-admin-login.png` (3456 × 2000 px, dibandingkan pada skala 1728 × 1000). `AdminLoginPage` berada di `/admin/login`, terpisah dari `PublicLayout` dan route laporan. Tidak membuat layout dashboard, menu admin atau halaman lanjutan.

- Desktop ≥1024 px: panel identitas sekitar 29% lebar layar, foto masjid lokal dengan overlay biru–hijau, logo, judul dan deskripsi di bawah. Panel kanan abu-abu muda dengan kartu putih di tengah, label Email/Password, input dan tombol Masuk Dashboard. Font Plus Jakarta Sans lokal; tidak memakai screenshot sebagai isi aplikasi.
- Tablet/mobile: panel identitas di atas kartu login, spacing dan judul lebih ringkas, form satu kolom dengan input minimal 44 px dan teks input 16 px. Halaman boleh bergulir vertikal pada layar pendek. Ini adaptasi responsive dari referensi desktop, bukan frame mobile resmi.
- Gaya baru dibatasi `.admin-login*` dalam `AdminLoginPage.css`; CSS, aset dan komponen publik tidak diubah. Kredensial contoh pada gambar tidak diisi ke input atau disalin sebagai akun aplikasi.
- Refinement: tombol Eye/EyeOff Lucide di kanan input password, area klik 44 px, hover/fokus dan label tampilkan/sembunyikan. Lebar/tinggi, border dan radius input tetap; padding kanan memberi ruang ikon. Password tersembunyi secara default dan toggle tidak mengubah nilai/validasi atau melakukan submit. CTA Masuk Pengurus pada Footer tetap menuju `/admin/login`.
- Loading/error/validasi mendukung alur form. Tidak ada login berhasil semu, token, session, lupa password atau registrasi. Batas integrasi dan status endpoint mengikuti README Admin 1.1; kontrak API tidak diubah.

Screenshot QA lokal disimpan di `tmp/admin11-qa/` dan tidak masuk Git. Kemiripan dinilai dari susunan, proporsi, crop, warna dan tipografi; belum diklaim identik piksel atau diuji pada perangkat fisik/lintas browser.

## Admin 1.2 — Dashboard Keuangan

Referensi final pengguna: `design-references/user/11-admin-dashboard.png` (1766 × 2013 px). Implementasi pada `/admin/dashboard` memakai AdminLayout dengan sidebar/topbar sendiri; tidak mengubah desain Login Pengurus atau PublicLayout. Margin hitam dan bayangan di luar aplikasi pada screenshot tidak dibuat sebagai bingkai halaman.

- Desktop: sidebar hijau 240–288 px, logo lokal, tiga kelompok navigasi, dashboard aktif, akun contoh di bawah. Topbar putih, notifikasi nonaktif dan avatar SA. Hero hijau dengan foto masjid, judul serta dua tombol transaksi, diikuti indikator update dan empat kartu saldo.
- Resume tiga kategori memakai satu sumber angka bersama kartu. Kolom numerik pertama ditulis **Saldo Awal**, mengoreksi label Saldo Akhir yang berulang pada screenshot. Saldo akhir kategori/total dihitung melalui service, bukan angka presentasi terpisah. Nilai mengikuti contoh 20 Oktober 2026, terpisah dari mock publik April.
- Banner oranye, lima transaksi terbaru dan tiga shortcut mengikuti urutan referensi. Klaim realtime diganti kalimat netral karena data statis; keterangan Data contoh terlihat. Akun/nama/email pada sidebar merupakan konten fixture, bukan kredensial atau sesi nyata. Fitur belum dibuat tetap nonaktif dengan title/keterangan yang jelas.
- Tablet 768 px: sidebar collapsible di bawah topbar, kartu dua kolom. Mobile 390 px: kartu/shortcut satu kolom, banner bertumpuk, teks/area klik menyesuaikan. Menu mendukung Escape, backdrop, fokus awal/kembali dan penutupan saat fokus keluar. Tabel memiliki petunjuk dan scroll horizontal lokal dengan akses keyboard.
- Foto/logo/font memakai aset lokal yang sudah ada, ikon Lucide React. CSS baru dibatasi `.admin-*` di AdminLayout.css. Halaman tidak menggunakan screenshot sebagai konten dan tidak membuat menu, transaksi, laporan, notifikasi atau akun fiktif yang berfungsi.

QA Chrome development/preview build mencakup 1728×1080, 1366×768, 768×1024 dan 390×844. Screenshot/top/full/menu dan metrik disimpan di `tmp/admin12-qa/`, tidak di-stage. Kesetiaan visual merupakan pendekatan raster; belum ada frame mobile resmi, pengujian perangkat fisik atau verifikasi Safari/Firefox pada milestone ini.

## Admin 1.3 — Kelola Dana Keuangan

Referensi final: `design-references/user/12-admin-kelola-dana.png` (1856 × 1395 px). Margin hitam/bayangan di luar bingkai aplikasi tidak dijadikan bagian halaman. Route `/admin/kelola-dana` memakai Sidebar dan Topbar AdminLayout yang sama; Kelola Dana aktif, Dashboard tetap dapat dinavigasi, judul Topbar mengikuti route.

- Hero hijau dengan foto masjid di kanan, badge MANAJEMEN TRANSAKSI, judul dan deskripsi referensi. Tinggi desktop sekitar 196 px, padding 28×40 px, radius 24 px; tidak mengubah hero Dashboard.
- Panel Kelola Transaksi berisi deskripsi, tombol Pemasukan hijau dan Pengeluaran oranye. Keterangan Data contoh/Fitur transaksi belum tersedia memperjelas bahwa deskripsi referensi belum merupakan implementasi CRUD. Tombol tetap nonaktif tanpa form/modal/route karangan.
- Tabel Transaksi Terbaru diekstrak dari Dashboard menjadi `AdminRecentTransactions` tanpa perubahan markup/styling. Kedua halaman memakai kategori dan lima transaksi yang sama melalui service/konteks layout, termasuk Lihat Semua nonaktif. Tidak membuat mock kedua atau mengubah saldo/laporan publik.
- Desktop mempertahankan geometri Sidebar/Topbar, spacing 24 px dan tabel penuh. Tablet memakai menu collapsible yang sudah ada; mobile menumpuk tombol, menyesuaikan hero/teks dan mempertahankan scroll tabel lokal. Menu fokus ke tautan aktif ketika dibuka; pergantian halaman mereset scroll.

QA Chrome dilakukan pada 1728×1080, 1366×768, 768×1024 dan 390×844, development dan preview production. Screenshot di `tmp/admin13-qa/` tidak di-stage. Desain mobile merupakan adaptasi desktop; belum frame mobile resmi, perangkat fisik, Safari/Firefox atau klaim identik piksel.

## Admin 1.4 — Kategori Dana

Referensi final: `design-references/user/13-admin-kategori-dana.png` (1856 × 1172 px). Route `/admin/kategori-dana` menggunakan AdminLayout yang sama, tanpa menyalin margin hitam/bayangan luar screenshot. Sidebar Kategori Dana aktif; Dashboard dan Kelola Dana tetap dapat dinavigasi.

- Heading Kategori Dana dengan garis oranye vertikal, subtitle, dan Tambah Kategori hijau di kanan. Kartu putih menampilkan NO/KATEGORI/AKSI, tiga badge serta ikon Pencil/Trash2 dari Lucide. Aksi nonaktif diberi title/label aksesibilitas per kategori; tidak membuat form/dialog/CRUD.
- Badge Kas Masjid hijau, Jum'at Berkah emas, serta Pembangunan & Pemeliharaan oranye. Warna emas hanya override dalam tabel kategori; ID, label, warna sumber dan saldo tidak diubah, sehingga titik Jum'at Berkah pada resume tetap biru seperti referensi.
- Resume diekstrak dari Dashboard menjadi AdminBalanceSummary. Dashboard mempertahankan markup/visual awal; Kategori Dana menghilangkan deskripsi tambahan di atas resume sesuai raster. Tabel/nominal memakai sumber dan styling yang sama. Label nominal pertama **Saldo Awal**, mengoreksi pengulangan Saldo Akhir pada gambar.
- Desktop: heading/tombol sejajar, gap 24 px, tabel kategori sekitar 44 px header dan 76 px per baris, radius kartu 24 px. Tablet/mobile mengikuti menu yang ada; pada smartphone heading/tombol bertumpuk. Badge tetap utuh dengan scroll tabel lokal dan akses keyboard. Area aksi 44 px untuk kenyamanan target.

QA pada 1728×1080, 1366×768, 768×1024 dan 390×844; bukti di `tmp/admin14-qa/` tidak di-stage. Adaptasi mobile bukan frame resmi; kesetiaan visual merupakan pendekatan raster dan belum diuji pada perangkat fisik/Safari/Firefox.

## Admin 1.5 — Profil Masjid

Referensi final: `design-references/user/14-admin-profil-masjid.png` (1766 × 1405 px). Route `/admin/profil-masjid` memakai Sidebar/Topbar yang sama, menu Profil Masjid aktif. Margin hitam/bayangan luar gambar tidak menjadi bagian layout.

- Heading bergaris oranye, subtitle dan Simpan Perubahan hijau dengan ikon Check. Form memakai kartu putih radius 24 px, shadow lembut, padding 24 px dan gap 20 px. Label/input mengikuti font lokal Plus Jakarta Sans dan palet admin.
- Banner awal memakai `assets/masjid-background.webp` yang sudah ada, rasio desktop 2,8 dengan posisi bawah agar bangunan utuh. Nama Masjid wajib, Deskripsi Singkat dan Alamat berupa textarea, Kontak memakai ikon Phone; tidak ada crop atau bagian profil tambahan.
- Isi nama/deskripsi/alamat mengikuti mock publik, bukan menyalin field kosong/nama berbeda di raster. Kontak tetap kosong karena nomor resmi belum terverifikasi. Catatan simulasi dan feedback ditambahkan untuk memperjelas batas penyimpanan; error memiliki label serta fokus field pertama. Data publik tidak berubah.
- Tablet mengikuti menu collapsible dan input 16 px. Smartphone menumpuk heading/tombol, tombol selebar konten, padding kartu 20 px, banner rasio 1,6 dan textarea lebih tinggi; tidak memerlukan scroll horizontal halaman.

QA Chrome development/preview production pada 1728×1080, 1366×768, 768×1024 dan 390×844. Screenshot di `tmp/admin15-qa/` tidak di-stage. Mobile merupakan adaptasi desktop; belum perangkat fisik, Safari/Firefox atau klaim identik piksel.

Refinement Ganti Foto atas permintaan pengguna setelah implementasi awal: kontrol putih semi-transparan dengan ikon Camera/shadow di kanan bawah gambar, target 44 px dan fokus keyboard yang terlihat. Ukuran, rasio, posisi objek dan radius gambar tetap. Petunjuk format/5 MB, Batalkan Foto serta status preview/error berada di bawah gambar dan membungkus pada mobile. Pemilihan native hanya preview lokal, tanpa galeri/drag-and-drop/crop/upload server atau perubahan banner publik. Bukti pada empat viewport di `tmp/admin15-photo-qa/` tidak di-stage.

## Admin 1.6 — Kelola Agenda

Referensi final: `design-references/user/15-admin-agenda.png` (1766 × 1505 px). Route `/admin/agenda`, memakai AdminLayout dan menu Agenda aktif. Margin/bayangan luar raster tidak disalin ke layout aplikasi.

- Heading Agenda bergaris oranye, subtitle dan Tambah Agenda hijau di kanan. Kartu memakai admin-panel yang sudah ada, radius 24 px, shadow lembut, padding 20 px, tinggi minimum 88 px dan jarak 20 px. Kalender hijau berlatar hijau pucat di kiri, nama 16 px, frekuensi/jadwal 14 px, ikon Pencil hijau dan Trash2 merah di kanan.
- Data memakai service agenda publik tanpa duplikasi. Kelompok tetap berurutan 5 Mingguan, 2 Bulanan dan 5 Tahunan / PHBI; frekuensi terlihat di setiap kartu, kelompok memiliki heading semantik untuk pembaca layar. Semua 12 kegiatan ditampilkan.
- Nama Rabi’ul Awwal mengikuti mock **Peringatan Maulid Nabi Muhammad SAW**, meskipun raster mengulang **Peringatan Tahun Baru Islam**. Awalan **Bulan** pada seluruh jadwal tahunan serta ejaan/kapitalisasi seperti Al-Qur’an dan Ibu-Ibu tetap mengikuti sumber publik; tidak mengoreksi sumber berdasarkan gambar.
- Tambah/Edit/Hapus nonaktif dengan title/label dan catatan data contoh di bawah daftar. Tidak ada modal/CRUD/notifikasi sukses. Aksi ikon mempunyai target 44 px. Smartphone menumpuk heading/tombol, membungkus nama/jadwal dan memindahkan aksi ke baris berikutnya dalam kartu; tablet mempertahankan kartu horizontal selama muat.

QA Chrome development dan preview production pada 1728×1080, 1366×768, 768×1024 dan 390×844. Bukti di `tmp/admin16-qa/`, tidak di-stage. Adaptasi mobile belum berasal dari frame mobile resmi; belum perangkat fisik/Safari/Firefox atau klaim identik piksel.

## Admin 1.7 — Kontak & Pengaturan Website

Referensi final: `design-references/user/16-admin-kontak-pengaturan.png` (1766 × 1056 px). Route `/admin/kontak-pengaturan` memakai AdminLayout, menu Kontak & Pengaturan aktif dan judul Topbar lengkap. Margin/bayangan hitam luar gambar tidak menjadi layout aplikasi.

- Heading beraksen oranye, subtitle serta Simpan Perubahan hijau berikon Check mengikuti pola admin. Kartu memakai admin-panel, radius 24 px, padding 24 px, gap 16 px dan shadow lembut. Bagian Informasi Kontak menggunakan Phone hijau, input latar abu muda/radius 14 px, alamat textarea serta baris laporan berlatar abu muda.
- WhatsApp/email/Maps awal kosong; placeholder kontak menandai belum dikonfirmasi dan Maps memakai contoh format tautan. Contoh nomor/email pada raster tidak menjadi data resmi. Alamat memakai salinan referensi publik yang sama dengan Profil Masjid. Perubahan tidak disinkronkan ke halaman lain. Catatan simulasi dan feedback ditambahkan untuk menjelaskan batas penyimpanan serta toggle.
- Switch native berlabel Laporan Keuangan Publik, tampilan track 38×20 px dengan target 44 px dan fokus terlihat. Aktif hijau/knob kanan, nonaktif abu/knob kiri; mendukung keyboard Space. Tidak menjadi pengaman atau pengubah route laporan publik.
- Desktop mempertahankan form selebar konten. Tablet/mobile memakai menu sebelumnya dan input 16 px; smartphone menumpuk heading/tombol, judul Topbar membungkus, textarea lebih tinggi dan baris switch menjaga ruang teks/target klik.

Visual Chrome development/preview production ditinjau pada 1728×1080, 1366×768, 768×1024 dan 390×844. Bukti di `tmp/admin17-qa/`, tidak di-stage. Mobile merupakan adaptasi desktop; belum perangkat fisik/Safari/Firefox atau klaim identik piksel.

## Admin 1.8 — Kelola Akun

Referensi final: `design-references/user/17-admin-kelola-akun.png` (1766 × 1056 px). Route `/admin/kelola-akun` memakai AdminLayout dan menu Kelola Akun aktif; Topbar tetap memakai komponen lama. Margin hitam/bayangan luar raster tidak menjadi layout halaman.

- Label visual Super Admin Only dengan Shield oranye dan pill kuning pucat, heading beraksen oranye, subtitle serta Tambah Akun Admin hijau. Panel pencarian putih berikon Search, input dan Pencarian; placeholder menjadi **Cari nama atau email...** sesuai fungsi halaman, bukan Cari transaksi pada raster.
- Empat kartu admin-panel putih/radius 24 px, shadow lembut, padding 20 px, tinggi minimum 104 px dan gap 12 px. Avatar bulat hijau pucat, nama 16 px, email 14 px, role/tanggal 12 px dan badge Aktif hijau/Nonaktif abu. Inisial SA/AF/SR/BS diselaraskan dengan nama; tanggal memakai formatter Indonesia panjang yang sudah ada, bukan singkatan campuran pada gambar.
- Nama/email/role/status/tanggal mengikuti contoh referensi. Tiga akun aktif memiliki Edit/Nonaktifkan, akun nonaktif Edit/Hapus/Aktifkan. Warna dan ikon mengikuti desain; semua aksi pengelolaan nonaktif, tanpa modal atau perubahan data. Label Super Admin Only tidak menjadi otorisasi.
- Pada tablet tombol aksi memiliki tinggi minimum 44 px; smartphone memindahkan aksi ke baris berikutnya dalam kartu, teks/email dapat membungkus, heading/tombol serta panel pencarian menyesuaikan lebar. Hasil pencarian tanpa kecocokan menampilkan pesan jelas, bukan kartu fiktif.

Visual Chrome development/preview production ditinjau pada 1728×1080, 1366×768, 768×1024 dan 390×844. Screenshot di `tmp/admin18-qa/` tidak di-stage. Mobile adalah adaptasi desktop; belum perangkat fisik/Safari/Firefox atau klaim identik piksel.

## Admin 1.9 — Kode Akses Laporan Publik

Referensi final: `design-references/user/18-admin-kode-akses-laporan.png` (1766 × 1056 px). Route `/admin/kode-akses-laporan` memakai AdminLayout; menu dan Topbar Kode Akses Laporan aktif. Margin hitam/bayangan luar raster tidak menjadi layout aplikasi.

- Label visual Super Admin Only berikon Shield, heading Kode Akses Laporan Publik beraksen oranye dan subtitle mengikuti pola admin. Dua kartu memakai admin-panel/radius 24 px, padding 24 px, shadow lembut dan jarak 20 px; tidak membuat layout baru.
- Status Kode Akses: KeyRound hijau berlatar hijau pucat 48 px, badge Aktif, area abu muda, delapan simbol placeholder, chip **Simulasi**, metadata perubahan contoh dan Ubah Kode Akses nonaktif. Tidak menyimpan kode/hash dan tidak menyalin klaim Terenkripsi dari raster.
- Cara Kerja memakai Info dan lima baris ChevronRight. Teks disesuaikan dengan M1.8b: CTA membuka gate, integrasi pemeriksaan direncanakan, kode sesuai menuju **/laporan-keuangan**, akses langsung/refresh tetap terbuka, serta autentikasi Super Admin untuk mengganti kode terpisah. Tidak menggunakan /laporan atau klaim realtime/perlindungan halaman/hash terenkripsi pada gambar.
- Status/tanggal/pengubah diberi catatan data contoh. Smartphone membungkus judul, daftar dan metadata; tombol selebar kartu dengan target minimum 44 px. Area kode dan Simulasi dapat menyesuaikan ruang tanpa memotong teks.

QA Chrome development/preview production pada 1728×1080, 1366×768, 768×1024 dan 390×844. Bukti di `tmp/admin19-qa/`, tidak di-stage. Mobile merupakan adaptasi desktop; belum perangkat fisik/Safari/Firefox atau klaim identik piksel.

## Admin 1.10 — Activity Log

Referensi final: `design-references/user/19-admin-activity-log.png` (1766 × 3540 px). Route `/admin/activity-log` memakai AdminLayout, menu aktif dan Topbar Activity Log; Sidebar/Topbar tidak dibuat ulang. Margin hitam/bayangan luar raster bukan bagian layout.

- Hero hijau memakai foto masjid yang sudah ada, radius 24 px, badge APPEND-ONLY · TIDAK DAPAT DIHAPUS dan judul 36 px. Deskripsi serta banner Sistem Append-Only diperjelas sebagai data contoh/konsep, tanpa klaim integritas atau kelengkapan yang sudah ditegakkan.
- Panel filter putih memakai empat kontrol native berlabel dan pencarian selebar panel. Grid empat kolom desktop menjadi dua pada tablet dan satu pada smartphone; ukuran input mobile 16 px dengan target minimum 44 px. Filter bekerja langsung tanpa tombol submit tambahan.
- Tujuh grup tanggal memakai pill kalender, garis horizontal dan jumlah hasil. Timeline vertikal, marker berwarna 40 px, avatar/inisial, badge jenis/modul, kartu putih admin-panel, radius 24 px dan detail perubahan mengikuti proporsi referensi. Badge menggunakan warna teks lebih gelap agar mudah dibaca; nominal lama dicoret merah dan baru hijau.
- Sembilan skenario bersifat mandiri. Kartu 11 Juni memakai tanggal 11 Juni dan contoh akun Siti, menggantikan duplikasi kartu/timestamp 12 Juni pada raster. Skenario 9 Juni berupa penonaktifan akun Budi; tidak menyalin rincian reset password. Perubahan kode hanya metadata contoh tanpa nilai asli dan tetap menyebut gate UI. Contoh tidak mengubah mock transaksi, akun atau agenda halaman lain.
- Smartphone memperkecil marker menjadi 32 px, membungkus header/badge, menumpuk label/nilai detail serta menjaga teks panjang di dalam kartu. Tidak ada tombol edit/hapus log, dialog, ekspor atau pencatatan aktivitas sungguhan.

Visual Chrome development/preview production diperiksa pada 1728×1080, 1366×768, 768×1024 dan 390×844. Bukti di `tmp/admin110-qa/`, tidak di-stage. Mobile merupakan adaptasi desktop; belum perangkat fisik/Safari/Firefox atau klaim identik piksel.

## Admin 1.11 — Kwitansi dan Buat Kwitansi

Referensi final halaman/modal: `design-references/user/20-admin-kwitansi.png` (1766×1057 px) dan `21-admin-buat-kwitansi.png` (524×641 px). Route `/admin/kwitansi` memakai AdminLayout; menu aktif dan Topbar Kwitansi. Margin hitam/shadow luar raster bukan layout aplikasi.

- Heading beraksen oranye, tombol Buat Kwitansi hijau, kartu putih/radius 24 px, header foto berlapis hijau dengan ikon Building2 serta judul masjid dua baris, detail berbaris, terbilang berbingkai hijau, tanggal Yogyakarta, label generated dan Unduh PNG selebar konten mengikuti referensi. Font/foto/ikon yang sudah ada digunakan kembali.
- Nomor 0 pada gambar diganti **Belum diterbitkan**, terbilang menjadi kata Indonesia dan label draft ditambahkan pada dokumen. Pratinjau awal tidak memakai identitas/nominal contoh resmi. Penambahan label dan teks panjang dapat memperbesar tinggi kartu; tidak memotong konten demi tinggi raster.
- Modal putih selebar 448 px, radius 16 px, header/X, lima kontrol berlabel, tanda wajib merah, tombol Batal/Simpan dan catatan state lokal. Native dialog membatasi interaksi latar; fokus/Tab/Shift+Tab, Enter, Escape, return focus dan scroll viewport pendek didukung. Smartphone memakai input 16 px, target minimum 44 px dan dialog mengikuti visual viewport saat keyboard muncul.
- Halaman mobile menumpuk heading/tombol serta label/nilai kwitansi. Render PNG menggunakan komponen dokumen yang sama pada salinan tetap 1120 px, resolusi 2×/tinggi otomatis; aturan responsive layar tidak mengubah format unduhan. Tidak menyertakan Sidebar, form, tombol atau toast dalam PNG.
- Referensi tambahan toast yang disebut pengguna: `22-admin-notifikasi-unduh-kwitansi.png`, belum ditemukan saat pemeriksaan workspace. Sementara mengikuti spesifikasi tertulis pengguna: toast hijau, ikon Download, teks sukses persis, radius/shadow lembut, kanan bawah, role status, auto-dismiss tiga detik; error merah. Pada mobile tersedia ruang bawah dan tombol unduh dibawa ke tengah viewport agar tidak tertutup toast; toast tidak menangkap pointer.
- Refinement pengguna: Buat Kwitansi mengikuti Tambah Kategori/Agenda, tinggi minimum 40 px desktop/44 px tablet-mobile, font 14 px, padding 10×18 px dan radius 16 px. Warna/ikon/fungsi tetap; Unduh PNG tidak berubah. Tanggal modal memakai kalender native dengan default tanggal lokal perangkat, tanpa batas tanggal lampau. Format input mengikuti browser; preview/PNG tetap dd/mm/yyyy dan draft tersimpan dipertahankan saat modal dibuka ulang.

Bukti screenshot empat viewport dan berkas PNG hasil unduhan di `tmp/admin111-qa/`, tidak di-stage. QA terbatas Chrome/emulasi; belum perangkat fisik/Safari/Firefox atau klaim identik piksel.

## Admin 1.12 — Laporan Keuangan

Referensi final: `23-admin-laporan-01.png` (1766×10490 px), `24-admin-laporan-02.png` (1766×18105 px) dan `25-admin-laporan-03.png` (3532×12533 px), di `design-references/user/`. Route `/admin/laporan` memakai AdminLayout; Topbar Laporan Keuangan menggantikan Transaksi pada raster. Margin hitam/shadow luar bukan layout aplikasi.

- Hero foto, judul dua baris, badge, dua tombol transaksi, saldo utama hijau, tiga kartu kategori, Detail Oktober, dua panel rincian, resume dan banner oranye mengikuti komposisi desktop. Refinement mempertahankan tinggi/posisi konten Laporan tetapi menyamakan gradient ke nilai asli Kelola Dana: #1b6b42 → #258961e8 → #30947199 → #4fa68426. Token bersama di AdminLayout dipakai kedua hero; posisi foto Laporan 45% dan Kelola Dana 47% tetap. Screenshot Dashboard/Kelola Dana sebelum-sesudah pada 1728×1080 identik (0 piksel berubah).
- Koreksi navigasi setelah commit `7ac0ec7`: ketiga raster adalah tiga state **satu halaman**. Tab **Kas Masuk** memakai ArrowUpRight/hijau, **Kas Keluar** ArrowDownRight/rose #ca003a, **Rekap Bulanan** FileText/hijau sesuai raster. Tiga kolom sama lebar di desktop; tab Laporan Bulanan keempat tetap dihilangkan. Kategori dana tidak lagi dipakai sebagai tab utama. Identitas Kas Masjid hijau, Jum'at Berkah biru dan Pembangunan oranye dipertahankan, terpisah dari warna jenis laporan.
- Filter memakai alignment tengah dengan padding vertikal 8 px. Label rentang, kelompok date picker, Terapkan dan jumlah hasil satu garis tengah desktop; teks label tanggal terpusat di atas input dengan gap 2 px. Terapkan tetap 36 px desktop/padding 6×14/font 13 dan 44 px tablet/mobile. Tinggi kartu sekitar 70 px desktop; mobile membungkus/bertumpuk. Nilai tanggal, validasi serta logika penerapan rentang tetap.
- Panel atas awalnya Oktober: **6 pemasukan dan 7 pengeluaran**, total persis baseline. Referensi memiliki 5 pemasukan; pemetaan biru/oranye pada referensi tidak konsisten dengan Dashboard. Entri biru menjadi Rp403.000, sedangkan oranye memakai cuplikan Rp403.000 yang sudah ada ditambah Rp303.000 simulasi. Keduanya ditandai simulasi, bukan salinan identik. Resume tetap memakai kolom **Saldo Awal** yang benar.
- Fixture riwayat Januari–Oktober tetap: 172 Kas Masjid, 38 Jum'at Berkah, 39 Pembangunan. Total 249 contoh (163 dari bagian raster terbaca, 81 simulasi/penyesuaian, 5 cuplikan Dashboard). Semua ditandai mock. Nama, tanggal, jenis dan nominal bervariasi; data tidak diklaim lengkap/identik 123 pemasukan + 251 pengeluaran Figma atau sama dengan rekap tahunannya. Bagian yang nominal/teksnya belum dapat dipastikan diperlakukan sebagai simulasi.
- Saldo sumber tidak ditukar agar menyerupai label raster: akhir Kas Masjid Rp12.718.200, Jum'at Berkah Rp3.654.000, Pembangunan Rp856.000. Kas Masuk menampilkan 141 transaksi dari semua kategori, total Rp74.941.200; Kas Keluar 108, total Rp64.782.500. Kartu total mengikuti jenis laporan, kartu jumlah dan pencarian sejajar seperti raster. Tabel memakai badge kategori berwarna, tanggal, uraian, nominal sesuai jenis serta aksi nonaktif. Pencarian/rentang memengaruhi total dan baris, bukan snapshot.
- Rekap Bulanan 2026 memakai tabel dengan Bulan, Kategori, Saldo Awal, Pemasukan, Pengeluaran dan Saldo Akhir. Kolom bulan mencakup tiga baris kategori dan satu baris TOTAL abu-abu. Saldo awal historis ditambah mutasi sebelum rentang membentuk saldo awal tiap grup; semua nilai bulanan dihitung dari 249 transaksi. Rincian Januari–Oktober saja, tanpa menyalin angka tahunan raster atau mengarang data bulan mendatang. Rentang parsial tetap seimbang, rentang kosong membawa saldo dengan mutasi nol. Kartu kategori atas menjadi pintasan ke rekap tanpa mengubah komposisi/angka kartu; aksen Jum'at Berkah dikembalikan ke identitas biru.
- Ekspor, ringkasan PNG dan toast tidak diubah. PNG desktop/mobile tetap 2240×1326, berisi seluruh kategori baseline. Tidak mengekspor daftar historis panjang atau menambah PDF.
- Tablet/mobile menumpuk panel/kartu/tab, input 16 px dan target aksi minimum 44 px. Tabel tetap scroll lokal dengan petunjuk dan caption beracuan pada kontainer. Kas Masuk/Kas Keluar menampilkan seluruh baris sesuai filter; rekap memiliki 30 baris kategori dan 10 total bulanan pada rentang awal. Data tidak dipotong demi menyerupai jumlah baris Figma. Tidak menambah dependency atau mekanisme daftar kompleks.

Bukti koreksi navigasi di `tmp/admin112-navigation-qa/`; screenshot empat viewport 1728×1080, 1366×768, 768×1024 dan 390×844 tidak di-stage. QA Chrome/emulasi, belum perangkat fisik/Safari/Firefox atau klaim identik piksel. Semua data historis tetap contoh pengembangan, terpisah dari laporan publik April dan sumber Dashboard.


## Admin 1.13 — Patch interaksi Kategori Dana

Referensi final `26-admin-hapus-kategori.png` (524×311 px) dan `27-admin-tambah-edit-kategori.png` (768×433 px). Satu halaman `/admin/kategori-dana` dan AdminLayout yang sama, tanpa route atau halaman baru.

- Form Tambah/Edit memakai satu komponen dengan judul dinamis, panel hijau muda, kartu putih berborder/radius, Nama Kategori, sembilan swatch berurutan sesuai raster dan footer Batal/Simpan. Indikator centang/outline dan radio native membantu keyboard/aksesibilitas; modal 720 px desktop, sembilan kolom warna, tiga kolom di smartphone. Warna memakai varian teks lebih gelap untuk keterbacaan tanpa menambah color picker.
- Konfirmasi Hapus memakai kartu putih, peringatan merah dan judul **Hapus Kategori?**. Label **Ya, Hapus Kategori** mengoreksi Hapus Transaksi pada raster. Kalimat database/Activity Log dari raster diganti penjelasan sesi mock. Kategori terpakai/saldo bukan nol menampilkan alasan serta konfirmasi nonaktif; kategori mock kosong dapat dikonfirmasi. Batal/X/Escape tidak mengubah state.
- Patch ini menggantikan aksi nonaktif Admin 1.4. Badge emas Jum'at Berkah pada baseline daftar dihapus sebagai override lokal; badge/titik/aksen kini mengikuti definisi warna bersama di `adminCategoryColors.js`. Varian dasar hijau/biru/oranye di Dashboard/Laporan dipertahankan; mengubah warna kategori tidak mewarnai jenis transaksi, saldo pemasukan/pengeluaran atau tab laporan.
- State kategori pada AdminLayout dipakai seluruh halaman admin selama layout aktif. Nama/warna berubah berdasarkan ID yang tetap; kategori baru memiliki saldo nol. Jumlah kategori pada resume/rekap dapat bertambah tanpa mengubah total. Tidak mengubah fixture 249 transaksi, snapshot, backend, autentikasi, frontend publik maupun algoritma ekspor.
- Native dialog membatasi tinggi viewport dan dapat digulir; Escape, fokus awal, trap Tab/Shift+Tab dan fokus kembali tersedia. Mobile memakai input 16 px serta area interaksi minimum 44 px. Feedback menyebut mock/belum ke server; tidak meniru penyimpanan permanen atau log asli.

Bukti desktop/tablet/mobile dan warna pada Laporan di `tmp/admin113-qa/`, tidak di-stage. Backend nantinya harus memvalidasi nama, pilihan warna, izin serta relasi transaksi sebelum penghapusan; belum menetapkan URL/kontrak baru.


## Admin 1.14 — Form Tambah Pemasukan dan Pengeluaran

Nama referensi yang diminta: `28-admin-tambah-pemasukan.png`, belum tersedia saat pemeriksaan. File yang berisi frame Tambah Pemasukan sesuai rincian pengguna ditemukan sebagai `design-references/user/Pasted 2026-11-11 at 1.49.23 AM.png` (768×906). Frame tersebut dipakai tanpa mengganti nama atau memasukkan aset ke staging; tidak mengarang frame/URL lain.

- Satu `AdminTransactionForm` dengan parameter income/expense. Header memakai tombol kembali, judul dan subtitle; surface pemasukan hijau muda, kartu putih berborder/radius, label di atas field, checkbox dalam panel lembut, Keterangan dan footer Batal/Simpan mengikuti raster. Modal 720 px desktop, radius 32 px, panel/form padding 24 px. Tablet/mobile menyesuaikan lebar, input 16 px, tinggi dibatasi visual viewport dan scroll lokal; posisi ikut perubahan viewport dengan cleanup listener.
- Pengeluaran memakai struktur enam field yang sama, label Uraian Pengeluaran dan Nama Penerima; checkbox nama publik tidak dirender. Surface #fff0f3, tombol/aksen #ca003a. Tombol Pengeluaran pada panel Kelola Dana menjadi rose, Pemasukan tetap hijau. Warna kategori oranye maupun tab jenis transaksi tidak diubah.
- Tanggal native diawali hari ini menurut kalender lokal perangkat, bukan UTC; form baru selalu kosong selain tanggal. Validasi error/fokus, Batal/Escape/kembali, trap Tab/Shift+Tab dan pengembalian fokus tersedia. Tidak menambahkan form edit/hapus, metode pembayaran, unggahan, atau fitur transaksi lain.
- Tambahan ada di state sesi bersama, terpisah dari 249 baris historis dan lima cuplikan snapshot. Daftar Kelola Dana/Dashboard memperlihatkan tambahan dengan label Sesi mock serta penjelasan belum termasuk saldo/laporan. Pemberitahuan Laporan menyebut jumlah tambahan tanpa mengubah tabel/agregat historis; total Rp17.228.200 tetap. Copy hero/panel yang sebelumnya mengklaim edit/hapus dan pembaruan otomatis seluruh laporan diganti agar sesuai perilaku mock.
- Kategori dari sumber bersama, ID stabil, nama/warna mengikuti metadata. Proteksi hapus kategori mencakup tambahan sesi. Preferensi nama donatur hanya untuk pemasukan/default false, belum memengaruhi laporan publik. State hilang setelah refresh/keluar admin, tanpa storage, request, backend atau log palsu.

Bukti kedua modal di 1728×1080, 1366×768, 768×1024 dan 390×844 serta screenshot simpan/integrasi di `tmp/admin114-qa/`, tidak di-stage. Perbedaan tanggal mengikuti locale kalender native; screenshot pendukung yang dipakai tetap bernama Pasted. Sinkronisasi agregat periode serta otorisasi/validasi server menunggu backend; tidak mengubah kontrak API.

## Admin 1.15 — Pagination dan Detail/Edit/Hapus Transaksi

Keempat referensi berikut digunakan sebagai elemen UI, tanpa mengganti layout Admin atau tiga tab Laporan:

| Referensi lokal | Implementasi |
| --- | --- |
| `29-admin-pagination-transaksi.png` | Footer pagination 20/30/50/Semua, rentang baris dan Lihat Detail pada tabel Kas Masuk/Kas Keluar di `/admin/laporan` |
| `30-admin-detail-transaksi.png` | `/admin/laporan/transaksi/:id`: breadcrumb, kembali, kartu informasi dan panel ringkasan kanan |
| `31-admin-edit-transaksi.png` | `/admin/laporan/transaksi/:id/edit`: form halaman tersendiri dan ringkasan sebelum diedit |
| `32-admin-hapus-transaksi.png` | Dialog konfirmasi dari detail; tombol aktif hanya untuk teks persis `HAPUS` |

Field Tambah dan Edit berbagi `AdminTransactionFields`, kategori bersama, validasi service, tanggal native serta input rupiah. Pengeluaran memakai rose dan Nama Penerima tanpa checkbox nama publik; pemasukan memakai hijau dan preferensi nama donatur. Field opsional yang tidak ada tidak dipaksakan tampil di detail. Form edit menggunakan textarea uraian sebagaimana referensi, sementara modal Tambah mempertahankan input sebelumnya.

Nomor halaman memakai ellipsis hanya bila ada celah, mengikuti hasil pencarian/rentang sebelum pemotongan baris. Konteks tab, pencarian, tanggal dan pagination disimpan sementara saat membuka detail. Detail/edit dan modal mengikuti grid desktop serta susunan satu kolom/scroll lokal pada mobile. Tidak menambahkan tab keempat.

Semua teks operasi menyebut simulasi sesi. Peringatan hapus permanen pada raster disesuaikan agar tidak mengklaim perubahan database atau Activity Log. Saldo/PNG snapshot tetap; rekap dan total tabel aktif menampilkan hasil simulasi dari sumber transaksi bersama. Bukti visual empat viewport tersedia di `tmp/admin115-qa/` dan tidak di-stage.

## Admin 1.16 — Pengaturan Donasi

Referensi final: `design-references/user/33-admin-pengaturan-donasi.png`. Route `/admin/donasi` memakai AdminLayout, topbar Donasi dan menu Donasi di kelompok Konten Website, sesudah Kontak & Pengaturan.

- Breadcrumb Konten Website → Kontak → Donasi; heading Pengaturan Donasi, badge draf dan banner peringatan mengikuti frame. Desktop memakai kolom konfigurasi dan kolom pratinjau/kesiapan; tablet/mobile bertumpuk tanpa mengubah layout halaman lain.
- Urutan panel: Scan QRIS, Transfer Bank, Catatan donasi, Konfirmasi Donasi (WhatsApp), lalu footer Batal/Simpan Perubahan. Gambar PNG/JPG maksimal 2 MB dipratinjau lokal; Ganti/Hapus aktif setelah gambar valid tersedia. Toggle nonaktif sampai data lengkap, dan otomatis mati saat kelengkapan hilang.
- Sesuai frame, hitungan `0 dari 2 siap` merujuk dua metode pembayaran (QRIS/transfer). Kesiapan konfirmasi WhatsApp ditampilkan terpisah. Semua status merujuk simulasi, bukan verifikasi rekening/QRIS atau publikasi.
- Mini-preview hanya menampilkan metode aktif dan lengkap; tanpa QRIS/transfer tampil empty state. Konfirmasi WhatsApp menampilkan nomor/template literal dengan tombol pratinjau nonaktif, tanpa membuka atau mengirim pesan. Catatan donasi diperbarui langsung.
- Rekening dan nomor WhatsApp awal kosong karena data resmi belum terverifikasi. Template placeholder dan catatan pengingat merupakan mock. Draf terakhir bertahan selama AdminLayout aktif; Batal mengembalikan isi dan gambar. Refresh/keluar layout menghapus draf, tanpa localStorage/backend atau perubahan Kontak publik.

Bukti visual empat viewport, upload/preview dan status di `tmp/admin116-qa/`; aset referensi serta artefak tidak di-stage. Tidak membuat frame atau URL Figma baru.

## Admin 1.17 — Unduh Laporan Keuangan PDF/PNG

Referensi final: `design-references/user/34-admin-unduh-laporan-pengaturan.png` dan `35-admin-unduh-laporan-pratinjau.png`. Sesuai refinement pengguna, shell modal pada raster diadaptasi menjadi dua halaman dalam AdminLayout:

- `/admin/laporan/unduh`: Pengaturan Unduhan.
- `/admin/laporan/unduh/pratinjau`: Pratinjau & Unduh Laporan.

Banner oranye Laporan tetap; tombol Unduh Laporan menuju pengaturan sambil mempertahankan konteks filter/pagination daftar. Menu Laporan tetap aktif pada kedua halaman. Breadcrumb, Kembali ke Laporan/Pengaturan dan Ubah Pengaturan mengikuti pola navigasi Detail/Edit Transaksi.

Pengaturan memakai kartu putih dua kolom dan heading beraksen oranye. Pilihan radio menentukan satu mode periode aktif: Periode Cepat (minggu/bulan/tiga bulan berdasarkan kalender lokal), Rentang Bulan (tahun/grid bulan dan month picker awal–akhir), atau Rentang Tanggal (dua date picker native, inklusif). Hanya kontrol mode aktif yang ditampilkan. Tiga checkbox adalah Kas Masuk, Kas Keluar dan Rekap Bulanan; Laporan Bulanan dihapus. PDF/PNG dipilih melalui radio di pengaturan, dengan PDF default. Panel Ringkasan Pilihan menampilkan periode, jenis, format dan nominal efektif.

Pratinjau memakai seluruh lebar area konten, ringkasan dokumen mendatar yang ringkas, dan semua lembar A4 portrait berurutan dalam satu kolom. Lebar pratinjau maksimum 900 px dengan skala proporsional; tablet/mobile menyesuaikan ruang. Satu tombol unduh mengikuti format terpilih (PNG jamak berupa ZIP); tidak ada pemilih format atau badge halaman pada header. Jumlah halaman tetap tercantum di ringkasan dokumen.

Template `AdminDownloadSheet`, identitas masjid, kategori, warna, perhitungan dan pagination berbasis tinggi DOM tetap. Setiap bagian dimulai pada halaman baru, baris tidak dibelah dan header tabel diulang. Rekap Bulanan tetap memuat saldo awal, pemasukan, pengeluaran, saldo akhir dan total tiap bulan/kategori; kartu saldo periode tetap terdapat di dokumen, sehingga penghapusan opsi Laporan Bulanan tidak menghilangkan informasi saldo. PDF A4 portrait dan PNG 1588×2246 px menggunakan lembar pratinjau yang sama. Toast sukses/error tetap mengikuti gaya Laporan.

Pilihan hanya disimpan selama AdminLayout aktif, tanpa localStorage. Ubah Pengaturan dan Back/Forward mempertahankan pilihan; pratinjau langsung/refresh tanpa konfigurasi diarahkan ke pengaturan. Data admin Oktober tetap menjadi default, bukan April pada contoh raster. Template publik A4 landscape tidak berubah. Bukti visual dan contoh berkas refinement di `tmp/admin117-refinement-qa/`, tidak di-stage.
