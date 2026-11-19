# Rangkuman Pekerjaan Backend — Sistem Keuangan Masjid

Dokumen ini merangkum seluruh pekerjaan pengembangan **backend** pada repository `sistem-keuangan-masjid` dari tahap fondasi awal (Milestone 0) hingga tahap integrasi PostgreSQL, autentikasi/keamanan, CRUD admin, dan penyambungan ke frontend API (`VITE_DATA_SOURCE=api`).

---

## 1. Ringkasan Teknologi & Arsitektur

- **Runtime & Framework**: Node.js `>=24.0.0` (ES Modules, `--watch`, `--env-file-if-exists=.env`, `node --test`), Express `^5.3.0`.
- **Database & Keamanan**: `pg` `^8.23.1` (PostgreSQL pool + parameterized query `$1, $2, ...`), `bcryptjs` `^3.0.3`, modul bawaan `node:crypto` (`scrypt`, HMAC-SHA256 HS256, `timingSafeEqual`).
- **Pola Arsitektur 3-Layer** di `backend/src/`:
  1. **Routes & Controllers** (`routes/`, `controllers/`) — parsing HTTP request, otorisasi role, penerusan `auditUserId`, pembentukan response envelope `{ success, data }` / `{ success: false, error: { code, message } }`.
  2. **Services** (`services/`) — validasi bisnis, aturan format/batas karakter/Rupiah/tanggal, pencegahan duplikasi & proteksi relasi, logika hash & token.
  3. **Repositories** (`repositories/`) — akses baca/tulis PostgreSQL schema `keu_masjid` (tanpa ORM), transaksi database (`BEGIN` / `COMMIT` / `ROLLBACK`), serta injeksi repository uji untuk unit/HTTP test.
- **Konfigurasi, Middleware & Utilitas** (`config/`, `middlewares/`, `utils/`, `scripts/`).

---

## 2. Kronologi Tahapan Pekerjaan Backend

### Tahap 1 — Fondasi Backend (Milestone 0)
- Memisahkan `backend/src/app.js` (definisi Express app untuk pengujian & server) dan `backend/src/server.js` (startup HTTP listener + graceful shutdown `SIGINT`/`SIGTERM`).
- Menambahkan konfigurasi environment terpusat di `backend/src/config/env.js` (`PORT`, `HOST`, `NODE_ENV`, `API_BASE_PATH`, `JSON_BODY_LIMIT`).
- Menyiapkan endpoint awal `GET /api/health`, penanganan JSON 404, validasi payload JSON maksimal `10kb` (`413`), serta middleware error terpusat lewat `httpError.js` tanpa membocorkan stack trace.

### Tahap 2 — Endpoint Publik & Gate Sandi Bersama
- Menambahkan `publicRoutes.js`, `publicController.js`, `publicContentService.js`, `agendaService.js`, dan `reportService.js`:
  - `GET /api/public/content`: menyajikan profil masjid, statistik, visi-misi, program kemakmuran, linimasa sejarah, pengurus, serta kontak/donasi (menyembunyikan data kontak/donasi dengan flag `verified: false`).
  - `GET /api/public/agenda`: menyajikan deskripsi dan kelompok kegiatan (`weekly`, `monthly`, `yearly`).
  - `POST /api/public/report/check-password`: memverifikasi sandi gate dengan hash `scrypt` (`passwordHash.js` + `timingSafeEqual`) serta rate limiter anti brute-force (`rateLimiter.js` -> HTTP `429 TOO_MANY_REQUESTS`).
  - `GET /api/public/finance/report`: menyajikan laporan keuangan publik per rentang tanggal (`startDate`, `endDate`), menghitung saldo awal terbawa dari mutasi sebelumnya, dan menandai `status: "unavailable"` untuk periode di luar cakupan data.

### Tahap 3 — Endpoint Admin 3-Layer & Konfigurasi Env Database
- Menambahkan modul admin pada `adminRoutes.js`:
  - **Keuangan (`adminFinance*`)**: `GET /api/admin/dashboard`, CRUD `/api/admin/categories`, `GET /api/admin/finance/report` (filter & pagination), dan CRUD `/api/admin/transactions`.
  - **Konten & Pengaturan (`adminSettings*`)**: `GET`/`PUT /api/admin/profile`, `GET /api/admin/agenda`, `GET`/`PUT /api/admin/donation-settings`, `GET`/`PUT /api/admin/website-settings`.
  - **Manajemen & Audit (`adminManagement*`)**: `POST /api/admin/auth/login` (stub `503` saat kredensial DB belum terhubung + rate limiter), `POST /api/admin/auth/logout`, `GET /api/admin/accounts`, `GET /api/admin/report-access`, dan `GET /api/admin/activity-logs`.
- Memperluas `loadEnv().db` (`env.js` & `.env.example`) agar mendukung `DATABASE_URL` maupun parameter `DB_*` (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `DB_SCHEMA`, `DB_SSLMODE`).

### Tahap 4 — Integrasi PostgreSQL & Penghapusan Data Dummy Backend
- Menambahkan dependency `pg` dan modul `backend/src/config/database.js` (`createDatabasePool`, `checkDatabaseConnection`, `withDatabaseTransaction`, `closeDefaultDatabasePool`) dengan default `search_path=keu_masjid,public`.
- Menambahkan endpoint `GET /api/health/db` dan skrip CLI baca-saja `npm run db:check --workspace backend` (`backend/src/scripts/checkDatabase.js`).
- Membuat `backend/src/utils/financeMapping.js` untuk pemetaan ID/warna kategori, konversi `NUMERIC` PostgreSQL ke safe integer Rupiah (`toRupiahInteger`), penyelesaian ID audit (`resolveAuditPenggunaId`), dan pemetaan kode error PostgreSQL (`23514`, `23505`, `23503`, `23001`) ke pesan HTTP yang aman.
- **Menghapus seluruh file data dummy** di `backend/src/data/` dan memigrasikan semua file `repositories/` menjadi query SQL parameterized ke PostgreSQL (`$1, $2, ...`), sekaligus mengubah `services/` dan `controllers/` menjadi `async/await`.

### Tahap 5 — Sinkronisasi Skema DB Lengkap, Keamanan/CORS, Autentikasi Admin & CRUD Lengkap
- **Sinkronisasi Tabel & Kolom DB Terbaru**:
  - Memperbarui `publicContentRepository.js` agar membaca seluruh tabel konten yang telah dilengkapi tim database: `m_profil_masjid`, `m_misi_masjid`, `m_program_masjid`, `m_sejarah_masjid`, `m_pengurus`, serta kolom lokasi/bank/QRIS pada `m_pengaturan_website`.
  - Memperbarui `adminSettingsRepository.js` agar `GET`/`PUT /api/admin/donation-settings` membaca dan menyimpan kolom `bank_nama`, `bank_no_rekening`, `bank_atas_nama`, `nomor_whatsapp`, dan membaca `qris_path` dari `m_pengaturan_website`.
- **Header Keamanan & CORS (`securityHeaders.js`)**:
  - Menambahkan header `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-site`, serta CORS terkonfigurasi lewat `CORS_ORIGIN` (mendukung `GET,POST,PUT,PATCH,DELETE,OPTIONS` dan `Access-Control-Allow-Credentials: true`).
- **Autentikasi Sesi Pengurus & Audit Aktor (`adminAuth.js`, `requireAdminAuth.js`)**:
  - Mengimplementasikan login nyata `POST /api/admin/auth/login` (verifikasi hash bcrypt/scrypt terhadap `m_pengguna`, status `Nonaktif` ditolak `403`, kredensial salah `401`, `AUTH_SECRET` belum siap `503`), penerbitan token HS256 (`signAdminToken`) + cookie `HttpOnly; SameSite=Lax` (`masjid_admin_session`), `GET /api/admin/auth/me`, dan `POST /api/admin/auth/logout`.
  - Menambahkan middleware `requireAdminAuth` berbasis `ADMIN_AUTH_REQUIRED` (otomatis `true` di `production`, default `false` di development agar testing lokal fleksibel) serta meneruskan `req.adminUser?.id ?? null` ke `set_config('app.user_id', ...)` saat operasi tulis agar trigger `t_activity_log` mencatat pelaku perubahan.
- **Penambahan CRUD yang Sebelumnya Belum Lengkap**:
  - **CRUD Agenda (`m_agenda`)**: `POST /api/admin/agenda`, `PUT /api/admin/agenda/:id`, `DELETE /api/admin/agenda/:id` beserta validasi duplikasi `nama_kegiatan + frekuensi`.
  - **CRUD Akun Pengurus (`m_pengguna`)**: `POST /api/admin/accounts`, `PUT /api/admin/accounts/:id`, `PATCH /api/admin/accounts/:id/status`, `DELETE /api/admin/accounts/:id` (hash bcrypt cost 12, proteksi nonaktifkan/hapus akun sendiri, penanganan FK `23503`, serta pembatasan akses `role === 'Super Admin'` saat login aktif).
  - **Update Kode Akses Laporan & Sinkronisasi Gate**: `PUT /api/admin/report-access` menyimpan hash `scrypt` ke `m_pengaturan_website.kode_akses_laporan` (dibatasi `Super Admin` saat login aktif) dan menyinkronkannya ke `POST /api/public/report/check-password` (membaca hash DB lebih dulu lalu fallback ke `REPORT_SHARED_PASSWORD_HASH` di `.env`).

### Tahap 6 — Integrasi ke Frontend (`VITE_DATA_SOURCE=api`)
- Menyambungkan seluruh 14 service frontend (`frontend/src/services/*.js`) dan helper `frontend/src/utils/apiClient.js` ke endpoint `/api/...` saat `VITE_DATA_SOURCE=api` (dengan mode `mock` tetap utuh dan berjalan tanpa backend).
- Mengaktifkan dialog CRUD pada `AdminAgendaPage.jsx`, `AdminAccountsPage.jsx`, dan `AdminReportAccessPage.jsx` serta penyimpanan API pada halaman profil, donasi, pengaturan website, kategori, dan transaksi.

---

## 3. Struktur File Backend Saat Ini

| Direktori / File | Peran |
| --- | --- |
| `backend/src/server.js` | Menjalankan server HTTP Express, cek koneksi awal DB, dan graceful shutdown |
| `backend/src/app.js` | Perakitan aplikasi Express (`createApp`), injeksi repository, middleware, routes, dan error handler |
| `backend/src/config/env.js` | Membaca & memvalidasi seluruh variabel `.env` (port, base path, rate limit, auth, CORS, DB) |
| `backend/src/config/database.js` | Pool PostgreSQL (`pg`), `checkDatabaseConnection()`, dan `withDatabaseTransaction()` |
| `backend/src/middlewares/securityHeaders.js` | Header keamanan HTTP & CORS dengan dukungan credentials |
| `backend/src/middlewares/rateLimiter.js` | Pembatasan percobaan brute-force (`429 TOO_MANY_REQUESTS`) untuk sandi laporan & login |
| `backend/src/middlewares/requireAdminAuth.js` | Verifikasi cookie/Bearer token HS256 dan penegakan `ADMIN_AUTH_REQUIRED` |
| `backend/src/routes/healthRoutes.js` | Routing `/api/health` dan `/api/health/db` |
| `backend/src/routes/publicRoutes.js` | Routing `/api/public/*` |
| `backend/src/routes/adminRoutes.js` | Routing `/api/admin/*` |
| `backend/src/controllers/healthController.js` | Handler health API dan status koneksi database |
| `backend/src/controllers/publicController.js` | Handler konten publik dan agenda publik |
| `backend/src/controllers/reportController.js` | Handler cek sandi bersama & laporan keuangan publik |
| `backend/src/controllers/adminFinanceController.js` | Handler dashboard, CRUD kategori, laporan admin, & CRUD transaksi |
| `backend/src/controllers/adminSettingsController.js` | Handler profil, CRUD agenda, pengaturan donasi, & pengaturan website |
| `backend/src/controllers/adminManagementController.js` | Handler auth (`/login`, `/logout`, `/me`), CRUD akun, update kode akses, & activity log |
| `backend/src/services/*.js` | Validasi input, business rules, otorisasi, hashing, dan normalisasi respons (`agendaService`, `publicContentService`, `reportService`, `adminFinanceService`, `adminSettingsService`, `adminManagementService`) |
| `backend/src/repositories/*.js` | Query SQL parameterized ke schema `keu_masjid` (`publicContentRepository`, `agendaRepository`, `financeReportRepository`, `adminFinanceRepository`, `adminSettingsRepository`, `adminManagementRepository`) |
| `backend/src/utils/httpError.js` | Pembentuk error terstruktur (`createHttpError`) |
| `backend/src/utils/passwordHash.js` | Hashing & verifikasi `scrypt` dengan `timingSafeEqual` |
| `backend/src/utils/adminAuth.js` | Hashing `bcryptjs`, penandatanganan & verifikasi token HS256, dan parser cookie |
| `backend/src/utils/financeMapping.js` | Pemetaan ID/warna kategori, safe integer Rupiah, `resolveAuditPenggunaId`, & mapper error PostgreSQL |
| `backend/src/scripts/checkDatabase.js` | Skrip uji koneksi & pembacaan read-only seluruh tabel/view PostgreSQL (`npm run db:check`) |
| `backend/test/*.test.js` + `helpers/testRepositories.js` | Suite pengujian otomatis backend terisolasi (8 file test, 43 test cases) |

---

## 4. Daftar Endpoint Backend yang Tersedia

### A. Kesehatan Sistem
- `GET /api/health` — status proses API (`{ status: "ok" }`).
- `GET /api/health/db` — verifikasi koneksi pool PostgreSQL (`{ status: "ok", database, schema }`).

### B. Endpoint Publik (`/api/public`)
- `GET /api/public/content` — konten Beranda, Profil, Kontak, Donasi (tanpa agenda; menjaga data unverified tetap `null`).
- `GET /api/public/agenda` — kelompok agenda aktif (`weekly`, `monthly`, `yearly`).
- `POST /api/public/report/check-password` — validasi sandi gate laporan terhadap DB `m_pengaturan_website.kode_akses_laporan` (fallback `.env` `REPORT_SHARED_PASSWORD_HASH`), dilindungi rate limiter.
- `GET /api/public/finance/report` — laporan transaksi & ringkasan saldo per rentang tanggal (`startDate`, `endDate`, batas maks 366 hari).

### C. Autentikasi & Endpoint Admin (`/api/admin`)
- **Auth**:
  - `POST /api/admin/auth/login` — verifikasi email/password, terbitkan token HS256 & cookie `HttpOnly` `masjid_admin_session` (dilindungi rate limiter).
  - `POST /api/admin/auth/logout` — hapus cookie sesi.
  - `GET /api/admin/auth/me` — cek pengguna dari sesi/Bearer token aktif (`401` bila belum login).
- **Keuangan, Kategori & Transaksi**:
  - `GET /api/admin/dashboard` — ringkasan saldo kategori, total kas, akun aktif, & 5 transaksi terbaru.
  - `GET /api/admin/categories`, `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id` (mencegah hapus kategori yang memiliki saldo atau dipakai transaksi).
  - `GET /api/admin/finance/report` — riwayat transaksi admin dengan filter (`startDate`, `endDate`, `categoryId`, `type`, `query`), pagination (`page`, `pageSize`), dan `monthlyRecap`.
  - `GET /api/admin/transactions/:id`, `POST /api/admin/transactions`, `PUT /api/admin/transactions/:id`, `DELETE /api/admin/transactions/:id`.
- **Konten & Pengaturan**:
  - `GET /api/admin/profile`, `PUT /api/admin/profile`.
  - `GET /api/admin/agenda`, `POST /api/admin/agenda`, `PUT /api/admin/agenda/:id`, `DELETE /api/admin/agenda/:id`.
  - `GET /api/admin/donation-settings`, `PUT /api/admin/donation-settings` (mengembalikan objek `readiness` terhitung).
  - `GET /api/admin/website-settings`, `PUT /api/admin/website-settings` (termasuk validasi URL HTTPS Google Maps).
- **Manajemen Akun, Akses Laporan & Audit**:
  - `GET /api/admin/accounts`, `POST /api/admin/accounts`, `PUT /api/admin/accounts/:id`, `PATCH /api/admin/accounts/:id/status`, `DELETE /api/admin/accounts/:id` (operasi tulis dibatasi `Super Admin` jika autentikasi aktif).
  - `GET /api/admin/report-access`, `PUT /api/admin/report-access` (`PUT` dibatasi `Super Admin` jika autentikasi aktif).
  - `GET /api/admin/activity-logs` — timeline audit dengan filter (`admin`, `type`, `date`, `module`, `query`), pengelompokan tanggal, dan 5 notifikasi header terbaru.

---

## 5. Integrasi Database PostgreSQL (`schema: keu_masjid`)

Backend membaca dan menulis ke tabel serta view berikut pada database `db_keuangan_masjid_dev`:

- **Master & Konten**: `m_profil_masjid`, `m_misi_masjid`, `m_program_masjid`, `m_sejarah_masjid`, `m_pengurus`, `m_agenda`, `m_pengaturan_website`, `m_kategori_dana`, `m_pengguna`.
- **Transaksi & Audit**: `t_transaksi`, `t_transfer_dana`, `t_activity_log`.
- **Views**: `v_saldo_kategori_dana`, `v_rekap_bulanan_per_dana`, `v_transaksi_lengkap`.
- **Keamanan Query**: seluruh query memakai parameterized bindings (`$1, $2, ...`), operasi tulis berjalan dalam transaksi (`BEGIN ... COMMIT`), menyetel `set_config('app.user_id', ...)` untuk pencatatan aktor di trigger audit, dan memetakan constraint violation (`23505` duplikat, `23503` relasi FK, `23514` check constraint saldo) menjadi respons HTTP `400` yang aman.

---

## 6. Pengujian & Verifikasi yang Telah Lulus

| Pemeriksaan | Hasil | Cakupan |
| --- | --- | --- |
| `npm run lint` | **PASS** (0 error) | Pemeriksaan sintaks seluruh 42 file `.js` backend (`node --check`) & lint frontend (`oxlint`) |
| `npm test --workspace backend` | **PASS** (**43/43**) | Endpoint health, publik, gate sandi, laporan, dashboard, kategori, transaksi, profil, agenda CRUD, donasi, website settings, akun CRUD, kode akses, activity log, CORS/security headers, & auth sesi |
| `npm run db:check --workspace backend` | **PASS** | Koneksi langsung read-only ke `db_keuangan_masjid_dev` schema `keu_masjid` (profil, 4 misi, 3 program, 2 sejarah, 7 pengurus, 12 agenda, 3 kategori, 374 transaksi, 10 bulan rekap, 2 akun, 31 log) |
| `npm test --workspace frontend` | **PASS** (**125/125**) | Unit & SSR frontend untuk mode `mock` maupun pemanggilan endpoint API (11 suite browser opsional membutuhkan Chrome QA terpisah) |
| `npm run build` | **PASS** | Build produksi Vite (`vite build`) |
| Uji Chrome manual endpoint `GET` | **PASS** | `/api/health`, `/api/admin/donation-settings`, `/api/admin/agenda`, `/api/admin/accounts`, `/api/admin/report-access`, `/api/admin/activity-logs` (`200`), dan `/api/admin/auth/me` (`401 UNAUTHORIZED` saat belum login) |

---

## 7. Batasan Tersisa & Tindak Lanjut Tim

1. **Data Bisnis yang Belum Terisi di Database**:
   - `m_pengaturan_website.bank_no_rekening`, `nomor_whatsapp`, dan `kode_akses_laporan` masih kosong, serta `laporan_publik_aktif` bernilai `false`.
   - Akun `id=2` (`superadmin@masjid.id`) saat ini tercatat memiliki `role = 'Admin'` di database; perlu dipastikan `role = 'Super Admin'` dan password hash valid bila `ADMIN_AUTH_REQUIRED=true` diaktifkan.
   - File gambar untuk `qris_path` (`"/images/qris-donasi.png"`) belum tersedia di folder statis publik frontend.
2. **Kolom UI yang Belum Tersedia di Skema Database Saat Ini**:
   - Kolom `warna` di `m_kategori_dana`, kolom `nama_donatur` / `tampilkan_nama_publik` / `keterangan` di `t_transaksi`, kolom `template_pesan_donasi` / `catatan_donasi` & flag visibilitas terpisah di `m_pengaturan_website`, teks pengantar kontak di `m_profil_masjid`, serta rincian nilai lama/baru terstruktur di `t_activity_log`.
3. **Fitur yang Belum Dibuat / Di luar Cakupan Saat Ini**:
   - Endpoint upload file fisik untuk foto masjid (`foto_path`) dan gambar QRIS baru (`qris_path`).
   - Endpoint backend untuk tabel `t_kwitansi` (halaman kwitansi admin masih menghasilkan PNG draft lokal di browser).
   - Verifikasi langsung trigger `keu_masjid.fn_log_activity()` di database live saat operasi tulis (`POST`/`PUT`/`DELETE`) agar sesuai check constraint `t_activity_log` (`Tambah`/`Edit`/`Hapus`, `Keuangan`/`Akun`/`Konten`).
   - Mengubah `ADMIN_AUTH_REQUIRED=true` di `backend/.env` lokal setelah tim siap mewajibkan login untuk seluruh rute `/api/admin/*`.
