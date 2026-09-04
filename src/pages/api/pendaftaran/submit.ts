// path: src/pages/api/pendaftaran/submit.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { sessions, users } from '../../../db/schema';
import { getCookieName } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, locals }) => {
  try {
    const runtime = (locals as any).runtime;
    const db_binding = runtime?.env?.DB;
    if (!db_binding) {
      return new Response(JSON.stringify({ success: false, error: 'Database tidak tersedia' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = drizzle(db_binding, { schema });
    const token = cookies.get(getCookieName())?.value;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await db.select()
      .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token)).limit(1);

    if (session.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = session[0].users;

    if (user.profileStatus === 'pending' || user.profileStatus === 'verified') {
      return new Response(JSON.stringify({ success: false, error: 'Profil sudah disubmit' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    await db.update(users).set({
      profileStatus: 'pending',
      profileSubmittedAt: now,
      updatedAt: now,
    }).where(eq(users.id, user.id));

    return new Response(JSON.stringify({ success: true, message: 'Profil berhasil disubmit untuk verifikasi' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Submit error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Terjadi kesalahan server' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
