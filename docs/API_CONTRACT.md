# Kerangka kontrak API

Status: pada branch `fitur/backend-admin`, seluruh endpoint publik (`health`, `health/db`, `public/content`, `public/agenda`, `public/report/check-password`, `public/finance/report`) dan endpoint admin (`/api/admin/*`) sudah terhubung ke PostgreSQL schema `keu_masjid` melalui lapisan `repositories/` menggunakan parameterized query (`$1, $2, ...`). Autentikasi login pengurus (`POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `POST /api/admin/auth/logout`), header keamanan HTTP + CORS (`CORS_ORIGIN`), serta pencatatan ID aktor ke `t_activity_log` juga sudah diaktifkan. Cabang `VITE_DATA_SOURCE=api` di seluruh service frontend (`frontend/src/services/*.js`) sudah dihubungkan ke backend API dengan mode `mock` tetap dipertahankan.

## Respons dasar yang diterapkan

Gunakan JSON (`Content-Type: application/json`). Keberhasilan HTTP 200:

```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

Kegagalan memakai status HTTP yang sesuai, bukan HTTP 200:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route tidak ditemukan."
  }
}
```

`code` adalah identifier stabil, `message` adalah pesan aman dalam bahasa Indonesia. Jangan mengirim stack trace, kredensial, atau detail internal ke frontend. Field `details` untuk validasi, `meta` untuk pagination, dan format data bisnis belum disepakati.

| Kondisi | HTTP | Kode saat ini |
| --- | --- | --- |
| Health / permintaan publik berhasil | 200 | Tidak ada kode error |
| JSON tidak valid / input validasi tidak sah | 400 | `BAD_REQUEST` |
| Belum login / token atau cookie sesi tidak valid (saat `ADMIN_AUTH_REQUIRED=true` atau `/auth/me`) | 401 | `UNAUTHORIZED` |
| Akun pengurus berstatus `Nonaktif` saat login, atau akun non-`Super Admin` mengakses pengelolaan akun/kode akses | 403 | `FORBIDDEN` |
| Body terlalu besar (batas default 10 KB via `JSON_BODY_LIMIT`) | 413 | `BAD_REQUEST` |
| Route tidak tersedia | 404 | `NOT_FOUND` |
| Percobaan sandi melebihi batas rate limiter | 429 | `TOO_MANY_REQUESTS` |
| Error internal | 500 | `INTERNAL_SERVER_ERROR` |
| Konfigurasi sandi laporan / `AUTH_SECRET` belum siap di environment | 503 | `SERVICE_UNAVAILABLE` |

## Endpoint yang tersedia

Prefix default `/api` dapat dikonfigurasi melalui `API_BASE_PATH` di environment backend (mendukung deployment subdirectory).

| Metode | Path | Kegunaan | Data sukses |
| --- | --- | --- | --- |
| GET | `/api/health` | Memastikan proses API merespons, tanpa pemeriksaan database | `{ "status": "ok" }` |
| GET | `/api/health/db` | Memeriksa koneksi pool PostgreSQL (`SELECT current_database(), current_schema()`) | `{ "status": "ok", "database", "schema" }` |
| GET | `/api/public/content` | Konten publik bersama, profil, dan placeholder kontak/donasi (tanpa `agenda`) | Objek konten publik sesuai bagian di bawah |
| GET | `/api/public/agenda` | Deskripsi dan daftar kelompok kegiatan (`weekly`, `monthly`, `yearly`) tanpa `counts` | `{ "description", "groups" }` |
| POST | `/api/public/report/check-password` | Memeriksa sandi bersama terhadap hash DB (`m_pengaturan_website.kode_akses_laporan`) atau fallback `.env` `REPORT_SHARED_PASSWORD_HASH` (dilindungi rate limiter) dan menerbitkan cookie sesi `HttpOnly` `masjid_report_access` bila valid | `{ "valid": boolean }` |
| GET | `/api/public/finance/report` | Laporan keuangan publik berdasarkan `startDate` & `endDate` (default cakupan April 2026 jika kosong); mewajibkan cookie sesi `masjid_report_access` (`401 REPORT_ACCESS_REQUIRED` bila belum masuk kode akses, `403 FORBIDDEN` bila `laporan_publik_aktif=false`) | Objek laporan (`status: "ready" \| "unavailable"`, `transactions`, `summary`) |
| POST | `/api/admin/auth/login` | Verifikasi email & password bcrypt (`m_pengguna`) + rate limiter; menerbitkan token HS256 & cookie `HttpOnly` `masjid_admin_session` | `{ "token", "expiresAt", "user": { "id", "name", "email", "role" } }` |
| POST | `/api/admin/auth/logout` | Menghapus cookie sesi `masjid_admin_session` | `{ "loggedOut": true }` |
| GET | `/api/admin/auth/me` | Memeriksa sesi aktif pengurus dari Bearer token / cookie sesi | `{ "user": { "id", "name", "email", "role" } }` |
| GET | `/api/admin/dashboard` | Ringkasan saldo per kategori, total kas, dan transaksi terbaru pengurus | `{ "updatedDate", "account", "categories", "totals", "recentTransactions" }` |
| GET | `/api/admin/categories` | Daftar kategori dana beserta total saldo dan warna yang diizinkan | `{ "categories", "totals", "allowedColors" }` |
| POST | `/api/admin/categories` | Menambah kategori dana baru dengan validasi nama unik dan allowlist warna | Objek kategori baru (`201`) |
| PUT | `/api/admin/categories/:id` | Mengubah nama dan warna kategori dana | Objek kategori yang diperbarui (`200`) |
| DELETE | `/api/admin/categories/:id` | Menghapus kategori dana (ditolak jika kategori memiliki saldo atau dipakai transaksi) | `{ "deletedId" }` |
| GET | `/api/admin/finance/report` | Laporan keuangan admin (249 transaksi Jan–Okt 2026, rekap 10 bulan, filter, & pagination) | Objek laporan lengkap beserta `monthlyRecap` & `pagination` |
| GET | `/api/admin/receipts` | Riwayat kwitansi jamaah (aktif dan dibatalkan) beserta transaksi pemasukannya, terbaru lebih dulu | `{ "receipts", "totalCount" }` |
| POST | `/api/admin/receipts` | Mencatat transaksi pemasukan dan menerbitkan kwitansi bernomor dalam satu transaksi database | Objek kwitansi baru (`201`) |
| PUT | `/api/admin/receipts/:id` | Mengubah kwitansi aktif beserta transaksi pemasukannya (payload sama dengan POST); nomor kwitansi tetap; kwitansi dibatalkan menghasilkan `409` | Objek kwitansi yang diperbarui (`200`) |
| POST | `/api/admin/receipts/:id/cancel` | Membatalkan kwitansi (baris tetap tersimpan); body `{ "withTransaction": true }` ikut menghapus transaksi pemasukannya | `{ "receipt", "deletedTransactionId" }` |
| GET | `/api/admin/transfers` | Riwayat transfer dana antar kategori, terbaru lebih dulu | `{ "transfers", "totalCount" }` |
| POST | `/api/admin/transfers` | Mencatat transfer dana antar kategori; saldo diperbarui trigger database dan ditolak bila saldo asal tidak mencukupi | Objek transfer baru (`201`) |
| DELETE | `/api/admin/transfers/:id` | Menghapus transfer dana; ditolak database bila saldo kategori tujuan menjadi negatif | `{ "deletedId" }` |
| GET | `/api/admin/transactions/:id` | Detail satu transaksi berdasarkan ID | Objek transaksi |
| POST | `/api/admin/transactions` | Menambah transaksi pemasukan/pengeluaran baru dengan validasi sisi server | Objek transaksi baru (`201`) |
| PUT | `/api/admin/transactions/:id` | Mengubah data transaksi berdasarkan ID | Objek transaksi yang diperbarui (`200`) |
| DELETE | `/api/admin/transactions/:id` | Menghapus transaksi berdasarkan ID | `{ "deletedId" }` |
| GET | `/api/admin/profile` | Membaca profil masjid (`m_profil_masjid`) beserta alamat & telepon (`m_pengaturan_website`) untuk formulir admin | `{ "name", "tagline", "description", "location", "foundedYear", "buildingArea", "buildingAreaNote", "capacity", "capacityNote", "vision", "managementPeriod", "address", "contact", "photoPath" }` |
| PUT | `/api/admin/profile` | Memvalidasi dan menyimpan profil masjid; field yang tidak dikirim mempertahankan nilai tersimpan. `contact` disimpan ke kolom `telepon` | Objek profil yang sama dengan GET |
| PUT | `/api/admin/files/:target` | Mengunggah gambar sebagai body biner (`Content-Type: image/png\|image/jpeg\|image/webp`); `target` = `masjid-photo` (≤5 MB), `logo` (≤2 MB), `qris` (≤2 MB) | `{ "id", "path", "mimeType", "size" }` (`201`) |
| DELETE | `/api/admin/files/:target` | Menghapus berkas target dan mengosongkan kolom path-nya (kembali ke gambar bawaan/belum ada) | `{ "path": null }` |
| GET | `/api/admin/profile-content` | Daftar misi, program, sejarah, dan pengurus (termasuk yang disembunyikan) | `{ "missions", "programs", "history", "officers" }` |
| POST | `/api/admin/profile-content/:section` | Menambah item pada `section` = `missions` \| `programs` \| `history` \| `officers` | Objek item baru (`201`) |
| PUT | `/api/admin/profile-content/:section/:id` | Mengubah item konten profil | Objek item yang diperbarui (`200`) |
| DELETE | `/api/admin/profile-content/:section/:id` | Menghapus item konten profil | `{ "deletedId" }` |
| GET | `/api/admin/agenda` | Daftar kelompok kegiatan beserta ringkasan `counts` (`total`, `weekly`, `monthly`, `yearly`) | `{ "description", "groups", "counts" }` |
| POST | `/api/admin/agenda` | Menambah kegiatan agenda baru pada `m_agenda` dengan validasi frekuensi & nama unik per frekuensi | Objek agenda baru (`201`) |
| PUT | `/api/admin/agenda/:id` | Mengubah nama, frekuensi, jadwal, keterangan, urutan, atau status aktif agenda | Objek agenda yang diperbarui (`200`) |
| DELETE | `/api/admin/agenda/:id` | Menghapus agenda kegiatan berdasarkan ID | `{ "deletedId" }` |
| GET | `/api/admin/donation-settings` | Membaca konfigurasi donasi (QRIS, hingga 4 rekening bank aktif pada tabel `m_rekening_donasi`/`m_rek`/`m_rekening` dengan fallback ke `m_pengaturan_website`, WhatsApp) beserta `readiness` | Objek pengaturan donasi (`bankAccounts` 0..4 item, serta kompatibilitas `bankName`, `accountNumber`, `accountName`, `bankName2`, `accountNumber2`, `accountName2`) + `readiness` |
| PUT | `/api/admin/donation-settings` | Memvalidasi dan menyimpan hingga 4 rekening donasi (`bankAccounts`, menolak >4 atau slot tidak lengkap), nomor WhatsApp, dan status visibilitas | Objek pengaturan donasi ternormalisasi + `readiness` |
| GET | `/api/admin/website-settings` | Membaca pengaturan WhatsApp, email, alamat, Google Maps, telepon, keterangan telepon, jam operasional, label peta, dan visibilitas laporan | `{ "whatsapp", "email", "address", "mapsUrl", "phone", "phoneNote", "hours", "mapLabel", "publicReportEnabled" }` |
| PUT | `/api/admin/website-settings` | Memvalidasi dan menyimpan pengaturan kontak & website (HTTPS Google Maps, telepon 8–15 digit); field yang tidak dikirim dipertahankan | Objek pengaturan website yang diperbarui |
| GET | `/api/admin/accounts` | Daftar akun pengurus beserta pencarian `?query=` | `{ "accounts", "totalCount", "filteredCount" }` |
| POST | `/api/admin/accounts` | Menambah akun pengurus baru (`bcrypt` cost 12); dibatasi `Super Admin` jika sedang login | Objek akun aman tanpa `password` (`201`) |
| PUT | `/api/admin/accounts/:id` | Mengubah nama, email, role, status, atau password baru akun pengurus; dibatasi `Super Admin` | Objek akun aman tanpa `password` (`200`) |
| PATCH | `/api/admin/accounts/:id/status` | Mengaktifkan atau menonaktifkan akun pengurus (mencegah menonaktifkan diri sendiri) | Objek akun aman tanpa `password` (`200`) |
| DELETE | `/api/admin/accounts/:id` | Menghapus akun pengurus jika belum memiliki riwayat transaksi/log; dibatasi `Super Admin` | `{ "deletedId" }` |
| GET | `/api/admin/report-access` | Status metadata kode akses laporan publik (tanpa membocorkan kode/hash) | `{ "active", "publicReportEnabled", "changedDate", "changedTime", "changedBy" }` |
| PUT | `/api/admin/report-access` | Mengubah & meng-hash kode akses laporan di `m_pengaturan_website` (langsung disinkronkan ke gate publik); dibatasi `Super Admin` | Metadata status kode akses terbaru (`200`) |
| GET | `/api/admin/activity-logs` | Riwayat aktivitas pengurus dengan pengelompokan tanggal, 5 notifikasi header, & filter | `{ "activities", "groups", "headerNotifications", "totalCount", "filteredCount" }` |

Base URL lokal backend: `http://127.0.0.1:3000/api`. Frontend development menggunakan `/api` melalui proxy Vite. Endpoint publik di atas belum memakai autentikasi pengguna dan saat ini menyajikan data terstruktur contoh sampai koneksi PostgreSQL siap.

## Usulan aturan tanggal dan Rupiah

- Tanggal kalender: string `YYYY-MM-DD`, misalnya `2026-11-05`, tanpa konversi zona waktu otomatis.
- Waktu kejadian: ISO 8601 dengan zona waktu, diusulkan UTC seperti `2026-11-05T08:00:00.000Z`; tampilan lokal memakai `Asia/Jakarta`.
- Nominal Rupiah: diusulkan JSON number berupa bilangan bulat dalam satuan Rupiah, misalnya `150000`, bukan string `Rp150.000` dan bukan satuan ribuan.
- Nilai harus berada dalam rentang integer aman JavaScript. Format tampilan mengikuti locale `id-ID`, mata uang `IDR`, dan tidak dikirim kembali sebagai angka berformat.
- Backend dan frontend perlu menyepakati apakah nilai negatif diperbolehkan, batas nominal, pembulatan, field wajib, serta makna nilai nol dan `null` sebelum fitur keuangan dibuat.

## Kebutuhan yang masih harus disepakati

| Kebutuhan | Keputusan yang diperlukan | Status |
| --- | --- | --- |
| Profil masjid | Field, sumber konten, pengelola konten, data yang boleh dipublikasikan | Belum disepakati |
| Laporan publik | Rumus/rentang dan gate sederhana sudah dipakai frontend; sumber resmi, payload HTTP final dan publikasi data perlu disepakati | Frontend mock selesai; API belum tersedia |
| Daftar data laporan | Filter, urutan, pagination, kebutuhan ekspor | Belum disepakati |
| Konsistensi kontrak | Nama endpoint, skema data, metadata, kode validasi | Belum disepakati |
| Infrastruktur | Database, autentikasi bila diperlukan, CORS, URL tiap lingkungan | Belum disepakati |

Jangan membuat endpoint bisnis, database, migrasi, atau autentikasi berdasarkan tabel kebutuhan ini saja. Catat persetujuan tim dan contoh payload sebelum implementasi. Saat kontrak disepakati, buat service dan mock dengan bentuk data yang sama.

## Pemetaan service ke HTTP — handoff M1.7 (diperbarui fase backend publik)

Keempat endpoint bisnis publik di bawah sudah diterapkan pada workspace `backend` dengan arsitektur 3-layer dan data sementara tanpa database, namun **adapter API pada `frontend/src/services/` belum dihubungkan** (dikerjakan terpisah bersama tim frontend). Tidak perlu endpoint ekspor karena ekspor berjalan lokal pada snapshot laporan.

| Service frontend | Request HTTP yang diusulkan | Respons sukses HTTP 200 |
| --- | --- | --- |
| getPublicContent({ signal }) | GET /api/public/content, tanpa body/query | Envelope proyek; data berisi field konten bersama, profile dan contact pada tabel berikut, tanpa agenda |
| getAgenda({ signal }) | GET /api/public/agenda, tanpa body/query | Envelope proyek; data berisi description dan groups. Service menghitung counts dari items |
| checkReportPassword(password, { signal }) | POST /api/public/report/check-password; JSON password string | { success: true, data: { valid: boolean } }, bukan token/session |
| getReport({ startDate, endDate, signal }) | GET /api/public/finance/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD | Envelope proyek; data berbentuk hasil getReport pada bagian laporan, termasuk status/coverage/range/transactions/summary |

Field konten publik yang diperlukan implementasi aktual:

| Field dalam data konten | Tipe dan kebutuhan |
| --- | --- |
| name, address, heroDescription, vision | String. address Footer adalah konten referensi yang perlu verifikasi publikasi; jangan mengambil alamat kosong/tidak terverifikasi pada kartu Kontak |
| copyrightYear | Integer tahun |
| statistics | Array: id founded/area/capacity, label/value string, icon calendar/expand/users; statistik area/capacity juga amount integer, unit, profileLabel, description string. Tahun/luas/kapasitas dan value tampilan harus satu sumber |
| missions | Array string |
| programs | Array: title, description, icon string; icon yang digunakan heart/health/economy |
| profile | Objek: foundedYear integer, location/introduction/managementPeriod/contactTitle/contactDescription string, timeline dan members array. Bentuk item mengikuti bagian Profil dan mocks/publicContent.js |
| contact | Objek introduction, information array, donation, location. Bentuk dan aturan verified/null mengikuti bagian Kontak; jangan mengaktifkan data pembayaran tanpa konfirmasi |

getPublicContent tetap menjadi agregator: adapter API mendatang menggabungkan data konten dengan hasil getAgenda menjadi objek content.agenda yang sama untuk Beranda dan Agenda. Komponen memakai konteks PublicLayout; jangan memanggil HTTP dari JSX atau membuat hubungan service melingkar. groups Agenda memakai id weekly/monthly/yearly; item name/schedule adalah string jadwal berulang, bukan timestamp.

Saat menambahkan adapter, terapkan pembacaan envelope/error proyek, validasi field wajib/jenis nilai, serta AbortSignal pada fetch dan pembaruan state. Array kosong adalah keadaan kosong yang sah; objek wajib yang hilang/format tidak cocok harus menjadi error integrasi yang jelas. Service mengembalikan objek hasil yang dapat dipakai komponen dan menjaga data sumber tidak termutasi. Nilai color kategori laporan saat ini green/orange/blue, id kategori harus stabil dan cocok dengan categoryId transaksi. Seluruh nominal termasuk hasil penjumlahan harus safe integer Rupiah. Urutan transaksi dari respons dipertahankan; backend perlu mengirim urutan stabil tanpa menambah kontrol sorting pada UI.

Pergantian VITE_DATA_SOURCE=api saat ini **belum mengaktifkan request bisnis**: cabang API konten, agenda, sandi dan laporan sengaja melempar error integrasi. Setelah endpoint dibuat dan payload disepakati, implementasikan cabang tersebut di services beserta test kontrak. VITE_API_BASE_URL dipakai healthService sekarang; adapter bisnis mendatang perlu menggunakannya juga. Jangan memakai mock sebagai fallback diam-diam pada kegagalan API.

Label contoh laporan dan tanggal acuan/default April 2026 masih merupakan keputusan prototipe, bukan metadata produksi. Integrasi data resmi nantinya perlu menyepakati penanda data contoh, periode default/acuan preset, daftar bulan dan cakupan data. Perubahan label/periode itu adalah pekerjaan integrasi terpisah; jangan menghapus penanda contoh sebelum sumber data dikonfirmasi. Kontrak ini tidak menambah akun, JWT, session, hashing atau autentikasi tambahan.

## Kebutuhan data Agenda — M1.2 (frontend mock)

Belum ada endpoint Agenda atau kontrak HTTP bisnis yang disepakati. Bagian ini mendokumentasikan kebutuhan UI untuk integrasi mendatang; bukan instruksi membuat backend.

- `getAgenda({ signal })` menyediakan `description`, `groups`, dan `counts` melalui lapisan service. Sumber sekarang adalah `mocks/agenda.js`; halaman tidak mengimpor mock langsung.
- Tiap kelompok memiliki `id` stabil (`weekly`, `monthly`, `yearly`), `title`, `subtitle`, dan `items`. Item berisi `name` serta `schedule` berupa label jadwal berulang yang tampil pada desain.
- Label seperti Rabu Pon, Jum’at Pahing, dan Bulan Ramadhan dipertahankan sebagai teks; tidak dikonversi menjadi tanggal ISO atau kejadian kalender tanpa aturan tambahan.
- Total kegiatan, jumlah mingguan dan jumlah tahunan dihitung dari panjang daftar, bukan angka terpisah yang dapat berbeda. Fixture saat ini berisi 5 mingguan, 2 bulanan, 5 tahunan: total 12. Daftar kosong ditampilkan sebagai state kosong.
- `publicContentService` menggunakan hasil service Agenda yang sama untuk Beranda dan Agenda. Mode `mock` mandiri; mode `api` memberi error integrasi belum tersedia tanpa menghubungi endpoint karangan. Dukungan pembatalan melalui AbortSignal dipertahankan.
- Sebelum integrasi API nyata, tim perlu menyepakati endpoint, bentuk payload dan pengelola konten. Tidak menambahkan filter tanggal, pagination, pendaftaran kegiatan atau fitur kalender karena tidak terdapat pada desain.

## Kebutuhan data Profil — M1.3 (frontend mock)

Profil memakai `getPublicContent({ signal })` yang sudah tersedia, melalui konteks PublicLayout. Tidak ada endpoint baru atau perubahan kontrak HTTP backend.

- Statistik bersama mendapat `id` stabil. Luas dan kapasitas memiliki `amount`, `unit`, `profileLabel`, serta `description`; field `value` Beranda tetap tersedia dan dibentuk dari konstanta angka yang sama. Tahun berdiri pada statistik, badge Profil dan linimasa awal memakai satu konstanta.
- Visi dan daftar misi tetap field bersama Beranda, tanpa salinan khusus Profil.
- `profile` berisi `foundedYear`, `location`, `introduction`, `timeline`, `managementPeriod`, `members`, `contactTitle`, dan `contactDescription`. Item linimasa: tahun, era, nama masjid saat itu, judul, uraian. Pengurus: inisial, jabatan, nama dan catatan opsional.
- Fixture mengikuti konten referensi; periode pengurus 2023–2025 dipilih sesuai desain final meskipun Blade menuliskan 2023–2026. Belum menjadi bukti data pengurus terkini atau kontrak publikasi produksi.
- State loading/error/empty ditangani UI; mode API tetap memberi pesan integrasi konten publik belum tersedia tanpa mengarang endpoint. Penetapan endpoint, skema final dan pengelola konten menunggu kesepakatan backend.


## Kebutuhan data Kontak dan Donasi — M1.4 (frontend mock)

`getPublicContent({ signal })` yang sudah ada menyediakan `contact` melalui PublicLayout; komponen tidak mengakses mock/API langsung. Tidak ada endpoint baru atau perubahan backend. Mode mock mandiri, salinan data terisolasi, pembatalan dan error mode API tetap berlaku.

- `contact.introduction`: uraian header; `information`: daftar `id`, `label`, `verified`, `value`, serta `note` opsional. Tiga id sekarang: `address`, `phone`, `hours`. Nilai `null` dan `verified: false` menunjukkan data belum dikonfirmasi, bukan nilai produksi. Catatan telepon saat ini hanya menyatakan jam layanan belum dikonfirmasi.
- `contact.donation.qris`: `verified` dan `imageSrc`. UI hanya dapat menampilkan gambar jika flag benar dan sumber tersedia; mock sekarang false/null. Gambar QRIS sumber belum menjadi aset publik.
- `contact.donation.banks`: daftar hingga 4 rekening terverifikasi (`[{ verified, name, number, recipient }]`) dari tabel `keu_masjid.m_rekening_donasi` (atau tabel rekening pengganti) dengan fallback aman ke `m_pengaturan_website`. Hanya menyertakan item lengkap dan terverifikasi.
- `contact.donation.bank`: `verified`, `name`, `number`, `recipient` untuk rekening pertama (kompatibilitas). Ketiga nilai harus tersedia dan flag benar sebelum ditampilkan.
- `contact.donation.bank2`: struktur sama (`verified`, `name`, `number`, `recipient`) untuk rekening kedua opsional. Tetap disanitasi menjadi `false`/`null` bila belum lengkap/terverifikasi.
- `contact.location`: `verified` (`boolean`) dan `url` (`string | null`), serta `label` (`string`, opsional dari `label_peta`) dan `embedUrl` (`string`, opsional URL Google Maps embed untuk `<iframe>`) hanya bila `verified: true`. Sumber utama berasal dari `link_gmaps` pada `m_pengaturan_website` (atau fallback koordinat `latitude`/`longitude` jika `link_gmaps` kosong). Mode mock tetap `verified: false, url: null` sehingga panel peta tetap placeholder dengan tombol nonaktif.
- Flag verifikasi adalah metadata publikasi, bukan validasi transaksi, otorisasi atau sistem pembayaran. Penetapan siapa yang menyetujui, sumber resmi, tanggal konfirmasi, izin publikasi dan skema API final menunggu pengurus/tim backend. Jangan mengubah flag hanya karena data ditemukan dalam Blade.
- Loading, error, tidak adanya objek Kontak, daftar informasi kosong dan data donasi belum tersedia memiliki pesan yang sesuai. Tidak ada fitur payment gateway, salin rekening atau unduhan QRIS.


## Gate sandi bersama — M1.5a, perilaku diperbarui M1.8b

Implementasi saat ini hanya frontend. `reportService.checkReportPassword(password, { signal })` mengembalikan `{ valid: boolean }` pada mode mock. Input kosong/bukan teks ditolak; mock `demo123` dibandingkan persis, termasuk kapital/spasi, dengan jeda 300 ms untuk memeriksa loading. Pembatalan melalui AbortSignal didukung. Sandi demo bukan rahasia atau kredensial produksi dan tidak digunakan untuk validasi mode API.

Mode `VITE_DATA_SOURCE=api` sekarang memberikan error “Pemeriksaan sandi melalui API belum tersedia” tanpa melakukan permintaan HTTP. Tidak menambahkan endpoint atau mengubah Express. Pengambilan transaksi/ringkasan ditambahkan melalui mock pada M1.5b; lihat bagian berikut.

Usulan kontrak backend untuk integrasi berikutnya, **belum tersedia**:

| Metode | Path | Permintaan | Hasil yang diusulkan |
| --- | --- | --- | --- |
| POST | `/api/public/report/check-password` | JSON `{ "password": "<sandi dari input>" }` | HTTP 200 `{ "success": true, "data": { "valid": true } }` atau `valid: false` |
| GET | `/api/public/finance/report` | Usulan parameter `startDate`, `endDate` | Usulan payload M1.5b di bawah; endpoint belum tersedia |

HTTP 200 pada POST berarti pemeriksaan berhasil dijalankan; valid/tidak valid adalah hasil pemeriksaan. Input kosong, hanya spasi, non-string, atau mengandung karakter kontrol mengembalikan HTTP 400 dengan format error proyek. Untuk kepatuhan keamanan SOP, sandi backend disimpan sebagai hash `scrypt` pada environment `REPORT_SHARED_PASSWORD_HASH` (di development lokal, `REPORT_SHARED_PASSWORD` di `.env` juga dapat di-hash otomatis saat boot; di `production` plaintext ditolak), dilengkapi `timingSafeEqual` serta rate limiter anti brute-force (`429 TOO_MANY_REQUESTS`), tanpa nilai sandi di repository dan tanpa JWT/session/cookie. Jika hash belum dikonfigurasi, endpoint mengembalikan HTTP `503 SERVICE_UNAVAILABLE`.

Keputusan M1.8b menggantikan gate halaman penuh: klik CTA laporan Beranda/Footer membuka modal pada halaman asal. PublicLayout mengelola buka/tutup; ReportAccessModal memakai ReportAccessPanel dan service yang sama. Input dibersihkan saat benar, modal ditutup dan frontend menuju /laporan-keuangan. Salah/error tetap di modal; menutup modal membatalkan pemeriksaan yang berjalan. Tidak ada status akses persisten maupun otorisasi pada route.

/laporan-keuangan langsung mengambil laporan melalui getReport(), termasuk saat akses URL langsung atau refresh. Refresh dari format/pratinjau kembali ke tampilan laporan dengan periode default; state filter/format hanya dipertahankan selama halaman masih terbuka. Sandi/status tidak dimasukkan ke URL, localStorage, sessionStorage atau cookie. Endpoint sandi hanya dipakai oleh interaksi CTA; bukan prasyarat pemanggilan GET laporan. Tidak ada perubahan payload HTTP atau kontrak autentikasi admin.

**Batasan:** pengecekan sandi hanya pembatas antarmuka. Respons `valid: true` bukan token/otorisasi dan tidak melindungi GET laporan. Endpoint laporan tanpa autentikasi tetap dapat diakses langsung tanpa melewati gate. Keputusan sederhana ini mengikuti kebutuhan tim; tidak mengklaim perlindungan data oleh gate.


## Laporan publik — M1.5b (frontend mock)

`reportService.getReport({ startDate, endDate, signal })` menyediakan hasil laporan. Bawaan 1–30 April 2026; mode mock tidak menghubungi backend, dengan jeda simulasi 150 ms. Signal diperiksa sebelum dan setelah menunggu; hasil request yang dibatalkan tidak diterapkan ke halaman. Mode API memberi error “Laporan keuangan melalui API belum tersedia”, tanpa membuat endpoint atau melakukan HTTP.

Struktur sumber mock:

- `name`, `coverage: { startDate, endDate }`, `months` berupa daftar opsi bulan dari referensi.
- `categories`: `id`, `label`, `color`, `openingBalance` pada awal cakupan, berupa integer Rupiah.
- `transactions`: `id` stabil, `date` dalam YYYY-MM-DD, `type` income/expense, `description`, `categoryId`, `amount` integer Rupiah. Ada 17 income dan 33 expense.
- Sumber terbatas April 2026. Opsi bulan lain tidak berarti datanya tersedia. Semua transaksi merupakan data contoh pengembangan berdasarkan referensi, bukan laporan produksi terverifikasi.

Hasil getReport: `name`, `coverage`, `months`, `range`, `status`, `transactions`, `summary`. Pada status ready, summary berisi rows per kategori (`id`, `label`, `color`, `openingBalance`, `income`, `expense`, `closingBalance`) dan totals empat nilai numerik. Pada status unavailable, transaksi kosong, summary null, dan message menjelaskan cakupan tidak lengkap. UI tidak menampilkan nol sebagai laporan periode yang tidak diketahui.

Aturan kalkulasi:

1. Validasi tanggal kalender, tanggal wajib diisi dan awal tidak melebihi akhir. Perbandingan batas tanggal ISO inklusif; tanggal kalender tidak digeser timezone.
2. Saldo awal kategori pada tanggal pilihan = saldo awal 1 April + pemasukan sebelum tanggal awal − pengeluaran sebelum tanggal awal.
3. Pemasukan/pengeluaran rentang dijumlahkan dari transaksi terpilih; saldo akhir = saldo awal rentang + pemasukan − pengeluaran. Totals berasal dari penjumlahan kategori. Jumlah transaksi dari panjang daftar.
4. Nominal/saldo awal berupa safe integer Rupiah; pemformatan id-ID hanya pada presentasi. Data mock tidak diubah oleh filter atau perubahan hasil service.
5. Rentang di luar cakupan ditandai unavailable; tidak mengasumsikan saldo awal atau transaksi bulan lain bernilai nol. Hari tanpa transaksi di dalam April tetap merupakan laporan lengkap dengan saldo terbawa.

Rekonsiliasi April 2026, seluruh nominal di tabel ini Rupiah:

| Kategori | Saldo awal | Pemasukan | Pengeluaran | Saldo akhir |
| --- | ---: | ---: | ---: | ---: |
| Kas Masjid | 15.256.700 | 8.657.500 | 5.791.500 | 18.122.700 |
| Kotak Pembangunan & Pemeliharaan | 1.335.000 | 685.000 | 300.000 | 1.720.000 |
| Kotak Jum’at Berkah | 1.999.000 | 1.323.000 | 2.680.000 | 642.000 |
| TOTAL | 18.590.700 | 10.665.500 | 8.771.500 | 20.484.700 |

Penjumlahan aktual cocok dengan audit. Resume Blade salah menuliskan pengeluaran Kas Masjid 6.791.500; baris transaksi dan desain final mendukung 5.791.500. Tidak mengubah transaksi agar cocok dengan angka ringkasan. Tanggal Beli Sapu dipilih 26 April sesuai final, menggantikan 25 April pada Blade; nominal tetap 22.000 dan total bulan tidak berubah.

Preset mock menggunakan acuan 30 April 2026: 1w = 24–30 April; 1m = 1–30 April; 3m = 1 Februari–30 April (unavailable). Draft kustom berlaku setelah Terapkan. Pilihan bulan menggunakan awal/akhir bulan kalender. Tidak ada filter kategori atau sorting. M1.6a memakai hasil getReport yang sama untuk pilihan format dan pratinjau PDF/PNG di frontend, tanpa kebutuhan endpoint atau perubahan payload. M1.6b merender lembar yang sama menjadi PDF atau PNG/ZIP sepenuhnya di browser, tanpa permintaan data baru, upload, endpoint ekspor atau perubahan kontrak HTTP.

Endpoint GET `/api/public/finance/report?startDate=2026-04-01&endDate=2026-04-30` mengembalikan envelope proyek dengan data berbentuk hasil `getReport` di atas, termasuk saldo awal sesuai rentang dan ringkasan yang konsisten dengan transaksi. Jika `startDate` dan `endDate` sama-sama tidak dikirim, backend memakai rentang cakupan default (1–30 April 2026); jika hanya salah satu dikirim, format tanggal kalender tidak valid, terbalik, atau melebihi batas 366 hari, backend mengembalikan HTTP 400 `BAD_REQUEST`. Rentang valid di luar cakupan mengembalikan HTTP 200 dengan `status: "unavailable"`, `transactions: []`, dan `summary: null`. Sumber database PostgreSQL serta endpoint pengurus/CRUD akan dihubungkan pada fase berikutnya. Gate sandi tetap hanya pembatas antarmuka dan tidak melindungi endpoint laporan tanpa autentikasi.

## Konten profil admin — fitur/konten-profil-admin

Item tiap `section` memiliki `id` (string) dan `order` (bilangan bulat 0–32767, default 0). Teks di-trim; teks opsional yang kosong disimpan sebagai `NULL` dan dikembalikan sebagai string kosong. Batas panjang mengikuti kolom tabel `keu_masjid`.

| Section | Tabel | Field (wajib *) |
| --- | --- | --- |
| `missions` | `m_misi_masjid` | `text`* (≤255), `order` |
| `programs` | `m_program_masjid` | `title`* (≤100), `description`* (≤500), `order`, `active` (boolean, default true) |
| `history` | `m_sejarah_masjid` | `year`* (1800–2100), `era` (≤50), `placeName` (≤150), `title`* (≤150), `description` (≤2000), `order` |
| `officers` | `m_pengurus` | `name`* (≤150), `role`* (≤50), `note` (≤150), `order`, `active` (boolean, default true) |

Section tidak dikenal atau ID tidak ditemukan menghasilkan `404 NOT_FOUND`; payload tidak valid menghasilkan `400 BAD_REQUEST`. Setiap perubahan tercatat otomatis di `t_activity_log` (modul `Konten`) melalui trigger database. Pengurus tidak memakai foto (halaman publik menampilkan inisial), sehingga kolom `m_pengurus.foto_path` sengaja tidak diekspos.

## Berkas gambar website — fitur/upload-berkas

- Isi berkas disimpan di kolom tabel yang sudah ada sesuai `docs/sql/2026-11-23-gambar-di-kolom.sql`: `m_profil_masjid.foto_isi`/`foto_mime`, `m_profil_masjid.logo_isi`/`logo_mime`, dan `m_pengaturan_website.qris_isi`/`qris_mime` (bytea + jenis MIME). Kolom `foto_path`, `logo_path`, dan `qris_path` berisi URL publik berbasis hash isi `/api/public/files/<target>/<sha256>`; mengganti gambar menimpa isi lama sehingga URL lama otomatis tidak berlaku.
- `GET /api/public/files/:target/:hash` (publik) hanya menyajikan gambar terkini milik target tersebut, dengan `Content-Type` sesuai berkas, `Cache-Control: public, max-age=31536000, immutable`, `ETag` berbasis SHA-256 (mendukung `304`), serta `X-Content-Type-Options: nosniff`. Hash tidak dikenal atau sudah diganti menghasilkan `404`.
- Validasi server: `Content-Type` wajib PNG/JPEG/WebP dan harus cocok dengan tanda tangan biner berkas (`415` bila tidak), berkas kosong `400`, melebihi batas per target `413`, target tidak dikenal `404`. SVG dan format lain ditolak. Nama berkas asli tidak disimpan.
- `GET /api/admin/profile` kini juga mengembalikan `logoPath`. `GET /api/public/content` menambahkan `photoSha256` (SHA-256 foto unggahan, diambil dari URL `foto_path`, atau `null`) agar frontend tetap menampilkan overlay gedung hero bila foto di database adalah salinan foto bawaan.
- Skrip `npm run db:seed-images --workspace backend` menyimpan foto dan logo ke kolom `foto_isi`/`logo_isi`: aset WebP bawaan, atau berkas asli PNG/JPG/WebP lewat `--photo=<jalur>` dan `--logo=<jalur>` (format dikenali dari isi berkas). QRIS hanya disimpan bila `--qris=<jalur>` diberikan. `--dry-run` hanya memeriksa, `--force` menimpa unggahan yang ada.
- Frontend hanya memakai path berpola `/api/public/files/<masjid-photo|logo|qris>/<sha256>`; path lama seperti `/images/...` diabaikan dan halaman kembali memakai aset bawaan.

## Kwitansi jamaah — fitur/simpan-kwitansi

Payload `POST /api/admin/receipts`:

| Field | Aturan |
| --- | --- |
| `categoryId` | ID API kategori dana tujuan pemasukan (`mosque`, `maintenance`, `friday`, atau ID numerik), wajib dan aktif |
| `payer` | "Telah terima dari", wajib, maks 150 karakter (`t_kwitansi.telah_terima_dari`) |
| `purpose` | "Untuk Pembayaran", wajib, maks 255 karakter; juga menjadi uraian transaksi |
| `method` | `Tunai`, `Transfer`, atau `QRIS` (`ck_t_kwitansi_metode`); formulir menampilkan "Transfer Bank" untuk `Transfer` |
| `amount` | Bilangan bulat Rupiah 1–999.999.999.999 |
| `date` | Tanggal kalender `YYYY-MM-DD`; menjadi tanggal transaksi |

Objek kwitansi: `{ "id", "number", "payer", "purpose", "method", "amount", "date", "status", "cancelledAt", "transactionId", "categoryId", "categoryLabel", "createdBy", "createdAt" }`. `status` = `Aktif` atau `Dibatalkan`; `transactionId`/`categoryId` bernilai `null` bila transaksi pemasukannya sudah dihapus.

Skema mengikuti `docs/sql/2026-11-24-kwitansi-pembatalan.sql` (kolom `nominal`, `tanggal`, `dibatalkan_at` pada `t_kwitansi`; `transaksi_id` boleh NULL dengan FK `ON DELETE SET NULL`).

- Satu permintaan mencatat `t_transaksi` (jenis `MASUK`, uraian = `purpose`) lalu `t_kwitansi` yang terhubung (`transaksi_id` unik); keduanya tersimpan atau dibatalkan bersama. Saldo kategori dan activity log diperbarui oleh trigger database. Nama pemberi tidak dimasukkan ke uraian transaksi agar tidak tampil di laporan publik.
- **Nomor kwitansi memakai format resmi mitra** berupa angka urut polos (`1`, `2`, `3`, ...), dimulai baru dari `1` dan terus berlanjut secara global lintas bulan/tahun (diatur di `backend/src/utils/receiptNumber.js`). Penomoran dikunci dengan `pg_advisory_xact_lock`; bila tetap bentrok dengan `uq_t_kwitansi_nomor`, API mengembalikan `409`.
- `PUT` memperbarui `t_transaksi` (kategori, uraian, nominal, tanggal) dan `t_kwitansi` (pemberi, keperluan, metode) dalam satu transaksi; **nomor kwitansi tidak berubah** walau tanggal dipindah ke bulan lain.
- Kwitansi **tidak pernah dihapus**. `POST /:id/cancel` mengisi `dibatalkan_at` dan menyalin nominal/tanggal transaksi terkini ke `t_kwitansi`; dengan `withTransaction: true` transaksi pemasukannya ikut dihapus (FK `ON DELETE SET NULL` membuat `transaksi_id` NULL, baris kwitansi tetap ada). Bila saldo kategori sudah terpakai, trigger `fn_cek_saldo_tidak_negatif` menolak dan API mengembalikan `400`. Kwitansi yang sudah dibatalkan menghasilkan `409`; ID tidak ditemukan `404`.
- Kwitansi aktif memakai nominal/tanggal transaksi terkini; kwitansi dibatalkan atau yang transaksinya dihapus dari Laporan memakai salinan di `t_kwitansi` dan berstatus `Dibatalkan`.
- Karena semua baris (termasuk yang dibatalkan) ikut dihitung, nomor kwitansi tidak pernah dipakai ulang.
- `t_kwitansi.file_path` tidak diisi; PNG dibuat di browser saat diunduh.

## Transfer dana antar kategori — fitur/transfer-dana

Payload `POST /api/admin/transfers`:

| Field | Aturan |
| --- | --- |
| `fromCategoryId` | ID API kategori asal (`mosque`, `maintenance`, `friday`, atau ID numerik), wajib dan aktif |
| `toCategoryId` | ID API kategori tujuan, wajib, aktif, dan berbeda dari asal |
| `amount` | Bilangan bulat Rupiah 1–999.999.999.999 |
| `date` | Tanggal kalender `YYYY-MM-DD` |
| `note` | Opsional, maksimal 255 karakter |

Objek transfer: `{ "id", "date", "fromCategoryId", "fromCategoryLabel", "toCategoryId", "toCategoryLabel", "amount", "note", "createdBy" }`.

Backend tidak menghitung saldo sendiri. Trigger `trg_t_transfer_dana_saldo` memperbarui `saldo_terkini` kedua kategori melalui `fn_hitung_saldo`, dan `fn_cek_saldo_tidak_negatif` menolak transfer atau penghapusan yang membuat saldo negatif; pesan database tersebut diteruskan sebagai `400 BAD_REQUEST`. Setiap transfer tercatat di `t_activity_log` (modul `Keuangan`). Transfer tidak dihitung sebagai pemasukan atau pengeluaran. Edit transfer belum tersedia; koreksi dilakukan dengan menghapus lalu mencatat ulang.

## Transfer internal pada laporan — fix/transfer-di-laporan

`GET /api/public/finance/report` (status `ready`) kini mengembalikan `summary.transfers`: daftar transfer di dalam rentang laporan `{ "date", "fromCategoryId", "fromCategoryLabel", "toCategoryId", "toCategoryLabel", "amount" }` (array kosong bila tidak ada). `summary.rows[].closingBalance` = saldo awal + pemasukan − pengeluaran + transfer masuk − transfer keluar dalam periode; `income`/`expense` tidak berubah dan total seluruh kategori tidak terpengaruh. Saldo akhir per kategori kini cocok dengan view `v_rekap_bulanan_per_dana`.

Laporan admin di frontend memakai `GET /api/admin/transfers` (dimuat bersama workspace admin) agar saldo awal/akhir per kategori pada rekap bulanan dan dokumen unduhan memperhitungkan transfer sesuai tanggalnya.
