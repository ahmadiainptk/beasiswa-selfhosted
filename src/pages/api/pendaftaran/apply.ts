// path: src/pages/api/pendaftaran/apply.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { sessions, users, pendaftaran, beasiswa } from '../../../db/schema';
import { getCookieName } from '../../../lib/auth';

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
    const token = cookies.get(getCookieName())?.value;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await db.select()
      .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token)).limit(1);

    if (session.length === 0 || new Date(session[0].sessions.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = session[0].users;

    // Profile must be verified or pending
    if (user.profileStatus !== 'verified' && user.profileStatus !== 'pending') {
      return new Response(JSON.stringify({
        success: false, error: 'Lengkapi dan submit profil terlebih dahulu'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { beasiswaId } = body;

    if (!beasiswaId) {
      return new Response(JSON.stringify({ success: false, error: 'beasiswaId wajib' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check beasiswa exists and is active
    const beaRows = await db.select().from(beasiswa)
      .where(eq(beasiswa.id, beasiswaId)).limit(1);

    if (beaRows.length === 0 || beaRows[0].aktif !== 1) {
      return new Response(JSON.stringify({ success: false, error: 'Beasiswa tidak tersedia' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check not already registered
    const existing = await db.select().from(pendaftaran)
      .where(and(eq(pendaftaran.userId, user.id), eq(pendaftaran.beasiswaId, beasiswaId)))
      .limit(1);

    if (existing.length > 0) {
      return new Response(JSON.stringify({ success: false, error: 'Sudah terdaftar di beasiswa ini' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const result = await db.insert(pendaftaran).values({
      userId: user.id,
      beasiswaId: beasiswaId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return new Response(JSON.stringify({ success: true, pendaftaranId: result[0].id }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Apply error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Terjadi kesalahan server' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
