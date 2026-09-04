// path: src/pages/api/admin/pendaftar.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, sql } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { pendaftaran, beasiswa, identitasPribadi, users } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET — list pendaftar dengan filter beasiswa + status + search
export const GET: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) return json({ success: false, error: 'Unauthorized' }, 401);

  try {
    const runtime = (locals as any).runtime;
    const db = drizzle(runtime?.env?.DB, { schema });

    const url = new URL(request.url);
    const beasiswaId = url.searchParams.get('beasiswa_id') || '';
    const status = url.searchParams.get('status') || '';
    const search = url.searchParams.get('q') || '';

    const allBeasiswa = await db.select({ id: beasiswa.id, nama: beasiswa.nama })
      .from(beasiswa).where(eq(beasiswa.aktif, 1));

    // ── Server-side: search di SQL, pagination limit+offset di SQL ──
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const perPage = Math.min(200, Math.max(10, parseInt(url.searchParams.get('per_page') || '60')));
    const conds: any[] = [];
    if (beasiswaId) conds.push(eq(pendaftaran.beasiswaId, parseInt(beasiswaId)));
    if (status) conds.push(eq(pendaftaran.status, status));
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conds.push(sql`(LOWER(${users.namaLengkap}) LIKE ${like} OR LOWER(${users.nik}) LIKE ${like})`);
    }
    const whereClause = conds.length ? sql.join(conds, sql` AND `) : undefined;

    // COUNT total (for pagination)
    const [totalRow] = await db.select({ c: sql<number>`COUNT(*)` })
      .from(pendaftaran).innerJoin(users, eq(pendaftaran.userId, users.id))
      .where(whereClause ?? sql`1=1`);
    const total = Number(totalRow?.c || 0);

    const results = await db.select({
      id: pendaftaran.id, userId: pendaftaran.userId, beasiswaId: pendaftaran.beasiswaId,
      status: pendaftaran.status, catatanAdmin: pendaftaran.catatanAdmin,
      createdAt: pendaftaran.createdAt, namaPendaftar: users.namaLengkap,
      nik: users.nik, desilDtsen: users.desilDtsen, beasiswaNama: beasiswa.nama,
    }).from(pendaftaran)
      .innerJoin(users, eq(pendaftaran.userId, users.id))
      .innerJoin(beasiswa, eq(pendaftaran.beasiswaId, beasiswa.id))
      .where(whereClause ?? sql`1=1`)
      .orderBy(desc(pendaftaran.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage);

    return json({ success: true, pendaftar: results, beasiswa: allBeasiswa, total, page, perPage, totalPages: Math.ceil(total / perPage) }, 200);

  } catch (e: any) {
    return json({ success: false, error: e.message }, 500);
  }
};

// POST — set status pendaftaran
export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) return json({ success: false, error: 'Unauthorized' }, 401);

  try {
    const runtime = (locals as any).runtime;
    const db = drizzle(runtime?.env?.DB, { schema });

    const body = await request.json();
    const { id, status, catatan } = body;

    if (!id || !status || !['accepted', 'rejected'].includes(status)) {
      return json({ success: false, error: 'Invalid status' }, 400);
    }

    const now = new Date().toISOString();
    await db.update(pendaftaran).set({
      status,
      catatanAdmin: catatan || null,
      updatedAt: now,
    }).where(eq(pendaftaran.id, id));

    return json({ success: true, message: 'Status berhasil diperbarui' }, 200);

  } catch (e: any) {
    return json({ success: false, error: e.message }, 500);
  }
};
