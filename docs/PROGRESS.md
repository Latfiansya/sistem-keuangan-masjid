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
