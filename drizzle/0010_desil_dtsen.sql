-- Migration: Tambah kolom Desil DTSEN di tabel users
-- Date: 2026-09-04
-- Desil DTSEN dari BPS (cek-desil) per mahasiswa (NIK). NULL = belum ada data desil.

ALTER TABLE users ADD COLUMN desil_dtsen TEXT;
