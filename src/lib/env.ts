// path: src/lib/env.ts
// Runtime env untuk self-hosted Node.js. Astro di Node TIDAK menyediakan
// `locals.runtime.env` otomatis (itu hanya ada di @astrojs/cloudflare).
// Di sini kita bangun env object dari process.env dan inject DB shim.
import 'dotenv/config';
import { createD1Shim, type D1Like } from './d1-shim';

// Path file SQLite, default: ./data/beasiswa.db (relatif ke cwd proses)
const DB_URL = process.env.BEASISWA_DB_URL || 'file:./data/beasiswa.db';

let _db: D1Like | null = null;

/** Singleton D1 binding (1 koneksi per proses — aman utk SQLite file). */
export function getDb(): D1Like {
  if (!_db) {
    _db = createD1Shim(DB_URL);
  }
  return _db;
}

/** Env object dengan API yang sama seperti env di @astrojs/cloudflare. */
export function getEnv(): Record<string, unknown> {
  const env: Record<string, unknown> = {
    DB: getDb(),
    // SESSION (KV) dulu dipakai binding di Cloudflare; di self-hosted tidak
    // dipakai auth (session tersimpan di tabel `sessions`), jadi simpan kosong.
    SESSION: null,
    GARDA_SECRET: process.env.GARDA_SECRET,
    STATUS_MAINTENANCE: process.env.STATUS_MAINTENANCE,
    GDRIVE_FOLDER_ID: process.env.GDRIVE_FOLDER_ID,
    GDRIVE_BLOG_FOLDER_ID: process.env.GDRIVE_BLOG_FOLDER_ID,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
  };
  return env;
}
