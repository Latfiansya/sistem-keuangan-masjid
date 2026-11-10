# Sistem Keuangan dan Profil Masjid Al-Hidayah

Repository kolaborasi mahasiswa untuk frontend publik dan backend sistem keuangan masjid. M1.1a melengkapi layout publik dan Beranda dengan foto serta logo dari referensi Blade dan font Plus Jakarta Sans lokal, sambil mempertahankan refinement skala M1.1. M1.2 menambahkan halaman Agenda beserta navigasi dan data mock bersama Beranda. M1.3 melengkapi Profil Masjid memakai data bersama Beranda, linimasa, dan tujuh pengurus. M1.4 menambahkan Kontak dan Donasi dengan placeholder data yang belum dikonfirmasi. M1.5a menambahkan gate sandi bersama; M1.5b melengkapi laporan mock April 2026, rentang tanggal, dua tabel transaksi dan resume saldo. M1.6a menambahkan pilihan format PDF/PNG serta pratinjau lembar A4 lanskap. M1.6b mengaktifkan unduhan PDF, PNG tunggal, atau ZIP berisi PNG tiap lembar. M1.7 menuntaskan audit frontend publik dan menyediakan panduan handoff backend. M1.8a menjadi baseline visual; M1.8b memoles Profil/Kontak/laporan dan memindahkan gate ke modal CTA, sementara akses langsung/refresh laporan tetap terbuka.

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

Buka `http://localhost:5173`. Route publik: `/`, `/agenda`, `/profil`, `/kontak`, `/laporan-keuangan`. Navbar dan Footer halaman publik dipakai bersama melalui `PublicLayout`. Route laporan memakai halaman khusus tanpa Navbar/Footer. Menu Kontak dan CTA Hubungi Takmir pada Profil menuju `/kontak`. CTA Masuk Pengurus pada Footer menuju `/admin/login`. Halaman tidak dikenal menampilkan placeholder 404.

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

## Login Pengurus — Admin 1.1

Halaman `/admin/login` berada dalam aplikasi React yang sama, dengan layout sendiri tanpa Navbar/Footer publik. Desktop mengikuti `design-references/user/10-admin-login.png`; tablet/mobile memakai satu kolom. Foto, logo dan font memakai aset lokal yang sudah tersedia. CTA Masuk Pengurus pada Footer publik memakai React Router Link menuju halaman ini.

Form dimulai kosong, memvalidasi field wajib/format email/karakter kontrol, mendukung Enter, pesan error dan pencegahan submit ganda. Password tersembunyi secara default; tombol Eye/EyeOff di kanan input dapat menampilkan/menyembunyikannya tanpa mengubah nilai atau validasi, dengan label aksesibilitas serta hover/fokus. Tombol visibilitas tidak melakukan submit dan nonaktif saat loading. Password dibersihkan dan disembunyikan kembali setelah submit selesai; email/password tidak dipersist ke URL, storage atau cookie. `adminAuthService.loginAdmin()` menjadi batas integrasi. Endpoint autentikasi admin belum tersedia: service tidak melakukan HTTP, tidak menerima akun apa pun dan tidak membuat token/session atau navigasi dashboard. Jeda 500 ms hanya menyimulasikan loading pada development dengan `VITE_DATA_SOURCE=mock`; mode API dan build production langsung melaporkan login belum tersedia. Ini belum merupakan autentikasi sungguhan.

Koordinasi backend diperlukan untuk metode/path login di bawah base API yang dikonfigurasi, payload email/password, respons sukses, error kredensial/validasi/rate limit, mekanisme akses, serta tujuan setelah berhasil. Ikuti envelope proyek setelah disepakati. Validasi ulang, hash password, mitigasi brute force dan pengujian keamanan menjadi kebutuhan backend; belum diterapkan oleh halaman ini. Tidak ada kontrak endpoint admin yang ditetapkan sepihak.

Pengujian unit/SSR login ikut `npm test`. Dengan server development mock/API dan Chrome QA pada bagian pengujian browser di bawah, jalankan suite login terpisah dari root:

```sh
ADMIN_BROWSER_QA_URL=http://127.0.0.1:5173 ADMIN_BROWSER_API_QA_URL=http://127.0.0.1:5174 REPORT_BROWSER_CDP_URL=http://127.0.0.1:9228 node --test frontend/test/admin-login.browser.test.js
```

Suite memakai tab QA sendiri, memeriksa desktop/tablet/mobile/layar pendek, validasi/fokus, Enter/loading/submit ganda, refresh, password kosong setelah kegagalan, tidak ada penyimpanan kredensial atau HTTP autentikasi. Screenshot hanya di `tmp/admin11-qa/` yang diabaikan Git. Jalankan suite browser publik dan login secara berurutan agar input keyboard QA tidak saling mengganggu.

## Dashboard Keuangan — Admin 1.2

Dashboard dapat direview langsung di `/admin/dashboard` dengan `VITE_DATA_SOURCE=mock`, tanpa login atau backend. Ini tampilan data contoh, bukan bukti autentikasi/otorisasi; login tetap belum terhubung. `AdminLayout` menyediakan sidebar/topbar terpisah dari PublicLayout dan login. Menu tablet/mobile dapat dibuka, ditutup melalui Escape/backdrop, dan mengelola fokus keyboard. Tabel bergeser lokal; halaman tidak meluap horizontal.

`adminDashboardService.getAdminDashboard({ signal })` mengambil mock admin terpisah, menghitung saldo akhir tiap kategori dan total untuk empat kartu/tabel. Data 20 Oktober 2026 mengikuti referensi: saldo awal Rp16.864.200 + pemasukan Rp1.791.500 − pengeluaran Rp1.427.500 = saldo akhir Rp17.228.200. Lima transaksi terbaru hanyalah cuplikan. Mock laporan publik April 2026 tidak diubah. Nama/email Super Admin hanya konten akun contoh dari desain, bukan akun login atau penerapan role.

Menu/aksi yang belum dibuat dinonaktifkan dengan keterangan belum tersedia: form transaksi/kategori/agenda, operasi akun, laporan admin, kwitansi, activity log, kode akses, notifikasi dan logout. Dashboard, Kelola Dana, Kategori Dana, Profil Masjid, Agenda, Kontak & Pengaturan serta Kelola Akun dapat dibuka melalui Sidebar. Tidak ada route fiktif atau login berhasil semu. Mode `api` menampilkan error integrasi tanpa HTTP maupun fallback mock. Autentikasi serta kontrak admin tetap menunggu backend; tidak menambah endpoint/dependency.

Test unit/SSR dashboard ikut `npm test`. Setelah server mock/API dan Chrome QA dijalankan sesuai bagian browser, jalankan dari root:

```sh
ADMIN_BROWSER_QA_URL=http://127.0.0.1:5173 ADMIN_BROWSER_API_QA_URL=http://127.0.0.1:5174 REPORT_BROWSER_CDP_URL=http://127.0.0.1:9228 node --test --test-concurrency=1 frontend/test/admin-dashboard.browser.test.js frontend/test/admin-login.browser.test.js frontend/test/report-access.browser.test.js
```

Screenshot dashboard serta metrik empat viewport disimpan di `tmp/admin12-qa/development/`. Untuk QA dashboard pada preview build mock, arahkan `ADMIN_BROWSER_QA_URL` ke preview dan set `ADMIN_DASHBOARD_QA_PHASE=production`; jalankan hanya suite dashboard (simulasi loading login memerlukan server development). Artefak QA dan build diabaikan Git.

## Kelola Dana Keuangan — Admin 1.3

Route `/admin/kelola-dana` memakai AdminLayout yang sama dengan Dashboard. Sidebar menandai menu aktif dan Topbar menampilkan judul sesuai halaman; navigasi bolak-balik mengembalikan scroll ke atas. Hero dan panel Kelola Transaksi mengikuti `design-references/user/12-admin-kelola-dana.png`, dengan tombol Pemasukan/Pengeluaran nonaktif dan penjelasan fitur belum tersedia. Tidak ada form, modal, CRUD atau endpoint baru.

Dashboard dan Kelola Dana menggunakan `AdminRecentTransactions` serta data dari `adminDashboardService` melalui konteks layout yang sama. Tidak menambah salinan mock transaksi, mengubah nilai/saldo atau mengambil data baru ketika berpindah halaman. Tabel, badge, warna nominal, tombol Lihat Semua nonaktif, dan scroll lokal tetap konsisten. Mode mock mandiri dan mode API yang belum terhubung tetap mengikuti batas Admin 1.2; login/publik tidak diubah.

Suite `admin-dashboard.browser.test.js` pada perintah QA Admin 1.2 juga mencakup Kelola Dana: empat viewport, navigasi tanpa reload, judul/menu aktif, tabel identik, scroll lokal, refresh/trailing slash dan error API. Screenshot Kelola Dana disimpan di `tmp/admin13-qa/development/` atau `tmp/admin13-qa/production/`; artefak ini tidak masuk staging.

## Kategori Dana — Admin 1.4

Route `/admin/kategori-dana` memakai AdminLayout yang sama, dengan menu aktif dan judul Topbar Kategori Dana. Heading beraksen oranye, tombol Tambah Kategori, tabel tiga kategori serta resume mengikuti referensi `13-admin-kategori-dana.png`. Tambah/Edit/Hapus tetap nonaktif dengan keterangan belum tersedia; tidak ada form, dialog, penghapusan atau endpoint baru.

Kategori, saldo dan tanggal update berasal dari `adminDashboardService` melalui konteks layout yang sama. `AdminBalanceSummary` dipakai Dashboard dan Kategori Dana; kolom pertama tetap Saldo Awal. Pada Kategori Dana, deskripsi tambahan di atas resume disembunyikan sesuai referensi. Badge Jum'at Berkah dalam daftar kategori berwarna emas, sedangkan titik resume tetap biru; ini styling khusus tabel, bukan perubahan data. Saldo dan transaksi tidak berubah.

Suite `admin-dashboard.browser.test.js` juga memeriksa navigasi tiga halaman, kesamaan resume, aksi nonaktif, refresh/trailing slash dan scroll lokal pada empat viewport. Screenshot kategori di `tmp/admin14-qa/development/` atau `tmp/admin14-qa/production/` tidak di-stage. Mode API/autentikasi dan batas QA mengikuti milestone sebelumnya.

## Profil Masjid — Admin 1.5

Route `/admin/profil-masjid` memakai AdminLayout, menu aktif dan judul Topbar yang sama. Form mengikuti referensi `14-admin-profil-masjid.png`: heading beraksen oranye, Simpan Perubahan, banner, nama wajib, deskripsi singkat, alamat dan kontak. Refinement atas permintaan klien menambahkan Ganti Foto untuk preview lokal. Tidak ada upload ke server, crop, pengelolaan sejarah/visi-misi/pengurus atau endpoint baru.

`adminProfileService.getAdminProfile({ signal })` memetakan salinan field dari mock publik yang sudah ada: `name`, `heroDescription` dan `address`. Kontak dimulai kosong karena nomor publik belum terverifikasi; contoh nomor pada desain tidak digunakan. Data sumber maupun halaman publik tidak diubah. Ini konten referensi, belum data produksi terkonfirmasi.

Form memakai state lokal. Simpan memvalidasi nama dan kontak opsional (8–15 digit dengan pemisah lazim), menandai field bermasalah dan memfokuskan kesalahan pertama. Penyimpanan hanya simulasi di halaman aktif, dengan pemberitahuan yang terlihat setelah simpan; perubahan hilang saat navigasi keluar atau refresh, tanpa HTTP, storage atau cookie. Mode API menampilkan error integrasi dan tombol simpan nonaktif. Kontrak baca/tulis profil admin serta autentikasi perlu disepakati bersama backend sebelum integrasi permanen.

Ganti Foto memakai file picker native yang dapat diakses melalui keyboard, satu berkas JPG/JPEG, PNG atau WebP, maksimal 5 MB (5 × 1024 × 1024 byte). `adminProfileService` menyediakan batas/validator awal ekstensi, MIME, ukuran dan jumlah. Berkas kosong/rusak ditolak; format/ukuran tidak valid mempertahankan preview valid sebelumnya. Batalkan Foto kembali ke foto awal halaman; batal pada picker mempertahankan pilihan yang ada. Object URL dilepas saat diganti, dibatalkan, gagal dibaca atau halaman dilepas. File hanya berada di state sementara; Simpan menegaskan foto belum tersimpan ke server.

Kebutuhan backend: sepakati endpoint/metode dan field multipart untuk satu gambar, otorisasi pengurus, validasi ulang ekstensi/MIME/isi gambar/ukuran/jumlah, penyimpanan aman serta respons URL banner. URL tersebut perlu terhubung ke sumber konten publik setelah integrasi disepakati. Batas multipart harus khusus upload, tanpa memperbesar batas JSON umum 10 KB. Belum menetapkan endpoint atau mengubah kontrak API maupun banner publik.

Test unit/service dan routing ikut `npm test`. Suite browser admin pada perintah di atas juga memeriksa form, validasi, Enter, simpan simulasi, reset saat keluar/refresh, data publik tetap dan empat viewport. Refinement foto menguji picker keyboard, format/ukuran/jumlah/berkas rusak, preview, pembatalan dan pelepasan object URL. Screenshot awal/validasi/simulasi di `tmp/admin15-qa/`, serta preview/validasi foto di `tmp/admin15-photo-qa/`, tidak di-stage. QA masih terbatas Chrome/emulasi viewport.

## Kelola Agenda — Admin 1.6

Route `/admin/agenda` memakai AdminLayout, menu aktif dan judul Topbar Agenda. Heading bergaris oranye, Tambah Agenda, kartu putih horizontal, ikon kalender, nama, frekuensi/jadwal dan aksi Edit/Hapus mengikuti `15-admin-agenda.png`. Semua 25 aksi nonaktif dengan label/keterangan belum tersedia; tidak ada form, dialog, CRUD atau notifikasi keberhasilan palsu.

Halaman memanggil `agendaService.getAgenda({ signal })` yang sudah dipakai publik, tanpa service/fixture kedua. Seluruh 12 kegiatan tampil berurutan dalam kelompok Mingguan (5), Bulanan (2), Tahunan / PHBI (5). Nama/jadwal disalin dari sumber tanpa perubahan. Perbedaan penting dengan raster: Rabi’ul Awwal tetap bernama **Peringatan Maulid Nabi Muhammad SAW**, sedangkan gambar mengulang Peringatan Tahun Baru Islam; jadwal tahunan tetap memakai awalan **Bulan**. Ejaan/kapitalisasi lain juga mengikuti mock publik.

Mode mock mandiri; loading/error/daftar kosong tersedia. Cabang API pada service agenda lama belum dihubungkan dan tetap memberi error integrasi tanpa HTTP/fallback. Pada smartphone heading/tombol bertumpuk, teks/jadwal membungkus dan aksi berpindah ke baris berikutnya agar tidak bertabrakan. Tidak mengubah halaman/service/mock publik atau halaman admin sebelumnya.

Test route ikut `npm test`. Suite browser admin pada perintah di atas mencakup jumlah/isi identik dengan sumber, navigasi lima halaman, menu aktif, aksi nonaktif, empat viewport, refresh/trailing slash dan daftar publik tetap. Screenshot di `tmp/admin16-qa/development/` atau `tmp/admin16-qa/production/`, tidak di-stage. QA terbatas Chrome/emulasi viewport; CRUD dan integrasi API admin menunggu desain/kontrak berikutnya.

## Kontak & Pengaturan Website — Admin 1.7

Route `/admin/kontak-pengaturan` memakai AdminLayout, menu aktif serta judul Topbar Kontak & Pengaturan Website. Form mengikuti `16-admin-kontak-pengaturan.png`: heading beraksen oranye, Simpan Perubahan, kartu Informasi Kontak, WhatsApp, email, alamat, Google Maps dan switch Laporan Keuangan Publik.

`adminWebsiteSettingsService.getAdminWebsiteSettings({ signal })` memberikan state awal terpisah: WhatsApp/email kosong karena belum tersedia, Maps kosong karena belum terverifikasi, serta salinan alamat contoh yang juga dipakai Profil Masjid. Tidak mengambil email akun contoh Sidebar atau menganggap telepon sebagai nomor WhatsApp resmi. Switch awal aktif hanya untuk review UI; bukan pembacaan status keamanan/publikasi yang nyata.

Seluruh field controlled dan opsional. Validasi awal memeriksa WhatsApp 8–15 digit, format email dan HTTPS Google Maps (`google.com`/`google.co.id` dengan path Maps, subdomain Maps, `maps.app.goo.gl` serta `goo.gl/maps/`). Error per field memfokuskan kesalahan pertama; switch mendukung mouse/keyboard dan Simpan menampilkan feedback simulasi. Perubahan hilang saat keluar/refresh, tanpa HTTP simpan, localStorage atau cookie. Mode API menampilkan error integrasi dan tombol simpan nonaktif.

Alamat dan kontak pada Profil Masjid, halaman ini serta konten publik perlu satu sumber API dan aturan verifikasi/publikasi yang disepakati. Saat ini state masing-masing halaman terpisah; tidak ada sinkronisasi palsu. Arti toggle visibilitas dan kebutuhan otorisasi laporan harus disepakati dengan backend; toggle UI ini tidak mengubah akses/isi laporan publik. Tidak ada fitur donasi/akun atau endpoint baru.

Test service/validasi/route ikut `npm test`. Suite browser admin memeriksa empat viewport, navigasi, edit, validasi, switch keyboard, simpan simulasi, reset dan isolasi profil/kontak/laporan publik. Screenshot di `tmp/admin17-qa/development/` atau `tmp/admin17-qa/production/`, tidak di-stage. QA terbatas Chrome/emulasi viewport.

## Kelola Akun — Admin 1.8

Route `/admin/kelola-akun` memakai AdminLayout yang sama, dengan menu aktif dan Topbar Kelola Akun. Label Super Admin Only berikon Shield, heading, Tambah Akun Admin, panel pencarian dan empat kartu mengikuti `17-admin-kelola-akun.png`. Nama/email/role/tanggal serta tiga status Aktif dan satu Nonaktif adalah data contoh tampilan, bukan akun login. Tidak ada password, token atau kredensial baru.

`adminAccountsService.getAdminAccounts({ signal })` mengembalikan salinan `mocks/adminAccounts.js`. Pencarian lokal nama/email melalui Pencarian atau Enter mengabaikan kapital dan spasi luar; query kosong menampilkan semua akun, hasil kosong memiliki pesan. Mengedit input baru diterapkan saat submit. Pencarian tidak memfilter role, melakukan HTTP atau mengubah akun. Query hilang saat keluar/refresh, tanpa URL/storage/cookie. Mode API menampilkan error integrasi tanpa fallback akun contoh.

Tambah, Edit, Nonaktifkan, Hapus dan Aktifkan tetap nonaktif dengan keterangan belum tersedia. Akun aktif menampilkan Edit/Nonaktifkan, nonaktif menampilkan Edit/Hapus/Aktifkan. Inisial avatar diselaraskan dengan nama dan tanggal menggunakan formatter Indonesia yang sudah ada. Placeholder diperjelas menjadi Cari nama atau email, menggantikan Cari transaksi pada raster.

Super Admin Only serta field role hanya tampilan; tidak memberikan izin atau perlindungan route. Backend nantinya wajib memverifikasi pengguna terautentikasi dan izin Super Admin untuk akses daftar maupun setiap operasi akun. Kontrak/API autentikasi dan manajemen akun belum diintegrasikan; tidak membuat sistem role, form/modal CRUD, registrasi atau reset password.

Test service/filter/route ikut `npm test`. Suite browser admin mencakup pencarian nama/email/kapital/spasi/Enter, empty state, status/aksi, empat viewport, refresh/trailing slash dan navigasi kembali dari enam halaman admin sebelumnya. Screenshot di `tmp/admin18-qa/` tidak di-stage; QA terbatas Chrome/emulasi viewport.

## Mock dan integrasi API

Konfigurasi `frontend/.env`:

```dotenv
VITE_DATA_SOURCE=mock
VITE_API_BASE_URL=/api
```

- `mock` adalah bawaan, tidak menghubungi backend. Beranda, Agenda, Profil, Kontak, dan Footer memakai konten referensi dari `publicContentService`; konten ini belum menjadi data produksi terverifikasi.
- `VITE_DATA_SOURCE=api` tersedia pada service health. Konten publik belum memiliki endpoint bisnis; halaman publik menampilkan pesan integrasi belum tersedia pada mode ini. Restart Vite setelah mengubah `.env`.
- `PublicLayout` memuat konten melalui `src/services/publicContentService.js` lalu membagikannya kepada Beranda, Agenda, Profil, dan Kontak. Ringkasan serta daftar kegiatan berasal dari satu `agendaService` dan mock agenda; statistik dihitung dari daftar. Service health tetap tersedia; komponen tidak memanggil API langsung.
- Kontak dan Donasi memakai placeholder “Data belum dikonfirmasi” untuk QRIS, rekening, alamat kontak, telepon, dan jam layanan. Aset QRIS sumber belum dipublikasikan; tombol Google Maps nonaktif sampai lokasi dikonfirmasi. Tidak ada pembayaran, unduhan QRIS, salin rekening, atau tautan WhatsApp.
- Gate laporan memakai `reportService.checkReportPassword()`. Mulai M1.8b, klik CTA Beranda/Footer membuka modal di atas halaman asal dengan overlay, scroll/fokus terkunci, tombol tutup dan Escape. Sandi contoh **`demo123`** khusus pengembangan; jika benar, modal ditutup dan frontend menuju laporan. Akses langsung atau refresh `/laporan-keuangan` tetap menampilkan laporan tanpa gate; refresh mereset tampilan/filter ke default. Sandi/status tidak disimpan pada URL, storage, atau cookie. Mode API menampilkan error integrasi belum tersedia tanpa mengirim sandi ke endpoint. Gate hanya formalitas interaksi CTA, bukan proteksi route atau endpoint data.
- `reportService.getReport()` menyediakan transaksi dan ringkasan dari mock berisi 17 pemasukan dan 33 pengeluaran. Nominal berupa integer Rupiah; saldo akhir dihitung dari saldo awal + pemasukan − pengeluaran. Rentang tanggal inklusif berlaku setelah Terapkan; saldo awal kustom memperhitungkan mutasi sebelumnya. Preset memakai acuan 30 April 2026. Bulan/rentang di luar April menampilkan data belum tersedia/lengkap, bukan saldo nol.
- Tombol Unduh pada laporan membuka pilihan PDF/PNG, lalu pratinjau, tetap di `/laporan-keuangan`. Kembali mempertahankan filter dan format selama halaman terbuka. Kedua format memakai `ReportSheet` dan data service yang sama; jumlah lembar dihitung dari kapasitas A4, dengan ringkasan pada lembar terakhir. Mobile memakai scroll lokal dan tombol Lebar halaman. M1.6b mengaktifkan unduhan dari lembar yang sedang ditampilkan, tanpa mengambil data baru atau menghitung ulang laporan. PDF memuat satu lembar per halaman A4 landscape. PNG satu lembar diunduh langsung; beberapa lembar dikemas dalam satu ZIP dengan nama `halaman-01.png`, `halaman-02.png`, dan seterusnya.
- Proxy Vite meneruskan `/api` ke `http://127.0.0.1:3000`, sehingga integrasi lokal tidak memerlukan CORS. Jika port backend berubah, sesuaikan target di `frontend/vite.config.js`.
- Semua variabel `VITE_*` tersedia pada browser: jangan mengisinya dengan rahasia. Nilainya ditanam saat build.
- Proxy hanya berlaku pada server development Vite. Untuk integrasi di hosting kelak, tim perlu menyepakati routing `/api` atau URL API dan kebijakan CORS. Hosting dengan BrowserRouter juga perlu fallback ke `index.html` untuk route frontend. Belum ada konfigurasi deployment pada milestone ini.

## Ekspor laporan — M1.6b

- Dependency frontend yang dikunci: [html-to-image 1.11.13](https://github.com/bubkoo/html-to-image/tree/v1.11.13), [jsPDF 4.2.1](https://github.com/parallax/jsPDF/tree/v4.2.1), dan [JSZip 3.10.2](https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html). Library dimuat dinamis saat ekspor diperlukan; JSZip hanya digunakan untuk PNG lebih dari satu lembar. Tidak ada layanan render atau upload laporan.
- `reportExportService.createReportExport()` menerima report, pages dan elemen ReportSheet yang sama dengan pratinjau. Service menolak laporan tidak lengkap, perbedaan data transaksi, ID hilang/berulang, atau lembar yang belum siap. Tidak membuat mock, request data atau perhitungan saldo kedua.
- Font Plus Jakarta Sans lokal ditunggu dan disematkan; gambar pada lembar ditunggu sebelum render. html-to-image merender hanya setiap lembar dengan ukuran tetap A4 pada 2× (2245 × 1587 piksel), tanpa transform responsif, kontainer scroll atau tombol. Kanvas kosong/resolusi tidak cukup ditolak. PDF menempatkan gambar secara proporsional pada A4 297 × 210 mm; tidak membuat halaman tambahan.
- Nama berkas bulan penuh: `laporan-keuangan-masjid-al-hidayah-2026-04.pdf`, `.png` atau `.zip`. Rentang khusus memakai tanggal awal dan akhir pada nama. Periode, penanda data pengembangan, transaksi serta resume sama pada pratinjau dan hasil unduhan.
- Selama ekspor, tombol unduh/format/kembali dinonaktifkan dan status proses ditampilkan. Ekspor gagal menampilkan pesan dan dapat dicoba lagi. Status selesai hanya muncul setelah Blob berkas dibuat dan pemicu unduhan dijalankan. Penyimpanan akhir, pembatalan atau pemblokiran oleh browser/sistem operasi tetap berada di bawah kendali pengguna.
- PDF berbasis gambar: teks belum dapat diseleksi atau dicari. Resolusi 2× setara sekitar 192 dpi, dengan font kecil mengikuti komposisi lembar desain. Uraian yang sudah disingkat pada sumber tetap disingkat; tidak mengarang kelanjutannya. Laporan besar memakai lebih banyak memori/waktu perangkat. QA aktual menggunakan Chrome desktop dan emulasi viewport mobile; browser lain serta perangkat mobile fisik belum diuji.

## Verifikasi lokal

```sh
npm ls --workspaces --depth=0
npm run lint
npm test
npm run build
npm audit
```

`lint` menjalankan Oxlint frontend dan pemeriksaan sintaks backend. `test` menjalankan 36 test frontend melalui Node.js/Vite SSR (Agenda/Profil/Kontak, service/panel gate dan route laporan langsung, rekonsiliasi laporan/filter, konsistensi data, pembagian lembar dan pratinjau, loading/empty/error, mode API, perlindungan data belum dikonfirmasi) dan tiga test HTTP backend (health, 404, JSON tidak valid). Satu suite browser gate/laporan/pratinjau dengan 35 skenario tersedia secara opsional; tanpa konfigurasi browser suite ditandai dilewati. Pemeriksaan visual tetap diperlukan. Build menghasilkan `frontend/dist`, yang diabaikan Git.

Untuk memeriksa hasil build lokal: `npm run preview --workspace frontend`. Preview tidak menyediakan proxy API; gunakan mode mock untuk pemeriksaan mandiri.

## Pengujian interaksi laporan dengan Chrome lokal

Tidak memerlukan dependency tambahan. Gunakan tiga terminal terpisah dari root repository: jalankan frontend mock dengan `npm run dev:frontend`, frontend mode API dengan `VITE_DATA_SOURCE=api npm run dev --workspace frontend -- --host 127.0.0.1 --port 5174`, dan instance Chrome QA terpisah. Contoh macOS:

```sh
mkdir -p tmp/browser-qa
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9228 --remote-debugging-address=127.0.0.1 --user-data-dir="$PWD/tmp/browser-qa/chrome-profile" --no-first-run --no-default-browser-check about:blank
```

Sesuaikan lokasi executable Chrome pada sistem lain. Gunakan profil QA terpisah, bukan profil browser pribadi. Server pertama harus memakai mode mock; `VITE_DATA_SOURCE=mock npm run dev:frontend` dapat dipakai jika konfigurasi lokal berbeda. Jalankan seluruh test dengan browser tersedia:

```sh
REPORT_BROWSER_QA_URL=http://127.0.0.1:5173 REPORT_BROWSER_API_QA_URL=http://127.0.0.1:5174 REPORT_BROWSER_CDP_URL=http://127.0.0.1:9228 npm test
```

Suite browser memakai tab pada instance QA tersebut. Cakupannya: akses langsung, sandi kosong/salah/benar melalui Enter, loading, pencegahan submit ganda, kegagalan mode API, refresh, pemeriksaan storage/URL/cookie, CTA Beranda/Footer, keluar–masuk halaman, konsistensi laporan, rentang inklusif, saldo awal kustom, tanggal terbalik, hari tanpa transaksi dan periode tidak lengkap. Alur format/pratinjau memeriksa pemilihan PDF/PNG, isi lembar yang identik, jumlah baris/total, navigasi kembali dengan filter tetap dan refresh dari pratinjau. Pengujian ekspor menerima berkas nyata dari Chrome, memeriksa signature/jumlah halaman/ukuran A4 PDF, CRC serta dimensi setiap PNG dalam ZIP, PNG tunggal terfilter, pencegahan ekspor ganda, render kosong dan kegagalan unduhan. Audit M1.7 menambahkan alur publik berurutan, skip link/fokus/scroll lokal melalui keyboard, error API empat halaman dan enam viewport termasuk subtotal yang tetap utuh. M1.8a memeriksa Navbar saat scroll; M1.8b memastikan modal berada di atas Navbar, fokus/scroll terkunci dan dipulihkan saat tutup, pembatalan pemeriksaan saat loading, serta akses langsung/refresh laporan tanpa gate. Request aset/HTTP yang gagal ikut menggagalkan suite. Hasil sementara disimpan dalam `tmp/report-export-tests/`. Hentikan server serta Chrome QA setelah pengujian. Screenshot/profil sementara berada di `tmp/` yang diabaikan Git.

## Struktur repository

```text
frontend/
  src/
    components/  # PublicLayout, Navbar, Footer
    pages/       # Beranda, Agenda, Profil, Kontak, Laporan langsung; 404
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
- [Handoff frontend publik ke backend](docs/FRONTEND_HANDOFF.md)
- [Integrasi Tailwind v4 dengan plugin Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Inisialisasi React melalui Vite](https://vite.dev/guide/)
- [React Router mode deklaratif](https://reactrouter.com/start/declarative/installation)
