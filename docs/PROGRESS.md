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
