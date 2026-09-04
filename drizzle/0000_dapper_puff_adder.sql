CREATE TABLE `dokumen` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pendaftaran_id` integer NOT NULL,
	`bagian` text NOT NULL,
	`field_name` text NOT NULL,
	`r2_key` text,
	`original_filename` text,
	`mime_type` text,
	`file_size` integer,
	`status_verifikasi` text DEFAULT 'pending',
	`catatan_verifikasi` text,
	`uploaded_at` text NOT NULL,
	FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `domisili_ortu` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pendaftaran_id` integer NOT NULL,
	`provinsi_ayah` text,
	`kabupaten_ayah` text,
	`kecamatan_ayah` text,
	`kelurahan_ayah` text,
	`alamat_ayah` text,
	`rt_rw_ayah` text,
	`kode_pos_ayah` text,
	`gmap_ayah` text,
	`provinsi_ibu` text,
	`kabupaten_ibu` text,
	`kecamatan_ibu` text,
	`kelurahan_ibu` text,
	`alamat_ibu` text,
	`rt_rw_ibu` text,
	`kode_pos_ibu` text,
	`gmap_ibu` text,
	`nama_wali` text,
	`nik_wali` text,
	`no_telp_wali` text,
	`hubungan_wali` text,
	`pendidikan_wali` text,
	`pekerjaan_wali` text,
	`penghasilan_wali` integer,
	`provinsi_wali` text,
	`kabupaten_wali` text,
	`kecamatan_wali` text,
	`kelurahan_wali` text,
	`alamat_wali` text,
	`rt_rw_wali` text,
	`kode_pos_wali` text,
	`gmap_wali` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `identitas_keluarga` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pendaftaran_id` integer NOT NULL,
	`nama_ayah` text,
	`nik_ayah` text,
	`status_ayah` text,
	`no_telp_ayah` text,
	`pendidikan_ayah` text,
	`pekerjaan_ayah` text,
	`penghasilan_ayah` integer,
	`nama_ibu` text,
	`nik_ibu` text,
	`status_ibu` text,
	`no_telp_ibu` text,
	`pendidikan_ibu` text,
	`pekerjaan_ibu` text,
	`penghasilan_ibu` integer,
	`nomor_kk` text,
	`jumlah_tanggungan` integer,
	`jumlah_hutang` integer,
	`cicilan_hutang` integer,
	`jumlah_piutang` integer,
	`cicilan_piutang` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `identitas_pribadi` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pendaftaran_id` integer NOT NULL,
	`nama` text,
	`nik` text,
	`nim` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`jenis_kelamin` text,
	`golongan_darah` text,
	`no_hp` text,
	`email` text,
	`anak_ke` integer,
	`jumlah_saudara` integer,
	`provinsi` text,
	`kabupaten` text,
	`kecamatan` text,
	`kelurahan` text,
	`alamat` text,
	`rt_rw` text,
	`kode_pos` text,
	`no_kip` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kondisi_rumah` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pendaftaran_id` integer NOT NULL,
	`luas_tanah` text,
	`kepemilikan_rumah` text,
	`biaya_sewa` integer,
	`tanah_lain` text,
	`status_tanah_lain` text,
	`daya_listrik` text,
	`status_listrik` text,
	`biaya_listrik_1` integer,
	`biaya_listrik_2` integer,
	`biaya_listrik_3` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pendaftaran` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`current_step` integer DEFAULT 1,
	`submitted_at` text,
	`verified_at` text,
	`verified_by` integer,
	`catatan_admin` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prestasi_tahfidz` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pendaftaran_id` integer NOT NULL,
	`nama_lomba` text,
	`jenis_lomba` text,
	`tingkat_lomba` text,
	`predikat_juara` text,
	`jumlah_juzz` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `riwayat_pendidikan` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pendaftaran_id` integer NOT NULL,
	`jenis_sekolah` text,
	`nisn` text,
	`npsn` text,
	`nama_sekolah` text,
	`alamat_sekolah` text,
	`lulus_tahun` text,
	`lulus_jalur` text,
	`kategori_ukt` text,
	`nominal_ukt` integer,
	`nomor_tes` text,
	`fakultas` text,
	`prodi` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`pendaftaran_id`) REFERENCES `pendaftaran`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sesi_pendaftaran` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`aktif` integer DEFAULT 1 NOT NULL,
	`dibuka_pada` text NOT NULL,
	`ditutup_pada` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nim` text,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`nama_lengkap` text NOT NULL,
	`role` text DEFAULT 'mahasiswa' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_nim_unique` ON `users` (`nim`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);