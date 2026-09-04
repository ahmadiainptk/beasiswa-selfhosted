// path: src/pages/api/admin/profil.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { admins } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) return json({ success: false, message: 'Unauthorized' }, 401);

  try {
    const runtime = (locals as any).runtime;
    const db = drizzle(runtime?.env?.DB, { schema });
    const body = await request.json();
    const { action } = body;
    const now = new Date().toISOString();

    if (action === 'update-nama') {
      const nama = String(body.nama_lengkap || '').trim();
      if (!nama) return json({ success: false, message: 'Nama tidak boleh kosong' }, 400);

      await db.update(admins).set({ namaLengkap: nama, updatedAt: now })
        .where(eq(admins.email, gardaAdmin.email));

      return json({ success: true, message: 'Nama berhasil diubah' }, 200);
    }

    return json({ success: false, message: 'Action tidak valid' }, 400);

  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};
