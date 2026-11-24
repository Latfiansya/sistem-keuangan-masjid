-- Mengubah 26 kolom timestamp tanpa zona waktu di schema keu_masjid menjadi timestamptz.
-- Dijalankan manual oleh DBA melalui DB Manager pada database db_keuangan_masjid_dev.
--
-- Data lama bercampur zona waktu (zona server Etc/UTC, sesi DB Manager Asia/Jakarta):
--   * WIB  : nilai sebelum 2026-11-21 (impor Excel 2 Nov dan seed konten 19 Nov lewat DB Manager) serta
--            jendela 2026-11-21 13:38-13:40 (perubahan role/status pengguna 1 & 2 lewat DB Manager;
--            activity log id 44-46 dan m_pengguna.updated_at).
--   * UTC  : semua nilai lain (ditulis aplikasi, mis. activity log id 43, 47-85).
-- Bukti urutan: activity log id 47 (10:27:53) terjadi setelah id 46 (13:39:51), jadi id 44-46 pasti WIB.
--
-- v_transaksi_lengkap memakai kolom created_at/updated_at/dibatalkan_at sehingga harus dihapus lalu dibuat ulang
-- (definisi live, tanpa perubahan isi). Index pada t_activity_log.waktu dibangun ulang otomatis.
-- ALTER TYPE menulis ulang tabel (tidak memicu trigger UPDATE, termasuk pemblokir perubahan activity log).
-- Jalankan segera setelah dibuat: baris baru setelah file ini dibuat dianggap UTC (benar untuk aplikasi,
-- salah untuk baris yang Anda isi lewat DB Manager sebelum migrasi).

BEGIN;

DROP VIEW keu_masjid.v_transaksi_lengkap;

ALTER TABLE keu_masjid.m_agenda
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_kategori_dana
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_kategori_transaksi
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_misi_masjid
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_pengaturan_website
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_pengguna
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_pengurus
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_profil_masjid
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_program_masjid
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.m_sejarah_masjid
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.t_activity_log
  ALTER COLUMN waktu TYPE timestamp(0) with time zone
    USING CASE WHEN waktu < '2026-11-21' OR waktu BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN waktu AT TIME ZONE 'Asia/Jakarta' ELSE waktu AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.t_kwitansi
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN dibatalkan_at TYPE timestamp(0) with time zone
    USING CASE WHEN dibatalkan_at < '2026-11-21' OR dibatalkan_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN dibatalkan_at AT TIME ZONE 'Asia/Jakarta' ELSE dibatalkan_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.t_transaksi
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp(0) with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

ALTER TABLE keu_masjid.t_transfer_dana
  ALTER COLUMN created_at TYPE timestamp(0) with time zone
    USING CASE WHEN created_at < '2026-11-21' OR created_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN created_at AT TIME ZONE 'Asia/Jakarta' ELSE created_at AT TIME ZONE 'UTC' END,
  ALTER COLUMN updated_at TYPE timestamp with time zone
    USING CASE WHEN updated_at < '2026-11-21' OR updated_at BETWEEN '2026-11-21 13:38' AND '2026-11-21 13:40' THEN updated_at AT TIME ZONE 'Asia/Jakarta' ELSE updated_at AT TIME ZONE 'UTC' END;

CREATE VIEW keu_masjid.v_transaksi_lengkap AS
SELECT t.id,
    t.tanggal,
    t.jenis,
    t.kategori_dana_id,
    kd.nama_kategori AS kategori_dana,
    kt.nama_kategori_transaksi AS kategori_transaksi,
    t.nominal,
    t.uraian,
    p.nama AS dicatat_oleh,
    kw.id IS NOT NULL AS punya_kwitansi,
    kw.no_kwitansi,
    t.created_at,
    t.updated_at
   FROM keu_masjid.t_transaksi t
     JOIN keu_masjid.m_kategori_dana kd ON kd.id = t.kategori_dana_id
     JOIN keu_masjid.m_pengguna p ON p.id = t.pengguna_id
     LEFT JOIN keu_masjid.m_kategori_transaksi kt ON kt.id = t.kategori_transaksi_id
     LEFT JOIN keu_masjid.t_kwitansi kw ON kw.transaksi_id = t.id AND kw.dibatalkan_at IS NULL;

COMMENT ON VIEW keu_masjid.v_transaksi_lengkap IS 'Daftar transaksi lengkap beserta nama kategori dana, kategori transaksi, pencatat, dan status kwitansi aktif. Dipakai Dashboard, Kelola Dana, serta tab Kas Masuk dan Kas Keluar (filter lewat WHERE).';

-- Opsional (disarankan): tampilkan waktu dalam WIB secara bawaan untuk setiap sesi baru.
-- Tidak mengubah data; hanya cara tampil timestamptz.
-- ALTER DATABASE db_keuangan_masjid_dev SET timezone TO 'Asia/Jakarta';

COMMIT;

-- Pemeriksaan setelah COMMIT (harus naik terus mengikuti id, tanpa selisih negatif):
-- SELECT id, waktu AT TIME ZONE 'Asia/Jakarta' AS waktu_wib,
--        waktu - lag(waktu) OVER (ORDER BY id) AS selisih
-- FROM keu_masjid.t_activity_log ORDER BY id;
