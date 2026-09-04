// path: src/pages/api/admin/manage-admin.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { admins } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

// POST — delete admin (superadmin only)
export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin || gardaAdmin.role !== 'superadmin') {
    return json({ success: false, message: 'Akses ditolak. Hanya superadmin.' }, 403);
  }

  try {
    const runtime = (locals as any).runtime;
    const db = drizzle(runtime?.env?.DB, { schema });
    const body = await request.json();
    const { action, email, role: newRole, user_id } = body;

    if (action === 'add') {
      if (!email) return json({ success: false, message: 'Email wajib diisi' }, 400);

      const allowedRoles = ['admin', 'editor'];
      const assignRole = allowedRoles.includes(newRole) ? newRole : 'admin';

      const existing = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
      if (existing.length > 0) {
        return json({ success: false, message: 'Email sudah terdaftar' }, 409);
      }

      const now = new Date().toISOString();
      await db.insert(admins).values({
        email,
        namaLengkap: email.split('@')[0],
        role: assignRole,
        createdAt: now,
        updatedAt: now,
      });

      return json({ success: true, message: 'Admin berhasil ditambahkan' }, 201);

    } else if (action === 'delete') {
      if (!user_id) return json({ success: false, message: 'user_id wajib' }, 400);

      const target = await db.select().from(admins).where(eq(admins.id, user_id)).limit(1);
      if (target.length === 0) return json({ success: false, message: 'User tidak ditemukan' }, 404);
      if (target[0].role === 'superadmin') return json({ success: false, message: 'Tidak bisa menghapus superadmin' }, 403);
      if (target[0].email === gardaAdmin.email) return json({ success: false, message: 'Tidak bisa menghapus akun sendiri' }, 400);

      await db.delete(admins).where(eq(admins.id, user_id));
      return json({ success: true, message: 'Admin berhasil dihapus' }, 200);
    }

    return json({ success: false, message: 'Action tidak valid' }, 400);

  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};
