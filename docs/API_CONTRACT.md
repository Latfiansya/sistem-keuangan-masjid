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
| Laporan publik | Definisi pemasukan, pengeluaran, saldo, periode, dan akses publik | Belum disepakati |
| Daftar data laporan | Filter, urutan, pagination, kebutuhan ekspor | Belum disepakati |
| Konsistensi kontrak | Nama endpoint, skema data, metadata, kode validasi | Belum disepakati |
| Infrastruktur | Database, autentikasi bila diperlukan, CORS, URL tiap lingkungan | Belum disepakati |

Jangan membuat endpoint bisnis, database, migrasi, atau autentikasi berdasarkan tabel kebutuhan ini saja. Catat persetujuan tim dan contoh payload sebelum implementasi. Saat kontrak disepakati, buat service dan mock dengan bentuk data yang sama.

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
