-- Migration: Tambah tabel pengumuman (rilis hasil seleksi beasiswa — batch)
-- Date: 2026-09-03

CREATE TABLE pengumuman (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beasiswa_id INTEGER NOT NULL REFERENCES beasiswa(id),
    judul TEXT NOT NULL,
    isi TEXT,
    sk_file_id TEXT,
    sk_original_filename TEXT,
    sk_mime_type TEXT,
    sk_file_size INTEGER,
    published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_pengumuman_beasiswa ON pengumuman(beasiswa_id);
