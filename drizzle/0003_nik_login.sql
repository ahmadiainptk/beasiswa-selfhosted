-- Migration: NIK-based login for mahasiswa
-- Date: 2026-07-16
-- Change: add nik column, make email optional (admin still uses email)

ALTER TABLE users ADD COLUMN nik TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nik ON users(nik);
