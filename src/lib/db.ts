// path: src/lib/db.ts
// Dual-mode DB helper: D1 in production, @libsql in local dev
import { createClient, type Client } from '@libsql/client';

// Lazy init — @libsql/client with file: URL crashes on Workers
let _localDb: Client | null = null;

function getLocalDb(): Client {
  if (!_localDb) {
    _localDb = createClient({ url: 'file:./data/beasiswa.db' });
  }
  return _localDb;
}

/**
 * Execute SQL on D1 (production) or local SQLite (dev)
 * @param sql - SQL string
 * @param args - Bind parameters
 * @param runtime - Astro runtime (optional, uses D1 if available)
 */
export async function exec(sql: string, args: unknown[] = [], runtime?: unknown) {
  const r = runtime as { env?: { DB?: { prepare: (s: string) => { bind: (...a: unknown[]) => { all: () => Promise<{ results: unknown[] }> } } } } } | undefined;

  if (r?.env?.DB) {
    const result = await r.env.DB.prepare(sql).bind(...args).all();
    return { rows: result.results };
  }

  // libsql fallback for local dev
  const result = await getLocalDb().execute({ sql, args: args as unknown[] });
  return { rows: result.rows };
}
