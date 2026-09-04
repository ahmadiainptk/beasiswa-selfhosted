// path: src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { sessions } from '../../../db/schema';
import { getCookieName } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, locals }) => {
  try {
    const token = cookies.get(getCookieName())?.value;
    const runtime = (locals as any).runtime;
    const db_binding = runtime?.env?.DB;

    if (token && db_binding) {
      const db = drizzle(db_binding, { schema });
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    // Hapus cookie mahasiswa + GARDA SSO admin
    // garda_token di-set oleh GARDA dgn Domain=.iainptk.ac.id — WAJIB delete dgn domain yg sama
    cookies.delete(getCookieName(), { path: '/' });
    cookies.delete('garda_token', { path: '/', domain: '.iainptk.ac.id' });

    return new Response(JSON.stringify({ success: true, message: 'Logout berhasil' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    cookies.delete(getCookieName(), { path: '/' });
    cookies.delete('garda_token', { path: '/', domain: '.iainptk.ac.id' });
    return new Response(JSON.stringify({ success: true, message: 'Logout berhasil' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  }
};
