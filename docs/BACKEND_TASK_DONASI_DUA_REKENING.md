# Tugas Integrasi Backend — Donasi Transfer Bank Maksimal 2 Rekening

Dokumen ini merangkum revisi frontend untuk dukungan maksimal **2 rekening Transfer Bank** (halaman publik `/kontak` dan halaman admin `/admin/donasi`) beserta spesifikasi teknis yang perlu diimplementasikan oleh tim backend agar Rekening 2 tersimpan permanen di PostgreSQL dan tampil di halaman publik.

---

## 1. Ringkasan Revisi Frontend

### A. Halaman Publik (`/kontak`)
- **File terkait:** `frontend/src/components/DonationSection.jsx`, `frontend/src/index.css`, `frontend/src/mocks/publicContent.js`.
- **Header card Transfer Bank:** Badge status (`Terkonfirmasi` / `Belum dikonfirmasi`, `.contact-chip`) dihapus. Badge pada card **Scan QRIS** tetap dipertahankan. Posisi, jarak, dan tipografi `<h3>Transfer Bank</h3>` serta paragraf deskripsi tetap sama.
- **Tata letak 1 vs 2 rekening:**
  - Jika **2 rekening terverifikasi**, keduanya tampil berdampingan (`.contact-bank-list`) dengan garis pemisah vertikal tipis `.contact-bank-divider` di tengah yang tingginya tepat setinggi blok `<dl className="contact-bank">`. Pada layar sempit/mobile (`<= 1023px`), layout menumpuk vertikal dengan garis pemisah horizontal tipis (`1px`).
  - Jika hanya **1 rekening terverifikasi** (atau belum ada yang terverifikasi), tampilan kembali ke 1 kolom bersih tanpa sekat tengah.
- **Adaptor pembacaan data (`getVerifiedBankAccounts`):**
  - Membaca `contact.donation.banks` (array, maksimal 2 item) terlebih dahulu, lalu fallback ke `[contact.donation.bank, contact.donation.bank2]`.
  - Setiap rekening hanya dirender jika `verified === true` serta `name`, `number`, dan `recipient` terisi (non-kosong setelah `.trim()`).

### B. Halaman Admin (`/admin/donasi`) & Panel Pratinjau
- **File terkait:** `frontend/src/pages/AdminDonationPage.jsx`, `frontend/src/pages/AdminDonationPage.css`, `frontend/src/services/adminDonationService.js`.
- **Input Rekening 1 & 2:** Card **Transfer Bank** kini memiliki blok **Rekening 1** (`Utama`: `bankName`, `accountNumber`, `accountName`) dan blok **Rekening 2** (`Opsional`: `bankName2`, `accountNumber2`, `accountName2`).
- **Validasi & kelengkapan:**
  - Rekening 2 opsional jika seluruh 3 kolomnya kosong.
  - Jika salah satu dari 3 kolom Rekening 2 diisi, maka ketiga kolom Rekening 2 wajib dilengkapi dan valid sebelum dapat disimpan atau ditampilkan.
  - Badge status header card menampilkan `Lengkap · 1 rekening`, `Lengkap · 2 rekening`, atau `Belum lengkap`.
- **Panel Pratinjau (kanan):** Menampilkan 1 rekening atau 2 rekening berdampingan lengkap dengan sekat tengah secara langsung.
- **Kondisi saat ini (sementara):**
  - Rekening 1 tersimpan normal ke backend (`PUT /api/admin/donation-settings`).
  - Frontend sudah mengirim `bankName2`, `accountNumber2`, `accountName2` pada `PUT /api/admin/donation-settings` serta menormalisasi `bankAccounts` atau `bankName2`/`accountNumber2`/`accountName2` saat membaca `GET`.
  - Karena backend saat ini belum menyimpan/mengembalikan key `bankName2` (atau `bankAccounts`), `saveAdminDonationSettings` sementara mempertahankan nilai Rekening 2 di state sesi lokal agar pratinjau tidak hilang, namun **data Rekening 2 akan hilang saat refresh** sampai backend & database mendukungnya.

---

## 2. Daftar Tugas Tim Backend (Checklist)

### A. Perubahan Database (`keu_masjid.m_pengaturan_website`)
- [ ] Tambahkan 3 kolom opsional (`NULL`-able) untuk Rekening 2 pada tabel `keu_masjid.m_pengaturan_website`:
  - `bank2_nama VARCHAR(100) NULL`
  - `bank2_no_rekening VARCHAR(40) NULL`
  - `bank2_atas_nama VARCHAR(160) NULL`
  *(Sesuaikan panjang/tipe karakter dengan kolom `bank_nama`, `bank_no_rekening`, dan `bank_atas_nama` yang sudah ada di DB live; seluruh kolom Rekening 2 wajib mengizinkan `NULL`).*
- [ ] *(Disarankan)* Tambahkan constraint integritas di level DB:
  - Cek konsistensi: `bank2_nama`, `bank2_no_rekening`, `bank2_atas_nama` harus terisi ketiganya atau `NULL` ketiganya.
  - Cek format nomor rekening jika tidak `NULL`: `bank2_no_rekening ~ '^[0-9]{1,40}$'`.
- [ ] Verifikasi trigger audit (`fn_log_activity` / `t_activity_log`) pada `m_pengaturan_website` agar perubahan `bank2_*` tetap berjalan lancar tanpa melanggar check constraint `t_activity_log`.

### B. Endpoint Admin (`GET` & `PUT /api/admin/donation-settings`)
- [ ] **Repository (`backend/src/repositories/adminSettingsRepository.js`):**
  - Pada `getDonationSettings()`: tambahkan `bank2_nama, bank2_no_rekening, bank2_atas_nama` di query `SELECT` dan kembalikan `bankName2`, `accountNumber2`, `accountName2` (string kosong `""` jika `NULL`).
  - Pada `saveDonationSettings()`: masukkan `bank2_nama`, `bank2_no_rekening`, `bank2_atas_nama` ke query `INSERT ... ON CONFLICT (id) DO UPDATE` (simpan `null` jika string kosong) serta kembalikan di klausa `RETURNING` dan objek hasil.
- [ ] **Service (`backend/src/services/adminSettingsService.js`):**
  - Pada `updateDonationSettings(payload)`:
    - Validasi `bankName2`: `string`, maks `100` karakter, tanpa karakter kontrol (`hasControlChars(val, false)`).
    - Validasi `accountName2`: `string`, maks `160` karakter, tanpa karakter kontrol (`hasControlChars(val, false)`).
    - Validasi `accountNumber2`: `string`, setelah `.trim()` jika non-kosong wajib cocok `/^\d{1,40}$/` (pertahankan nol di depan / *leading zero* seperti `007...`).
    - **Aturan parsial Rekening 2:** jika seluruh 3 field Rekening 2 setelah `.trim()` kosong, simpan sebagai kosong/`NULL`; jika **1 atau 2** field terisi dan masih ada yang kosong, lempar `400 BAD_REQUEST` (`createHttpError(400, 'BAD_REQUEST', ...)`).
    - Pertahankan perilaku Rekening 1 yang sudah ada untuk payload parsial agar kompatibel dengan unit test existing.
  - Pada `computeDonationReadiness(values)`:
    - Hitung `bank1Complete` (3 field Rekening 1 terisi & valid) dan `bank2Empty` / `bank2Complete` / `bank2Partial`.
    - `bankComplete = bank1Complete && (bank2Empty || bank2Complete)`.
    - Tambahkan info `accountCount` dan `accounts` pada `readiness.bank` jika ingin selaras dengan struktur frontend (opsional, frontend tetap menghitung dari field utama).

### C. Endpoint Publik (`GET /api/public/content`)
- [ ] **Repository (`backend/src/repositories/publicContentRepository.js`):**
  - Tambahkan `bank2_nama, bank2_no_rekening, bank2_atas_nama` pada query `m_pengaturan_website`.
  - Hitung `bank2Verified = Boolean(settings?.bank2_nama?.trim() && settings?.bank2_no_rekening?.trim() && settings?.bank2_atas_nama?.trim())`.
  - Tambahkan `bank2` di dalam `contact.donation`:
    ```js
    bank2: {
      verified: bank2Verified,
      name: bank2Verified ? settings.bank2_nama.trim() : null,
      number: bank2Verified ? settings.bank2_no_rekening.trim() : null,
      recipient: bank2Verified ? settings.bank2_atas_nama.trim() : null,
    }
    ```
  - *(Catatan: cukup kembalikan `bank` dan `bank2` — komponen `DonationSection.jsx` di frontend sudah langsung membaca `[donation.bank, donation.bank2]` tanpa perlu mengubah kode frontend lagi).*
- [ ] **Service (`backend/src/services/publicContentService.js`):**
  - Di `sanitizePublicContact(contact)`, sanitasi `contact.donation.bank2` persis seperti `contact.donation.bank`: jika `verified !== true`, seluruh `name`, `number`, dan `recipient` wajib diset `null`.

### D. Pengujian Backend
- [ ] Perbarui fixture di `backend/test/helpers/testRepositories.js` (`donationSettings` menambah `bankName2: ''`, `accountNumber2: ''`, `accountName2: ''`; `publicContent.contact.donation` menambah `bank2: { verified: false, name: null, number: null, recipient: null }`).
- [ ] Tambahkan test di `backend/test/adminSettings.test.js`:
  - Simpan 1 rekening lengkap dengan Rekening 2 kosong → `200`, `bankEnabled: true`, field `*2` bernilai `""`.
  - Simpan 2 rekening lengkap (termasuk nomor rekening dengan leading zero) → `200`, seluruh field Rekening 1 & 2 tersimpan.
  - Kirim Rekening 2 terisi sebagian (1 atau 2 dari 3 field) → ditolak `400 BAD_REQUEST`.
  - Kirim `accountNumber2` tidak valid (huruf/tanda baca/spasi) atau `bankName2`/`accountName2` melebihi batas / mengandung karakter kontrol → `400 BAD_REQUEST`.
  - Kosongkan kembali Rekening 2 (`""`) → `200`, Rekening 2 kembali `""` (`NULL` di DB) sementara Rekening 1 tetap terjaga.
- [ ] Tambahkan test di `backend/test/public.test.js`:
  - `contact.donation.bank2` bernilai `{ verified: false, name: null, number: null, recipient: null }` saat belum terverifikasi (tidak membocorkan data yang belum terverifikasi).
  - Saat 2 rekening terverifikasi di repository, `GET /api/public/content` mengembalikan `contact.donation.bank` dan `contact.donation.bank2` dengan `verified: true`.

---

## 3. Kontrak Payload & Response JSON

### A. `PUT /api/admin/donation-settings`

**Request (2 rekening lengkap):**
```json
{
  "bankName": "Bank Syariah Indonesia",
  "accountNumber": "007123456789",
  "accountName": "Takmir Masjid Al-Hidayah",
  "bankName2": "Bank BPD DIY Syariah",
  "accountNumber2": "800112233445",
  "accountName2": "Panitia Pembangunan Masjid Al-Hidayah",
  "qrisEnabled": false,
  "bankEnabled": true,
  "whatsappNumber": "6281234567890",
  "whatsappEnabled": true,
  "messageTemplate": "Assalamu’alaikum Takmir Masjid Al-Hidayah...",
  "donationNote": "Periksa nama penerima sebelum transfer dan simpan bukti donasi."
}
```

**Response HTTP `200` (2 rekening lengkap):**
```json
{
  "success": true,
  "data": {
    "qrisFile": null,
    "qrisEnabled": false,
    "bankName": "Bank Syariah Indonesia",
    "accountNumber": "007123456789",
    "accountName": "Takmir Masjid Al-Hidayah",
    "bankName2": "Bank BPD DIY Syariah",
    "accountNumber2": "800112233445",
    "accountName2": "Panitia Pembangunan Masjid Al-Hidayah",
    "bankEnabled": true,
    "whatsappNumber": "6281234567890",
    "whatsappEnabled": true,
    "messageTemplate": "Assalamu’alaikum Takmir Masjid Al-Hidayah...",
    "donationNote": "Periksa nama penerima sebelum transfer dan simpan bukti donasi.",
    "readiness": {
      "qris": {
        "complete": false,
        "enabled": false,
        "reason": "Gambar QRIS belum tersedia. Unggah gambar valid, lalu aktifkan visibilitas QRIS."
      },
      "bank": {
        "complete": true,
        "enabled": true,
        "reason": "2 rekening siap ditampilkan dalam pratinjau simulasi."
      },
      "whatsapp": {
        "complete": true,
        "enabled": true,
        "reason": "Siap ditampilkan dalam pratinjau simulasi."
      },
      "paymentReadyCount": 1
    }
  }
}
```

**Request (mengosongkan Rekening 2):**
Kirim `bankName2: ""`, `accountNumber2: ""`, `accountName2: ""` bersama data Rekening 1 yang valid. Backend menyimpan ketiganya sebagai `NULL` dan mengembalikan `""` pada response `200`.

**Response HTTP `400` (jika Rekening 2 hanya diisi sebagian):**
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Jika Rekening 2 digunakan, Nama Bank, Nomor Rekening, dan Atas Nama Rekening 2 wajib dilengkapi seluruhnya."
  }
}
```

### B. `GET /api/public/content` (bagian `contact.donation`)

```json
{
  "success": true,
  "data": {
    "contact": {
      "donation": {
        "qris": {
          "verified": false,
          "imageSrc": null
        },
        "bank": {
          "verified": true,
          "name": "Bank Syariah Indonesia",
          "number": "007123456789",
          "recipient": "Takmir Masjid Al-Hidayah"
        },
        "bank2": {
          "verified": true,
          "name": "Bank BPD DIY Syariah",
          "number": "800112233445",
          "recipient": "Panitia Pembangunan Masjid Al-Hidayah"
        }
      }
    }
  }
}
```

---

## 4. Peta File Backend & Dokumentasi Terkait

| File | Perubahan yang Diperlukan |
| --- | --- |
| `backend/src/repositories/adminSettingsRepository.js` | Query & mapping `bank2_nama`, `bank2_no_rekening`, `bank2_atas_nama` pada `getDonationSettings` & `saveDonationSettings` |
| `backend/src/services/adminSettingsService.js` | Validasi field `*2`, aturan parsial Rekening 2, dan pembaruan `computeDonationReadiness` |
| `backend/src/controllers/adminSettingsController.js` | Tidak perlu perubahan (cukup verifikasi penerusan `req.body` ke service) |
| `backend/src/repositories/publicContentRepository.js` | Ambil `bank2_*` dari `m_pengaturan_website` dan bentuk `contact.donation.bank2` |
| `backend/src/services/publicContentService.js` | Sanitasi `contact.donation.bank2` di `sanitizePublicContact` |
| `backend/test/helpers/testRepositories.js` | Tambah field `bankName2`/`accountNumber2`/`accountName2` & `contact.donation.bank2` pada state uji |
| `backend/test/adminSettings.test.js` | Tambah skenario 1 rekening, 2 rekening, parsial `400`, validasi format, dan pengosongan Rekening 2 |
| `backend/test/public.test.js` | Tambah verifikasi `contact.donation.bank2` (terverifikasi dan belum terverifikasi) |
| `docs/API_CONTRACT.md` | Perbarui ringkasan payload/response `/api/admin/donation-settings` dan `/api/public/content` |

---

## 5. Kriteria Selesai (Checklist Verifikasi Integrasi)

- [ ] Migrasi SQL kolom `bank2_nama`, `bank2_no_rekening`, `bank2_atas_nama` terpasang di PostgreSQL `keu_masjid.m_pengaturan_website` dan `npm run db:check --workspace backend` lulus.
- [ ] `npm run lint --workspace backend` dan `npm test --workspace backend` seluruhnya **PASS** (termasuk skenario baru Rekening 2).
- [ ] `npm run lint --workspace frontend` dan `npm test --workspace frontend` seluruhnya **PASS**.
- [ ] Uji integrasi dengan `VITE_DATA_SOURCE=api`:
  1. Buka `/admin/donasi`, isi Rekening 1 & Rekening 2 lengkap, nyalakan toggle, lalu **Simpan Perubahan** → tidak muncul catatan sesi lokal, dan setelah **refresh browser** kedua rekening tetap terisi.
  2. Buka `/kontak` → kedua rekening langsung tampil berdampingan (desktop) dan menumpuk rapi (mobile) tanpa badge `Terkonfirmasi` dan tanpa perlu mengubah kode frontend lagi.
  3. Kosongkan Rekening 2 di `/admin/donasi` lalu **Simpan Perubahan** → `/kontak` kembali menampilkan 1 kolom rekening tanpa sekat pemisah.
