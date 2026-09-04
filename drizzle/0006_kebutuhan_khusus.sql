-- Migration: Tambah tabel kebutuhan_khusus (Section 7 - Kebutuhan Khusus)
-- Date: 2026-08-27

CREATE TABLE kebutuhan_khusus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    penyandang_disabilitas INTEGER DEFAULT 0,
    jenis_disabilitas TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
