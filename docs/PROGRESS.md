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
