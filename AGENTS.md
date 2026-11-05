# Aturan coding agent

- Seluruh komunikasi, laporan, dokumentasi, komentar penjelas, dan usulan pesan commit menggunakan bahasa Indonesia. Identifier dan sintaks kode boleh berbahasa Inggris.
- Utamakan kode sederhana, fungsional, dan mudah dipahami; jangan membuat abstraksi atau direktori sebelum diperlukan.
- Jangan menambah dependency tanpa kebutuhan yang jelas.
- Bekerja hanya di repository ini. Jangan mengubah pekerjaan anggota lain tanpa relevansi dengan tugas yang diberikan.
- Frontend menggunakan lapisan `services` untuk data dinamis. Komponen tidak memanggil API langsung. Mode mock harus tetap bisa berjalan tanpa backend.
- Jangan mengarang desain atau URL Figma yang belum final. Implementasi visual mengikuti frame resmi yang diberikan pengguna.
- Lakukan pengujian lokal setelah perubahan: jalankan pemeriksaan yang relevan, minimal lint, test, dan build untuk perubahan kode fondasi. Perbaiki kegagalan dalam lingkup tugas.
- Periksa `git status`, `git diff`, daftar file, dan diff staged sebelum menyatakan siap commit. Jangan memasukkan `.env`, credential, token, log, `node_modules`, atau hasil build.
- Git staging diperbolehkan setelah pemeriksaan file dan validasi lokal.
- Jangan melakukan commit, push, merge, rebase, membuat repository remote, atau operasi Git destruktif secara otomatis.
- Pengguna adalah satu-satunya pihak yang memutuskan dan mengeksekusi commit serta push.
- `main` adalah branch stabil. Pengembangan fitur selanjutnya memakai branch terpisah dengan nama deskriptif, misalnya `fitur/profil-masjid`.
- GitHub kelak menjadi remote utama `origin`; GitLab kampus menjadi remote kedua setelah disepakati. Jangan membuat atau mengonfigurasi remote tanpa instruksi.
- Selalu laporkan hasil verifikasi, file yang di-stage, batasan yang tersisa, dan saran pesan commit dalam bahasa Indonesia.
- Perbarui `docs/PROGRESS.md` pada akhir milestone penting; perbarui kontrak API dan peta desain jika keputusan terkait berubah.
- Jangan menambahkan database, autentikasi, fitur bisnis, dashboard admin, Docker, CI/CD, atau deployment di Milestone 0.
