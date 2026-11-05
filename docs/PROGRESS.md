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
