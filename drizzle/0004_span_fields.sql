-- Migration: Tambah field agama, pkh, kjp, jurusan (SPAN-PTKIN alignment)
-- Date: 2026-07-16

ALTER TABLE identitas_pribadi ADD COLUMN agama TEXT;
ALTER TABLE identitas_pribadi ADD COLUMN penerima_pkh INTEGER DEFAULT 0;
ALTER TABLE identitas_pribadi ADD COLUMN penerima_kjp INTEGER DEFAULT 0;
ALTER TABLE riwayat_pendidikan ADD COLUMN jurusan TEXT;
