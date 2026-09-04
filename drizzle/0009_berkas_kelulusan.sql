-- Migration: Tambah kolom berkas kelulusan (Format 1 + Lampiran II) di tabel pendaftaran
-- Date: 2026-09-04
-- Mahasiswa Lolos (status=accepted) upload Format 1 + Lampiran II per pendaftaran beasiswa

ALTER TABLE pendaftaran ADD COLUMN format1_file_id TEXT;
ALTER TABLE pendaftaran ADD COLUMN format1_original_filename TEXT;
ALTER TABLE pendaftaran ADD COLUMN lampiran2_file_id TEXT;
ALTER TABLE pendaftaran ADD COLUMN lampiran2_original_filename TEXT;
ALTER TABLE pendaftaran ADD COLUMN berkas_uploaded_at TEXT;
