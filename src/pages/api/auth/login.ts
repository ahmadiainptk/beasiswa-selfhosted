// path: src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { users, sessions } from '../../../db/schema';
import { generateToken, getCookieName, getSessionDuration } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db_binding = runtime?.env?.DB;
    if (!db_binding) {
      return new Response(JSON.stringify({ success: false, error: 'Database tidak tersedia' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = drizzle(db_binding, { schema });
    const formData = await request.formData();
    const nim = String(formData.get('nim') ?? '').trim();
    const nik = String(formData.get('nik') ?? '').trim();

    if (!nim || !nik) {
      return new Response(JSON.stringify({ success: false, error: 'NIM dan NIK wajib diisi' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + getSessionDuration() * 1000).toISOString();

    // Mahasiswa login: NIM + NIK → users table
    const user = await db.select().from(users).where(eq(users.nim, nim)).limit(1);
    if (user.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'NIM atau NIK salah' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify NIK matches
    if (user[0].nik !== nik) {
      return new Response(JSON.stringify({ success: false, error: 'NIM atau NIK salah' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.insert(sessions).values({
      userId: user[0].id, token, expiresAt, createdAt: now,
    });

    cookies.set(getCookieName(), token, {
      path: '/', httpOnly: true, sameSite: 'lax',
      maxAge: getSessionDuration(),
    });

    return new Response(JSON.stringify({
      success: true, message: 'Login berhasil', redirect: '/mahasiswa',
      user: { nama: user[0].namaLengkap, role: user[0].role }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Terjadi kesalahan server' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
