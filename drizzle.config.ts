// path: drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    // File SQLite lokal utk dev / self-hosted
    url: process.env.BEASISWA_DB_URL || 'file:./data/beasiswa.db',
  },
});
