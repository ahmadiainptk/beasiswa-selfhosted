// path: src/pages/api/admin/pengumuman.ts
// Pengumuman (rilis hasil seleksi beasiswa) — admin CRUD (auth: GARDA SSO superadmin)
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { pengumuman, beasiswa } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET — list pengumuman (join beasiswa nama) + daftar beasiswa aktif untuk dropdown
export const GET: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) return json({ success: false, message: 'Unauthorized' }, 401);
  if (gardaAdmin.role !== 'superadmin') return json({ success: false, message: 'Forbidden' }, 403);

  try {
    const db = drizzle((locals as any).runtime?.env?.DB, { schema });
    const all = await db.select({
      id: pengumuman.id,
      beasiswaId: pengumuman.beasiswaId,
      judul: pengumuman.judul,
      isi: pengumuman.isi,
      skFileId: pengumuman.skFileId,
      skOriginalFilename: pengumuman.skOriginalFilename,
      skMimeType: pengumuman.skMimeType,
      skFileSize: pengumuman.skFileSize,
      published: pengumuman.published,
      publishedAt: pengumuman.publishedAt,
      createdAt: pengumuman.createdAt,
      updatedAt: pengumuman.updatedAt,
      beasiswaNama: beasiswa.nama,
    }).from(pengumuman)
      .leftJoin(beasiswa, eq(pengumuman.beasiswaId, beasiswa.id))
      .orderBy(desc(pengumuman.id));

    const allBeasiswa = await db.select({ id: beasiswa.id, nama: beasiswa.nama })
      .from(beasiswa).where(eq(beasiswa.aktif, 1));

    return json({ success: true, pengumuman: all, beasiswa: allBeasiswa }, 200);
  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};

// POST — create pengumuman (draft)
export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) return json({ success: false, message: 'Unauthorized' }, 401);
  if (gardaAdmin.role !== 'superadmin') return json({ success: false, message: 'Forbidden' }, 403);

  try {
    const db = drizzle((locals as any).runtime?.env?.DB, { schema });
    const body = await request.json();
    const { beasiswaId, judul, isi, skFileId, skOriginalFilename, skMimeType, skFileSize, published } = body;

    if (!beasiswaId || !judul) {
      return json({ success: false, message: 'Beasiswa dan judul wajib diisi' }, 400);
    }

    const now = new Date().toISOString();
    const insert = await db.insert(pengumuman).values({
      beasiswaId,
      judul,
      isi: isi || null,
      skFileId: skFileId || null,
      skOriginalFilename: skOriginalFilename || null,
      skMimeType: skMimeType || null,
      skFileSize: skFileSize || null,
      published: published ? 1 : 0,
      publishedAt: published ? now : null,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: pengumuman.id });

    return json({ success: true, message: 'Pengumuman berhasil dibuat', id: insert[0]?.id }, 201);
  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};

// PUT — update pengumuman
export const PUT: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) return json({ success: false, message: 'Unauthorized' }, 401);
  if (gardaAdmin.role !== 'superadmin') return json({ success: false, message: 'Forbidden' }, 403);

  try {
    const db = drizzle((locals as any).runtime?.env?.DB, { schema });
    const body = await request.json();
    const { id, beasiswaId, judul, isi, skFileId, skOriginalFilename, skMimeType, skFileSize, published, publishedAt } = body;

    if (!id) return json({ success: false, message: 'ID wajib' }, 400);

    const now = new Date().toISOString();
    const updates: any = { updatedAt: now };
    if (beasiswaId !== undefined) updates.beasiswaId = beasiswaId;
    if (judul !== undefined) updates.judul = judul;
    if (isi !== undefined) updates.isi = isi;
    if (skFileId !== undefined) updates.skFileId = skFileId;
    if (skOriginalFilename !== undefined) updates.skOriginalFilename = skOriginalFilename;
    if (skMimeType !== undefined) updates.skMimeType = skMimeType;
    if (skFileSize !== undefined) updates.skFileSize = skFileSize;
    if (published !== undefined) {
      const wasPublished = publishedAt != null;
      updates.published = published ? 1 : 0;
      if (published && !wasPublished) updates.publishedAt = now;
    }

    await db.update(pengumuman).set(updates).where(eq(pengumuman.id, id));

    return json({ success: true, message: 'Pengumuman berhasil diupdate' }, 200);
  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};

// DELETE — hapus pengumuman
export const DELETE: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) return json({ success: false, message: 'Unauthorized' }, 401);
  if (gardaAdmin.role !== 'superadmin') return json({ success: false, message: 'Forbidden' }, 403);

  try {
    const db = drizzle((locals as any).runtime?.env?.DB, { schema });
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0');
    if (!id) return json({ success: false, message: 'ID wajib' }, 400);

    await db.delete(pengumuman).where(eq(pengumuman.id, id));
    return json({ success: true, message: 'Pengumuman dihapus' }, 200);
  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};
