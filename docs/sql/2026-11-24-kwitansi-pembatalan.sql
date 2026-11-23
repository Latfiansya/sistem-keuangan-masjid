-- Kwitansi dibatalkan, bukan dihapus: nomor kwitansi tidak pernah hilang sehingga tidak dipakai ulang.
-- Dijalankan manual oleh DBA melalui DB Manager pada database db_keuangan_masjid_dev.
--
-- Perubahan pada keu_masjid.t_kwitansi:
--   * nominal, tanggal  : salinan dari transaksi saat kwitansi dibuat/diubah/dibatalkan, agar kwitansi
--                         yang dibatalkan tetap lengkap walau transaksi pemasukannya dihapus.
--   * dibatalkan_at     : waktu pembatalan; NULL = kwitansi aktif.
--   * transaksi_id      : boleh NULL; FK berubah dari ON DELETE CASCADE menjadi ON DELETE SET NULL, sehingga
--                         menghapus transaksi tidak lagi menghapus baris kwitansinya.
-- View v_transaksi_lengkap hanya menganggap kwitansi aktif (definisi live, satu-satunya perubahan pada JOIN).
-- Saat skrip ini disiapkan, t_kwitansi masih kosong (0 baris).

BEGIN;

ALTER TABLE keu_masjid.t_kwitansi
  ADD COLUMN nominal       numeric(15,2),
  ADD COLUMN tanggal       date,
  ADD COLUMN dibatalkan_at timestamp(0) without time zone;

-- Mengisi salinan untuk baris yang sudah ada (bila ada). Trigger activity log butuh pelaku:
-- ganti '2' dengan id pengguna DBA bila perlu.
SELECT set_config('app.user_id', '2', true);
UPDATE keu_masjid.t_kwitansi k
   SET nominal = t.nominal, tanggal = t.tanggal
  FROM keu_masjid.t_transaksi t
 WHERE t.id = k.transaksi_id;

ALTER TABLE keu_masjid.t_kwitansi
  ALTER COLUMN nominal SET NOT NULL,
  ALTER COLUMN tanggal SET NOT NULL,
  ALTER COLUMN transaksi_id DROP NOT NULL,
  ADD CONSTRAINT ck_t_kwitansi_nominal CHECK (nominal > 0),
  DROP CONSTRAINT fk_t_kwitansi_transaksi,
  ADD CONSTRAINT fk_t_kwitansi_transaksi FOREIGN KEY (transaksi_id)
    REFERENCES keu_masjid.t_transaksi(id) ON UPDATE RESTRICT ON DELETE SET NULL;

COMMENT ON TABLE keu_masjid.t_kwitansi IS 'Kwitansi digital untuk jamaah. Satu transaksi paling banyak memiliki satu kwitansi. Kwitansi tidak dihapus, melainkan dibatalkan (dibatalkan_at), agar nomornya tidak dipakai ulang.';
COMMENT ON COLUMN keu_masjid.t_kwitansi.transaksi_id  IS 'Foreign key ke t_transaksi (ON DELETE SET NULL). Unik bila terisi. NULL = transaksi pemasukannya sudah dihapus.';
COMMENT ON COLUMN keu_masjid.t_kwitansi.nominal       IS 'Salinan nominal transaksi (Rupiah) saat kwitansi dibuat, diubah, atau dibatalkan.';
COMMENT ON COLUMN keu_masjid.t_kwitansi.tanggal       IS 'Salinan tanggal transaksi saat kwitansi dibuat, diubah, atau dibatalkan.';
COMMENT ON COLUMN keu_masjid.t_kwitansi.dibatalkan_at IS 'Waktu kwitansi dibatalkan. NULL = aktif. Kwitansi dibatalkan tetap tersimpan agar nomornya tidak dipakai ulang.';
COMMENT ON COLUMN keu_masjid.t_kwitansi.metode_pembayaran IS 'Cara pembayaran: ''Tunai'', ''Transfer'', atau ''QRIS''.';

CREATE OR REPLACE VIEW keu_masjid.v_transaksi_lengkap AS
 SELECT t.id,
    t.tanggal,
    t.jenis,
    t.kategori_dana_id,
    kd.nama_kategori AS kategori_dana,
    kt.nama_kategori_transaksi AS kategori_transaksi,
    t.nominal,
    t.uraian,
    p.nama AS dicatat_oleh,
    (kw.id IS NOT NULL) AS punya_kwitansi,
    kw.no_kwitansi,
    t.created_at,
    t.updated_at
   FROM ((((keu_masjid.t_transaksi t
     JOIN keu_masjid.m_kategori_dana kd ON ((kd.id = t.kategori_dana_id)))
     JOIN keu_masjid.m_pengguna p ON ((p.id = t.pengguna_id)))
     LEFT JOIN keu_masjid.m_kategori_transaksi kt ON ((kt.id = t.kategori_transaksi_id)))
     LEFT JOIN keu_masjid.t_kwitansi kw ON (((kw.transaksi_id = t.id) AND (kw.dibatalkan_at IS NULL))));

COMMIT;
