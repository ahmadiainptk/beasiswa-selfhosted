-- Migrasi 0012: prestasi_list (JSON array) untuk dukung banyak prestasi per mahasiswa.
-- Kolom prestasi_tahfidz lama (nama_lomba, jenis_lomba, tingkat_lomba, predikat_juara)
-- tetap ada; prestasi_list menyimpan SEMUA prestasi dalam satu row (fix bug 3→1).
ALTER TABLE prestasi_tahfidz ADD COLUMN prestasi_list TEXT;
