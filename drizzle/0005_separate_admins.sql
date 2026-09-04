-- Migration: Pisahkan tabel admins dari users
-- Date: 2026-07-16

-- 1. Create admins table
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nama_lengkap TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. Create admin_sessions table
CREATE TABLE admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL REFERENCES admins(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 3. Migrate existing admin users to admins table
INSERT INTO admins (id, email, password_hash, nama_lengkap, role, created_at, updated_at)
SELECT id, email, password_hash, nama_lengkap, role, created_at, updated_at
FROM users WHERE role IN ('admin', 'superadmin', 'editor');

-- 4. Migrate existing admin sessions to admin_sessions
INSERT INTO admin_sessions (id, admin_id, token, expires_at, created_at)
SELECT s.id, s.user_id, s.token, s.expires_at, s.created_at
FROM sessions s
INNER JOIN users u ON u.id = s.user_id
WHERE u.role IN ('admin', 'superadmin', 'editor');

-- 5. Update blog_posts to reference admins (via author_id)
-- No need to change since the IDs are preserved

-- 6. Delete admin users and their sessions from old tables
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE role IN ('admin', 'superadmin', 'editor'));
DELETE FROM users WHERE role IN ('admin', 'superadmin', 'editor');
