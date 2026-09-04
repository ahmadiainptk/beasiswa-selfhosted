-- Migration: Tambah tabel beasiswa_dokumen (dokumen persyaratan per beasiswa)
-- Date: 2026-08-27

CREATE TABLE beasiswa_dokumen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beasiswa_id INTEGER NOT NULL REFERENCES beasiswa(id),
    judul TEXT NOT NULL,
    deskripsi TEXT,
    file_id TEXT,
    original_filename TEXT,
    mime_type TEXT,
    file_size INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
