# Beasiswa IAIN Pontianak — Self-Hosted Edition

Versi aplikasi Beasiswa IAIN Pontianak yang berjalan di **server biasa (Node.js)** dengan **SQLite**, bukan di Cloudflare Workers + D1.

Fork ini dibuat agar aplikasi bisa di-deploy di VPS/server sendiri, tetap memakai stack yang sama (Astro SSR + Drizzle ORM), tapi mengganti backend database dari Cloudflare D1 ke **file SQLite lokal** (via `@libsql/client`).

## Perbedaan dari versi Cloudflare

| Aspek | Cloudflare (asli) | Self-hosted (fork ini) |
|-------|-------------------|------------------------|
| Adapter | `@astrojs/cloudflare` | `@astrojs/node` (standalone) |
| Database | Cloudflare D1 (SQLite) | File SQLite lokal (`data/beasiswa.db`) |
| Env binding | `locals.runtime.env` dari Workers | `locals.runtime.env` di-inject middleware dari `.env` |
| Deploy | `wrangler deploy` | `node dist/server/entry.mjs` (systemd/Docker) |

**Tidak ada perubahan pada logika aplikasi, schema, atau query.** DB diakses lewat D1-shim (`src/lib/d1-shim.ts`) yang mengadopsi interface D1 (`.prepare().bind().all()/.first()/.run()/.raw()/.batch()`) di atas `@libsql/client`. Semua `.astro` dan `/api/*` yang pakai `drizzle(env.DB)` tetap berjalan tanpa diubah.

## Prasyarat

- Node.js >= 22.12
- pnpm

## Instalasi

```bash
pnpm install
cp .env.example .env   # lalu isi nilai real
```

## Konfigurasi (.env)

Semua wajib diisi sesuai `.env.example`. Paling penting:

- `GARDA_SECRET` — wajib. Dipakai verifikasi token admin (GARDA SSO). Tanpa ini zone admin tidak bisa diakses.
- `BEASISWA_DB_URL` — path file SQLite. Default `file:./data/beasiswa.db`.
- `STATUS_MAINTENANCE` — `"true"` mengaktifkan maintenance mode.
- Kredensial Google Drive (opsional) — untuk fitur upload file/dokumen.

## Setup database

Schema dibuat / disinkronkan ke file SQLite lokal:

```bash
pnpm db:push
```

## Build & jalankan

```bash
pnpm build
pnpm start        # = node dist/server/entry.mjs, listen di PORT (default 4321)
```

### Development

```bash
pnpm dev
```

## Deploy dengan systemd

`deploy/beasiswa.service` disediakan. Contoh:

```bash
sudo cp deploy/beasiswa.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now beasiswa
```

## Deploy dengan Docker

`Dockerfile` disediakan.

```bash
docker build -t beasiswa-selfhosted .
docker run -d -p 4321:4321 --env-file .env -v $(pwd)/data:/app/data beasiswa-selfhosted
```

## Cache & edge

`src/pages/api/img/[id].ts` memakai Cache API Cloudflare (`caches`) dan `ctx.waitUntil`. Keduanya **di-guard** (`typeof caches !== "undefined"`, `if (ctx?.waitUntil)`) sehingga di Node.js di-skip dengan aman; proxy gambar tetap bekerja langsung ke Google Drive.

## Catatan keamanan

- Jangan pernah menaruh secret asli di repo. `.env` sudah di-gitignore.
- Versi asli punya fallback `GARDA_SECRET` hardcoded di source — **dibuang** di fork ini; sekarang wajib dari env.
- `wrangler.jsonc` tidak disertakan (khusus Cloudflare).
