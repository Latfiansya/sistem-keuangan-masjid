# Perkembangan proyek

## Milestone 0 — fondasi (5 November 2026)

Status: selesai, siap untuk commit manual oleh pengguna.

- Repository kosong diinisialisasi dengan branch `main`; remote dan commit belum dibuat.
- Dua npm workspace: React/Vite JavaScript di `frontend`, Express di `backend`, satu lockfile root.
- Tailwind CSS v4 melalui plugin Vite; React Router dan Lucide React tersedia.
- Route publik dan 404 memakai placeholder, `PublicLayout`, Navbar, Footer; desain Figma belum tersedia.
- Service health mendukung mock bawaan atau API melalui environment. Proxy development `/api` menuju port 3000.
- Backend memisahkan `app.js` dan `server.js`; tersedia health, JSON 404, penanganan error, konfigurasi environment, dan watch/start bawaan Node.js.
- README, aturan agent, kerangka kontrak API, dan peta desain disiapkan.

### Verifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Instalasi bersih `npm ci` dan dua workspace | PASS |
| `npm run lint` | PASS |
| `npm test` (3 test HTTP backend) | PASS |
| `npm run build` | PASS |
| `npm audit` | PASS — 0 kerentanan |
| Backend start, health langsung, development, dan PORT dari `.env` | PASS |
| Proxy Vite `/api/health` dan service mode API nyata | PASS |
| Mock mandiri tanpa HTTP dan render 4 route dengan layout bersama | PASS — render server untuk pemeriksaan struktur |
| Service: kegagalan koneksi, error HTTP, JSON/kontrak tidak valid | PASS |
| `.gitignore`, diff, staged changes, dan pemeriksaan file sensitif | PASS |
| Pembersihan proses dan berkas verifikasi sementara | PASS |

Pengujian integrasi frontend tambahan dilakukan dengan skrip sementara menggunakan Vite dan render React; skrip tidak masuk Git. Suite otomatis permanen saat ini hanya pengujian backend. Pemeriksaan visual/interaksi browser belum dilakukan karena host akses browser tidak tersedia; build, render route, dan HTTP lokal telah diuji. npm memberi pemberitahuan skrip instalasi `fsevents` opsional dari Vite yang belum diizinkan; instalasi, lint, build, dan server development tetap berhasil tanpa perubahan izin.

Semua file fondasi yang relevan sudah di-stage dan diperiksa; tidak ada `.env`, dependency terpasang, log, atau build artifact di staging. Tidak ada commit, push, remote, atau deployment yang dibuat.

### Keputusan dan langkah berikutnya

Node.js 24+ menjadi standar lokal agar fitur environment, watch, dan test runner tersedia tanpa dependency tambahan. Mock tidak menyimulasikan data keuangan. Format bisnis pada kontrak masih berupa usulan; hanya health telah diterapkan.

Selanjutnya: pengguna meninjau staged changes lalu melakukan commit manual; tim memberikan frame Figma resmi, mengonfirmasi konten profil dan kebutuhan laporan, serta menyepakati kontrak API sebelum implementasi berikutnya pada branch fitur. Database, autentikasi, admin, fitur keuangan, CI/CD, remote, dan deployment belum dikerjakan.

## Milestone 0.1 — GitHub dan persiapan commit (6 November 2026)

Status: selesai, siap initial commit manual oleh pengguna.

- Autentikasi GitHub CLI dan SSH berhasil untuk akun `Latfiansya`; konfigurasi akun tidak diubah.
- Repository baru [Latfiansya/sistem-keuangan-masjid](https://github.com/Latfiansya/sistem-keuangan-masjid) dibuat dengan visibility private dan deskripsi yang diminta, tanpa inisialisasi berkas atau commit di GitHub.
- `origin` terhubung melalui `git@github.com:Latfiansya/sistem-keuangan-masjid.git`; branch utama GitHub dan branch lokal adalah `main`.
- Verifikasi remote: belum ada branch, tag, atau riwayat; akses baca melalui SSH berhasil.
- Pemeriksaan staged diff, whitespace, `.gitignore`, pola kredensial, dan file sensitif: PASS. Sebanyak 31 file fondasi disiapkan; README dan catatan ini diperbarui untuk mencerminkan status remote.
- Source code dan dependency tidak diubah. Hasil validasi kode Milestone 0 tetap berlaku; tidak ada proses development dijalankan pada milestone ini.
- Tidak ada commit, push, merge, rebase, atau konfigurasi remote GitLab yang dijalankan.

Langkah berikutnya: pengguna memeriksa staging lalu menjalankan initial commit dan `git push -u origin main` secara manual. Implementasi Figma tetap menunggu instruksi berikutnya.

## M1.1 — Layout bersama dan Beranda

Status: implementasi tahap pertama selesai dengan placeholder aset; menunggu peninjauan pengguna. Pekerjaan berhenti sebelum M1.2.

- Branch `feature/frontend-publik`; Navbar, Footer, PublicLayout, dan seluruh bagian Beranda mengikuti `design-references/user/01-beranda.png`.
- Beranda berisi hero, statistik, visi-misi, ringkasan agenda, kemakmuran, dan CTA transparansi. Komponen bersama baru hanya Button, VisionMission, dan AgendaSummary.
- Konten mock dimuat melalui publicContentService, mendukung pembatalan dan salinan data terpisah. Mode API memberi pesan integrasi konten publik belum tersedia, tanpa endpoint karangan. Service health tetap tersedia.
- Profil/Laporan/404 tetap placeholder dan route tidak ditambah. Agenda, Kontak, detail kegiatan, serta Masuk Pengurus dinonaktifkan sampai tahap terkait.
- Tidak mengubah backend, dependency, kontrak API, atau konfigurasi remote; tidak memanggil Figma MCP.

### Verifikasi lokal

- `npm run lint`: PASS.
- `npm test`: PASS, tiga test HTTP backend yang sudah tersedia; belum ada suite frontend permanen baru.
- `npm run build`: PASS.
- Pemeriksaan sementara melalui Vite SSR: PASS untuk mock tanpa backend, isolasi salinan data, pembatalan, struktur/tautan Beranda, state loading/error, serta render route Profil/Laporan/404 dengan layout bersama. Skrip sementara tidak disimpan.
- Chrome native: Beranda tampil pada desktop, viewport responsive 861 px dan mobile 390 px. Hero/Navbar/statistik serta bagian bawah kartu kemakmuran, CTA/Footer diperiksa secara visual. Tautan CTA mengubah URL ke route laporan yang tersedia.
- Akses browser DOM tidak tersedia; alat tangkap/scroll native beberapa kali gagal. QA belum merupakan perbandingan penuh seluruh halaman pada 1728 px atau matriks 360/768/1024 px. Tidak mengklaim kesamaan piksel atau audit aksesibilitas lengkap.
- Browser menampilkan peringatan dari ekstensi dan 404 favicon bawaan; tidak ada kegagalan render React yang teramati.

### Batasan dan tindak lanjut

Foto masjid, latar foto buram, logo dan font asli belum tersedia; placeholder berlabel dan gradien dipakai tanpa mengambil gambar masjid lain. Karena itu komposisi foto, bentuk huruf, panjang baris dan detail warna belum identik dengan referensi. Data konten mengikuti mock referensi, belum terverifikasi sebagai informasi produksi. Tidak ada fitur laporan, token, ekspor, atau data keuangan yang diterapkan.

README dan peta desain diperbarui. Gambar referensi tetap di luar staging. Hanya file kode/dokumentasi M1.1 yang relevan disiapkan setelah pemeriksaan; commit dan push dilakukan pengguna sendiri. Usulan pesan commit: `feat: implementasikan layout bersama dan beranda publik`.

## M1.1 — Refinement skala dan proporsi

Status: dua iterasi CSS selesai; tidak melanjutkan M1.2. Seluruh konten, mock, service, komponen, dan route M1.1 dipertahankan.

### Perubahan visual

- Navbar dipersempit dari maksimum 1090 menjadi 1000 px. Logo placeholder, menu, padding dan gap diperkecil; tinggi aktual desktop turun 78 → 59 px.
- Judul hero memakai `clamp(64px, 6.4vw, 110px)`. Tinggi hero cair 620–900 px; judul, paragraf dan tombol mengecil seiring viewport. Tidak memakai zoom CSS atau skala transform halaman.
- Statistik, heading, ringkasan agenda, kartu kemakmuran, CTA/Footer dan jarak antarseksi dirapatkan secara proporsional.
- Mobile mempertahankan logo di atas menu dengan empat menu satu baris pada lebar 390 px. Tinggi Navbar 162 → 98 px; hero 680 → 500 px; kartu statistik 147 → 115 px.
- Iterasi pertama memperlihatkan Navbar masih 66 px akibat label placeholder dan paragraf hero menyisakan tahun sendiri di laptop. Iterasi kedua memperkecil tinggi logo/label, membatasi lebar paragraf dalam satuan em, dan menyeimbangkan pemenggalan heading visi.

### Hasil QA

Chrome native tersedia tetapi kontrol viewport tidak andal. Pemeriksaan terukur dilakukan pada instance Chrome headless lokal terpisah dengan profil sementara, device scale factor 1, page scale 1, dan computed zoom 1 (100%). Tidak mengubah zoom browser pengguna atau mengambil gambar eksternal.

| Viewport | Navbar sebelum → sesudah | Hero sebelum → sesudah | Tinggi kartu statistik sebelum → sesudah | Tinggi halaman sebelum → sesudah |
| --- | --- | --- | --- | --- |
| 1728 × 1080 | 78 → 59 px | 1115 → 899 px | 198 → 170 px | 4185 → 3536 px |
| 1366 × 768 | 78 → 59 px | 881 → 710 px | 198 → 150 px | 3944 → 2989 px |
| 390 × 844 | 162 → 98 px | 680 → 500 px | 147 → 115 px | 3941 → 3119 px |

Screenshot sebelum, iterasi pertama, dan hasil akhir (viewport serta halaman penuh) tersimpan di `tmp/visual-qa/`, yang sudah diabaikan Git. Screenshot dibandingkan dengan referensi lokal; tidak dimasukkan ke staging. Pengujian browser sementara memastikan viewport tepat, skala 100%, tanpa overflow horizontal atau tumpang tindih Navbar–judul, satu h1, tiga statistik dan tiga kartu program. Navigasi ke `/profil` serta `/laporan-keuangan` tetap menampilkan placeholder.

`npm run lint`, `npm test` (tiga test backend), `npm run build`, dan pemeriksaan browser sementara: PASS. Diff dan staging ditinjau; refinement hanya menyentuh CSS, catatan progres, dan peta desain. Staging M1.1 sebelumnya dipertahankan; tidak ada gambar referensi, screenshot QA, profil browser, log, credential atau hasil build di staging.

### Batasan tersisa

Foto masjid, latar foto buram, logo dan font asli tetap belum tersedia. Warna dan komposisi latar memakai placeholder/gradien; bentuk huruf dan pemenggalan teks belum identik dengan desain. Tinggi raster referensi 4121 px tidak disamakan secara paksa: hasil desktop dibuat lebih ringkas mengikuti koreksi skala pengguna. Belum merupakan kesamaan piksel dengan Figma, dan belum ada desain mobile resmi. Tidak ada perubahan backend/dependency, commit, push, atau pengerjaan M1.2.

Usulan pesan commit khusus refinement setelah M1.1 dipisahkan pengguna: `style: rapatkan skala dan proporsi beranda publik`. Jika seluruh staging M1.1 di-commit sekaligus, gunakan `feat: implementasikan layout bersama dan beranda publik`.

## M1.1a — Integrasi aset Blade ke Beranda React

Status: selesai dan tervalidasi; siap ditinjau serta di-commit manual oleh pengguna. Branch `feature/frontend-publik`; M1.1 sebelumnya sudah di-commit, staging kosong saat pekerjaan dimulai. Hanya `design-references/` yang untracked pada awal pemeriksaan.

### Implementasi dan sumber

- Repository Blade di-clone terpisah di `/Users/nobody79/Project/referensi-ui-keu-masjid-m11a`, lalu diperiksa pada commit `12e0155f6a5aba59f4776403c711082f27fa2dce`. Tidak menggabungkan histori Git atau menjalankan Laravel.
- `Background Pict.png` dan `Logo Masjid.png` sesuai secara visual dengan referensi final. Keduanya dikonversi menjadi WebP aplikasi; ukuran foto turun 93,2% dan logo 94,3%. Sumber, dimensi, ukuran, pengolahan, serta batasan lisensi dicatat di DESIGN_MAP.
- Font Plus Jakarta Sans normal variabel 200–800 subset Latin dimuat lokal melalui @font-face dengan font-display swap. Salinan copyright/lisensi SIL OFL 1.1 disertakan. Tidak menambahkan dependency atau permintaan font eksternal saat runtime.
- Placeholder foto/logo diganti aset asli. Foto hero memakai cover/tengah bawah, crop mobile 72%, serta overlay yang menjaga teks tetap terbaca. Foto yang sama menjadi latar buram Beranda.
- Font dan latar baru dibatasi kelas Beranda, tanpa mengganti font/latar halaman placeholder lainnya. Logo dipakai pada Navbar bersama. Struktur React, services/mock, komponen reusable, tombol dan route dipertahankan.

### Verifikasi

| Viewport (zoom 100%) | Hasil visual dan ukuran aktual |
| --- | --- |
| 1728 × 1080 | PASS — Navbar 60 px, logo 155 px, hero 899 px; bangunan di kanan dan teks di kiri |
| 1366 × 768 | PASS — Navbar 60 px, logo 155 px, hero 710 px; tipografi dan kartu tetap proporsional |
| 390 × 844 | PASS — Navbar 97 px, logo 125 px, hero 500 px; menu ringkas, fasad terlihat melalui crop mobile, kartu bertumpuk |

- Screenshot viewport dan halaman penuh diperiksa terhadap referensi lokal, tersimpan di `tmp/m11a-qa/` dan tidak di-stage.
- Pemeriksaan browser sementara menggunakan Chrome headless lokal pada server development dan preview hasil build: PASS untuk dimensi viewport, skala 1/zoom 100%, tanpa overflow horizontal atau tumpang tindih Navbar–judul, dua gambar berhasil decode, font benar-benar loaded, serta background lokal terpasang.
- Tidak ditemukan error runtime atau pemuatan aset dalam pemeriksaan browser. Navigasi ke `/profil` dan `/laporan-keuangan` tetap berfungsi; font khusus Beranda tidak bocor ke halaman tersebut.
- `npm run lint`: PASS. `npm test`: PASS (tiga test backend yang sudah ada). `npm run build`: PASS. Tidak menambah suite/dependency untuk perubahan visual ini; skrip QA sementara tidak masuk Git.
- Git status, diff, daftar file, staged diff, whitespace, dan lingkup aset diperiksa. Hanya kode, dokumentasi, foto/logo WebP, font dan lisensinya yang relevan disiapkan. Referensi besar, profil browser, screenshot, skrip sementara, log, `.env`, dan hasil build tetap di luar staging.

### Batasan dan penghentian

Crop, overlay dan pemenggalan teks masih pendekatan dari referensi raster, bukan token Figma; resolusi/fokus asli foto dan efek bayangan logo membatasi ketajaman. Tidak ada desain mobile resmi. Lisensi khusus foto/logo tidak ditemukan pada sumber; penggunaan mengikuti instruksi pengguna untuk proyek ini, tanpa mengklaim izin redistribusi umum. Font berlisensi SIL OFL 1.1. Tidak menambahkan QRIS atau fitur bisnis, tidak mengubah backend/dependency, tidak memanggil Figma MCP, dan tidak menjalankan commit/push/merge/rebase. Pekerjaan berhenti sebelum milestone berikutnya.

Usulan pesan commit: `feat: integrasikan aset masjid dan font lokal pada beranda`.

## M1.2 — Migrasi Agenda dari Blade ke React

Status: implementasi dan verifikasi selesai; menunggu commit manual pengguna. Branch `feature/frontend-publik`, staging kosong saat mulai; `design-references/` tetap untracked. Milestone berhenti pada Agenda.

### Perubahan

- Menambahkan route `/agenda`, `AgendaPage` dan satu `AgendaGroup` reusable. `AgendaSummary` mendukung banner h1 tanpa CTA pada halaman Agenda, sementara versi Beranda tetap h2 dengan CTA.
- Memakai Navbar, Footer, PublicLayout, Button, logo/foto WebP dan Plus Jakarta Sans lokal yang sudah tersedia. CSS halaman Agenda terpisah dari placeholder; struktur dan refinement Beranda dipertahankan.
- Konten tiga kelompok mengikuti Blade pada commit `12e0155f6a5aba59f4776403c711082f27fa2dce` dan referensi final `02-agenda.png`: 5 mingguan, 2 bulanan, 5 tahunan/PHBI. Sumber Blade hanya dibaca, tidak diubah.
- Satu mock agenda dipasok `agendaService` ke `publicContentService`; daftar dan ringkasan Beranda/Agenda tidak lagi menduplikasi angka. Statistik 12/5/5 dihitung dari item. Mendukung loading, error, daftar kosong, kelompok kosong dan AbortSignal.
- Mode API tetap melaporkan integrasi belum tersedia; tidak menambah endpoint/backend. Kebutuhan data jadwal berulang dicatat di API_CONTRACT sebagai kebutuhan UI, bukan kontrak HTTP final.
- Navbar Agenda dan kedua CTA Beranda aktif menuju `/agenda`; kembali melalui logo/Beranda tersedia. Scroll kembali ke atas saat pathname berubah. `/agenda` dan `/agenda/` dapat dibuka langsung.

### Verifikasi

- `npm run lint`: PASS.
- `npm test`: PASS — empat test frontend permanen baru (Node/Vite SSR) dan tiga test HTTP backend yang sudah ada. Pengujian mencakup jumlah/jadwal, kesamaan data Beranda, isolasi salinan, pembatalan, state loading/empty/error dan mode API. Tanpa dependency baru.
- `npm run build`: PASS.
- Browser Chrome headless lokal, server development dan preview build: PASS untuk route langsung, menu aktif, navigasi pulang-pergi melalui kedua CTA, reset scroll, data 5/2/5, font/logo lokal, zoom 100%, tanpa overflow atau error runtime/HTTP selain favicon bawaan.

| Viewport | Hasil visual |
| --- | --- |
| 1728 × 1080 | PASS — banner sekitar 418 px, kartu mingguan 647 px, panjang halaman 2923 px; dibanding raster final 2895 px |
| 1366 × 768 | PASS — iterasi kedua merapatkan banner 386 → 337 px dan baris 80 → 64 px; panjang halaman 2461 px |
| 390 × 844 | PASS — banner 401 px, menu ringkas, nama/jadwal ditumpuk tanpa terpotong; panjang halaman 2582 px |

Dua iterasi screenshot dilakukan, hasil di `tmp/m12-qa/final-*.png`. Regresi Beranda diperiksa pada tiga viewport: geometri identik dengan M1.1a; PNG desktop/laptop identik dengan baseline; mobile ditinjau visual tanpa regresi komposisi. Screenshot dan skrip QA sementara tetap diabaikan Git.

### Batasan dan Git

Belum ada desain mobile resmi atau token Figma terukur. Crop/blur latar, garis pemisah, shadow, dan pemenggalan teks masih pendekatan dari gambar final. Data agenda mengikuti referensi, belum menjadi integrasi produksi. Tidak mengubah backend Express, dependency, aset, atau fitur Profil/Kontak/Laporan/Admin; tidak memanggil Figma MCP.

Git status, diff, daftar file dan staged diff serta whitespace diperiksa. Hanya file implementasi, test dan dokumentasi M1.2 disiapkan; `.env`, credential, screenshot, temporary files, build dan gambar referensi tidak di-stage. Tidak melakukan commit, push, merge atau rebase.

Usulan pesan commit: `feat: tambahkan halaman agenda dengan data dan navigasi bersama`.

## M1.3 — Migrasi Profil Masjid dari Blade ke React

Status: implementasi dan verifikasi selesai; siap ditinjau untuk commit manual. Branch `feature/frontend-publik`; M1.1/M1.1a/M1.2 sudah di-commit dan staging kosong saat mulai. Hanya `design-references/` yang untracked pada awal pemeriksaan.

### Implementasi

- Mengembangkan ProfilePage pada `/profil` yang sudah tersedia: header, dua statistik, visi-misi, sejarah/linimasa, tujuh pengurus dan CTA Hubungi Takmir. Tidak menambah halaman atau komponen kartu duplikat.
- Memakai Navbar, Footer, PublicLayout, Button, VisionMission, foto/logo/font lokal M1.1a. Kartu statistik, peristiwa dan pengurus dirender dari array.
- Mock diperluas di publicContent; publicContentService tetap menjadi penyedia data tanpa API langsung dari JSX. Konstanta bersama mempertahankan kesamaan 265 m², 290 Jamaah, tahun 1980 dan visi/misi dengan Beranda. Teks/value Beranda tidak berubah.
- Sumber Blade diperiksa pada commit `12e0155f6a5aba59f4776403c711082f27fa2dce`, tanpa mengubah repository sumber. Periode pengurus dipilih **2023–2025** dari desain final, bukan 2023–2026 pada Blade. Tujuh nama/jabatan diambil dari sumber, tanpa mengarang kontak/foto pengurus.
- Kelas PublicLayout memisahkan Profil dari placeholder. CSS profile-* menjaga proporsi, latar, linimasa bergantian dan susunan pengurus 4+3 desktop; mobile menumpuk statistik/linimasa dan memakai dua kolom kartu.
- CTA Profil menuju `/kontak` sesuai instruksi. Route tersebut sementara tetap 404 sampai M1.4; tidak mengimplementasikan Kontak. Menu Profil, CTA Beranda, kembali Beranda/Agenda dan reset scroll tetap berfungsi.

### Verifikasi

- `npm run lint`: PASS.
- `npm test`: PASS — delapan test frontend (empat test Profil baru dan empat Agenda), serta tiga test HTTP backend. Cakupan Profil: tujuh nama/periode final, linimasa 1980/2000, satu h1, CTA Kontak, konsistensi statistik/visi-misi, isolasi salinan mock, loading/error/empty, bagian belum tersedia, AbortSignal dan mode API.
- `npm run build`: PASS.
- Chrome headless lokal pada development dan preview hasil build: PASS untuk route langsung `/profil` dan `/profil/`, menu aktif, CTA, navigasi Beranda/Agenda, font/logo lokal, jumlah/statistik/linimasa, zoom 100%, tanpa horizontal overflow atau error runtime/HTTP selain favicon bawaan.

| Viewport | Hasil QA visual |
| --- | --- |
| 1728 × 1080 | PASS — Navbar 60 px; dua statistik 323 px; tujuh kartu 4+3; panjang halaman 3741 px |
| 1366 × 768 | PASS — ukuran menyesuaikan tanpa memperbesar elemen bersama; panjang halaman 3392 px |
| 390 × 844 | PASS — Navbar 97 px; statistik dan sejarah bertumpuk; pengurus 2+2+2+1; panjang halaman 3800 px |

Iterasi pertama dibandingkan dengan `03-profil.png`; iterasi berikutnya merapatkan teks/kartu sejarah dan menyesuaikan foto buram dengan transisi transparan agar tidak membentuk batas latar keras. Screenshot final di `tmp/m13-qa/final-*.png`, diabaikan Git. Regresi Beranda/Agenda pada tiga viewport: geometri identik dengan M1.2; PNG Beranda identik semua ukuran, Agenda identik desktop/laptop dan mobile ditinjau visual tanpa perubahan komposisi.

### Batasan dan Git

Crop/blur latar, shadow dan pemenggalan teks masih pendekatan raster, bukan hasil pembacaan token Figma. Belum ada frame mobile resmi. Periode/nama pengurus mengikuti referensi, bukan verifikasi pengurus terkini. Kontak tetap belum diimplementasikan; CTA sementara menuju 404 pada `/kontak`.

README, peta desain dan kebutuhan data mock diperbarui. Git status, diff, daftar file dan staged diff serta whitespace diperiksa. Hanya kode, test dan dokumentasi M1.3 disiapkan; tidak memasukkan gambar referensi, screenshot, temporary files, credential, `.env` atau hasil build. Tidak mengubah backend, dependency atau aset; tidak memanggil Figma MCP dan tidak menjalankan commit/push/merge/rebase. Pekerjaan berhenti sebelum M1.4.

Usulan pesan commit: `feat: implementasikan profil masjid dengan data bersama dan linimasa`.

## M1.4 — Kontak dan Donasi

Status: implementasi selesai dan tervalidasi; siap ditinjau serta di-commit manual oleh pengguna. Branch `feature/frontend-publik`; staging kosong pada awal pekerjaan, hanya `design-references/` untracked. M1.1–M1.3 dipertahankan; pekerjaan berhenti sebelum M1.5.

### Implementasi

- Menambahkan `ContactPage` dan route `/kontak` dengan header, Donasi QRIS/rekening, tiga informasi takmir, panel lokasi, serta Footer bersama. `DonationSection` membantu keterbacaan tanpa membuat komponen untuk tiap kartu kecil.
- Navbar, PublicLayout, Button, Footer, foto/logo dan Plus Jakarta Sans lokal digunakan kembali. Kontak pada Navbar aktif sesuai route; CTA Hubungi Takmir dari Profil kini membuka Kontak. Beranda/Agenda/Profil tetap berfungsi.
- Memperluas mock yang disalurkan `publicContentService`; tidak mengimpor mock dari JSX. Loading/error/empty serta data belum dikonfirmasi ditangani. Mode API tetap memberi error integrasi belum tersedia, tanpa endpoint karangan.
- Sumber Blade dibaca pada commit `12e0155f6a5aba59f4776403c711082f27fa2dce`; final `04-kontak.png` menjadi acuan komposisi. CSS dibatasi halaman Kontak; tidak mengimpor CSS Laravel atau mengubah backend/dependency.

### Data dan aset yang menunggu konfirmasi

Kedua aset `qris-donasi.png`/`.jpg` sudah diperiksa: keduanya JPEG 1024 × 1024 dengan hash identik. Materi berlabel nama masjid, tetapi belum membuktikan validitas transaksi, kepemilikan atau izin publikasi. Tidak disalin ke aplikasi atau staging. Jika nanti dikonfirmasi, ekstensi yang benar `.jpg`; sumber dan hash dicatat pada DESIGN_MAP.

Rekening/nama penerima, QRIS, telepon, jam layanan, alamat kontak dan tujuan peta belum dikonfirmasi pengurus. UI menampilkan “Data belum dikonfirmasi”; nilai/note kontak serta data donasi yang belum terverifikasi tidak dipublikasikan. Tidak menyimpan nomor rekening/telepon contoh ke mock. Tombol Google Maps nonaktif; tidak ada iframe, koordinat/tautan karangan, WhatsApp, salin rekening, unduhan QRIS, atau pemrosesan pembayaran. Footer mempertahankan alamat mock referensi dari milestone sebelumnya. Konfirmasi data resmi, lokasi dan izin aset menjadi tindak lanjut sebelum publikasi produksi.

### Verifikasi

- `npm run lint`: PASS, frontend dan pemeriksaan sintaks backend.
- `npm test`: PASS — 12 test frontend dan 3 test HTTP backend. Empat test Kontak baru mencakup route/menu aktif, komposisi, placeholder aman, penolakan nilai QRIS/rekening/kontak/note belum dikonfirmasi, isolasi data, loading/error/empty, pembatalan dan mode API.
- `npm run build`: PASS.
- Chrome headless lokal terpisah, development dan preview hasil build: route langsung `/kontak` serta `/kontak/`, navigasi empat halaman, menu aktif, CTA Profil–Kontak, reset scroll, font/logo dan pemuatan aset: PASS. Tidak ada error runtime/HTTP aplikasi selain favicon bawaan yang belum tersedia.

| Viewport | QA visual setelah iterasi |
| --- | --- |
| 1728 × 1080 | PASS — zoom 100%, Navbar 60 px, panel Donasi dua kolom mulai sekitar 516 px, peta 783 px, tinggi halaman 3105 px, tanpa overflow |
| 1366 × 768 | PASS — zoom 100%, Navbar 60 px, kartu dan judul menyesuaikan, peta 619 px, tinggi halaman 2670 px, tanpa overflow |
| 390 × 844 | PASS — zoom 100%, Navbar 97 px, Donasi bertumpuk, informasi terbaca, peta 350 px, tinggi halaman 2454 px, tanpa overflow |

Screenshot viewport/halaman penuh dibandingkan dengan referensi lokal. Iterasi kedua merapatkan jarak heading/Donasi serta memperbaiki posisi foto buram agar tidak mengikuti crop seluruh panjang halaman. Hasil final di `tmp/m14-qa/final-*.png`, tidak di-stage. Regresi tiga halaman sebelumnya: geometri identik pada semua viewport; PNG Beranda dan Profil identik seluruh ukuran, Agenda identik desktop/laptop dan mobile ditinjau visual tanpa perubahan komposisi.

### Batasan dan Git

Placeholder serta panel peta kosong berlabel sengaja menggantikan data/lokasi yang belum disetujui. Crop/blur foto, detail warna, shadow dan pemenggalan teks masih pendekatan raster; belum identik piksel. Navbar/Footer mempertahankan refinement bersama, dan belum tersedia frame mobile resmi.

README, DESIGN_MAP dan kebutuhan mock pada API_CONTRACT diperbarui. Git status, diff, daftar file, whitespace serta staged diff diperiksa. Hanya kode/test/dokumentasi M1.4 disiapkan; tidak menyertakan referensi desain, gambar QRIS sumber, screenshot QA, temporary files, `.env`, credential atau build. Tidak memanggil Figma MCP dan tidak melakukan commit, push, merge, rebase atau pekerjaan M1.5.

Usulan pesan commit: `feat: migrasikan kontak dan donasi dengan placeholder data belum dikonfirmasi`.

## M1.5a — Gate sandi bersama laporan keuangan

Status: implementasi selesai dan tervalidasi; siap ditinjau serta di-commit manual. Branch `feature/frontend-publik`; staging kosong pada awal pekerjaan, hanya `design-references/` untracked. Berhenti sebelum M1.5b dan M1.6.

### Implementasi

- Route `/laporan-keuangan` tetap memakai FinancialReportPage, dipisahkan dari PublicLayout sehingga gate dan placeholder laporan tidak memiliki Navbar/Footer publik. CTA transparansi Beranda dan tautan Footer seluruh halaman tetap menuju route yang sama.
- `ReportAccessPanel` mengikuti panel `07-token.png`: hijau/lime/putih, perisai, badge, judul, deskripsi, input password dan tombol submit. CSS terisolasi `report-*`, memakai font lokal sebelumnya. Keterangan bawah menjadi “Akses menggunakan sandi bersama”, tanpa klaim enkripsi.
- React state mengontrol input, loading, error dan akses berhasil. Ref mencegah submit ganda; Enter memakai form native. Sandi kosong/salah dan kegagalan service memiliki pesan jelas. Sandi benar membersihkan input lalu menampilkan placeholder lama, dengan fokus pada heading dan tautan kembali Beranda.
- `reportService.checkReportPassword()` memakai mock `demo123` khusus pengembangan, dengan jeda 300 ms, pencocokan persis dan AbortSignal. Mock diakses melalui service saja. Mode API menolak dengan error integrasi belum tersedia, tanpa permintaan HTTP atau validasi memakai sandi demo.
- Refresh maupun keluar–masuk route mengembalikan gate. Aplikasi tidak menyimpan sandi/status di URL, localStorage, sessionStorage atau cookie. Tidak membawa session/autentikasi Laravel, JWT, hashing, masa kedaluwarsa atau manajemen token.

### Verifikasi

- `npm run lint`: PASS, tanpa peringatan.
- Seluruh test dengan konfigurasi Chrome QA: PASS — 29 hasil test frontend (18 unit/struktur, 10 skenario browser dan satu induk suite), serta 3 test HTTP backend. Tidak ada test dilewati pada pemeriksaan ini. Tanpa konfigurasi browser, `npm test` tetap menjalankan 18 test frontend dan menandai satu suite browser sebagai dilewati; cara mengaktifkan tercantum pada README.
- Skenario browser permanen: gate langsung, input kosong, sandi salah dan loading, submit ganda, sandi benar melalui Enter, URL/storage/cookie, refresh, error mode API, CTA/Footer seluruh halaman dan keluar–masuk route. Suite juga dijalankan terhadap preview hasil build: PASS.
- `npm run build`: PASS. Tidak mengubah backend, dependency atau konfigurasi environment lokal.

| Viewport | Hasil QA Chrome development dan preview build, zoom 100% |
| --- | --- |
| 1728 × 1080 | PASS — panel 1640 × 584 px, judul satu baris, input 60 px, tombol 54 px |
| 1366 × 768 | PASS — panel 1282 × 571 px, judul satu baris, input 60 px, tombol 54 px |
| 390 × 844 | PASS — panel 358 × 544 px, judul dua baris, input 54 px, tombol 50 px |

Kondisi awal/loading/error diperiksa tanpa overflow horizontal, error runtime atau gagal memuat aset aplikasi; favicon bawaan yang belum tersedia dikecualikan. Font lokal termuat; tidak ada Navbar/Footer pada gate. Iterasi pertama panel desktop 627 px; iterasi kedua merapatkan ruang bawah, teks dan form menjadi 584 px. Screenshot awal/final/error di `tmp/m15a-qa/`, diabaikan Git.

Regresi Beranda/Agenda/Profil/Kontak: geometri identik pada tiga viewport dibanding baseline M1.4. Sembilan dari 12 PNG identik; Beranda mobile, Profil desktop dan Kontak laptop yang berbeda ditinjau visual tanpa perubahan komposisi.

### Batasan dan Git

Gate ini hanya pembatas antarmuka. Endpoint laporan tanpa autentikasi tetap dapat diakses langsung; hasil valid bukan token atau otorisasi API. Integrasi Express kelak cukup POST pengecekan sandi dan environment variable backend biasa, tanpa menyimpan sandi produksi pada frontend. Kedua endpoint yang dicatat pada API_CONTRACT masih usulan; tidak ada endpoint baru yang dibuat.

Halo/shadow, ikon dan pemenggalan teks belum identik piksel dengan raster. Frame referensi berupa panel, bukan keseluruhan halaman, dan belum ada desain mobile resmi. Laporan setelah akses tetap placeholder; tidak membangun tabel/filter, transaksi, pemilihan format atau ekspor.

README, DESIGN_MAP dan API_CONTRACT diperbarui. Status, daftar file, diff, whitespace, file sensitif serta staged diff diperiksa. Hanya kode/test/dokumentasi M1.5a disiapkan; tidak ada screenshot QA, temporary files, referensi desain, `.env`, credential produksi atau build di staging. Tidak memanggil Figma MCP dan tidak menjalankan commit, push, merge, rebase atau perubahan backend.

Usulan pesan commit: `feat: tambahkan gate sandi bersama untuk akses laporan keuangan`.

## M1.5b — Laporan keuangan publik

Status: implementasi selesai dan tervalidasi; siap ditinjau serta di-commit manual. Branch `feature/frontend-publik`; awal pekerjaan bersih selain `design-references/` untracked. Tidak melanjutkan M1.6.

### Implementasi

- FinancialReportPage mengganti placeholder setelah gate dengan laporan putih: header masjid/tahun, Beranda, periode/rentang tanggal, dua tabel, jumlah/subtotal transaksi, dan resume saldo kategori/total. ReportAccessPanel, sandi demo, state akses dan route tetap dipertahankan; tidak ada Navbar/Footer publik pada laporan.
- FinancialTable digunakan dua kali, BalanceSummary menampilkan rekapitulasi. Mock dinamis hanya diakses melalui reportService.getReport; utilitas kalkulasi dipisahkan dari format tampilan. Tidak ada filter kategori/sorting tambahan, komponen tiap baris, dependency baru atau perubahan backend.
- Laporan diberi keterangan jelas sebagai data contoh pengembangan, bukan laporan produksi. Tombol Unduh terlihat tetapi nonaktif dengan status, tanpa state/route pemilihan format atau ekspor.
- Filter tanggal inklusif dan draft berlaku setelah Terapkan; tanggal kosong/tidak valid/terbalik ditolak. Saldo awal kustom berasal dari saldo awal April ditambah mutasi sebelumnya. Preset memakai akhir April, bukan tanggal komputer. Bulan/rentang di luar cakupan menampilkan data belum tersedia/lengkap, bukan nol. Loading, hari tanpa transaksi, error tanggal dan error integrasi API ditangani.

### Audit dan rekonsiliasi

Transaksi Blade pada commit `12e0155f6a5aba59f4776403c711082f27fa2dce` diparsing menjadi 50 baris dengan ID stabil, tanggal ISO, jenis, uraian, kategori dan integer Rupiah. Penjumlahan aktual cocok dengan audit; sumber tidak diubah.

| Kategori | Saldo awal | Pemasukan | Pengeluaran | Saldo akhir |
| --- | ---: | ---: | ---: | ---: |
| Kas Masjid | 15.256.700 | 8.657.500 | 5.791.500 | 18.122.700 |
| Pembangunan & Pemeliharaan | 1.335.000 | 685.000 | 300.000 | 1.720.000 |
| Jum’at Berkah | 1.999.000 | 1.323.000 | 2.680.000 | 642.000 |
| TOTAL | 18.590.700 | 10.665.500 | 8.771.500 | 20.484.700 |

Terdapat 17 pemasukan dan 33 pengeluaran. Angka 6.791.500 pada resume Kas Masjid di Blade salah; penjumlahan transaksi dan desain final menunjukkan 5.791.500. Ringkasan dihitung ulang, tidak menyalin angka salah. Beli Sapu mengikuti tanggal 26 April pada desain, sementara Blade menuliskan 25 April; nominal 22.000 tidak diubah. Uraian yang sudah disingkat di sumber dipertahankan.

Rentang 3–5 April menghasilkan 9 transaksi, saldo awal 15.445.700 dan saldo akhir 16.602.700. Rentang 24–30 April menghasilkan 14 transaksi, saldo awal 15.195.700, pemasukan 5.979.000, pengeluaran 690.000 dan saldo akhir 20.484.700. Pada 4 April tidak ada transaksi; saldo terbawa 16.815.700. Ketiganya diverifikasi otomatis; mutasi mock tidak terjadi.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan.
- Seluruh test dengan konfigurasi Chrome QA: PASS — 43 hasil frontend (26 unit/struktur, 16 skenario browser dan satu induk suite) serta 3 test backend; tidak ada test dilewati. Delapan test laporan baru mencakup audit/kategori, batas tanggal, saldo awal khusus, validasi, periode tidak lengkap, hari kosong, konsistensi komponen, isolasi data, pembatalan dan error API. Suite browser gate diperluas untuk laporan/filter tanpa mengubah mekanisme gate.
- `npm run build`: PASS. Suite interaksi juga dijalankan terhadap preview hasil build: PASS.
- Browser memastikan sandi benar/salah, Enter, submit ganda, loading, refresh, tidak ada penyimpanan akses, navigasi CTA/Footer/Beranda, perubahan draft/Terapkan, tanggal terbalik, saldo hari kosong, preset dan bulan tanpa data.

| Viewport | QA visual Chrome development dan preview build pada zoom 100% |
| --- | --- |
| 1728 × 1080 | PASS — kontainer 1528 px, dua tabel, baris sekitar 70,5 px, panjang 3239 px dibanding raster 3225 px |
| 1366 × 768 | PASS — kontainer 1209 px, preset satu baris, baris 64 px, panjang 2952 px |
| 390 × 844 | PASS — kontainer 358 px, pemasukan lalu pengeluaran, baris 78 px, panjang 5104 px; resume bergeser lokal |

Screenshot dibandingkan dengan 05-laporan.png dan diperbaiki secara iteratif: merapatkan resume, memperbaiki padding mobile, posisi preset laptop dan kepadatan baris. Loading/empty/error/periode tidak lengkap, subtotal, saldo, font lokal dan header tanpa tabrakan diperiksa pada tiga viewport. Tidak ada overflow halaman atau error runtime/aset aplikasi selain favicon bawaan. Screenshot viewport/panjang penuh/resume/error tersimpan di `tmp/m15b-qa/`, diabaikan Git.

Regresi empat halaman publik dan gate: geometri identik dengan baseline M1.5a pada seluruh viewport; 13 dari 15 PNG identik. Beranda mobile dan Profil desktop yang berbeda ditinjau visual tanpa perubahan komposisi. Kode ReportAccessPanel dan badan fungsi checkReportPassword tetap sama.

### Batasan dan Git

Input tanggal memakai format/kontrol native browser; pemenggalan teks, ellipsis kategori dan detail font/border belum identik piksel. Belum ada desain mobile resmi. Penanda mock/status unduhan merupakan keterangan yang diperlukan. Gate tetap hanya pembatas antarmuka dan tidak melindungi endpoint laporan publik. GET laporan/POST sandi masih usulan, tidak dibuat pada Express; cakupan mock hanya April.

README, DESIGN_MAP dan API_CONTRACT diperbarui. Status, diff, daftar file, whitespace dan staged diff diperiksa; hanya file kode/test/dokumentasi M1.5b disiapkan. Tidak menyertakan referensi, screenshot QA, temporary files, `.env`, credential, dependency atau build. Tidak memanggil Figma MCP; tidak melakukan commit, push, merge, rebase, perubahan backend atau pekerjaan M1.6.

Usulan pesan commit: `feat: implementasikan laporan keuangan publik dan filter periode`.


## M1.6a — Pilihan format dan pratinjau laporan

Status: implementasi selesai dan tervalidasi pada branch `feature/frontend-publik`; siap ditinjau dan di-commit manual. Awal pekerjaan bersih selain `design-references/` untracked. Hanya M1.6a; tidak membuat ekspor M1.6b.

### Implementasi dan konsistensi data

- Tombol Unduh laporan membuka ReportFormatPicker: PDF/PNG dengan status aktif, periode terfilter, jumlah transaksi dan lembar aktual, kembali serta lanjut pratinjau. Semua tetap state pada `/laporan-keuangan`; gate M1.5a dan filter M1.5b dipertahankan.
- ReportExportLayout menyatukan header/tahapan. ReportPreview menggunakan ReportSheet yang sama untuk kedua format: A4 lanskap, pemasukan kiri, pengeluaran kanan, ringkasan BalanceSummary pada lembar terakhir dan footer berlabel contoh pengembangan. FinancialTable tetap digunakan pada laporan utama.
- getReport, mock dan kalkulasi M1.5b tidak diubah. Formatters bersama diperluas untuk rentang singkat/tahun. Tidak ada sumber transaksi pratinjau atau penghitungan uang terpisah. Total tetap: saldo awal Rp18.590.700, pemasukan Rp10.665.500, pengeluaran Rp8.771.500, saldo akhir Rp20.484.700.
- reportPagination menghitung ruang baris dari geometri lembar dan ruang ringkasan, lalu membagi seluruh transaksi tanpa memotong baris atau memutasi sumber. Untuk April hasilnya dua lembar: 17 pemasukan/21 pengeluaran, lalu 12 pengeluaran dan resume. Jumlah halaman berubah menurut jumlah data; tidak mengambil hardcoded dua lembar/slice indeks tetap dari Blade.
- Kembali dari pratinjau mempertahankan format; kembali ke laporan mempertahankan rentang, draft dan preset. Header Beranda tetap menuju `/`; refresh pratinjau mengembalikan gate/input kosong tanpa URL akses, localStorage, sessionStorage atau cookie.
- Rentang unavailable tidak dapat membuka pilihan format/pratinjau valid. Hari kosong di dalam cakupan tetap menampilkan saldo terbawa. Unduh pratinjau nonaktif dengan keterangan ekspor belum tersedia; nama berkas hanya rencana. Tidak membuat file nyata, library ekspor, toast keberhasilan semu atau endpoint baru.

### Pengujian

- `npm run lint`: PASS, frontend dan pemeriksaan sintaks backend.
- Seluruh test dengan Chrome QA: PASS — 55 hasil frontend (32 unit/struktur, 22 skenario browser dan satu induk suite) serta 3 test backend; tidak ada test dilewati.
- Enam test unit/SSR baru mencakup kapasitas A4, nol/batas/banyak transaksi, seluruh ID tepat sekali/berurutan, mutasi sumber, kesamaan lembar PDF/PNG, total keuangan, periode kustom/kosong/tidak lengkap dan status radio/jumlah lembar.
- Enam skenario browser baru mencakup membuka pemilih, PDF/PNG/status aktif, lanjut, kesamaan isi, kembali dengan format tetap, serta filter 3–5 April sepanjang alur. Sembilan transaksi, saldo awal Rp15.445.700 dan saldo akhir Rp16.602.700 tetap konsisten. Refresh, storage, error API, loading, gate dan navigasi publik tetap diuji.
- `npm run build`: PASS. Seluruh 22 skenario browser juga PASS pada preview hasil build. Pemeriksaan tambahan ketiga viewport memastikan semua baris berada di dalam lembar, ringkasan tidak bertabrakan dengan footer, rasio A4, font termuat, dua tombol unduh nonaktif, PDF/PNG identik, serta mobile dapat scroll lokal dan menyesuaikan lebar.

### Visual QA

Chrome headless lokal terpisah, development dan preview build, browser zoom 100%. Referensi: 06-format-unduhan.png, 08-preview-pdf.png dan 09-preview-png.png. Dilakukan iterasi setelah screenshot: merapatkan header/spacing, menyelaraskan tinggi pilihan format, mengoreksi tinggi header lembar, dan meningkatkan skala baca lembar mobile. Tidak memakai screenshot sebagai isi aplikasi.

| Viewport | Hasil QA |
| --- | --- |
| 1728 × 1080 | PASS — kontainer 1528 px; dua kartu sejajar; lembar sekitar 1486 × 1051 px. Tinggi pilihan format 1201 px, pratinjau 3081 px, dibanding raster 1200/3056 px |
| 1366 × 768 | PASS — kontainer 1209 px; kartu sejajar; lembar sekitar 1167 × 825 px. Tinggi pilihan format 1083 px dan pratinjau 2611 px |
| 390 × 844 | PASS — kontainer 358 px; kartu/kontrol ditumpuk, lembar tetap landscape dengan scroll lokal, skala baca 1,25 dan opsi Lebar halaman. Tinggi pilihan format 1284 px dan pratinjau 3321 px |

Tidak ada overflow horizontal halaman, baris terpotong, ringkasan keluar lembar, atau error runtime/aset aplikasi selain favicon bawaan. Screenshot viewport/panjang penuh/lembar/resume dan metrik ada di `tmp/m16a-qa/`, diabaikan Git. Geometri empat halaman publik dan gate identik dengan baseline M1.5b pada semua viewport; 12 dari 15 PNG identik, tiga halaman desktop lainnya ditinjau visual tanpa perubahan komposisi. Laporan utama tetap setinggi 3239/2952/5104 px.

### Batasan, dokumentasi dan Git

Belum identik piksel dengan raster: penanda data mock/status ekspor diperlukan, detail tipografi, border, pemenggalan teks dan ellipsis masih pendekatan. Uraian panjang mengikuti pemotongan visual referensi dan tetap tersedia pada title; tidak mengarang kelanjutan uraian sumber. Belum ada desain mobile resmi. Gate tetap pembatas antarmuka dan bukan perlindungan endpoint; cakupan mock hanya April 2026.

README dan DESIGN_MAP diperbarui termasuk pendekatan M1.6b: gunakan ReportSheet/pagination/data yang sama, tanpa transform pratinjau, tunggu font dan render tiap lembar sebagai PNG atau rangkai sebagai PDF A4. Pemilihan adaptor/library serta validasi berkas dikerjakan pada M1.6b. API_CONTRACT hanya memperjelas status pratinjau/tombol; tidak mengubah payload, service atau endpoint.

Status, daftar file, diff, whitespace, file sensitif dan staged diff diperiksa. Hanya perubahan kode/test/dokumentasi M1.6a yang disiapkan; tidak menyertakan referensi, screenshot QA, temporary files, `.env`, credential, dependency atau build. Tidak mengubah backend, gate, transaksi atau perhitungan keuangan. Tidak menggunakan Figma MCP atau menjalankan commit, push, merge maupun rebase. Pekerjaan berhenti pada M1.6a.

Usulan pesan commit: `feat: tambahkan pilihan format dan pratinjau laporan A4`.


## M1.6b — Ekspor PDF dan PNG nyata

Status: implementasi selesai dan tervalidasi pada `feature/frontend-publik`; siap ditinjau dan di-commit manual. Awal pekerjaan bersih selain design-references/ yang untracked. Pekerjaan berhenti pada M1.6b.

### Implementasi

- Menambah html-to-image 1.11.13, jsPDF 4.2.1 dan JSZip 3.10.2 hanya pada workspace frontend, dengan versi pasti dan pembaruan lockfile. Dokumentasi resmi/version compatibility diperiksa sebelum instalasi. Library dimuat dinamis; JSZip digunakan hanya untuk beberapa PNG. Paket lama tidak berubah versi, manifest backend tetap sama. Audit npm melaporkan 0 kerentanan; pemberitahuan skrip instalasi opsional core-js/fsevents tidak mengubah izin skrip proyek.
- reportExportService menerima report, pages dan node ReportSheet yang sama dengan pratinjau; tidak mengimpor mock, mengambil data baru, membagi ulang halaman atau menghitung saldo kedua. Kelengkapan data, kesamaan field transaksi dan ID/urutan node diperiksa sebelum ekspor. Periode tidak lengkap ditolak.
- Font lokal ditunggu dan disematkan; gambar pada lembar ditunggu. Render ukuran A4 tetap dengan pixelRatio 2 mengabaikan transform/scroll pratinjau. PNG 2245 × 1587 px, termasuk pada mobile. Kanvas kosong atau resolusi kurang ditolak; kanvas dilepas per lembar.
- PDF A4 landscape memakai satu PNG per halaman sesuai urutan, tanpa distorsi atau halaman kosong tambahan. PNG satu halaman menjadi berkas langsung; PNG jamak menjadi ZIP dengan nama halaman berurutan. Nama berkas bulanan dan rentang kustom jelas. Penanda data contoh tetap terlihat pada pratinjau dan hasil ekspor.
- ReportPreview mengaktifkan kedua tombol unduh, memberi status proses/error, serta menahan ekspor ganda melalui ref dan tombol nonaktif. Format/kembali dikunci saat ekspor; navigasi keluar membatalkan pengiriman hasil. Pesan selesai baru muncul setelah Blob dibuat dan unduhan dipicu. URL Blob dibersihkan; tidak ada upload, endpoint atau perubahan backend.

### Konsistensi dan berkas nyata

Data April tidak berubah: 17 pemasukan, 33 pengeluaran, saldo awal Rp18.590.700, pemasukan Rp10.665.500, pengeluaran Rp8.771.500 dan saldo akhir Rp20.484.700. Dua lembar tetap memuat 17/21 lalu 0/12 baris dengan resume pada akhir. Seluruh ID muncul tepat sekali. Rentang 3–5 April memuat 9 transaksi dan satu lembar, saldo awal Rp15.445.700 dan saldo akhir Rp16.602.700; filter dipertahankan setelah unduhan/kembali.

| Skenario | Hasil pemeriksaan berkas |
| --- | --- |
| April 2026 | PDF 2 halaman A4 (792.460 byte), ZIP berisi 2 PNG asli (1.012.190 byte), setiap PNG 2245 × 1587 |
| 3–5 April | PDF 1 halaman (255.125 byte), PNG langsung (349.581 byte), 2245 × 1587 |
| Lebih dari dua lembar | Fixture QA terpisah: 60 transaksi/3 lembar, PDF 3 halaman dan ZIP 3 PNG; seluruh ID/urutan utuh dan resume hanya terakhir |

Fixture tambahan hanya dibuat dalam browser QA dari salinan data untuk menguji kapasitas; tidak mengubah mock aplikasi atau menambahkan data produksi. Development menghasilkan 14 berkas uji dengan 12 halaman PDF serta 12 gambar PNG. Preview build menghasilkan 12 berkas tambahan dengan 9 halaman/gambar. Seluruh PDF dibuka dengan pembaca PDF, ukuran/jumlah halaman diperiksa dan halaman pertama/terakhir dirender. ZIP diperiksa CRC, nama, jumlah dan semua gambarnya didekode; format PNG asli, ukuran konsisten dan tidak kosong. Gambar yang benar-benar dipasang pada setiap halaman PDF identik piksel dengan PNG pasangannya, lintas viewport dan development/build. Halaman tengah fixture juga ditinjau visual. PDF tidak mengandung teks yang dapat diseleksi, sesuai pendekatan raster.

### Pengujian dan visual QA

- `npm run lint`: PASS, frontend dan pemeriksaan sintaks backend.
- Seluruh test dengan Chrome QA: PASS, 62 hasil frontend (35 unit/struktur, 26 skenario browser serta satu induk) dan 3 test backend, tanpa dilewati. Tiga test unit baru memeriksa nama/format, penolakan data/lembar tidak konsisten dan pembatalan. Empat skenario browser baru menerima PDF/ZIP nyata, mencegah unduh ganda, menolak render kosong dan menangani pemicu unduhan gagal. Test rentang khusus juga menerima PDF serta PNG tunggal nyata. Gate, refresh/storage, loading/error, filter, total dan navigasi sebelumnya tetap diuji.
- `npm run build`: PASS. Seluruh 26 skenario browser kembali PASS pada preview build. Dependency ekspor terpisah dari entry aplikasi; chunk opsional jsPDF tidak dipakai oleh alur PNG/browser render ini.
- Browser development/preview build, zoom 100%: PASS pada 1728 × 1080, 1366 × 768 dan 390 × 844. Setiap viewport mengunduh PDF, ZIP April, serta PDF/PNG rentang khusus. Tidak ada horizontal overflow halaman, nominal/teks sumber terpotong tambahan, baris terbelah, tabrakan footer/resume atau error runtime/aset aplikasi selain favicon bawaan. Tombol, informasi ZIP, status dan layout mengikuti struktur M1.6a. Ukuran keluaran tetap sama ketika mobile memakai skala baca maupun Lebar halaman.
- Regresi empat halaman publik dan gate: geometri identik dengan baseline M1.6a pada semua viewport; 12 dari 15 PNG identik. Agenda/Profil/Kontak desktop yang berbeda tipis ditinjau visual tanpa perubahan komposisi. Kalkulasi, mock, ReportSheet, reportPagination dan mekanisme gate tidak diubah.

Screenshot, log, metrik, berkas PDF/PNG/ZIP dan alat inspeksi hanya berada di tmp/m16b-qa/ atau tmp/report-export-tests/, diabaikan Git. Inspeksi memakai PyMuPDF/Pillow pada lingkungan QA sementara; bukan dependency aplikasi.

### Batasan dan Git

PDF berbasis gambar belum mendukung seleksi/cari teks; resolusi 2× sekitar 192 dpi. Uraian yang sudah disingkat pada sumber tidak dikarang kepanjangannya. Frame mobile resmi belum tersedia; QA mobile memakai viewport Chrome, belum perangkat fisik atau Safari/Firefox. Berkas panjang memerlukan lebih banyak waktu/memori. Pemicu unduhan browser tidak dapat mengonfirmasi pilihan simpan/batal pada sistem operasi; status UI membatasi klaimnya pada berkas dibuat dan unduhan dimulai.

README, DESIGN_MAP dan PROGRESS diperbarui; API_CONTRACT hanya memperjelas status ekspor frontend tanpa perubahan payload/endpoint. Status, daftar file, diff, whitespace, dependency, file sensitif dan staged diff diperiksa. Hanya kode/test/dokumentasi serta manifest/lockfile M1.6b disiapkan. Tidak menyertakan artefak QA, referensi desain, build, environment atau kredensial. Tidak mengubah backend, menggunakan Figma MCP, menjalankan commit/push/merge/rebase atau mengerjakan M1.7.

Usulan pesan commit: `feat: aktifkan ekspor PDF dan PNG laporan keuangan`.


## M1.7 — Final QA dan handoff frontend publik (7 November 2026)

Status: audit frontend publik selesai untuk baseline Chrome/mode mock, siap ditinjau dan di-commit manual. Branch feature/frontend-publik; awal kerja bersih selain design-references/ untracked. Tidak melakukan merge atau integrasi bisnis Express.

### Audit sembilan tampilan

| Tampilan | Hasil audit |
| --- | --- |
| Beranda | Hero/aset/logo/font, statistik, visi-misi, agenda, kartu kemakmuran dan CTA lengkap; refinement M1.1 dipertahankan. Klaim realtime diganti teks netral |
| Agenda | Kelompok 5/2/5 dan 12 kegiatan, ringkasan satu sumber dengan Beranda, Navbar/Footer dan menu aktif konsisten |
| Profil | Statistik/visi bersama, sejarah 1980/2000, tujuh pengurus dan CTA Kontak; periode/konten referensi belum diverifikasi sebagai produksi |
| Kontak/Donasi | Komposisi QRIS/rekening, kontak/jam layanan dan lokasi tersedia sebagai placeholder yang jelas. Tidak ada pembayaran/tautan fiktif |
| Gate sandi | Halaman khusus tanpa Navbar/Footer, input password, error/loading/Enter dan pencegahan submit ganda; sandi bersama tetap hanya gate antarmuka |
| Laporan | 17/33 transaksi, filter/periode, subtotal/resume konsisten. Perbaikan clipping subtotal pada 360/768 px; tidak mengubah angka atau kalkulasi |
| Pilihan format | PDF/PNG, periode/jumlah lembar aktual, pilihan aktif dan kembali mempertahankan filter |
| Pratinjau PDF | A4 landscape, seluruh ID tepat sekali, resume terakhir, ekspor PDF sesuai lembar |
| Pratinjau PNG | Isi sama dengan PDF; satu PNG langsung atau beberapa PNG dalam ZIP. Petunjuk scroll mengikuti mode baca |

Sembilan pasangan raster/render desktop ditinjau visual; 54 screenshot/geometri dicatat per lingkungan. Crop/blur foto, wrapping, spacing dan panjang Beranda/Profil tetap pendekatan dari raster sesuai refinement sebelumnya; tidak diklaim identik piksel. Placeholder Kontak, teks netral gate, penanda contoh dan informasi ZIP mengikuti keputusan pengguna. Tidak melakukan redesign atau mengembalikan skala komponen yang terlalu besar.

### Temuan dan perbaikan

1. Nominal header kartu laporan terpotong pada 360/768 px meski dokumen tidak overflow. Mobile kini membungkus subtotal jika ruang kurang; tablet 768–1023 menumpuk tabel dan memberi ruang penuh pada kontrol. Desktop ≥1024 tetap dua kolom. Screenshot dan test batas nominal terhadap kartu memastikan angka utuh.
2. Petunjuk menggeser lembar tetap muncul ketika Lebar halaman aktif; kondisi render disesuaikan tanpa mengubah lembar cetak.
3. Browser meminta favicon.ico yang tidak tersedia. HTML kini menunjuk logo WebP asli yang sudah ada; tidak membuat aset/dependency baru.
4. CTA Beranda menyebut realtime padahal data snapshot mock; teks dibuat netral tentang sandi akses bersama.
5. Kontrak sebelumnya belum merinci kebutuhan seluruh field Beranda/agregasi konten. API_CONTRACT kini memetakan service, request/respons, field konten dan enum, serta menandai endpoint konten/agenda sebagai usulan. Cabang API tetap belum diimplementasikan.

### Responsive dan browser

| Viewport Chrome, zoom 100% | Hasil akhir |
| --- | --- |
| 360 × 800 | PASS — navigasi utuh, subtotal dapat membungkus tanpa terpotong, filter ringkas, preview scroll lokal |
| 390 × 844 | PASS — kartu/kontrol ditumpuk, tabel/resume terbaca dengan scroll lokal, tanpa overflow halaman |
| 768 × 1024 | PASS — tabel satu kolom dan kontrol berbaris, nominal lengkap, A4 tetap landscape |
| 1024 × 768 | PASS — dua tabel sesuai ruang, Navbar dan kartu tidak bertabrakan |
| 1366 × 768 | PASS — komposisi laptop dan refinement sebelumnya dipertahankan |
| 1728 × 1080 | PASS — sembilan komposisi desktop dibandingkan raster final dan refinement sebelumnya |

Development dan production preview masing-masing memeriksa 54 kombinasi. Font/aset termuat; tidak ada horizontal overflow dokumen, subtotal terpotong, tabrakan header, HTTP gagal atau exception runtime aplikasi. Fokus keyboard terlihat, skip link mencapai main, Enter mengaktifkan CTA, dan tombol panah menggeser resume/lembar lokal. Ini pemeriksaan accessibility dasar, bukan audit WCAG lengkap.

Safari tersedia tetapi POST pembuatan sesi safaridriver tidak merespons dalam 20 detik; driver dihentikan dan smoke test belum terlaksana. Firefox tidak ditemukan pada /Applications, /System/Applications atau ~/Applications. Tidak memasang browser tambahan, mengubah izin otomatisasi atau mengklaim PASS lintas browser/perangkat fisik.

### Data, alur end-to-end dan ekspor

Alur Beranda–Agenda–Profil–Kontak–Beranda, menu aktif, 404/kembali, CTA/Footer ke gate, sandi benar/salah, Enter, refresh, filter, kembali, pemilihan format dan unduhan nyata: PASS. Mode API menampilkan error integrasi yang jelas pada empat halaman publik/gate; tidak memakai mock diam-diam atau membuat request endpoint bisnis yang belum ada.

Rekonsiliasi tetap 17 pemasukan/33 pengeluaran: saldo awal Rp18.590.700 + pemasukan Rp10.665.500 − pengeluaran Rp8.771.500 = saldo akhir Rp20.484.700. Total/kategori berasal dari transaksi; tanggal inklusif dan saldo awal khusus, penolakan rentang terbalik/di luar cakupan, hari kosong, serta isolasi mock diuji. Tidak mengubah mock, nilai transaksi, rumus, service laporan atau pembagian halaman.

Ekspor diuji pada enam viewport: April menghasilkan PDF dua halaman dan ZIP dua PNG; 3–5 April menghasilkan PDF satu halaman dan PNG langsung. Fixture QA 60 transaksi menghasilkan tiga lembar; tidak ditambahkan ke mock aplikasi. Development menghasilkan 26 berkas, production preview 24 berkas. Semua 39 halaman PDF dan 39 gambar PNG diperiksa menggunakan pembaca PDF/dekoder ZIP/PNG; jumlah, A4 297 × 210 mm, CRC, urutan, dimensi 2245 × 1587 dan isi tidak kosong: PASS. Halaman pertama/terakhir dirender serta ditinjau. Gambar di PDF identik dengan PNG pasangannya, lintas viewport dan development/build. Penanda data pengembangan tetap tercetak; baris/resume tidak hilang. PDF tetap raster tanpa seleksi/cari teks.

### Kualitas kode, dependency dan verifikasi akhir

- Seluruh data dinamis melalui services; komponen tidak mengimpor mock, database atau Laravel. HTTP aplikasi hanya ada di healthService, cabang bisnis masih error integrasi. Tidak menemukan kebutuhan refactor besar, dependency baru atau komponen duplikat; tabel layar dan lembar cetak berbeda struktur dengan satu logika data/kalkulasi.
- Tidak ada penggunaan storage/cookie untuk sandi/akses, sandi produksi atau klaim perlindungan endpoint. demo123 khusus mock dan terdokumentasi. QRIS/rekening/kontak tidak terverifikasi tidak ditampilkan sebagai data resmi.
- npm run lint: PASS. Seluruh test dengan Chrome: 65 hasil frontend (35 unit/struktur, 29 skenario browser dan satu induk) serta 3 test backend, tanpa dilewati. Tiga skenario tambahan mencakup navigasi/keyboard, mode API publik dan enam viewport. Suite browser yang sama juga PASS pada production preview.
- npm run build: PASS. Entry aplikasi sekitar 328,38 kB / 102,29 kB gzip, sama skala dengan M1.6b; library ekspor tetap dimuat dinamis. Tidak ada masalah performa terukur yang membutuhkan perubahan arsitektur.
- npm audit: 0 kerentanan yang dilaporkan. Tidak mengubah manifest/lockfile atau menambah dependency. Pemeriksaan diff/whitespace, file sensitif dan staging diselesaikan.

### Handoff dan penilaian kesiapan

FRONTEND_HANDOFF memuat route/status, komponen/service, sumber mock, langkah adapter API, gate, filter/ekspor dan batasan. API_CONTRACT membedakan health tersedia dari empat endpoint bisnis yang masih usulan, merinci field/request/respons dan aturan agregasi. Mengubah VITE_DATA_SOURCE saja belum mengaktifkan request bisnis. Label contoh dan periode April tetap prototipe; metadata/periode produksi perlu keputusan integrasi.

| Aspek | Penilaian |
| --- | --- |
| Fungsional frontend publik | Siap untuk mode mock di Chrome; seluruh alur dan ekspor nyata tervalidasi |
| Visual | Struktur/identitas/refinement konsisten, mendekati referensi; bukan kesamaan piksel dan belum ada frame mobile resmi |
| Integrasi backend | Siap handoff kontrak/mock; endpoint, adapter HTTP dan verifikasi sumber resmi belum dibuat |
| Merge ke main | Layak review manual sebagai frontend mock. main lokal ancestor HEAD, selisih 0/9 commit; status remote tidak diperbarui dan merge tidak dilakukan. Bukan kesiapan sistem produksi |

Tertunda sebelum publikasi produksi: persetujuan kontrak/adapter API, data/sandi/periode resmi, konfirmasi QRIS/rekening/kontak/lokasi/pengurus, izin aset, serta pengujian lintas browser/perangkat fisik. Maps dan Masuk Pengurus tetap nonaktif. Bukti QA hanya di tmp/m17-qa/ atau tmp/report-export-tests/, diabaikan Git.

README, DESIGN_MAP, API_CONTRACT dan PROGRESS diperbarui; FRONTEND_HANDOFF dibuat. Hanya perubahan M1.7 yang diverifikasi disiapkan untuk staging. Tidak menyertakan backend, environment, credential, referensi desain, screenshot, ekspor, temporary files atau build. Tidak menggunakan Figma MCP, menjalankan commit/push/merge/rebase, atau melanjutkan admin/milestone lain.

Usulan pesan commit: `chore: finalisasi QA frontend publik dan dokumentasi handoff backend`.

## M1.8a — Refinement desktop layout, Beranda dan Agenda (7 November 2026)

Status: refinement lingkup M1.8a selesai, siap review/commit manual setelah validasi. Branch feature/frontend-publik, awal kerja tanpa perubahan tracked/staged; design-references/ tetap untracked. Tidak menimpa pekerjaan lama atau mengubah backend.

### Implementasi dan iterasi visual

- Navbar sebelumnya absolute dan hilang pada scroll. Kini fixed pada keempat halaman publik; iterasi awal mempertahankan tinggi sekitar 60 px, lalu refinement tambahan merapatkannya menjadi 52 px. Glass transparan, blur/highlight/border dan shadow halus menjaga karakter referensi; drop-shadow logo membantu latar terang. Pointer events hanya aktif pada panel sehingga sisi kosong header tidak menghalangi klik. Scroll margin ditambahkan pada target navigasi/fokus; laporan khusus tidak memperoleh Navbar.
- Bagian atas selain Beranda diberi gradasi langit sedikit lebih dalam. Crop foto Agenda disesuaikan secara terisolasi hingga nuansa hijau dinding muncul sekitar Bulanan. Foto Profil/Kontak tidak diubah crop-nya. Beranda tidak mendapat gradasi biru baru di atas hero.
- Hero Beranda diberi fade bawah dan bayangan batas lebih ringan. Kemakmuran dipersempit agar sejajar panel Agenda (maksimum 1464 px, sebelumnya 1608 px), padding/gap kartu dirapikan dan shadow subtil ditambahkan. Ukuran Navbar, hero, heading/tombol/statistik tidak diperbesar.
- Hijau CTA dipertahankan lebih panjang; iterasi kontras memperdalam warna akhir agar teks kecil tetap terbaca. Copyright desktop menjadi 12 px dengan bobot 350, mobile tetap 11 px.
- Badge jumlah dan label waktu Agenda memakai lapisan glass/highlight dengan blur 8 px; bayangan kartu kelompok sangat tipis. Struktur, warna hijau/lime, jumlah 5/2/5 dan semua jadwal tidak berubah.

Raster Beranda/Agenda ditinjau bersama screenshot sebelum dan sesudah. Iterasi kedua melembutkan shadow hero, memperjelas logo dan memperkuat kontras CTA; hasil akhir diperiksa ulang. Satu pengambilan screenshot sempat terganggu karena alat QA memakai tab bersamaan; pengambilan final diulang berurutan dan hasil yang gagal tidak dijadikan bukti lulus. Artefak hanya ada di tmp/m18a-qa/, diabaikan Git.

### Hasil QA aktual

| Chrome, zoom 100% | Hasil |
| --- | --- |
| 1728 × 1080 | PASS — Navbar akhir 880 × 52 px pada top 48 px, tetap terlihat pada scroll awal/tengah/akhir; komposisi Beranda/Agenda dan glass ditinjau visual |
| 1366 × 768 | PASS — Navbar akhir 880 × 52 px pada top sekitar 41 px, judul/kartu tidak terpotong, tiga kartu Kemakmuran tetap seimbang, semua jadwal terbaca |
| 390 × 844 | PASS smoke — Navbar ringkas dua baris, kartu ditumpuk, tidak ada overflow atau interaksi utama terhalang; bukan refinement mobile menyeluruh |

Development dan production preview masing-masing mencakup 27 kombinasi (sembilan tampilan × tiga viewport) serta 36 posisi scroll (empat halaman publik × tiga viewport × awal/tengah/akhir). Seluruh posisi Navbar terlihat dan dapat diklik; navigasi ke route lain mengembalikan scroll ke atas. Font/aset termuat, tanpa horizontal overflow atau HTTP gagal/exception runtime aplikasi.

Pemeriksaan tambahan production mencakup 12 target CTA/Footer pada empat halaman × tiga viewport: fokus terlihat dan scroll target berada di bawah Navbar. Klik mouse nyata melalui Chrome pada menu saat scroll tengah berhasil berpindah route dan kembali ke atas.

Regresi Profil/Kontak dibatasi perubahan Navbar, gradasi atas dan copyright bersama; isi, layout bagian dan CTA tetap berfungsi. Gate, filter/ringkasan laporan, pilihan format dan dua pratinjau mempertahankan geometri serta data. Sebagian raster browser berbeda tipis dan ditinjau visual tanpa perubahan susunan. Suite browser menerima berkas PDF/ZIP/PNG nyata dan memeriksa format/jumlah halaman/dimensi, sekaligus alur gate, refresh, filter, error API dan navigasi sebelumnya. Tidak mengubah kalkulasi, mock atau ekspor.

### Testing dan Git

- npm run lint: PASS.
- Seluruh test dengan Chrome: PASS, 66 hasil frontend (35 unit/struktur + 30 skenario browser + satu induk), 3 test backend; tidak ada yang dilewati. Satu skenario baru memeriksa Navbar pada 36 posisi scroll, menu dapat digunakan, scroll reset ketika route berubah, dan tidak ada Navbar pada gate/laporan.
- npm run build: PASS. Tidak menambah dependency atau mengubah manifest/lockfile.
- Review diff, whitespace dan file sensitif dilakukan sebelum staging eksplisit. Hanya CSS, test browser, README, PROGRESS dan DESIGN_MAP M1.8a disiapkan; referensi desain, screenshot, log, ekspor, build, environment dan temporary files tidak disertakan. Tidak menjalankan commit, push, merge atau rebase.

Batasan: belum identik piksel terhadap Figma, terutama crop/blur dan panjang halaman dari refinement terdahulu. Navbar fixed secara normal membuat konten bergulir di belakang panel; target navigasi diberi scroll margin dan interaksi utama tetap terjangkau. Smoke mobile bukan pengganti M1.8c. Tidak melakukan QA Safari/Firefox baru, refinement khusus M1.8b, integrasi bisnis atau milestone lain.

Usulan pesan commit: `style: sempurnakan navbar dan tampilan desktop Beranda serta Agenda`.

### Refinement tambahan M1.8a sebelum commit

Staging lima file M1.8a sebelumnya dipertahankan; tidak ada pekerjaan tracked lain yang belum di-stage saat awal revisi. Perubahan tambahan hanya CSS serta catatan PROGRESS/DESIGN_MAP:

- Navbar desktop dari 1000 × sekitar 60 menjadi 880 × 52 px; padding 6 × 24 menjadi 4 × 18 px, gap logo/menu maksimum 64 menjadi 32 px dan gap antaritem 10 menjadi 8 px. Logo 155 menjadi 140 px, padding menu 6 × 20 menjadi 5 × 16 px. Ukuran teks, menu aktif, posisi fixed dan navigasi tetap.
- Border putih tetap 1 px tetapi opasitas turun dari 60% ke sekitar 22%; background dari 50%–40% menjadi 20%–12%. Blur 16 menjadi 12 px, saturasi 115% menjadi 125%, highlight tepi 0,5 px dan shadow lebih lembut. Menggunakan CSS glassmorphism sederhana tanpa library/efek kompleks.
- Gradasi atas Agenda/Profil/Kontak diperkuat dari #89b8df80/#bad8ef40 menjadi #72a7d4a6/#9cc6e86b. Cakupan naik dari sekitar 550/437 menjadi 720/574 px pada desktop/laptop, lalu memudar transparan. Crop/posisi foto, termasuk nuansa hijau Bulanan, tidak berubah. Tidak mengubah CSS hero/fade/overlay Beranda atau ukuran isi halaman.
- Screenshot sebelum/sesudah diperiksa di atas foto, latar biru dan section hijau pada kedua desktop; header Profil/Kontak serta smoke 390 × 844 juga ditinjau. Navbar mobile tetap sekitar 358 × 97 px, navigasi utuh. Sembilan tampilan × tiga viewport dan 36 posisi scroll kembali diperiksa per lingkungan development/production preview, tanpa overflow atau error HTTP/runtime. Geometri hero dan isi halaman dipertahankan; raster minor bukan klaim identik piksel.
- Lint, seluruh test (66 hasil frontend dan 3 backend, tanpa skip), serta build diulang: PASS. Regresi gate, laporan/filter, format/pratinjau dan berkas ekspor tetap lulus. Tidak mengubah mock, service, backend, dependency atau memulai M1.8b.

Bukti tambahan hanya di tmp/m18a-refinement-qa/, tidak di-stage. Setelah review diff/whitespace, staging diperbarui hanya untuk CSS dan dua dokumentasi tersebut; README dan test yang sebelumnya staged tetap dipertahankan. Tidak melakukan commit, push, merge atau rebase. Batasan kesamaan piksel dan pengujian lintas browser dari M1.8a tetap berlaku.

### Refinement final hero, distribusi Navbar dan tombol Profil

Permintaan lanjutan pengguna memperbarui keputusan tinggi hero desktop sebelumnya. Staging M1.8a tetap dipertahankan. Hanya CSS dan dokumentasi terkait diperbarui; tanpa perubahan konten, route, backend, dependency atau pekerjaan M1.8b.

- Hero desktop ≥1024 memakai min-height max(100svh, 64.5vw), menggantikan clamp(620px, 52vw, 900px). Foto asli tetap object-fit cover, kini kanan bawah; skala render foto sekitar 14% lebih besar pada tiga desktop acuan. Tinggi hero dan crop ditangani bersama, tanpa zoom/transform halaman. Padding atas menjadi clamp(164px, 13.4vw, 232px); ukuran judul dan CTA tetap.
- Navbar tetap 880 × 52 px dan fixed. Distribusi space-between dengan padding horizontal 32 px memindahkan logo ke kiri dan menu ke kanan, masing-masing sekitar 33 px dari tepi panel. Border, transparansi, blur/saturasi, tinggi, menu aktif dan ukuran teks dipertahankan. Mobile mempertahankan susunan dan padding breakpoint sebelumnya.
- Dua token CSS permukaan/filter glass dipakai Navbar serta tombol Profil hero. Tombol memakai tint ringan di bawah permukaan translucent, blur 12 px/saturasi 125%, border/highlight tipis, shadow dan teks putih dengan bayangan ringan. Hover/fokus sederhana; CTA Lihat Agenda tetap putih.
- Iterasi pertama mendekatkan proporsi foto/hero dan distribusi Navbar. Setelah perbandingan, fade masih memudarkan anak tangga; iterasi kedua memperpendek fade desktop menjadi clamp(48px, 4vw, 72px), tetap menempel batas bawah hero. Fade/crop/tinggi mobile tidak diubah.

| Chrome, zoom 100% | Hero sebelum → akhir | Awal kartu statistik akhir | Hasil |
| --- | --- | --- | --- |
| 1728 × 1080 | sekitar 899 → 1115 px | sekitar 1187 px | PASS — foto mendominasi layar pertama, Navbar top 48 px, statistik sesudah scroll |
| 1440 × 900 | sekitar 749 → 929 px | sekitar 991 px | PASS — crop proporsional, Navbar top 43 px, statistik di bawah fold |
| 1366 × 768 | sekitar 710 → 881 px | sekitar 940 px | PASS — atap/fasad kanan bawah, Navbar top 41 px, CTA tetap terbaca |
| 390 × 844 | tetap 500 px | tetap 528 px | PASS smoke — Navbar sekitar 358 × 97 px, tanpa overflow/kerusakan navigasi |

Screenshot referensi dibandingkan dengan render pada viewport/zoom setara; untuk lebar berbeda, raster dinormalisasi hanya sebagai pembanding rasio komposisi, bukan ukuran CSS mentah. Dua iterasi, crop fade dan tampilan mobile ditinjau visual. Development dan production preview masing-masing memeriksa 36 kombinasi (sembilan tampilan × empat viewport) serta 48 posisi scroll. Tidak ada overflow halaman, aset/font gagal atau exception runtime. Geometri isi Agenda/Profil/Kontak serta gate/laporan/format/pratinjau tidak berubah; hanya distribusi Navbar bersama yang menyesuaikan.

Pemeriksaan tambahan production: posisi foto/cakupan viewport/statistik, inset logo/menu, ukuran Navbar, hover/fokus dan Enter pada tombol Profil: PASS di empat viewport. Tombol Lihat Agenda tetap berlatar putih. Lint, seluruh test (66 hasil frontend dan 3 backend, tanpa skip) dan build: PASS. Regresi gate, filter serta ekspor nyata tetap lulus. Artefak QA hanya di tmp/m18a-hero-qa/ dan tidak di-stage.

Belum identik piksel: ketajaman/warna foto mengikuti aset WebP asli, overlay dan refinement font sebelumnya; hero desktop kini mengikuti komposisi baru yang diminta, sementara mobile menyeluruh tetap M1.8c. Staging hanya diperbarui untuk CSS/PROGRESS/DESIGN_MAP yang diverifikasi; README/test staged sebelumnya dipertahankan. Tidak melakukan commit, push, merge atau rebase.

### Koreksi akhir geometri Navbar

Hanya geometri Navbar desktop ≥1024 px yang ditambahkan pada CSS; hero/foto/fade, background, section, tombol hero dan tipografi halaman tidak diubah. Staging M1.8a sebelumnya tetap dipertahankan. Acuan visual yang dapat diperiksa adalah raster lokal 01-beranda.png; screenshot pembanding terbaru yang disebut pengguna tidak tampak sebagai lampiran pesan.

- Grid dua kolom menggantikan space-between desktop. Lebar panel clamp(720px, 63vw, 1088px), kolom logo clamp(170px, 13vw, 224px), gap kolom terukur dan padding internal seimbang secara visual. Logo diperbesar dengan merapikan padding transparan vertikal melalui object-fit cover; tulisan/ikon tidak diregangkan atau dipotong. Efek glass, border, shadow dan posisi fixed tetap.
- Empat tombol mempunyai kolom dengan rasio 147:140:190:131, gap 8–12 px, font 17–24 px, serta area klik lebih besar. Posisi dinilai relatif terhadap panel: identitas visual sekitar 18%, awal Beranda sekitar 33%, akhir Kontak sekitar 93%, mendekati raster lokal. Ruang kosong logo–Beranda berkurang tanpa menumpuk seluruh menu di kanan.

| Viewport | Panel sebelum → akhir | Hasil |
| --- | --- | --- |
| 1728 × 1080 | 880 × 52 → 1088 × 64 px | PASS — panel terpusat; logo visual sekitar 200 px, tombol sekitar 148/141/192/132 px |
| 1440 × 900 | 880 × 52 → sekitar 907 × 56 px | PASS — proporsi logo/menu konsisten dengan panel dan raster pembanding |
| 390 × 844 | tetap sekitar 358 × 97 px | PASS smoke — susunan, navigasi dan geometri mobile dipertahankan |

Baseline, iterasi dan screenshot akhir dibandingkan kembali pada zoom Chrome 100%. Development/production preview masing-masing mencakup 36 kombinasi tampilan dan 48 posisi scroll; tidak ada overflow halaman, kegagalan aset/font atau exception runtime. Geometri hero dan seluruh isi halaman sama dengan baseline. Pemeriksaan tambahan 1728/1440/1366/1024/768/390 px meliputi panel terpusat, rasio posisi, hover, Tab/Enter, menu aktif dan klik mouse saat scroll: PASS.

Lint, seluruh test (66 hasil frontend dan 3 backend, tanpa skip), build dan whitespace: PASS. Screenshot/log hanya di tmp/m18a-navbar-qa/, tidak di-stage. Staging diperbarui hanya untuk CSS dan catatan desain/progres; README serta test browser staged sebelumnya tetap utuh. Tidak mengubah backend/dependency atau melakukan commit, push, merge maupun melanjutkan M1.8b.

Perbedaan tersisa terhadap raster lokal berupa detail raster logo dan selisih kecil tinggi/posisi vertikal panel; belum diklaim identik piksel atau diverifikasi terhadap lampiran yang tidak tersedia. Usulan commit tetap: `style: sempurnakan hero, navbar, dan tampilan desktop publik`.

## M1.8b — Polishing Profil/Kontak, modal gate dan laporan (7 November 2026)

Status: selesai untuk review/commit manual pada branch feature/frontend-publik. Baseline M1.8a cbe90ea sudah di-commit saat awal kerja; working tree tracked/staging bersih, hanya design-references/ untracked. Tidak mengubah backend, menambah dependency atau melanjutkan responsive QA final.

### Implementasi

- Profil: shadow lembut pada tujuh kartu Struktur Organisasi tanpa mengubah grid/konten. CTA kontribusi memakai tone hijau masjid dengan gradasi dan deskripsi yang tetap terbaca.
- Kontak: surface/shadow halus serta border lebih lembut pada panel dan kartu QRIS/bank. Judul Donasi naik 8 px, margin bawah dikompensasi sehingga susunan dua kolom/posisi kartu tetap. Placeholder QRIS, rekening, kontak dan Maps tidak diganti atau diaktifkan.
- ReportAccessModal baru memakai native dialog pada PublicLayout dan menggunakan kembali ReportAccessPanel/checkReportPassword. CTA Beranda/Footer mencegah navigasi langsung dan membuka modal di halaman asal. Backdrop gelap/top layer berada di atas Navbar fixed; body scroll dikunci, fokus awal/input serta siklus Tab/Shift+Tab dikelola. Tombol tutup/Escape memulihkan fokus dan scroll pemicu. Menutup saat loading membatalkan pemeriksaan; salah/error tetap di modal; benar membersihkan input, menutup modal dan menuju laporan.
- FinancialReportPage tidak lagi memiliki hasAccess. Akses langsung/refresh route memuat laporan, termasuk refresh dari format/pratinjau yang kembali ke tampilan/periode default. Filter/format tetap dipertahankan ketika kembali selama halaman terbuka. Tidak ada sandi/status pada storage, cookie atau URL; gate adalah pembatas interaksi CTA saja, bukan proteksi route/endpoint.
- Laporan/format: shadow tipis pada tabel/resume, kontrol periode dan kartu format; layout putih, warna, ukuran tabel dan kalkulasi tetap. ReportSheet memakai kategori teks berwarna tanpa capsule, font 7,5 px/line-height 10 px. Tinggi baris, nominal, kategori dana dan pagination tidak berubah.

Inspeksi ekspor pertama menemukan kategori ringkasan masih mewarisi capsule breakpoint layar sehingga raster 1728 berbeda dari laptop. Scope kategori diperbaiki untuk seluruh ReportSheet (transaksi dan resume), lalu semua ekspor diulang. Ini perbaikan styling bersama pratinjau/ekspor, bukan data/perhitungan terpisah.

### QA browser dan baseline

| Chrome, zoom 100% | Hasil |
| --- | --- |
| 1728 × 1080 | PASS — polishing Profil/Donasi, modal proporsional maksimum 1120 px, overlay/close, laporan/format/dua pratinjau ditinjau |
| 1366 × 768 | PASS — panel dan kartu tidak terpotong, fokus/navigation/scroll modal serta laporan terbaca |
| 390 × 844 | PASS smoke — modal muat/scroll lokal bila diperlukan, navigasi/kontrol tidak rusak, tanpa overflow halaman |

Development dan production preview masing-masing memeriksa 27 kombinasi (sembilan tampilan × tiga viewport) dan 36 posisi scroll publik; font/aset termuat, tanpa HTTP gagal/exception runtime. Gate diuji dari CTA serta Footer seluruh halaman, termasuk mempertahankan posisi scroll/fokus Footer. Tutup saat pending, sandi kosong/salah/benar, Enter, submit ganda, API error/retry, akses langsung dan refresh: PASS. Test lama refresh meminta sandi diganti; tidak menambah autentikasi/session.

Baseline M1.8a dipertahankan: 163 aturan CSS Navbar/hero/background/Beranda/Agenda dibandingkan dan identik. Screenshot regression mempunyai geometri/panjang halaman yang sama; sebagian PNG identik, lainnya berbeda raster tipis dan ditinjau visual tanpa perubahan komposisi. Navbar, crop/tinggi/fade hero, glass tombol dan background tidak disentuh. Perubahan HomePage/Footer hanya callback pemicu modal.

### Ekspor nyata dan data

- April tetap 17 pemasukan/33 pengeluaran, total Rp10.665.500/Rp8.771.500, saldo awal Rp18.590.700 dan akhir Rp20.484.700. Semua ID tepat sekali; pratinjau PDF/PNG memakai lembar/data yang sama.
- April: PDF dua halaman A4 landscape dan ZIP dua PNG. Rentang 3–5 April: PDF satu halaman/PNG langsung, sembilan transaksi. Fixture QA 60 transaksi: tiga halaman, tanpa menambah mock aplikasi. Tidak ada baris terbelah, ringkasan hilang atau kategori bertumpuk/terpotong.
- Inspeksi development mencakup 14 berkas dengan 12 halaman/gambar; production 12 berkas dengan 9 halaman/gambar. Seluruh 26 berkas, 21 halaman PDF serta 21 PNG diperiksa format asli, A4 297 × 210 mm, CRC/urutan ZIP, dimensi 2245 × 1587 dan isi tidak kosong. PDF dibuka dan halaman pertama/terakhir dirender/ditinjau; semua PNG didekode. Gambar di PDF identik piksel dengan PNG pasangannya, termasuk lintas viewport/development/build. Isi dan layout menggunakan ReportSheet pratinjau yang sama.

### Verifikasi, dokumentasi dan Git

- npm run lint: PASS. Seluruh test: 69 hasil frontend (36 unit/struktur, 32 skenario browser dan satu induk), 3 backend, tanpa skip/failure. Suite browser juga PASS pada production preview (33 hasil termasuk induk).
- npm run build: PASS. Tidak mengubah manifest/lockfile, service, mock, utils kalkulasi/pagination, backend atau kontrak autentikasi admin.
- README, DESIGN_MAP, API_CONTRACT dan FRONTEND_HANDOFF diperbarui untuk alur modal/refresh/direct route. Endpoint bisnis tetap usulan; gate tidak melindungi GET laporan.
- Review status/diff, whitespace dan file sensitif sebelum staging eksplisit. Hanya source/test/dokumentasi M1.8b yang diverifikasi disiapkan. Screenshot, PDF/PNG/ZIP, log dan alat QA berada di tmp/m18b-qa/ atau tmp/report-export-tests/. Referensi desain tetap untracked dan build di frontend/dist diabaikan Git; semuanya tidak di-stage.

Batasan: mock dan data kontak/pembayaran belum menjadi data produksi; PDF tetap raster tanpa seleksi teks. Visual belum identik piksel; QA baru memakai Chrome, bukan klaim Safari/Firefox/perangkat fisik. Mobile menyeluruh tetap tahap berikutnya. Tidak melakukan commit, push, merge atau rebase.

Usulan pesan commit: `feat: tampilkan gate laporan sebagai modal dan rapikan halaman publik`.

### Refinement tambahan M1.8b — tipografi, kontras dan latar

Staging 15 file M1.8b yang belum di-commit dipertahankan. Perubahan tambahan hanya index.css serta PROGRESS/DESIGN_MAP. Tidak mengubah JS, gate, data, filter, kalkulasi, pagination/ekspor, dependency atau backend; tidak memulai M1.8c.

| H1 Profil dan Kontak | Sebelum | Sesudah |
| --- | --- | --- |
| Desktop 1728 × 1080 | 63,936 px | 69 px (+7,9%) |
| Laptop 1366 × 768 | 50,542 px | 54,64 px (+8,1%) |
| Mobile 390 × 844 | Profil 32 px, Kontak 34 px | Tetap |

Warna hijau/oranye, font Plus Jakarta Sans dan weight 800 dipertahankan. Subtitle #779bdf (Profil)/#6388c6 (Kontak) serta italic Sorolaten diganti #385464, biru keabu-abuan yang lebih gelap dan tetap sekunder. Pengukuran sampel screenshot background aktual, dengan teks disembunyikan sementara tanpa mengubah layout, memperoleh minimum 5,14:1 untuk Sorolaten dan 5,29:1 untuk subtitle desktop; mobile minimum 5,51:1. Ini pemeriksaan kontras terarah, bukan audit WCAG keseluruhan.

Badge header Profil/Kontak memakai aturan bersama: off-white #fffaf0f2, border hangat #dfc6a8 dan shadow kecil 0 2px 6px #5b452018. Oranye, ikon, radius dan padding ringkas tetap; tidak menambah hover/blur atau mengubah badge linimasa. Dua stat cards Profil mendapat shadow natural 0 6px 18px #2547351a dan highlight putih tipis; radius, ukuran, angka, ikon dan warna dasar tetap.

Latar Profil sebelumnya cover/center, sedangkan Kontak 100% auto/center top. Keduanya kini menggunakan konfigurasi scene bersama: foto auto 120% tinggi lapisan, opacity .65 tetap, blur 10 → 8 px dan overlay putih tengah sedikit ditipiskan (#edf5fac9 → #edf5fab8). Crop Kontak 72% bottom; crop Profil 72% 65% pada desktop besar dan 72% 80% pada ≤1399 px untuk menempatkan siluet atap di belakang Sejarah. Foto kedua pada pseudo-element Sejarah dihilangkan dan diganti gradasi ringan agar scene besar tidak tertutup. Variabel Agenda mempertahankan konfigurasi lama secara utuh untuk menjaga crop Bulanan; gradasi biru atas yang disetujui dan seluruh foto/hero/latar Beranda tetap.

Iterasi pertama memperbaiki header/kartu dan skala foto, tetapi atap terlalu tinggi. Iterasi kedua mengoreksi posisi Profil serta blur/overlay; hasil dibandingkan kembali dengan 03-profil/04-kontak pada zoom Chrome 100%. QA desktop 1728 × 1080, 1366 × 768 serta smoke mobile 390 × 844: PASS. Tidak ada wrapping baru yang merusak komposisi, tabrakan, overflow halaman, font/aset gagal atau exception runtime. Development/production masing-masing memeriksa 27 kombinasi tampilan serta 36 posisi scroll.

Regresi Beranda/Agenda: geometri, tinggi dan konfigurasi background tetap sama; beberapa PNG identik, perbedaan raster kecil pada lainnya ditinjau tanpa perubahan komposisi. Navbar/glass dan hero tidak disentuh. Gate/modal, akses langsung/refresh laporan, filter, pratinjau serta ekspor nyata tetap lulus suite browser. npm run lint, 69 hasil frontend dan 3 test backend (tanpa skip), serta build production: PASS. Tidak menulis test CSS yang hanya menyalin implementasi.

Bukti before/dua iterasi/final, perbandingan dan sampel kontras berada di tmp/m18b-refinement-qa/, diabaikan Git. Foto asli WebP 1928 × 1089 membatasi detail saat crop diperbesar; blur/crop tetap pendekatan raster Figma, belum identik piksel atau diuji pada layar fisik/Safari/Firefox. Setelah review diff/whitespace dan file sensitif, staging diperbarui hanya untuk tiga file tambahan yang diverifikasi; 12 file staged lainnya tetap utuh. Tidak melakukan commit, push, merge atau rebase.

### Refinement final M1.8b — badge frosted glass

Surface solid badge header Profil/Kontak diganti satu aturan bersama: gradient putih susu 76% → tint hangat 62%, blur 12 px/saturasi 115%, border putih 1 px/55%, highlight inset 65% dan shadow 0 4px 12px rgba(20,55,45,.12). Teks/ikon oranye tetap solid; opacity elemen tetap 1. Border Profil sebelumnya tidak memiliki lebar, sedangkan Kontak 1 px. Border kini identik; padding Profil dikurangi 1 px per sisi untuk mempertahankan dimensi, termasuk mobile. Tidak mengubah badge linimasa, kategori laporan atau label agenda.

QA screenshot sebelum/sesudah Chrome zoom 100% pada 1728 × 1080, 1366 × 768 dan smoke 390 × 844: kapsul lebih transparan, outline sama tipis, teks tetap jelas. Pengukuran seluruh elemen pada 12 kombinasi empat halaman publik menunjukkan geometri/tinggi halaman tetap sama; enam screenshot Beranda/Agenda identik piksel dengan baseline. Tidak ada overflow, aset gagal atau exception runtime. Surface kedua badge sama pada seluruh viewport; font, radius dan posisi tetap. Bukti lokal di tmp/m18b-badge-qa/ tidak di-stage.

Lint, 69 hasil test frontend (termasuk browser gate/filter/ekspor nyata) dan 3 test backend tanpa skip, build production serta whitespace check: PASS. Tidak menambah dependency atau mengubah backend/fitur. Staging M1.8b sebelumnya dipertahankan; tambahan hanya CSS badge dan dokumentasi progres/peta desain. Belum diuji ulang lintas browser atau pada layar fisik. Tidak melakukan commit/push/merge/rebase atau memulai M1.8c.

## M1.8c — Responsive refinement dan regression QA (7 November 2026)

### Perubahan terverifikasi

- Navbar <768 px menjadi satu baris sekitar 62 px, dengan tombol Menu dan empat tautan collapsible dua kolom. Target klik minimal 44 px, aria-expanded/controls, Escape kembali ke pemicu, Tab keluar/klik luar/pemilihan tautan menutup menu. Fixed/glass tetap; desktop tidak berubah.
- Beranda mobile: jarak teks hero menyesuaikan Navbar ringkas; kartu statistik memakai ikon di samping dan angka 26 px tanpa mengurangi konten. Tablet memakai gutter lebih lega serta dua kolom program, kartu terakhir selebar baris. Tinggi/crop/fade hero desktop tetap.
- Agenda mobile: header lebih ringkas, nama kegiatan 15 px dan label waktu dapat membungkus. Tablet: panel pengantar lebih lega. Data 5/2/5 tetap.
- Profil: nama/jabatan pengurus mobile 14/11 px, tujuh kartu tetap. Tablet: gap statistik/CTA lebih proporsional. Kontak mempertahankan QRIS/rekening bertumpuk pada mobile; informasi rata atas dan padding tablet lebih lega. Seluruh data belum dikonfirmasi tetap placeholder.
- Modal mengikuti tinggi/offset visualViewport, dengan scroll lokal. Iterasi screenshot layar pendek menemukan tombol tutup ikut tergulir; diperbaiki dengan toolbar sticky mobile agar tidak menutupi teks/input. Fokus/scroll lock dan sandi benar/salah/loading/error tetap. Simulasi area 390×360 memastikan input, submit dan tutup tetap dapat digunakan; keyboard perangkat fisik belum diuji.
- Laporan: tanggal satu kolom di bawah 480 px, input 16 px, tombol ≥44 px, uraian/kategori dapat membungkus pada mobile. Resume tetap scroll lokal. Format/pratinjau: tombol unduh mobile bertumpuk, kontrol lebar halaman ≥44 px, pembungkusan pengantar/tombol tablet. ReportSheet A4, skala baca lokal, pagination, service/data dan perhitungan tidak diubah.

### Hasil QA dan ekspor

| Viewport Chrome, zoom 100% | Hasil |
| --- | --- |
| 360 × 800 | PASS — sembilan tampilan, menu/scroll lokal/overflow |
| 390 × 844 | PASS — sembilan tampilan, modal/menu/scroll lokal |
| 768 × 1024 | PASS — sembilan tampilan, susunan tablet |
| 1024 × 768 | PASS — sembilan tampilan, baseline desktop |
| 1366 × 768 | PASS — sembilan tampilan, baseline desktop |
| 1728 × 1080 | PASS — sembilan tampilan, baseline desktop |

Baseline/iterasi dan production diperiksa melalui screenshot. QA final production memeriksa 54 kombinasi tampilan dan 120 posisi scroll: tanpa overflow halaman, tabrakan header/subtotal, font/aset gagal atau exception runtime. Navbar tetap terlihat/dapat diklik saat scroll; tombol ekspor bawah tetap terjangkau. Dua puluh tujuh pengukuran geometri/style/tinggi desktop ≥1024 px identik dengan baseline. Screenshot yang berbeda hanya menunjukkan selisih raster kecil pada blur/teks tanpa perubahan komposisi; tidak mengklaim seluruh screenshot identik piksel.

Alur publik, CTA Beranda/Footer → modal → laporan → format → pratinjau → ekspor, akses langsung/refresh tanpa gate, filter inklusif/kustom/tanggal terbalik/periode tidak lengkap, kembali dengan filter tetap, fokus/Escape/loading/error/submit ganda dan mode API: PASS. Test menu memakai klik melalui koordinat elemen, bukan hanya memanggil handler. April tetap 17 pemasukan/33 pengeluaran; saldo awal 18.590.700 + pemasukan 10.665.500 − pengeluaran 8.771.500 = saldo akhir 20.484.700.

Ekspor production nyata pada keenam viewport menghasilkan 24 berkas: tiap viewport April penuh (PDF dua halaman + ZIP dua PNG) dan 3–5 April (PDF satu halaman + PNG tunggal). Seluruh 18 halaman PDF dirender/dibuka dan 18 PNG diperiksa; A4 297×210 mm, PNG asli 2245×1587, ZIP lolos CRC, bukan gambar kosong, tanpa baris melewati footer. Gambar yang tertanam pada setiap halaman PDF identik piksel dengan PNG pasangannya serta konsisten lintas viewport. Pratinjau memakai 50 ID April unik, tanpa transaksi hilang/berulang; DOM lembar tidak berubah selama ekspor. Penanda data pengembangan, font, warna, periode dan resume tetap. PDF masih berbasis gambar; uraian yang sudah disingkat pada sumber tetap demikian.

### Quality gate, staging dan batasan

Lint: PASS. Seluruh test: 72 hasil frontend (36 test dasar, 35 skenario browser dan suite induk) serta 3 test backend, tanpa skip/fail. Build production dan whitespace check: PASS. Tiga skenario browser baru memeriksa menu mobile, modal pada layar pendek, serta ekspor PDF/ZIP mobile. README, peta desain dan handoff diperbarui; tidak ada dependency, backend atau kontrak bisnis baru.

Bukti screenshot/berkas/metrics di tmp/m18c-qa/ diabaikan Git. Perubahan manual pengguna pada shadow badge (blur 12 → 32 px) yang sudah ada saat mulai dipertahankan di working tree dan tidak dicampur ke staging M1.8c. Hanya Navbar, ReportAccessModal, CSS responsive, test browser serta empat dokumen terkait disiapkan untuk commit manual; referensi desain, credential, build output dan artefak QA tidak di-stage. Tidak melakukan commit, push, merge atau rebase.

Frontend mode mock siap untuk review manual sebelum pertimbangan merge; belum berarti siap produksi. Belum ada desain mobile resmi atau pengujian perangkat fisik/Safari/Firefox pada tahap ini. Data resmi Kontak/Donasi, izin aset dan integrasi endpoint Express tetap mengikuti handoff; tidak dikerjakan pada M1.8c. Tidak melanjutkan milestone lain/admin atau melakukan merge.

## Backend Publik Fase 1 (tanpa database, selaras SOP Capstone) — 8 November 2026

Status: implementasi backend publik pada branch `fitur/backend-publik` selesai dan tervalidasi tanpa menyentuh `frontend/` dan tanpa menambah dependency baru.

### Implementasi

- Memisahkan arsitektur backend menjadi 3 layer tegas (`routes/` + `controllers/` → `services/` → `repositories/` → `data/`) serta memusatkan konfigurasi runtime di `backend/src/config/env.js`.
- Menyesuaikan fondasi terhadap SOP Capstone Project: batas body JSON `10kb` (`JSON_BODY_LIMIT`), prefix path API configurable (`API_BASE_PATH`, default `/api`) untuk dukungan subdirectory, validasi & sanitasi input serta error terstruktur (`httpError.js`) tanpa membocorkan stack trace.
- Mengimplementasikan keempat endpoint publik sesuai `docs/API_CONTRACT.md` dengan sumber data sementara (menunggu kesiapan skema PostgreSQL/pgAdmin tim):
  - `GET /api/public/agenda`: 5 mingguan, 2 bulanan, 5 tahunan tanpa `counts`.
  - `GET /api/public/content`: konten bersama, profil, dan sanitasi placeholder aman `contact`/`donation` (`verified: false`, `null`), tanpa `agenda`.
  - `POST /api/public/report/check-password`: verifikasi `scrypt` + `timingSafeEqual` dari `REPORT_SHARED_PASSWORD_HASH` (development mendukung hash otomatis `REPORT_SHARED_PASSWORD` di memori; production menolak plaintext), validasi input ketat (`400`), status `503` jika belum dikonfigurasi, serta rate limiter in-memory anti brute-force (`429 TOO_MANY_REQUESTS`).
  - `GET /api/public/finance/report`: validasi tanggal kalender & batas rentang maks 366 hari (`400`), default cakupan April 2026 bila query kosong, HTTP `200` `status: 'unavailable'` di luar cakupan, dan rekonsiliasi 50 transaksi integer Rupiah (ID string, saldo awal `18.590.700`, pemasukan `10.665.500`, pengeluaran `8.771.500`, saldo akhir `20.484.700`).
- Menjaga `frontend/` tidak diubah (sesuai batas tugas backend) dan memperbarui `docs/API_CONTRACT.md` serta `backend/.env.example`.

### Verifikasi dan Batasan

- `npm run lint`: PASS (frontend Oxlint 47 file + backend `node --check` 23 file).
- `npm test --workspace frontend`: PASS (36 test unit/SSR, 1 suite Chrome QA opsional dilewati).
- `npm test --workspace backend`: PASS (18 test HTTP & unit untuk health, 404, JSON invalid, batas 10 KB/413, `API_BASE_PATH` subdirectory, `agenda`, `content`, `check-password` termasuk 400/503/429 brute-force, `finance/report` termasuk rekonsiliasi/inklusif/hari kosong/unavailable/400, serta isolasi data).
- `npm run build`: PASS.
- Batasan tersisa: koneksi PostgreSQL (pgAdmin), skema tabel/migrasi/seeder, autentikasi admin & CRUD pengurus ("Masuk Pengurus"), upload file QRIS, dan pengaktifan adapter `VITE_DATA_SOURCE=api` di `frontend/` belum dikerjakan pada tahap ini.

## Admin 1.1 — Login Pengurus (10 November 2026)

Status: halaman login selesai dan tervalidasi pada branch `feature/frontend-admin`; siap review dan commit manual pengguna. Baseline saat mulai `c583969`, tanpa perubahan tracked/staged; `design-references/` tetap untracked.

### Implementasi dan batas autentikasi

- Menambahkan `/admin/login` pada aplikasi React yang sama, di luar PublicLayout. Desktop dua panel mengikuti `10-admin-login.png` (3456 × 2000); foto/gradasi biru–hijau, logo dan font lokal yang sudah tersedia. Tablet/mobile satu kolom, form dan kartu dapat digulir pada layar pendek. CSS terpisah dibatasi `.admin-login*`.
- Form dimulai kosong, email/password wajib, format email dan karakter kontrol divalidasi; karakter khusus password biasa tidak dihapus/diubah. Input password tersembunyi, autocomplete sesuai tujuan, Enter/submit, fokus error, aria-invalid/describedby, status loading dan pesan kesalahan tersedia. Ref serta tombol/input nonaktif mencegah submit ganda. Request dibatalkan saat halaman dilepas; password dibersihkan setelah submit selesai.
- Kode backend, API_CONTRACT dan referensi remote ditinjau: belum ada endpoint autentikasi admin. `adminAuthService.loginAdmin()` menyediakan batas integrasi tanpa HTTP atau endpoint karangan. Jeda 500 ms hanya development mode mock untuk menguji loading; semua kredensial ditolak sebagai integrasi belum tersedia. Mode API/build production tidak memakai simulasi autentikasi. Tidak ada akun/password/token/secret aplikasi baru, persistence kredensial, session, role, route protection atau sukses semu.
- Perlu koordinasi backend untuk metode/path, payload email/password, respons sukses dan error (validasi, kredensial, rate limit), mekanisme akses dan tujuan setelah berhasil. Validasi ulang, hashing password, mitigasi brute force serta pentest tetap kebutuhan backend sebelum autentikasi nyata; bukan klaim keamanan dari UI. Kontrak API tidak diubah sepihak.
- Hanya login yang dibuat. Komponen/CSS/aset/service/mock publik, backend, dependency dan lockfile tidak diubah. Masuk Pengurus di Footer publik tetap nonaktif; tidak membuat dashboard, menu admin, CRUD, profil, pengaturan akun, lupa password atau registrasi.

### Verifikasi aktual

- `npm run lint`: PASS tanpa peringatan, frontend dan backend.
- `npm test`: PASS — 41 test frontend unit/SSR (5 baru untuk login) dan 18 test backend. Dua suite browser opsional dilewati pada perintah standar, lalu dijalankan terpisah dengan Chrome QA.
- Suite browser login: PASS — 4 skenario (5 hasil termasuk induk), mencakup validasi/fokus, Enter/loading, submit berulang, error/retry, refresh, input kosong, isolasi route, tidak ada storage/cookie/HTTP autentikasi. Akun yang dimasukkan pada QA hanya data uji yang selalu ditolak, bukan kredensial aplikasi.
- Suite regresi publik: PASS — 35 skenario (36 hasil termasuk induk), termasuk CTA/modal, akses langsung/refresh laporan, filter/rekonsiliasi, menu responsive/keyboard, serta unduhan PDF/PNG/ZIP nyata.
- `npm run build`: PASS. Preview build production juga diperiksa pada tujuh viewport: 1728×1000, 1366×768, 1024×768, 768×1024, 390×844, 360×800 dan 390×360. Development diuji pada ukuran yang sama. Tidak ada overflow horizontal/elemen terpotong, font/logo gagal atau exception runtime/HTTP gagal. Submit production tetap di login dengan pesan belum tersedia, password dibersihkan, tanpa HTTP autentikasi atau penyimpanan kredensial.
- Screenshot development/production dibandingkan dengan raster resmi dan ditinjau pada desktop/tablet/mobile. Satu iterasi memperbaiki pemisahan kata judul pada satu kolom serta tracking teks. Bukti lokal di `tmp/admin11-qa/`, diabaikan Git. Pengujian hanya Chrome/emulasi viewport; belum perangkat fisik, Safari/Firefox, pentest atau klaim identik piksel.

README dan DESIGN_MAP diperbarui untuk route, desain dan batas integrasi. Setelah review status, diff, daftar file, whitespace dan file sensitif, hanya sembilan file kode/test/dokumentasi Admin 1.1 disiapkan untuk staging. Screenshot, profil Chrome, build, environment dan referensi desain tidak disertakan. Tidak melakukan commit, push atau merge. Pekerjaan berhenti setelah Login Pengurus; integrasi autentikasi menunggu kesepakatan backend.

Usulan pesan commit: `feat: tambahkan halaman login pengurus dan batas integrasi autentikasi`.

### Tindak lanjut — CTA Footer ke login (10 November 2026)

- Mengganti tombol Masuk Pengurus nonaktif pada Footer dengan React Router `Link` menuju `/admin/login`, mengikuti tautan Footer yang sudah ada. CSS, autentikasi dan backend tidak diubah. README dan DESIGN_MAP diselaraskan.
- Verifikasi lulus: lint, build, 41 test frontend dan 18 test backend. Dua suite browser opsional dilewati pada `npm test`; pemeriksaan Chrome terpisah mencakup lima halaman publik (Beranda, Agenda, Profil, Kontak dan 404) pada desktop 1366×768 serta mobile 390×844: klik/Enter menuju login tanpa reload dokumen, navigasi Kembali, CTA laporan tetap membuka modal pada halaman asal, serta akses langsung/refresh login. Tidak ada overflow horizontal, exception runtime atau HTTP gagal pada pemeriksaan tersebut.
- Perubahan tindak lanjut dibiarkan unstaged; sembilan file staged dari pekerjaan login sebelumnya dipertahankan. Tidak melakukan commit atau push. Autentikasi tetap belum terhubung. Usulan pesan commit khusus tindak lanjut: `fix: hubungkan tautan masuk pengurus di footer ke halaman login`.

### Refinement — tampilkan/sembunyikan password (10 November 2026)

- Menambahkan tombol Eye/EyeOff Lucide pada sisi kanan input, default tersembunyi. Tombol `type="button"`, label Tampilkan/Sembunyikan password, aria-controls, target 44 px dan hover/fokus. Toggle hanya mengubah visibilitas, menjaga nilai serta validasi; nonaktif saat submit dan kembali tersembunyi setelah submit selesai. Tinggi/lebar, border dan radius input dipertahankan dengan padding kanan untuk ikon.
- Perubahan Footer/README/DESIGN_MAP dari tindak lanjut sebelumnya dipertahankan. Footer memakai Link ke `/admin/login`; kini ikut staging sesuai instruksi pengguna. Tidak mengubah autentikasi, service, kontrak API, backend atau dependency dan tidak menambah halaman/komponen.
- Verifikasi: lint PASS tanpa peringatan, `npm test` PASS (42 test frontend dan 18 backend; dua suite browser opsional dilewati), build PASS. Suite Chrome login dijalankan terpisah: 6 skenario PASS (7 hasil termasuk induk), termasuk toggle mouse/keyboard, hover/fokus, nilai/validasi/geometri input tetap, loading/submit ganda, dan navigasi Footer pada lima halaman publik × desktop/mobile. Layout diperiksa pada tujuh viewport; screenshot desktop/mobile ditinjau, tanpa overflow atau error runtime/HTTP aplikasi. QA terbatas pada Chrome/emulasi viewport.
- README dan DESIGN_MAP mencatat perilaku terbaru. Staging diperbarui hanya untuk file terkait, mempertahankan pekerjaan login terdahulu. Referensi desain, hasil build, screenshot dan profil Chrome di tmp tetap tidak di-stage. Tidak melakukan commit, push atau merge. Usulan commit gabungan: `feat: lengkapi login pengurus dengan toggle password dan tautan footer`.

## Admin 1.2 — Dashboard Keuangan (10 November 2026)

Status: implementasi dan QA selesai pada `feature/frontend-admin`, baseline commit `28b4fef`. Awal pekerjaan tanpa perubahan tracked/staged; `design-references/` tetap untracked. Referensi final `11-admin-dashboard.png` baru tersedia setelah dikonfirmasi pengguna, lalu digunakan sebagai acuan implementasi.

### Implementasi dan keputusan

- Menambahkan `/admin/dashboard` dalam React yang sama dengan AdminLayout sederhana (sidebar/topbar dan Outlet). Sidebar memuat logo, tiga kelompok navigasi, dashboard aktif dan akun contoh di bawah; topbar memakai judul, ikon Bell nonaktif dan avatar SA. Tidak mengubah PublicLayout, CSS/komponen publik atau desain login.
- Konten mengikuti referensi: hero hijau/foto masjid dan dua tombol transaksi, tanggal update, empat kartu, resume tiga kategori/total, banner oranye, lima transaksi terbaru dan tiga shortcut. Memakai aset/font lokal serta Lucide yang tersedia, tanpa dependency baru.
- Data baru di `mocks/adminDashboard.js`, hanya diakses melalui `adminDashboardService`. Saldo akhir dihitung per kategori dan total diturunkan dari kategori untuk kartu/tabel. Rekonsiliasi: 16.864.200 + 1.791.500 − 1.427.500 = 17.228.200. Saldo akhir kategori 12.718.200 / 3.654.000 / 856.000; lima transaksi terakhir merupakan cuplikan, bukan seluruh mutasi periode. Mock laporan publik April tidak diubah.
- Kolom numerik pertama tabel diperjelas menjadi Saldo Awal, mengoreksi label Saldo Akhir ganda pada raster. Klaim realtime diganti teks netral dan penanda data contoh ditampilkan. Nama/email Super Admin hanya fixture tampilan dari referensi, bukan kredensial, role atau sesi pengguna.
- Dashboard dapat dibuka langsung/refresh untuk review mock, tanpa mengubah login menjadi sukses palsu atau menerapkan proteksi route. Mode API menampilkan error integrasi tanpa HTTP atau fallback mock. Autentikasi backend belum tersedia; tidak membuat backend, database atau perubahan kontrak API.
- Seluruh menu/aksi fitur lain nonaktif dengan keterangan: transaksi, laporan admin, kategori, kwitansi, activity log, konten, akun, kode akses, notifikasi dan logout. Tidak membuat route/halaman fiktif.
- Tablet/mobile: sidebar collapsible dengan fokus awal/kembali, Escape/backdrop/penutupan saat fokus keluar; kartu 2/1 kolom. Tabel memakai petunjuk dan scroll lokal dengan keyboard. Nominal tetap utuh, shortcut/bannernya menyesuaikan. Iterasi visual merapikan pemenggalan kategori dan ruang akun pada sidebar laptop.

### Verifikasi aktual

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS — 48 test frontend unit/SSR (6 baru untuk dashboard) dan 18 test backend. Tiga suite browser opsional dilewati pada perintah standar, kemudian dijalankan terpisah.
- Chrome development: 46 skenario browser PASS (49 hasil termasuk 3 induk): 5 dashboard, 6 login dan 35 publik. Mencakup angka/aset/route/refresh, menu dan tabel keyboard, kontrol nonaktif, error mode API tanpa request, toggle/login, serta regresi alur publik/gate/filter dan ekspor PDF/PNG/ZIP nyata.
- `npm run build`: PASS. Suite dashboard pada preview production: 5 skenario PASS (6 hasil termasuk induk), termasuk fokus navigasi dan akses langsung/refresh dengan atau tanpa trailing slash.
- Visual/top/full pada 1728×1080, 1366×768, 768×1024 dan 390×844 ditinjau terhadap raster final. Hero desktop 1392×386 / 1078×386 px; kartu 4/4/2/1 kolom. Tidak ada overflow horizontal halaman, nominal kartu terpotong, font/logo gagal, HTTP gagal atau exception runtime aplikasi. Scroll tabel lokal diuji sampai kolom terakhir; tabel mempertahankan semua angka/baris.
- Screenshot dan metrik ada di `tmp/admin12-qa/development/` serta `tmp/admin12-qa/production/`, termasuk menu mobile. File QA, build dan referensi tidak masuk Git. QA terbatas Chrome/emulasi viewport; belum perangkat fisik/Safari/Firefox dan tidak mengklaim identik piksel atau kesiapan autentikasi produksi.

README dan DESIGN_MAP diperbarui untuk route/layout, mock, batasan dan cara QA. Setelah review status, diff, daftar file, whitespace dan staged diff, hanya 11 file Admin 1.2 disiapkan untuk commit manual. Tidak melakukan commit, push atau merge. Pekerjaan berhenti setelah dashboard selesai.

Usulan pesan commit: `feat: tambahkan dashboard keuangan admin dengan layout dan data mock`.

## Admin 1.3 — Kelola Dana Keuangan (10 November 2026)

Status: halaman selesai dan tervalidasi pada `feature/frontend-admin`, baseline commit `62d6fd2`. Awal kerja tanpa perubahan tracked/staged; referensi `12-admin-kelola-dana.png` baru dibaca setelah pengguna menambahkannya. `design-references/` tetap untracked.

- Route `/admin/kelola-dana` memakai AdminLayout yang sama. Kelola Dana kini menjadi Link Sidebar, menu aktif dan judul Topbar mengikuti route; Dashboard tetap dapat diakses. Pergantian halaman mereset scroll, menu mobile fokus ke tautan aktif dan menutup seperti sebelumnya.
- Hero hijau/foto masjid, badge MANAJEMEN TRANSAKSI, judul/deskripsi serta panel Kelola Transaksi mengikuti raster final 1856×1395 px, tanpa menyalin margin hitam/bayangan luar aplikasi. Tombol Pemasukan hijau, Pengeluaran oranye dan Lihat Semua nonaktif; status data contoh/fitur belum tersedia tetap jelas. Tidak membuat form/modal/CRUD atau tujuan fiktif.
- Tabel lama diekstrak menjadi `AdminRecentTransactions`, dipakai Dashboard dan Kelola Dana. Kedua halaman menerima kategori/lima transaksi dari service dan konteks layout yang sama, tanpa mock/service baru atau perubahan nilai. Seluruh markup konten Dashboard setelah ekstraksi dibandingkan dengan baseline sebelum perubahan dan identik; CSS Dashboard tidak diubah.
- CSS Kelola Dana terpisah dan dibatasi `.admin-funds*`. Tablet/mobile memakai pola menu/scroll tabel yang sudah ada; tombol bertumpuk pada smartphone, tipografi/spacing menyesuaikan. Iterasi visual merapatkan tinggi hero desktop menjadi sekitar 196 px, merapikan judul/deskripsi mobile dan memberi shadow lembut pada panel.
- Tidak mengubah desain Login, frontend publik, mock laporan publik, backend, kontrak API, autentikasi, dependency atau lockfile. Mode API tetap melaporkan integrasi belum tersedia tanpa request admin dan tanpa fallback mock.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS, 51 test frontend unit/SSR (3 baru) serta 18 test backend; tiga suite browser opsional dilewati pada perintah standar dan dijalankan terpisah.
- Chrome development: 48 skenario browser PASS (51 hasil termasuk induk), mencakup 7 Dashboard/Kelola Dana, 6 Login dan 35 publik. Navigasi Sidebar bolak-balik tidak reload dokumen, judul/menu aktif benar, scroll kembali atas, DOM tabel tetap identik, saldo Dashboard tetap, serta refresh/trailing slash dan error mode API diuji. Regresi publik termasuk modal/gate/filter serta ekspor PDF/PNG/ZIP nyata lulus.
- `npm run build`: PASS. Preview build production: 7 skenario Dashboard/Kelola Dana PASS (8 hasil termasuk induk). Visual desktop 1728×1080 / 1366×768, tablet 768×1024 dan mobile 390×844 ditinjau. Tidak ada overflow horizontal halaman, font/logo gagal, HTTP gagal atau exception runtime aplikasi. Scroll tabel lokal dengan keyboard sampai kolom terakhir tetap berfungsi.
- Screenshot development/production di `tmp/admin13-qa/`, tidak di-stage. QA terbatas Chrome/emulasi viewport; belum perangkat fisik, Safari/Firefox atau klaim identik piksel. Fitur transaksi tetap belum tersedia dan tidak ada kredensial/autentikasi baru.

README dan DESIGN_MAP diperbarui untuk route, reuse dan batasan. Setelah review status, diff, daftar file, whitespace dan staged diff, hanya 11 file Admin 1.3 disiapkan untuk commit manual. Referensi, hasil build, screenshot dan profil Chrome tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah Kelola Dana selesai.

Usulan pesan commit: `feat: tambahkan halaman kelola dana dengan tabel transaksi bersama`.

## Admin 1.4 — Kategori Dana (10 November 2026)

Status: implementasi dan QA selesai pada `feature/frontend-admin`, baseline commit `58f0710`. Awal kerja tanpa perubahan tracked/staged; `design-references/` tetap untracked. Referensi final `13-admin-kategori-dana.png` (1856×1172 px) dibaca sebelum implementasi.

- Route `/admin/kategori-dana` memakai AdminLayout yang sama. Kategori Dana menjadi Link aktif pada Sidebar dan judul Topbar mengikuti route. Navigasi Dashboard ↔ Kelola Dana ↔ Kategori Dana memakai pola menu/fokus/scroll yang sudah ada, tanpa layout baru.
- Heading bergaris oranye, subtitle, Tambah Kategori hijau, kartu NO/KATEGORI/AKSI dan tiga kategori mengikuti referensi. Badge hijau/emas/oranye; ikon Pencil/Trash2 memiliki label per kategori dan target 44 px. Semua tujuh aksi nonaktif dengan keterangan belum tersedia, tanpa form, dialog atau operasi CRUD.
- Resume lama diekstrak menjadi `AdminBalanceSummary`. Dashboard tetap memakai markup/visual semula; Kategori Dana menghilangkan deskripsi tambahan sesuai raster. Tabel memakai Saldo Awal pada kolom nominal pertama, kategori/nominal/tanggal yang sama, dan total akhir tetap 17.228.200. Badge emas Jum'at Berkah hanya styling daftar kategori, bukan perubahan warna sumber atau titik biru resume.
- Tidak membuat mock/service kedua atau mengubah saldo/transaksi. Seluruh markup konten Dashboard dan Kelola Dana sesudah ekstraksi dibandingkan dengan baseline sebelum perubahan dan identik. Desain Login/publik, CSS Dashboard/Kelola Dana, backend, kontrak API, autentikasi, dependency dan lockfile tidak diubah.
- CSS baru dibatasi halaman kategori. Tablet memakai Sidebar yang sama; mobile menumpuk heading/tombol. Tabel kategori/resume memiliki scroll lokal, petunjuk dan dukungan keyboard; badge tidak memaksa halaman meluap. API tetap belum terhubung dan tidak dipanggil.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS — 54 test frontend unit/SSR (3 baru) dan 18 test backend; tiga suite browser opsional dilewati pada perintah standar, lalu dijalankan terpisah.
- Browser Chrome: 9 skenario admin, 6 login dan 35 publik PASS (50 skenario total), termasuk kesamaan DOM resume, kategori/nilai tidak termutasi, navigasi tiga halaman, menu aktif/judul, scroll tabel sampai kolom terakhir, aksi nonaktif, refresh/trailing slash dan mode API tanpa HTTP/fallback. Regresi publik mencakup modal/gate/filter dan unduhan PDF/PNG/ZIP nyata.
- Pemeriksaan awal refresh membaca DOM lama sebelum dokumen baru siap; sinkronisasi suite QA diperbaiki memakai penanda dokumen dan readyState. Suite admin kemudian diulang dan 9 skenario lulus; ini perbaikan pengujian, bukan perubahan perilaku aplikasi.
- `npm run build`: PASS. Preview production juga lulus 9 skenario admin (10 hasil termasuk induk). Visual pada 1728×1080, 1366×768, 768×1024 dan 390×844 ditinjau: tanpa overflow horizontal halaman, font/logo gagal, HTTP gagal atau exception runtime aplikasi. Label Saldo Awal dan total kategori konsisten dengan Dashboard.
- Screenshot development/production di `tmp/admin14-qa/`, tidak di-stage. QA terbatas Chrome/emulasi viewport; belum perangkat fisik, Safari/Firefox atau klaim identik piksel. Aksi kategori dan autentikasi nyata tetap belum tersedia.

README dan DESIGN_MAP diperbarui. Setelah review status, diff, daftar file, whitespace dan staged diff, hanya 11 file Admin 1.4 disiapkan untuk commit manual. Referensi, build, screenshot dan profil Chrome tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah halaman Kategori Dana selesai.

Usulan pesan commit: `feat: tambahkan halaman kategori dana dengan resume saldo bersama`.

## Admin 1.5 — Profil Masjid (10 November 2026)

Status: selesai pada `feature/frontend-admin`, baseline `5b78aef`. Awal kerja tanpa perubahan tracked/staged; `design-references/` tetap untracked. Referensi final `14-admin-profil-masjid.png` (1766×1405 px) dibaca sebelum implementasi.

- Route `/admin/profil-masjid` dan tautan Sidebar memakai AdminLayout yang sudah ada. Topbar/menu aktif mengikuti halaman. Tidak mengubah halaman Login, Dashboard, Kelola Dana, Kategori Dana atau frontend publik.
- Heading beraksen oranye, tombol hijau, kartu putih, banner statis dan empat field mengikuti desain. Foto/font memakai aset lama; CSS baru dibatasi `.admin-profile*`. Smartphone menumpuk heading/tombol dan menambah tinggi textarea; tablet/mobile mempertahankan menu admin yang sama.
- Service admin minimal membaca salinan field mock publik: nama, heroDescription sebagai deskripsi singkat dan alamat. Kontak kosong karena data sumber belum terverifikasi; tidak menggunakan nomor contoh Figma. Tidak mengubah sumber mock/service publik atau menambah salinan fixture profil.
- Form controlled mendukung edit semua field, nama wajib dan kontak opsional 8–15 digit dengan pemisah lazim. Error ditampilkan di field dan fokus menuju kesalahan pertama; perubahan field membersihkan error/feedback terkait. Nama menolak karakter kontrol, panjang field dibatasi dan teks dirender sebagai nilai input/textarea.
- Simpan hanya memvalidasi serta menandai state sementara di komponen. Catatan dan feedback menegaskan simulasi, belum permanen ke server; feedback digulirkan ke area terlihat setelah simpan. Keluar halaman/refresh mengembalikan data awal. Tidak ada HTTP simpan, localStorage, sessionStorage atau cookie; profil publik tetap.
- Mode API memberi error integrasi profil dan tombol simpan nonaktif tanpa request/fallback mock. Kontrak baca/tulis profil admin dan autentikasi perlu koordinasi backend. Tidak membuat endpoint, database, upload server/crop, form profil tambahan, dependency atau perubahan kontrak API.

### Verifikasi

- `npm run lint`: PASS. `npm test`: PASS — 58 test frontend unit/SSR (4 baru), 18 test backend. Tiga suite browser opsional dilewati pada perintah standar; suite admin/login dijalankan terpisah.
- Chrome development: 11 skenario admin PASS, termasuk empat viewport, menu aktif, navigasi empat halaman, data/angka sebelumnya, edit seluruh field, validasi nama/kontak, fokus, Enter, simpan simulasi, reset saat keluar/refresh/trailing slash, publik tetap dan mode API tanpa HTTP. Enam skenario Login juga PASS.
- Pemeriksaan awal QA diperbaiki agar Enter mengirim karakter tombol lengkap dan perpindahan halaman menunggu konten tujuan terpasang. Suite admin diulang dan lulus; tidak mengubah perilaku halaman lama.
- `npm run build`: PASS. Preview production: 11 skenario admin PASS (12 hasil termasuk induk). Visual ditinjau pada 1728×1080, 1366×768, 768×1024 dan 390×844, tanpa overflow horizontal halaman, aset gagal atau exception runtime aplikasi.
- Screenshot awal, validasi dan simulasi di `tmp/admin15-qa/`, tidak di-stage. QA terbatas Chrome/emulasi viewport; belum perangkat fisik/Safari/Firefox. Penyimpanan permanen, autentikasi dan upload server memang belum tersedia pada milestone ini.

README dan DESIGN_MAP diperbarui. Hanya 10 file terkait Admin 1.5 disiapkan setelah pemeriksaan status/diff/staged diff; referensi, build, log dan artefak QA tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah Profil Masjid selesai.

Usulan pesan commit: `feat: tambahkan halaman profil masjid admin dengan simpan simulasi`.

### Refinement Admin 1.5 — Ganti Foto Masjid

Diminta setelah implementasi awal, sebelum pengguna melakukan commit. Staging 10 file Admin 1.5 dipertahankan; perubahan lanjutan hanya menyentuh halaman/CSS profil, service/validator profil, dua test dan tiga dokumen yang sudah terkait milestone ini.

- Kontrol Ganti Foto berikon Camera, putih semi-transparan dengan shadow di kanan bawah banner. File picker native memiliki label, fokus keyboard, filter JPG/JPEG/PNG/WebP dan hanya satu berkas. Rasio/ukuran/radius banner serta empat field lain tidak diubah. Batalkan Foto mengembalikan aset awal; batal picker mempertahankan preview saat ini.
- Validator awal pada adminProfileService memeriksa jumlah, ekstensi dan MIME yang sesuai, berkas tidak kosong serta maksimum 5 × 1024 × 1024 byte. Berkas rusak yang gagal ditampilkan menghasilkan error dan kembali ke foto awal. Format/ukuran/jumlah yang ditolak tidak menghapus preview valid sebelumnya. Input direset agar berkas yang sama dapat dipilih kembali.
- File dan object URL hanya disimpan pada state komponen. Cleanup melepas URL lama saat mengganti foto, membatalkan, gagal membaca gambar atau unmount. Status di bawah foto dan feedback Simpan menegaskan foto hanya dipratinjau, belum tersimpan ke server. Tidak ada request upload, storage permanen, crop, dependency atau perubahan publik/backend/kontrak.
- Batas integrasi tetap sederhana: state menyimpan File asli dan service menyediakan batas/validator awal. Backend perlu menyepakati endpoint/metode/field multipart, otorisasi dan validasi ulang ekstensi/MIME/isi gambar/ukuran/jumlah, penyimpanan aman serta URL banner yang kelak dibaca konten publik. Batas upload khusus tidak boleh menaikkan batas JSON umum 10 KB.

Verifikasi lanjutan: lint tanpa peringatan; `npm test` lulus 59 test frontend unit/SSR (1 tambahan validator foto) dan 18 backend. Browser development serta preview production lulus 13 skenario admin (14 hasil termasuk induk): native picker lewat Enter, JPG/PNG/WebP, ukuran batas tepat 5 MB pada unit test dan berkas melebihi batas, ekstensi/MIME/jumlah/berkas kosong/rusak, preview/batal, banner tetap, form lain tetap, simpan simulasi dan regresi admin. URL yang dibuat/dilepas dilacak pada penggantian, pembatalan, kegagalan dan keluar halaman; seluruhnya dilepas. Build lulus. Visual diperiksa pada 1728×1080, 1366×768, 768×1024 dan 390×844, tanpa overflow halaman atau exception runtime. Bukti foto di `tmp/admin15-photo-qa/`; tidak di-stage. Pengujian picker menggunakan Chrome dengan intersepsi dialog native, belum perangkat fisik/Safari/Firefox.

Setelah pemeriksaan diff dan staging, total tetap 10 file Admin 1.5; hanya delapan file terkait refinement diperbarui dalam staging. Aset referensi, fixture, log dan hasil build tidak disertakan. Tidak melakukan commit, push atau merge.

Usulan pesan commit yang mencakup hasil akhir: `feat: tambahkan profil masjid admin dengan simulasi simpan dan preview foto`.

## Admin 1.6 — Kelola Agenda (10 November 2026)

Status: selesai pada `feature/frontend-admin`, baseline commit `e51629c`. Awal kerja tanpa perubahan tracked/staged; `design-references/` tetap untracked. Referensi final `15-admin-agenda.png` (1766×1505 px) dibaca sebelum implementasi.

- Route `/admin/agenda` dan tautan Agenda pada Sidebar memakai AdminLayout yang sama. Judul Topbar/menu aktif mengikuti route, navigasi lima halaman admin berfungsi. Tidak mengubah markup/CSS halaman admin lama atau frontend publik.
- Heading beraksen oranye, Tambah Agenda hijau, 12 kartu putih horizontal dengan kalender, nama, frekuensi/jadwal dan ikon Edit/Hapus mengikuti raster. Menggunakan admin-panel, font dan ikon yang sudah tersedia; CSS tambahan dibatasi `.admin-agenda*`. Aksi ikon 44 px. Pada smartphone tombol heading selebar konten, nama/jadwal membungkus dan aksi berpindah baris agar tetap nyaman.
- Memakai `getAgenda({ signal })` dari service publik yang sudah ada, tanpa service/fixture baru. Seluruh kelompok/items dipertahankan: 5 Mingguan, 2 Bulanan dan 5 Tahunan / PHBI. Tidak mengubah nilai sumber atau membatasi jumlah berdasarkan screenshot. Jadwal tetap string berulang, bukan tanggal/jam hasil asumsi.
- Perbedaan referensi dipertahankan sesuai data: mock memakai Peringatan Maulid Nabi Muhammad SAW untuk Bulan Rabi’ul Awwal, sementara raster mengulang nama Peringatan Tahun Baru Islam. Semua jadwal tahunan memakai awalan Bulan; ejaan/kapitalisasi lainnya tetap mengikuti sumber, termasuk Al-Qur’an dan Ibu-Ibu.
- Semua 25 aksi Tambah/Edit/Hapus nonaktif, memiliki title/label dan catatan belum tersedia. Tidak membuat form/dialog/CRUD/notifikasi sukses. Halaman memiliki loading/error/kosong, pembatalan saat unmount, dan tidak menghubungi API admin. Mode API memakai error adapter agenda lama yang belum dihubungkan, tanpa request/fallback mock.
- Backend, kontrak API, sumber agenda publik, autentikasi, dependency dan lockfile tidak berubah. README dan DESIGN_MAP diperbarui untuk route serta keputusan perbedaan data.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS — 60 frontend unit/SSR (1 route baru), 18 backend; tiga suite browser opsional dilewati dalam perintah standar, admin/login dijalankan terpisah.
- Chrome development: 15 skenario admin dan 6 Login PASS (23 hasil termasuk dua induk). Pengujian baru membandingkan seluruh nama/frekuensi/jadwal dengan mock sumber, jumlah 5/2/5, 25 aksi nonaktif, navigasi lima halaman tanpa reload, menu aktif, refresh/trailing slash dan kesamaan daftar/jadwal publik. Regresi mencakup saldo/tabel, form profil, preview foto/cleanup URL dan login sebelumnya.
- `npm run build`: PASS. Preview production: 15 skenario admin PASS (16 hasil termasuk induk), termasuk error API tanpa HTTP. Visual ditinjau pada 1728×1080, 1366×768, 768×1024 dan 390×844: tanpa overflow horizontal halaman, teks/aksi bertabrakan, aset gagal atau exception runtime aplikasi.
- Screenshot di `tmp/admin16-qa/`, tidak di-stage. QA terbatas Chrome/emulasi viewport; belum perangkat fisik/Safari/Firefox. Data tetap contoh, CRUD menunggu desain form/dialog dan integrasi admin menunggu kesepakatan backend.

Hanya sembilan file Admin 1.6 di-stage setelah pemeriksaan status, diff, daftar file dan staged diff. Aset referensi, log, screenshot, profil Chrome dan hasil build tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah daftar Agenda selesai.

Usulan pesan commit: `feat: tambahkan halaman agenda admin dari data agenda publik`.

## Admin 1.7 — Kontak & Pengaturan Website (10 November 2026)

Status: selesai pada `feature/frontend-admin`, baseline commit `094caf2`. Awal kerja tanpa perubahan tracked/staged; `design-references/` tetap untracked. Raster final `16-admin-kontak-pengaturan.png` (1766×1056 px), AdminLayout, Profil Masjid Admin dan sumber konten publik diperiksa sebelum implementasi.

- Route `/admin/kontak-pengaturan` memakai AdminLayout yang sama; menu Kontak & Pengaturan aktif dan Topbar berjudul lengkap. Heading oranye, tombol Simpan, kartu Informasi Kontak berikon Phone, empat field dan switch mengikuti referensi. CSS baru dibatasi `.admin-settings*`, tanpa perubahan CSS atau perilaku halaman lama.
- Service minimal memisahkan state awal dari sumber publik: WhatsApp/email kosong, Maps kosong karena belum terverifikasi, alamat dari salinan mockPublicContent.address. Tidak menganggap contoh raster atau email akun Sidebar sebagai data resmi. Switch default aktif merupakan contoh UI lokal, bukan status keamanan/akses laporan nyata.
- Semua field controlled dan opsional; WhatsApp divalidasi 8–15 digit, email dengan format ringan/karakter kontrol, URL HTTPS pada domain/path Google Maps yang didukung. Batas panjang input diterapkan. Error per field, aria-invalid/describedby dan fokus kesalahan pertama tersedia. Switch checkbox native ber-role switch mendukung mouse/Space dan target 44 px.
- Simpan hanya memvalidasi dan menandai state sementara, dengan catatan/feedback eksplisit belum permanen. Edit/toggle membersihkan feedback; keluar/refresh mengembalikan data awal. Tidak ada HTTP simpan, localStorage/sessionStorage/cookie atau penguncian laporan baru. Mode API memberi error integrasi tanpa request/fallback mock, tombol Simpan nonaktif.
- Alamat/kontak juga muncul di Profil Masjid Admin. State tetap terpisah, tanpa sinkronisasi palsu; integrasi berikutnya perlu sumber API tunggal, pemetaan telepon/WhatsApp/email/alamat/peta, verifikasi dan aturan publikasi. Semantik toggle visibilitas serta otorisasi laporan perlu disepakati backend. Tidak mengubah kontrak API sepihak.
- Tidak mengubah frontend publik, Login, Dashboard, Kelola Dana, Kategori Dana, Profil Masjid, Agenda, backend, mock/service publik, autentikasi, dependency atau lockfile. Tidak membuat fitur QRIS/rekening/akun. README dan DESIGN_MAP diperbarui.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS — 64 frontend unit/SSR (4 baru), 18 backend; tiga suite browser opsional dilewati dalam perintah standar, admin/login dijalankan terpisah.
- Chrome development: 17 skenario admin dan 6 Login PASS (25 hasil termasuk dua induk). Skenario baru mencakup route/menu, edit seluruh field, validasi/fokus, Enter, toggle mouse/Space, simpan simulasi, feedback dibersihkan, reset keluar/refresh/trailing slash, field opsional, profil tidak tersinkron, kontak publik tetap placeholder dan laporan publik masih terbuka setelah toggle dimatikan. Regresi admin lama termasuk tabel/saldo, profil/foto/cleanup URL dan agenda lulus.
- `npm run build`: PASS. Preview production: 17 skenario admin PASS (18 hasil termasuk induk), termasuk error mode API tanpa HTTP. Visual desktop 1728×1080 / 1366×768, tablet 768×1024 dan mobile 390×844 ditinjau, tanpa overflow halaman, kontrol terpotong, aset gagal atau exception runtime aplikasi.
- Screenshot di `tmp/admin17-qa/`, tidak di-stage. QA terbatas Chrome/emulasi viewport, belum perangkat fisik/Safari/Firefox. API admin/penyimpanan permanen dan sumber pengaturan bersama belum tersedia; toggle hanya simulasi antarmuka.

Hanya 10 file Admin 1.7 di-stage setelah review status, diff, daftar file dan staged diff. Referensi, log, screenshot, profil Chrome serta build tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah halaman ini selesai.

Usulan pesan commit: `feat: tambahkan kontak dan pengaturan website admin dengan simpan simulasi`.

## Admin 1.8 — Kelola Akun (10 November 2026)

Status: selesai pada `feature/frontend-admin`, HEAD awal `094caf2`. Saat mulai, sepuluh file Admin 1.7 masih staged dan belum di-commit; pekerjaan/staging tersebut dipertahankan. `design-references/` tetap untracked. AGENTS, AdminLayout/routing/pola sebelumnya serta referensi final `17-admin-kelola-akun.png` (1766×1056 px) diperiksa sebelum implementasi.

- Route `/admin/kelola-akun` dan tautan Sidebar memakai AdminLayout yang sama. Label Super Admin Only dengan Shield, heading oranye, Tambah Akun Admin, panel pencarian dan empat kartu mengikuti referensi. Menggunakan admin-panel, font dan ikon yang sudah ada; CSS baru dibatasi `.admin-accounts*`.
- Fixture terpisah berisi empat contoh nama/email/role/tanggal: Super Admin, Ahmad Fauzi, Siti Rahmawati aktif; Budi Santoso nonaktif. Tidak menambah password, token atau kredensial. Inisial diselaraskan dengan nama; tanggal memakai formatter Indonesia panjang. Placeholder pencarian diperjelas menjadi nama/email sesuai fungsi halaman.
- Service menyediakan salinan fixture dan filter murni nama/email. Query controlled diterapkan lewat tombol atau Enter, tanpa membedakan kapital, dengan trim spasi luar. Query kosong menampilkan semua akun; tidak cocok menghasilkan empty state. Tidak mencari berdasarkan role atau memutasi sumber. Pencarian hilang saat keluar/refresh, tanpa URL/storage/cookie.
- Semua 10 aksi pengelolaan nonaktif dengan label/title: Tambah serta Edit/Nonaktifkan pada akun aktif, Edit/Hapus/Aktifkan pada nonaktif. Tidak membuat form/modal CRUD, registrasi, reset password, aktivasi atau penghapusan sungguhan. Search adalah satu-satunya form interaktif.
- Label Super Admin Only dan field role hanya data visual, bukan otorisasi atau sistem role. Backend nantinya wajib memverifikasi pengguna terautentikasi serta izin Super Admin pada akses daftar dan setiap operasi akun. Tidak membuat autentikasi, login sukses palsu, endpoint atau perubahan kontrak API. Mode API memberi error integrasi tanpa HTTP/fallback mock.
- Responsive mengikuti menu lama, tombol tablet/mobile minimum 44 px, teks/email membungkus dan aksi berpindah baris pada smartphone. Tidak mengubah halaman admin sebelumnya, publik, backend, sumber data lama, dependency atau lockfile. README dan DESIGN_MAP diperbarui.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS — 68 frontend unit/SSR (4 baru), 18 backend; tiga suite browser opsional dilewati dalam perintah standar, admin/login dijalankan terpisah.
- Chrome development: 19 skenario admin dan 6 Login PASS (27 hasil termasuk dua induk). Skenario baru menguji empat contoh/status/tanggal, 10 aksi nonaktif, pencarian tombol/Enter/nama/email/kapital/spasi/domain, empty state, pemulihan hasil tanpa mutasi, query tidak persisten, refresh/trailing slash dan navigasi enam halaman sebelumnya. Regresi halaman admin lama dan Login lulus.
- `npm run build`: PASS. Preview production: 19 skenario admin PASS (20 hasil termasuk induk), termasuk mode API tanpa HTTP. Visual ditinjau pada 1728×1080, 1366×768, 768×1024 dan 390×844, tanpa overflow horizontal halaman, benturan teks/aksi, aset gagal atau exception runtime aplikasi.
- Screenshot di `tmp/admin18-qa/`, tidak di-stage. QA terbatas Chrome/emulasi viewport; belum perangkat fisik/Safari/Firefox. Akun tetap contoh, CRUD/API/autentikasi/otorisasi menunggu backend dan desain berikutnya.

Sebelas file memuat perubahan Admin 1.8: App, AdminLayout, halaman/CSS akun, mock, service, dua test serta README/DESIGN_MAP/PROGRESS. Setelah pemeriksaan diff/status/staged diff, hanya perubahan terkait ini ditambahkan ke staging. Total staged menjadi 15 file karena Admin 1.7 yang sudah staged dipertahankan; empat file khusus Admin 1.7 tidak diedit. Aset referensi, log, screenshot, profil Chrome dan build tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah Kelola Akun selesai.

Usulan pesan commit untuk staging gabungan Admin 1.7–1.8: `feat: tambahkan pengaturan website dan kelola akun admin`.

## Admin 1.9 — Kode Akses Laporan Publik (10 November 2026)

Status: selesai pada `feature/frontend-admin`, baseline commit `72def82`. Awal kerja tanpa perubahan tracked/staged; `design-references/` tetap untracked. Raster final `18-admin-kode-akses-laporan.png` (1766×1056 px), AdminLayout/routing, service/modal gate publik, kontrak API dan keberadaan endpoint pemeriksaan backend diperiksa sebelum implementasi.

- Route `/admin/kode-akses-laporan` memakai AdminLayout; menu/Topbar Kode Akses Laporan mengikuti route. Label Super Admin Only, heading oranye, dua kartu status/cara kerja, ikon dan styling mengikuti referensi dengan CSS khusus `.admin-report-access*`.
- Fixture/service baru hanya memuat metadata contoh active/changedDate/changedTime/changedBy. Status Aktif dan riwayat bukan data backend sebenarnya. Halaman menggunakan delapan simbol placeholder tetap, tanpa nilai kode asli/hash atau impor sandi mock publik. Chip Simulasi menggantikan klaim Terenkripsi; catatan data contoh ditampilkan.
- Ubah Kode Akses nonaktif dengan keterangan belum tersedia. Tidak ada form perubahan kode, kredensial, HTTP, storage/cookie atau operasi simpan. Mode API memberikan error integrasi metadata tanpa fallback. Autentikasi Super Admin belum dibuat; label hanya visual.
- Cara Kerja mengikuti koreksi penting M1.8b: gate hanya melalui CTA Beranda/Footer; kode sesuai menutup gate dan mengarah ke /laporan-keuangan. Akses langsung/refresh tetap tanpa gate. Kode bukan autentikasi, otorisasi atau pengamanan data keuangan; tidak membuat JWT, session, route guard atau penguncian laporan sekarang maupun sebagai usulan integrasi.
- Endpoint publik POST /api/public/report/check-password sudah tersedia, frontend checker masih mock/belum dihubungkan. Integrasi mendatang harus menyatukan perubahan kode oleh Super Admin dengan sumber kode/verifikasi backend yang sama, menyepakati penyimpanan/metadata dan otorisasi pengelola secara terpisah. Respons status tidak mengirim kode/hash; perubahan kode hanya untuk kode yang diperiksa gate. Tidak mengarang endpoint admin baru.
- Tidak mengubah backend, API_CONTRACT, alur/service/mock gate publik, sandi publik, halaman laporan, halaman admin lama, dependency atau lockfile. README dan DESIGN_MAP diperbarui.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS — 71 frontend unit/SSR (3 baru) dan 18 backend; tiga suite browser opsional dilewati dalam perintah standar, lalu dijalankan terpisah.
- Chrome development: 21 skenario admin, 6 Login dan 35 publik PASS (62 skenario; 65 hasil termasuk tiga induk). Pemeriksaan baru mencakup menu/judul, kedua kartu/metadata/placeholder, chip Simulasi, tombol nonaktif, tanpa form/input kode, penjelasan M1.8b, empat viewport, refresh/trailing slash, navigasi tujuh halaman sebelumnya dan error API tanpa HTTP. Suite publik memverifikasi CTA gate, akses langsung/refresh, tanpa persistensi sandi/otorisasi, serta ekspor PDF/PNG/ZIP dan regresi publik lainnya.
- Setelah teks Cara Kerja diringkas agar mudah dibaca, lint/test/build dan 21 skenario admin diulang dan lulus. `npm run build`: PASS; preview production lulus 21 skenario admin (22 hasil termasuk induk). Visual ditinjau pada 1728×1080, 1366×768, 768×1024 dan 390×844, tanpa overflow halaman, elemen terpotong, aset gagal atau exception runtime aplikasi.
- Screenshot di `tmp/admin19-qa/`, tidak di-stage. QA terbatas Chrome/emulasi viewport; belum perangkat fisik/Safari/Firefox. Halaman tetap mock; metadata/perubahan kode dan autentikasi pengelola menunggu kesepakatan/integrasi backend.

Sebelas file terkait Admin 1.9 di-stage setelah review status, diff, daftar file dan staged diff. Aset referensi, log, screenshot, profil Chrome dan build tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah halaman ini selesai.

Usulan pesan commit: `feat: tambahkan halaman kode akses laporan dengan status simulasi`.

## Admin 1.10 — Activity Log (10 November 2026)

Status: selesai pada `feature/frontend-admin`, baseline commit `a1e4ed8`. Awal kerja tanpa perubahan tracked/staged; `design-references/` tetap untracked. AGENTS, AdminLayout, routing, pola halaman/service/test admin dan raster final `19-admin-activity-log.png` (1766×3540 px) diperiksa sebelum implementasi.

- Route `/admin/activity-log` dan menu Sidebar memakai AdminLayout yang sama. Topbar/menu aktif mengikuti route. Hero hijau/foto, badge append-only, empat filter dan pencarian, banner informasi serta timeline mengikuti referensi. CSS dibatasi `.admin-activity*`; tidak mengubah markup/CSS halaman lama.
- Fixture lokal mandiri berisi sembilan contoh dalam tujuh tanggal: tambah/edit/hapus transaksi, pembuatan/penonaktifan akun, perubahan kode gate, cetak kwitansi dan agenda. Rincian read-only tanpa kode/password asli, token atau rahasia. Perbedaan contoh dengan raster dicatat di DESIGN_MAP; tidak mengubah sumber data halaman lain.
- Service memberi salinan fixture, filter murni gabungan AND dan pengelompokan tanggal terbaru dahulu tanpa mutasi. Admin/jenis/tanggal/modul serta pencarian nama/judul langsung bekerja; query mengabaikan kapital dan spasi luar. Tersedia loading/error/kosong, abort saat unmount dan pengumuman jumlah hasil. Filter hilang saat keluar/refresh, tanpa persistensi URL/storage/cookie.
- Tidak membuat pencatat audit di frontend atau aksi ubah/hapus log. Banner menyebut konsep yang belum ditegakkan; integritas, kelengkapan, keamanan pencatatan, pembatasan akses dan penyaringan data sensitif menjadi kebutuhan backend. Perubahan kode contoh tetap hanya untuk gate UI sesuai M1.8b. Mode API memberi error belum tersedia tanpa HTTP/fallback mock; tidak mengarang endpoint.
- Filter empat kolom menjadi dua pada tablet dan satu pada smartphone. Header/badge membungkus, detail label/nilai menumpuk di mobile, marker dan garis timeline tetap terbaca. Lebar label detail desktop diperbaiki dan kontras badge ditingkatkan dari tinjauan visual.
- Tidak mengubah backend, API_CONTRACT, frontend publik, halaman admin sebelumnya, autentikasi, sumber mock lama, dependency atau lockfile. Penyesuaian bersama hanya registrasi route, tautan Sidebar dan perluasan test. README dan DESIGN_MAP diperbarui.

### Verifikasi

- `npm run lint`: PASS tanpa peringatan. `npm test`: PASS — 76 frontend unit/SSR (5 baru) dan 18 backend; tiga suite browser opsional dilewati pada perintah standar dan admin/login dijalankan terpisah.
- Chrome development: 23 skenario admin dan 6 Login PASS (31 hasil termasuk dua induk). Activity Log diuji untuk jumlah/sumber contoh, tujuh grup tanggal, posisi setiap tanggal, empat filter terpisah/gabungan, pencarian kapital/spasi/nama/judul, empty state, pemulihan hasil tanpa mutasi, tanpa aksi log/persistensi, refresh/trailing slash dan navigasi delapan halaman sebelumnya. Regresi admin/Login lama lulus.
- Pengujian browser awal bersamaan dengan test SSR mengalami kegagalan pemuatan dua dependency Vite dan timeout Dashboard. Setelah lint/unit/build selesai, browser diulang secara berurutan dan seluruhnya lulus tanpa menyembunyikan kegagalan. Tidak ditemukan error runtime aplikasi pada pengulangan.
- `npm run build`: PASS. Preview production: 23 skenario admin PASS (24 hasil termasuk induk), termasuk error mode API tanpa HTTP. Visual ditinjau pada 1728×1080, 1366×768, 768×1024 dan 390×844, tanpa overflow horizontal halaman atau rincian kartu bertabrakan. QA terbatas Chrome/emulasi viewport; belum perangkat fisik/Safari/Firefox.
- Screenshot development/production di `tmp/admin110-qa/`, tidak di-stage. Activity Log tetap data contoh; API, autentikasi/pembatasan akses dan penegakan audit backend belum diintegrasikan.

Sebelas file terkait Admin 1.10 di-stage setelah pemeriksaan status, diff, daftar file dan staged diff. Referensi, screenshot, log, profil Chrome serta hasil build tidak disertakan. Tidak melakukan commit, push atau merge; berhenti setelah Activity Log selesai.

Usulan pesan commit: `feat: tambahkan activity log admin dengan filter lokal`.
