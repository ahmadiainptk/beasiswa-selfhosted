-- Migration: Multi-Beasiswa
-- 1. Create beasiswa table
CREATE TABLE `beasiswa` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nama` text NOT NULL,
	`slug` text NOT NULL,
	`deskripsi` text,
	`persyaratan` text,
	`aktif` integer DEFAULT 1 NOT NULL,
	`dibuka_pada` text,
	`ditutup_pada` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `beasiswa_slug_unique` ON `beasiswa` (`slug`);
--> statement-breakpoint

-- 2. Add beasiswa_id to pendaftaran (SQLite ALTER TABLE - no FK constraint)
ALTER TABLE `pendaftaran` ADD COLUMN `beasiswa_id` integer;
--> statement-breakpoint

-- 3. Seed default beasiswa
INSERT INTO `beasiswa` (`nama`, `slug`, `deskripsi`, `aktif`, `dibuka_pada`, `created_at`, `updated_at`)
VALUES ('KIP Kuliah 2026', 'kip-kuliah-2026', 'Beasiswa Kartu Indonesia Pintar (KIP) Kuliah Rekrutmen Baru 2026', 1, '2026-07-01', datetime('now'), datetime('now'));
--> statement-breakpoint

-- 4. Update existing pendaftaran to link to KIP Kuliah 2026
UPDATE `pendaftaran` SET `beasiswa_id` = (SELECT `id` FROM `beasiswa` WHERE `slug` = 'kip-kuliah-2026') WHERE `beasiswa_id` IS NULL;
--> statement-breakpoint

-- 5. Drop sesi_pendaftaran (unused, replaced by beasiswa)
DROP TABLE IF EXISTS `sesi_pendaftaran`;
