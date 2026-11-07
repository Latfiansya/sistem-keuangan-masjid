# Sistem Keuangan dan Profil Masjid Al-Hidayah

Repository kolaborasi mahasiswa untuk frontend publik dan backend sistem keuangan masjid. M1.1a melengkapi layout publik dan Beranda dengan foto serta logo dari referensi Blade dan font Plus Jakarta Sans lokal, sambil mempertahankan refinement skala M1.1. M1.2 menambahkan halaman Agenda beserta navigasi dan data mock bersama Beranda. M1.3 melengkapi Profil Masjid memakai data bersama Beranda, linimasa, dan tujuh pengurus. M1.4 menambahkan Kontak dan Donasi dengan placeholder data yang belum dikonfirmasi. M1.5a menambahkan gate sandi bersama; M1.5b melengkapi laporan mock April 2026, rentang tanggal, dua tabel transaksi dan resume saldo. M1.6a menambahkan pilihan format PDF/PNG serta pratinjau lembar A4 lanskap. M1.6b mengaktifkan unduhan PDF, PNG tunggal, atau ZIP berisi PNG tiap lembar.

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

Buka `http://localhost:5173`. Route publik: `/`, `/agenda`, `/profil`, `/kontak`, `/laporan-keuangan`. Navbar dan Footer halaman publik dipakai bersama melalui `PublicLayout`. Route laporan memakai halaman khusus tanpa Navbar/Footer. Menu Kontak dan CTA Hubungi Takmir pada Profil menuju `/kontak`. Masuk Pengurus belum aktif. Halaman tidak dikenal menampilkan placeholder 404.

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

- `mock` adalah bawaan, tidak menghubungi backend. Beranda, Agenda, Profil, Kontak, dan Footer memakai konten referensi dari `publicContentService`; konten ini belum menjadi data produksi terverifikasi.
- `VITE_DATA_SOURCE=api` tersedia pada service health. Konten publik belum memiliki endpoint bisnis; halaman publik menampilkan pesan integrasi belum tersedia pada mode ini. Restart Vite setelah mengubah `.env`.
- `PublicLayout` memuat konten melalui `src/services/publicContentService.js` lalu membagikannya kepada Beranda, Agenda, Profil, dan Kontak. Ringkasan serta daftar kegiatan berasal dari satu `agendaService` dan mock agenda; statistik dihitung dari daftar. Service health tetap tersedia; komponen tidak memanggil API langsung.
- Kontak dan Donasi memakai placeholder “Data belum dikonfirmasi” untuk QRIS, rekening, alamat kontak, telepon, dan jam layanan. Aset QRIS sumber belum dipublikasikan; tombol Google Maps nonaktif sampai lokasi dikonfirmasi. Tidak ada pembayaran, unduhan QRIS, salin rekening, atau tautan WhatsApp.
- Gate laporan memakai `reportService.checkReportPassword()`. Pada mode mock, sandi contoh **`demo123`** membuka laporan mock April 2026; nilai ini khusus pengembangan dan bukan sandi produksi. Refresh atau keluar dari halaman mengembalikan gate. Sandi/status tidak disimpan pada URL, storage, atau cookie. Mode API menampilkan error integrasi belum tersedia tanpa mengirim sandi ke endpoint. Gate hanya pembatas antarmuka dan tidak melindungi endpoint data laporan yang bersifat publik.
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

`lint` menjalankan Oxlint frontend dan pemeriksaan sintaks backend. `test` menjalankan 35 test frontend melalui Node.js/Vite SSR (Agenda/Profil/Kontak, service dan struktur gate, rekonsiliasi laporan/filter, konsistensi data, pembagian lembar dan pratinjau, loading/empty/error, mode API, perlindungan data belum dikonfirmasi) dan tiga test HTTP backend (health, 404, JSON tidak valid). Satu suite browser gate/laporan/pratinjau dengan 26 skenario tersedia secara opsional; tanpa konfigurasi browser suite ditandai dilewati. Pemeriksaan visual tetap diperlukan. Build menghasilkan `frontend/dist`, yang diabaikan Git.

Untuk memeriksa hasil build lokal: `npm run preview --workspace frontend`. Preview tidak menyediakan proxy API; gunakan mode mock untuk pemeriksaan mandiri.

## Pengujian interaksi laporan dengan Chrome lokal

Tidak memerlukan dependency tambahan. Gunakan tiga terminal terpisah dari root repository: jalankan frontend mock dengan `npm run dev:frontend`, frontend mode API dengan `VITE_DATA_SOURCE=api npm run dev --workspace frontend -- --host 127.0.0.1 --port 5174`, dan instance Chrome QA terpisah. Contoh macOS:

```sh
mkdir -p tmp/m15a-qa
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9228 --remote-debugging-address=127.0.0.1 --user-data-dir="$PWD/tmp/m15a-qa/chrome-profile" --no-first-run --no-default-browser-check about:blank
```

Sesuaikan lokasi executable Chrome pada sistem lain. Gunakan profil QA terpisah, bukan profil browser pribadi. Server pertama harus memakai mode mock; `VITE_DATA_SOURCE=mock npm run dev:frontend` dapat dipakai jika konfigurasi lokal berbeda. Jalankan seluruh test dengan browser tersedia:

```sh
REPORT_BROWSER_QA_URL=http://127.0.0.1:5173 REPORT_BROWSER_API_QA_URL=http://127.0.0.1:5174 REPORT_BROWSER_CDP_URL=http://127.0.0.1:9228 npm test
```

Suite browser memakai tab pada instance QA tersebut. Cakupannya: akses langsung, sandi kosong/salah/benar melalui Enter, loading, pencegahan submit ganda, kegagalan mode API, refresh, pemeriksaan storage/URL/cookie, CTA Beranda/Footer, keluar–masuk halaman, konsistensi laporan, rentang inklusif, saldo awal kustom, tanggal terbalik, hari tanpa transaksi dan periode tidak lengkap. Alur format/pratinjau memeriksa pemilihan PDF/PNG, isi lembar yang identik, jumlah baris/total, navigasi kembali dengan filter tetap dan refresh dari pratinjau. Pengujian ekspor menerima berkas nyata dari Chrome, memeriksa signature/jumlah halaman/ukuran A4 PDF, CRC serta dimensi setiap PNG dalam ZIP, PNG tunggal terfilter, pencegahan ekspor ganda, render kosong dan kegagalan unduhan. Hasil sementara disimpan dalam `tmp/report-export-tests/`. Hentikan server serta Chrome QA setelah pengujian. Screenshot/profil sementara berada di `tmp/` yang diabaikan Git.

## Struktur repository

```text
frontend/
  src/
    components/  # PublicLayout, Navbar, Footer
    pages/       # Beranda, Agenda, Profil, Kontak, Laporan dengan gate; 404
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
