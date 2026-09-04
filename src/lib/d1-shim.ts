// path: src/lib/d1-shim.ts
// D1-compatible shim yang bungkus @libsql/client (SQLite file).
// Tujuan: aplikasi yang ditulis untuk Cloudflare D1 bisa jalan di Node.js
// self-hosted TANPA mengubah satu pun call site.
//
// D1 binding yang dipakai (drizzle-orm/d1 + auth.ts + db.ts) adalah:
//   DB.prepare(sql).bind(...args).all()   -> Promise<{ results: ROW[] }>
//   DB.prepare(sql).bind(...args).first() -> Promise<ROW | null>
//   DB.prepare(sql).bind(...args).run()   -> Promise<{ success: boolean, meta: any }>
//   DB.prepare(sql).bind(...args).raw()   -> Promise<VALUE[][]>
//   DB.batch([stmt...])                   -> Promise<{ results: ROW[] }[]>
//
// libsql hanya menyediakan: client.execute({sql, args}) & client.batch([...]).
// Shim ini mengadopsi shape D1 di atas.

import { createClient, type Client } from '@libsql/client';

// Sqlite parameter placeholder — D1 pakai `?1, ?2` (numbered) kadang, dan libsql
// pakai `?` (positional). Keduanya didukung libsql engine.
export type D1Row = Record<string, unknown>;

export interface D1PreparedStatement {
  /** sql asli (dipakai drizzle.batch) */
  sql: string;
  /** bound args saat ini */
  bindArgs: unknown[];
  bind(...args: unknown[]): D1PreparedStatement;
  all(): Promise<{ results: D1Row[]; success: boolean }>;
  first(): Promise<D1Row | null>;
  run(): Promise<{ success: boolean; meta: { changes: number; lastRowId: number | null } }>;
  raw(): Promise<unknown[][]>;
}

export interface D1Like {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: (D1PreparedStatement | { sql: string; bind?: unknown[] })[]): Promise<{ results: D1Row[]; success: boolean }[]>;
}

/**
 * Buat binding D1-like dari path file SQLite.
 * @param url - libsql URL, mis. 'file:./data/beasiswa.db'
 */
export function createD1Shim(url: string): D1Like {
  const client: Client = createClient({ url });

  const runRaw = async (sql: string, args: unknown[]): Promise<{ columns: string[]; rows: unknown[][]; rowsAffected: number; lastInsertRowid: number | null }> => {
    const res = await client.execute({ sql, args });
    return {
      columns: res.columns,
      rows: res.rows as unknown[][],
      rowsAffected: res.rowsAffected,
      lastInsertRowid: res.lastInsertRowid as number | null,
    };
  };

  // positional rows -> object (pakai nama kolom)
  const toObjects = (columns: string[], rows: unknown[][]): D1Row[] => {
    return rows.map((r) => {
      const obj: D1Row = {};
      columns.forEach((c, i) => { obj[c] = r[i]; });
      return obj;
    });
  };

  const makeStatement = (sql: string): D1PreparedStatement => {
    let bound: unknown[] = [];
    const stmt: D1PreparedStatement = {
      sql,
      bindArgs: bound,
      bind(...args: unknown[]) {
        bound = args;
        stmt.bindArgs = bound;
        return stmt;
      },
      async all() {
        const { columns, rows } = await runRaw(sql, bound);
        return { results: toObjects(columns, rows), success: true };
      },
      async first() {
        const { columns, rows } = await runRaw(sql, bound);
        const objs = toObjects(columns, rows);
        return objs[0] ?? null;
      },
      async run() {
        const { rowsAffected, lastInsertRowid } = await runRaw(sql, bound);
        return { success: true, meta: { changes: rowsAffected, lastRowId: lastInsertRowid } };
      },
      async raw() {
        const { rows } = await runRaw(sql, bound);
        return rows;
      },
    };
    return stmt;
  };

  return {
    prepare(sql: string) {
      return makeStatement(sql);
    },
    async batch(statements) {
      const results = [];
      for (const s of statements) {
        // Bisa berupa D1PreparedStatement (drizzle) atau { sql, bind? }
        let sql: string;
        let args: unknown[];
        if (typeof s === 'string') {
          sql = s;
          args = [];
        } else if ('bindArgs' in s && typeof s.bindArgs === 'object') {
          sql = s.sql;
          args = s.bindArgs ?? [];
        } else {
          sql = s.sql;
          args = (s.bind ?? []);
        }
        const { columns, rows } = await runRaw(sql, args);
        results.push({ results: toObjects(columns, rows), success: true });
      }
      return results;
    },
  };
}
