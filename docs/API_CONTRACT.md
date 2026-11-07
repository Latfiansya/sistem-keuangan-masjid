# Kerangka kontrak API

Status: hanya endpoint health dan format respons fondasi yang sudah diterapkan. Aturan data bisnis di bawah merupakan usulan integrasi untuk ditinjau bersama anggota backend; endpoint bisnis belum ditetapkan.

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
| Health berhasil | 200 | Tidak ada kode error |
| JSON tidak valid | 400 | `BAD_REQUEST` |
| Body terlalu besar (batas 100 KB) | 413 | `BAD_REQUEST` |
| Route tidak tersedia | 404 | `NOT_FOUND` |
| Error internal | 500 | `INTERNAL_SERVER_ERROR` |

## Endpoint yang tersedia

| Metode | Path | Kegunaan | Data sukses |
| --- | --- | --- | --- |
| GET | `/api/health` | Memastikan proses API merespons, tanpa pemeriksaan database | `{ "status": "ok" }` |

Base URL lokal backend: `http://127.0.0.1:3000/api`. Frontend development menggunakan `/api` melalui proxy Vite. Health tidak memerlukan autentikasi. Kebijakan akses endpoint bisnis belum diputuskan.

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

## Pemetaan service ke HTTP — handoff M1.7

**Hanya GET /api/health sudah tersedia.** Dua nama endpoint konten di bawah adalah usulan untuk ditinjau tim, bukan endpoint yang sudah disepakati/diimplementasikan. POST sandi dan GET laporan tetap usulan sebelumnya. Tidak perlu endpoint ekspor karena ekspor berjalan lokal pada snapshot laporan.

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
- `contact.donation.bank`: `verified`, `name`, `number`, `recipient`. Ketiga nilai harus tersedia dan flag benar sebelum ditampilkan. Semua nilai mock null; tidak menyimpan nomor rekening contoh atau penerima yang belum terverifikasi.
- `contact.location`: false/null untuk `verified`/`url`, mencatat kebutuhan lokasi mendatang. Saat ini panel peta selalu placeholder dengan tombol nonaktif; tidak mengonsumsi tautan sumber yang belum dikonfirmasi. Aktivasi tautan/embed setelah konfirmasi merupakan pekerjaan lanjutan yang terpisah.
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

HTTP 200 pada POST berarti pemeriksaan berhasil dijalankan; valid/tidak valid adalah hasil pemeriksaan. Input kosong atau bentuk permintaan tidak valid diusulkan HTTP 400 dengan format error proyek. Sandi backend kelak berupa environment variable biasa, misalnya `REPORT_SHARED_PASSWORD`, tanpa awalan VITE dan tanpa nilai produksi di repository. Tidak perlu hashing, akun, login/logout, JWT, session, refresh token, kedaluwarsa atau penyimpanan browser.

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

Usulan GET `/api/public/finance/report?startDate=2026-04-01&endDate=2026-04-30` nantinya mengembalikan envelope proyek dengan data berbentuk hasil getReport di atas, termasuk saldo awal sesuai rentang dan ringkasan yang konsisten dengan transaksi. Skema HTTP final dan sumber saldo memerlukan kesepakatan backend; ini bukan endpoint yang sudah diimplementasikan. Gate sandi tetap hanya pembatas antarmuka dan tidak melindungi endpoint laporan tanpa autentikasi.
