# Sistem Keuangan dan Profil Masjid Al-Hidayah

Repository kolaborasi mahasiswa untuk frontend publik dan backend sistem keuangan masjid. M1.1a melengkapi layout publik dan Beranda dengan foto serta logo dari referensi Blade dan font Plus Jakarta Sans lokal, sambil mempertahankan refinement skala M1.1. M1.2 menambahkan halaman Agenda beserta navigasi dan data mock bersama Beranda. M1.3 melengkapi Profil Masjid memakai data bersama Beranda, linimasa, dan tujuh pengurus. Laporan tetap placeholder; Kontak menunggu M1.4.

## Teknologi dan prasyarat

- Frontend: React, Vite, JavaScript/JSX, Tailwind CSS v4, React Router, Lucide React.
- Backend: Node.js dan Express v5, tanpa database.
- npm workspaces, satu `package-lock.json` di root.
- Node.js **24 atau lebih baru**, npm **10 atau lebih baru**, serta Git.

Node.js dipakai untuk watch mode, pemuatan `.env`, dan test runner bawaan sehingga backend tidak memerlukan nodemon atau dotenv. Dependency `@types/react` dari template hanya membantu editor; kode aplikasi tetap JavaScript/JSX.

## Instalasi

Jalankan dari root repository:

```sh
npm ci
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

`npm ci` memasang dependency kedua workspace berdasarkan lockfile. Gunakan `npm install` saat memang mengubah dependency. Penyalinan `.env` bersifat opsional: frontend tetap memakai mock dan backend memakai port 3000 tanpa berkas tersebut. Jangan menimpa `.env` lokal yang sudah berisi konfigurasi tim.

Pada npm 11, instalasi lokal dapat menampilkan pemberitahuan skrip `fsevents` opsional dari Vite yang belum diizinkan. Fondasi ini sudah berhasil diuji tanpa mengubah izin skrip tersebut.

## Menjalankan aplikasi

Terminal pertama, frontend mandiri:

```sh
npm run dev:frontend
```

Buka `http://localhost:5173`. Route publik: `/`, `/agenda`, `/profil`, `/laporan-keuangan`. Navbar dan Footer dipakai bersama melalui `PublicLayout`. Menu Kontak dan Masuk Pengurus belum aktif. CTA Profil sudah menuju `/kontak`, yang sementara ditangani halaman 404 sampai M1.4. Halaman tidak dikenal menampilkan placeholder 404.

Terminal kedua, backend mandiri:

```sh
npm run dev:backend
```

Backend memakai `http://127.0.0.1:3000` dan memuat `backend/.env`. Uji tanpa frontend:

```sh
curl http://127.0.0.1:3000/api/health
```

Respons: `{"success":true,"data":{"status":"ok"}}`.

Perintah start backend tanpa watch:

```sh
npm run start:backend
```

Untuk lingkungan production, set `NODE_ENV=production` melalui environment proses. Perintah start hanya menjalankan server; tidak melakukan deployment. `PORT` dan `HOST` dapat diubah melalui environment atau `.env`; environment proses memiliki prioritas.

Kedua workspace juga dapat dijalankan dari direktorinya masing-masing dengan `npm run dev`; backend menyediakan `npm start` dan frontend menyediakan `npm run build`.

## Mock dan integrasi API

Konfigurasi `frontend/.env`:

```dotenv
VITE_DATA_SOURCE=mock
VITE_API_BASE_URL=/api
```

- `mock` adalah bawaan, tidak menghubungi backend. Beranda, Agenda, Profil, dan Footer memakai konten referensi dari `publicContentService`; konten ini belum menjadi data produksi terverifikasi.
- `VITE_DATA_SOURCE=api` tersedia pada service health. Konten publik belum memiliki endpoint bisnis; Beranda menampilkan pesan integrasi belum tersedia pada mode ini. Restart Vite setelah mengubah `.env`.
- `PublicLayout` memuat konten melalui `src/services/publicContentService.js` lalu membagikannya kepada Beranda, Agenda, dan Profil. Ringkasan serta daftar kegiatan berasal dari satu `agendaService` dan mock agenda; statistik dihitung dari daftar. Service health tetap tersedia; komponen tidak memanggil API langsung.
- Proxy Vite meneruskan `/api` ke `http://127.0.0.1:3000`, sehingga integrasi lokal tidak memerlukan CORS. Jika port backend berubah, sesuaikan target di `frontend/vite.config.js`.
- Semua variabel `VITE_*` tersedia pada browser: jangan mengisinya dengan rahasia. Nilainya ditanam saat build.
- Proxy hanya berlaku pada server development Vite. Untuk integrasi di hosting kelak, tim perlu menyepakati routing `/api` atau URL API dan kebijakan CORS. Hosting dengan BrowserRouter juga perlu fallback ke `index.html` untuk route frontend. Belum ada konfigurasi deployment pada milestone ini.

## Verifikasi lokal

```sh
npm ls --workspaces --depth=0
npm run lint
npm test
npm run build
npm audit
```

`lint` menjalankan Oxlint frontend dan pemeriksaan sintaks backend. `test` menjalankan delapan test frontend melalui Node.js/Vite SSR (Agenda/Profil, konsistensi data bersama, loading/empty/error, mode API) dan tiga test HTTP backend (health, 404, JSON tidak valid). Pemeriksaan visual dan navigasi browser tetap diperlukan. Build menghasilkan `frontend/dist`, yang diabaikan Git.

Untuk memeriksa hasil build lokal: `npm run preview --workspace frontend`. Preview tidak menyediakan proxy API; gunakan mode mock untuk pemeriksaan mandiri.

## Struktur repository

```text
frontend/
  src/
    components/  # PublicLayout, Navbar, Footer
    pages/       # Beranda, Agenda, Profil; placeholder Laporan dan 404
    services/    # Pengambilan data melalui mock atau HTTP
    mocks/       # Data contoh teknis
    utils/       # Pembacaan konfigurasi frontend
  .env.example
backend/
  src/app.js     # Inisialisasi Express, health, 404, error
  src/server.js  # Konfigurasi dan proses server
  test/          # Pengujian HTTP
  .env.example
docs/
  API_CONTRACT.md
  DESIGN_MAP.md
  PROGRESS.md
AGENTS.md
package.json
package-lock.json
```

## SOP Git dan pembagian pekerjaan

`main` adalah branch stabil. Untuk fitur berikutnya, buat branch deskriptif seperti `fitur/profil-masjid`; koordinasikan perubahan frontend/backend melalui kontrak API. Setelah validasi lokal, periksa `git status`, `git diff`, lalu file yang akan di-stage dan `git diff --cached`. Git staging boleh dilakukan setelah pemeriksaan. Hanya pengguna yang memutuskan dan mengeksekusi commit serta push, dengan pesan berbahasa Indonesia. Jangan melakukan merge/rebase otomatis atau operasi destruktif.

Repository GitHub private: [Latfiansya/sistem-keuangan-masjid](https://github.com/Latfiansya/sistem-keuangan-masjid). Remote `origin` menggunakan SSH: `git@github.com:Latfiansya/sistem-keuangan-masjid.git`. Branch utama adalah `main`. GitLab kampus akan ditambahkan sebagai remote kedua kemudian. Jangan memasukkan `.env`, kredensial, token, dependency terpasang, log, atau hasil build ke Git.

## Dokumen kerja dan rujukan

- [Aturan agent](AGENTS.md)
- [Kontrak API](docs/API_CONTRACT.md)
- [Peta desain Figma](docs/DESIGN_MAP.md)
- [Perkembangan milestone](docs/PROGRESS.md)
- [Integrasi Tailwind v4 dengan plugin Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Inisialisasi React melalui Vite](https://vite.dev/guide/)
- [React Router mode deklaratif](https://reactrouter.com/start/declarative/installation)
