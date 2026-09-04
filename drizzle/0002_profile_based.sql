-- Migration: Profile-based data (userId) instead of per-pendaftaran
-- Date: 2026-07-07

-- 1. Add profile columns to users
ALTER TABLE users ADD COLUMN profile_status TEXT NOT NULL DEFAULT 'incomplete';
ALTER TABLE users ADD COLUMN profile_step INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN profile_submitted_at TEXT;
ALTER TABLE users ADD COLUMN profile_verified_at TEXT;
ALTER TABLE users ADD COLUMN profile_verified_by INTEGER;
ALTER TABLE users ADD COLUMN profile_catatan TEXT;

-- 2. Migrate existing pendaftaran data to user profile
-- For users who have pendaftaran with data, set profileStatus based on pendaftaran status
UPDATE users SET profile_status = 'verified'
WHERE id IN (SELECT user_id FROM pendaftaran WHERE status = 'verified');
UPDATE users SET profile_status = 'pending'
WHERE id IN (SELECT user_id FROM pendaftaran WHERE status = 'submitted');
UPDATE users SET profile_status = 'incomplete'
WHERE id IN (SELECT user_id FROM pendaftaran WHERE status = 'draft');

-- Update profileStep from pendaftaran.currentStep
UPDATE users SET profile_step = (
  SELECT MAX(current_step) FROM pendaftaran WHERE pendaftaran.user_id = users.id
) WHERE id IN (SELECT user_id FROM pendaftaran);

-- 3. Recreate section tables with userId

-- identitas_pribadi
CREATE TABLE identitas_pribadi_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  nama TEXT, nik TEXT, nim TEXT,
  tempat_lahir TEXT, tanggal_lahir TEXT, jenis_kelamin TEXT, golongan_darah TEXT,
  no_hp TEXT, email TEXT,
  anak_ke INTEGER, jumlah_saudara INTEGER,
  provinsi TEXT, kabupaten TEXT, kecamatan TEXT, kelurahan TEXT,
  alamat TEXT, rt_rw TEXT, kode_pos TEXT, no_kip TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO identitas_pribadi_new
  SELECT ip.id, p.user_id, ip.nama, ip.nik, ip.nim,
    ip.tempat_lahir, ip.tanggal_lahir, ip.jenis_kelamin, ip.golongan_darah,
    ip.no_hp, ip.email, ip.anak_ke, ip.jumlah_saudara,
    ip.provinsi, ip.kabupaten, ip.kecamatan, ip.kelurahan,
    ip.alamat, ip.rt_rw, ip.kode_pos, ip.no_kip,
    ip.created_at, ip.updated_at
  FROM identitas_pribadi ip
  INNER JOIN pendaftaran p ON ip.pendaftaran_id = p.id;
DROP TABLE identitas_pribadi;
ALTER TABLE identitas_pribadi_new RENAME TO identitas_pribadi;

-- riwayat_pendidikan
CREATE TABLE riwayat_pendidikan_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  jenis_sekolah TEXT, nisn TEXT, npsn TEXT, nama_sekolah TEXT, alamat_sekolah TEXT,
  lulus_tahun TEXT, lulus_jalur TEXT, kategori_ukt TEXT, nominal_ukt INTEGER,
  nomor_tes TEXT, fakultas TEXT, prodi TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO riwayat_pendidikan_new
  SELECT rp.id, p.user_id, rp.jenis_sekolah, rp.nisn, rp.npsn, rp.nama_sekolah, rp.alamat_sekolah,
    rp.lulus_tahun, rp.lulus_jalur, rp.kategori_ukt, rp.nominal_ukt,
    rp.nomor_tes, rp.fakultas, rp.prodi,
    rp.created_at, rp.updated_at
  FROM riwayat_pendidikan rp
  INNER JOIN pendaftaran p ON rp.pendaftaran_id = p.id;
DROP TABLE riwayat_pendidikan;
ALTER TABLE riwayat_pendidikan_new RENAME TO riwayat_pendidikan;

-- prestasi_tahfidz
CREATE TABLE prestasi_tahfidz_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  nama_lomba TEXT, jenis_lomba TEXT, tingkat_lomba TEXT,
  predikat_juara TEXT, jumlah_juzz INTEGER,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO prestasi_tahfidz_new
  SELECT pt.id, p.user_id, pt.nama_lomba, pt.jenis_lomba, pt.tingkat_lomba,
    pt.predikat_juara, pt.jumlah_juzz,
    pt.created_at, pt.updated_at
  FROM prestasi_tahfidz pt
  INNER JOIN pendaftaran p ON pt.pendaftaran_id = p.id;
DROP TABLE prestasi_tahfidz;
ALTER TABLE prestasi_tahfidz_new RENAME TO prestasi_tahfidz;

-- identitas_keluarga
CREATE TABLE identitas_keluarga_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  nama_ayah TEXT, nik_ayah TEXT, status_ayah TEXT, no_telp_ayah TEXT,
  pendidikan_ayah TEXT, pekerjaan_ayah TEXT, penghasilan_ayah INTEGER,
  nama_ibu TEXT, nik_ibu TEXT, status_ibu TEXT, no_telp_ibu TEXT,
  pendidikan_ibu TEXT, pekerjaan_ibu TEXT, penghasilan_ibu INTEGER,
  nomor_kk TEXT, jumlah_tanggungan INTEGER,
  jumlah_hutang INTEGER, cicilan_hutang INTEGER,
  jumlah_piutang INTEGER, cicilan_piutang INTEGER,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO identitas_keluarga_new
  SELECT ik.id, p.user_id,
    ik.nama_ayah, ik.nik_ayah, ik.status_ayah, ik.no_telp_ayah,
    ik.pendidikan_ayah, ik.pekerjaan_ayah, ik.penghasilan_ayah,
    ik.nama_ibu, ik.nik_ibu, ik.status_ibu, ik.no_telp_ibu,
    ik.pendidikan_ibu, ik.pekerjaan_ibu, ik.penghasilan_ibu,
    ik.nomor_kk, ik.jumlah_tanggungan,
    ik.jumlah_hutang, ik.cicilan_hutang,
    ik.jumlah_piutang, ik.cicilan_piutang,
    ik.created_at, ik.updated_at
  FROM identitas_keluarga ik
  INNER JOIN pendaftaran p ON ik.pendaftaran_id = p.id;
DROP TABLE identitas_keluarga;
ALTER TABLE identitas_keluarga_new RENAME TO identitas_keluarga;

-- kondisi_rumah
CREATE TABLE kondisi_rumah_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  luas_tanah TEXT, kepemilikan_rumah TEXT, biaya_sewa INTEGER,
  tanah_lain TEXT, status_tanah_lain TEXT,
  daya_listrik TEXT, status_listrik TEXT,
  biaya_listrik_1 INTEGER, biaya_listrik_2 INTEGER, biaya_listrik_3 INTEGER,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO kondisi_rumah_new
  SELECT kr.id, p.user_id,
    kr.luas_tanah, kr.kepemilikan_rumah, kr.biaya_sewa,
    kr.tanah_lain, kr.status_tanah_lain,
    kr.daya_listrik, kr.status_listrik,
    kr.biaya_listrik_1, kr.biaya_listrik_2, kr.biaya_listrik_3,
    kr.created_at, kr.updated_at
  FROM kondisi_rumah kr
  INNER JOIN pendaftaran p ON kr.pendaftaran_id = p.id;
DROP TABLE kondisi_rumah;
ALTER TABLE kondisi_rumah_new RENAME TO kondisi_rumah;

-- domisili_ortu
CREATE TABLE domisili_ortu_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  provinsi_ayah TEXT, kabupaten_ayah TEXT, kecamatan_ayah TEXT, kelurahan_ayah TEXT,
  alamat_ayah TEXT, rt_rw_ayah TEXT, kode_pos_ayah TEXT, gmap_ayah TEXT,
  provinsi_ibu TEXT, kabupaten_ibu TEXT, kecamatan_ibu TEXT, kelurahan_ibu TEXT,
  alamat_ibu TEXT, rt_rw_ibu TEXT, kode_pos_ibu TEXT, gmap_ibu TEXT,
  nama_wali TEXT, nik_wali TEXT, no_telp_wali TEXT, hubungan_wali TEXT,
  pendidikan_wali TEXT, pekerjaan_wali TEXT, penghasilan_wali INTEGER,
  provinsi_wali TEXT, kabupaten_wali TEXT, kecamatan_wali TEXT, kelurahan_wali TEXT,
  alamat_wali TEXT, rt_rw_wali TEXT, kode_pos_wali TEXT, gmap_wali TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO domisili_ortu_new
  SELECT do_.id, p.user_id,
    do_.provinsi_ayah, do_.kabupaten_ayah, do_.kecamatan_ayah, do_.kelurahan_ayah,
    do_.alamat_ayah, do_.rt_rw_ayah, do_.kode_pos_ayah, do_.gmap_ayah,
    do_.provinsi_ibu, do_.kabupaten_ibu, do_.kecamatan_ibu, do_.kelurahan_ibu,
    do_.alamat_ibu, do_.rt_rw_ibu, do_.kode_pos_ibu, do_.gmap_ibu,
    do_.nama_wali, do_.nik_wali, do_.no_telp_wali, do_.hubungan_wali,
    do_.pendidikan_wali, do_.pekerjaan_wali, do_.penghasilan_wali,
    do_.provinsi_wali, do_.kabupaten_wali, do_.kecamatan_wali, do_.kelurahan_wali,
    do_.alamat_wali, do_.rt_rw_wali, do_.kode_pos_wali, do_.gmap_wali,
    do_.created_at, do_.updated_at
  FROM domisili_ortu do_
  INNER JOIN pendaftaran p ON do_.pendaftaran_id = p.id;
DROP TABLE domisili_ortu;
ALTER TABLE domisili_ortu_new RENAME TO domisili_ortu;

-- 4. Recreate dokumen with userId
CREATE TABLE dokumen_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  bagian TEXT NOT NULL,
  field_name TEXT NOT NULL,
  r2_key TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size INTEGER,
  uploaded_at TEXT NOT NULL
);
INSERT INTO dokumen_new
  SELECT d.id, p.user_id, d.bagian, d.field_name,
    d.r2_key, d.original_filename, d.mime_type, d.file_size, d.uploaded_at
  FROM dokumen d
  INNER JOIN pendaftaran p ON d.pendaftaran_id = p.id;
DROP TABLE dokumen;
ALTER TABLE dokumen_new RENAME TO dokumen;

-- 5. Simplify pendaftaran (drop form-related columns)
CREATE TABLE pendaftaran_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  beasiswa_id INTEGER NOT NULL REFERENCES beasiswa(id),
  status TEXT NOT NULL DEFAULT 'pending',
  catatan_admin TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT INTO pendaftaran_new (id, user_id, beasiswa_id, status, catatan_admin, created_at, updated_at)
  SELECT id, user_id, beasiswa_id,
    CASE WHEN status = 'verified' THEN 'accepted'
         WHEN status = 'rejected' THEN 'rejected'
         ELSE 'pending' END,
    catatan_admin, created_at, updated_at
  FROM pendaftaran;
DROP TABLE pendaftaran;
ALTER TABLE pendaftaran_new RENAME TO pendaftaran;
