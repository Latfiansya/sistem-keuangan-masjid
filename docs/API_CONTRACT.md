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
