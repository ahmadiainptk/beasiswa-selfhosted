-- path: drizzle/0011_query_perf_indexes.sql
-- Indexes to speed up filtered/paginated queries (row-read efficiency).
-- Lamanya: filtered queries pakai index, bukan full scan.

-- users: filter by role (mahasiswa) — sangat sering dipakai di admin + login scope
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
-- users: filter by profile_status (pending/verified/rejected) — dipakai di admin count + list
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON users(profile_status);
-- users: composite role+status untuk query admin pendaftaran
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, profile_status);

-- pendaftaran: filter by status (admin pendaftar)
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON pendaftaran(status);
-- pendaftaran: filter by beasiswa_id (admin filter per beasiswa)
CREATE INDEX IF NOT EXISTS idx_pendaftaran_beasiswa_id ON pendaftaran(beasiswa_id);
-- pendaftaran: join by user_id (N+1 lookup + join users)
CREATE INDEX IF NOT EXISTS idx_pendaftaran_user_id ON pendaftaran(user_id);

-- section tables: join by user_id (speed up export batch-load + per-user queries)
CREATE INDEX IF NOT EXISTS idx_identitas_pribadi_user_id ON identitas_pribadi(user_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_pendidikan_user_id ON riwayat_pendidikan(user_id);
CREATE INDEX IF NOT EXISTS idx_prestasi_tahfidz_user_id ON prestasi_tahfidz(user_id);
CREATE INDEX IF NOT EXISTS idx_identitas_keluarga_user_id ON identitas_keluarga(user_id);
CREATE INDEX IF NOT EXISTS idx_kondisi_rumah_user_id ON kondisi_rumah(user_id);
CREATE INDEX IF NOT EXISTS idx_domisili_ortu_user_id ON domisili_ortu(user_id);
CREATE INDEX IF NOT EXISTS idx_kebutuhan_khusus_user_id ON kebutuhan_khusus(user_id);
-- dokumen: join by user_id (export count dokumen)
CREATE INDEX IF NOT EXISTS idx_dokumen_user_id ON dokumen(user_id);
