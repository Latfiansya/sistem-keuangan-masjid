-- Menyimpan isi gambar (foto masjid, logo, QRIS) langsung di tabel yang sudah ada.
-- Dijalankan manual oleh DBA melalui DB Manager pada database db_keuangan_masjid_dev.
--
-- Rancangan:
--   * Kolom *_path yang sudah ada tetap varchar(255) dan berisi URL publik berbasis hash isi,
--     mis. '/api/public/files/qris/<sha256>'. URL berubah setiap gambar diganti (aman di-cache).
--   * Kolom baru *_isi (bytea) menyimpan isi berkas, *_mime menyimpan jenis gambar.
--   * Constraint menjaga isi & mime selalu berpasangan, format PNG/JPEG/WebP, dan batas ukuran.
--   * fn_log_activity tidak mencatat kolom *_isi (biner); perubahan *_path tetap tercatat.
-- Aplikasi tidak pernah memakai SELECT * pada tabel ini, sehingga isi biner hanya dibaca oleh endpoint berkas.

BEGIN;

ALTER TABLE keu_masjid.m_profil_masjid
  ADD COLUMN foto_isi  bytea,
  ADD COLUMN foto_mime varchar(20),
  ADD COLUMN logo_isi  bytea,
  ADD COLUMN logo_mime varchar(20),
  ADD CONSTRAINT ck_m_profil_foto_berkas CHECK (
    (foto_isi IS NULL) = (foto_mime IS NULL)
    AND (foto_mime IS NULL OR foto_mime IN ('image/png', 'image/jpeg', 'image/webp'))
    AND (foto_isi IS NULL OR octet_length(foto_isi) BETWEEN 1 AND 5242880)
  ),
  ADD CONSTRAINT ck_m_profil_logo_berkas CHECK (
    (logo_isi IS NULL) = (logo_mime IS NULL)
    AND (logo_mime IS NULL OR logo_mime IN ('image/png', 'image/jpeg', 'image/webp'))
    AND (logo_isi IS NULL OR octet_length(logo_isi) BETWEEN 1 AND 2097152)
  );

ALTER TABLE keu_masjid.m_pengaturan_website
  ADD COLUMN qris_isi  bytea,
  ADD COLUMN qris_mime varchar(20),
  ADD CONSTRAINT ck_m_pengaturan_qris_berkas CHECK (
    (qris_isi IS NULL) = (qris_mime IS NULL)
    AND (qris_mime IS NULL OR qris_mime IN ('image/png', 'image/jpeg', 'image/webp'))
    AND (qris_isi IS NULL OR octet_length(qris_isi) BETWEEN 1 AND 2097152)
  );

COMMENT ON COLUMN keu_masjid.m_profil_masjid.foto_path IS 'URL gambar latar (hero) Beranda; hasil unggah berformat /api/public/files/masjid-photo/<sha256>.';
COMMENT ON COLUMN keu_masjid.m_profil_masjid.foto_isi  IS 'Isi berkas foto masjid (PNG/JPEG/WebP, maks 5 MB). NULL = memakai aset bawaan.';
COMMENT ON COLUMN keu_masjid.m_profil_masjid.foto_mime IS 'Jenis berkas foto_isi: image/png, image/jpeg, atau image/webp.';
COMMENT ON COLUMN keu_masjid.m_profil_masjid.logo_path IS 'URL logo masjid; hasil unggah berformat /api/public/files/logo/<sha256>.';
COMMENT ON COLUMN keu_masjid.m_profil_masjid.logo_isi  IS 'Isi berkas logo masjid (PNG/JPEG/WebP, maks 2 MB). NULL = memakai aset bawaan.';
COMMENT ON COLUMN keu_masjid.m_profil_masjid.logo_mime IS 'Jenis berkas logo_isi: image/png, image/jpeg, atau image/webp.';
COMMENT ON COLUMN keu_masjid.m_pengaturan_website.qris_path IS 'URL gambar QRIS donasi; hasil unggah berformat /api/public/files/qris/<sha256>.';
COMMENT ON COLUMN keu_masjid.m_pengaturan_website.qris_isi  IS 'Isi berkas QRIS donasi (PNG/JPEG/WebP, maks 2 MB). NULL = QRIS belum tersedia.';
COMMENT ON COLUMN keu_masjid.m_pengaturan_website.qris_mime IS 'Jenis berkas qris_isi: image/png, image/jpeg, atau image/webp.';

-- Definisi live fn_log_activity; satu-satunya perubahan: kolom *_isi ditambahkan ke v_skip.
CREATE OR REPLACE FUNCTION keu_masjid.fn_log_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'keu_masjid', 'pg_catalog'
AS $function$
DECLARE
  v_objek  text := TG_ARGV[0];
  v_modul  text;
  v_uid    int8 := NULLIF(current_setting('app.user_id', true), '')::int8;
  v_row    jsonb;
  v_old    jsonb;
  v_id     text;
  v_jenis  text;
  v_desk   text;
  v_diff   text;
  -- kolom yang tidak pernah dicatat nilainya (sensitif / bising)
  v_skip   text[] := ARRAY['password','kode_akses_laporan','updated_at','updated_by',
                           'updated_by_nama','created_at','created_by','created_by_nama',
                           -- isi biner gambar: tidak dicatat (path gambar tetap tercatat)
                           'foto_isi','logo_isi','qris_isi'];
BEGIN
  -- Petakan objek ke modul yang diizinkan ck_t_activity_log_modul
  v_modul := CASE
               WHEN v_objek IN ('Transaksi','Transfer Dana','Kwitansi',
                                'Kategori Dana','Kategori Transaksi') THEN 'Keuangan'
               WHEN v_objek = 'Pengguna' THEN 'Akun'
               ELSE 'Konten'   -- Agenda, Profil Masjid, Pengaturan Website, dll.
             END;

  IF TG_OP = 'DELETE' THEN
    v_row := to_jsonb(OLD);
  ELSE
    v_row := to_jsonb(NEW);
  END IF;
  v_id := v_row->>'id';

  IF TG_OP = 'INSERT' THEN
    v_jenis := 'Tambah';
    v_uid   := COALESCE(v_uid, (v_row->>'created_by')::int8, (v_row->>'pengguna_id')::int8);
    v_desk  := format('Menambah data %s (id=%s)', v_objek, v_id);

  ELSIF TG_OP = 'UPDATE' THEN
    v_jenis := 'Edit';
    v_old   := to_jsonb(OLD);
    v_uid   := COALESCE(v_uid, (v_row->>'updated_by')::int8, (v_row->>'pengguna_id')::int8);

    SELECT string_agg(
             format('%s: %s -> %s', n.key,
                    left(COALESCE(o.value, 'NULL'), 60),
                    left(COALESCE(n.value, 'NULL'), 60)),
             '; ' ORDER BY n.key)
      INTO v_diff
      FROM jsonb_each_text(v_row) n
      JOIN jsonb_each_text(v_old) o ON o.key = n.key
     WHERE n.value IS DISTINCT FROM o.value
       AND n.key <> ALL (v_skip);

    IF v_diff IS NULL THEN
      -- kalau yang berubah hanya password / kode akses, catat tanpa nilai
      IF EXISTS (SELECT 1 FROM jsonb_each_text(v_row) n
                   JOIN jsonb_each_text(v_old) o ON o.key = n.key
                  WHERE n.value IS DISTINCT FROM o.value
                    AND n.key IN ('password','kode_akses_laporan')) THEN
        v_diff := 'kolom sensitif diubah (nilai tidak dicatat)';
      ELSE
        RETURN NEW;  -- hanya kolom audit yang berubah: tidak dicatat
      END IF;
    END IF;
    v_desk := format('Mengubah data %s (id=%s): %s', v_objek, v_id, v_diff);

  ELSE -- DELETE
    v_jenis := 'Hapus';
    v_uid   := COALESCE(v_uid, (v_row->>'updated_by')::int8, (v_row->>'pengguna_id')::int8);
    v_desk  := format('Menghapus data %s (id=%s)', v_objek, v_id);
  END IF;

  -- Log permanen wajib punya pelaku: pesan jelas daripada error NOT NULL
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Activity log butuh pelaku: jalankan set_config(''app.user_id'', <id pengguna>, true) di awal transaksi.'
      USING ERRCODE = 'not_null_violation';
  END IF;

  INSERT INTO keu_masjid.t_activity_log (pengguna_id, modul, jenis_aktivitas, deskripsi, waktu)
  VALUES (v_uid, v_modul, v_jenis, left(v_desk, 500), now());

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END $function$
;

COMMIT;
