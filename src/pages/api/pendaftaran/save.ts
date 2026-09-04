// path: src/pages/api/pendaftaran/save.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { sessions, users, identitasPribadi, riwayatPendidikan, prestasiTahfidz, identitasKeluarga, kondisiRumah, domisiliOrtu, kebutuhanKhusus } from '../../../db/schema';
import { getCookieName } from '../../../lib/auth';

const stepTables: Record<number, any> = {
  1: identitasPribadi, 2: riwayatPendidikan, 3: prestasiTahfidz,
  4: identitasKeluarga, 5: kondisiRumah, 6: domisiliOrtu, 7: kebutuhanKhusus,
};

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
    const body = await request.json();
    const { step, data } = body;

    if (!step || step < 1 || step > 7 || !data) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid step or data' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // Update profileStep if progressing forward
    if (step > (user.profileStep || 0)) {
      await db.update(users)
        .set({ profileStep: step, updatedAt: now })
        .where(eq(users.id, user.id));
    }

    // Save section data by userId
    const table = stepTables[step];
    const existing = await db.select().from(table)
      .where(eq(table.userId, user.id)).limit(1);

    const sectionData = { ...data, userId: user.id, updatedAt: now };

    if (existing.length === 0) {
      await db.insert(table).values({ ...sectionData, createdAt: now });
    } else {
      await db.update(table).set(sectionData)
        .where(eq(table.userId, user.id));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Save error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Terjadi kesalahan server' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
