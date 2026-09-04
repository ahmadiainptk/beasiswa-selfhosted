/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    db: import('drizzle-orm/d1').DrizzleD1Database<typeof import('./db/schema')>;
    runtime?: {
      env?: {
        DB?: any;
        SESSION?: any;
        GARDA_SECRET?: string;
        STATUS_MAINTENANCE?: string;
      };
    };
    admin?: {
      email: string;
      name: string;
      picture: string | null;
      role: string;
    };
  }
}
