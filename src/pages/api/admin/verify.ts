// path: src/pages/api/admin/verify.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { users } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const db_binding = runtime?.env?.DB;
    if (!db_binding) {
      return new Response(JSON.stringify({ success: false, message: 'Database tidak tersedia' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = drizzle(db_binding, { schema });
    const admin = { id: 0, email: gardaAdmin.email, role: gardaAdmin.role };

    const body = await request.json();
    const { user_id, action, notes } = body;

    if (!user_id || !action) {
      return new Response(JSON.stringify({ success: false, message: 'user_id dan action wajib' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['verify', 'reject'].includes(action)) {
      return new Response(JSON.stringify({ success: false, message: 'Action harus verify atau reject' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const targetUser = await db.select().from(users)
      .where(eq(users.id, user_id)).limit(1);

    if (targetUser.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'User tidak ditemukan' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (targetUser[0].profileStatus !== 'pending') {
      return new Response(JSON.stringify({ success: false, message: 'Profil belum disubmit' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    if (action === 'verify') {
      await db.update(users).set({
        profileStatus: 'verified',
        profileVerifiedAt: now,
        profileVerifiedBy: admin.id,
        profileCatatan: notes || null,
        updatedAt: now,
      }).where(eq(users.id, user_id));

      return new Response(JSON.stringify({
        success: true, message: 'Profil berhasil diverifikasi'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {
      await db.update(users).set({
        profileStatus: 'rejected',
        profileVerifiedAt: now,
        profileVerifiedBy: admin.id,
        profileCatatan: notes || 'Data tidak lengkap atau tidak sesuai',
        updatedAt: now,
      }).where(eq(users.id, user_id));

      return new Response(JSON.stringify({
        success: true, message: 'Profil ditolak'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (e: any) {
    console.error('Verify Error:', e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
