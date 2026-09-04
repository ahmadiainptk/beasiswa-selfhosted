// path: src/pages/api/admin/beasiswa.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { beasiswa, beasiswaDokumen } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// WIB = UTC+7. Input datetime-local dari browser sudah lokal (WIB).
// Simpan sebagai ISO string apa adanya (tanpa timezone), agar konsisten tampil WIB.
// API hanya pass-through; frontend yang render.

interface DokumenInput {
  id?: number;
  judul: string;
  deskripsi?: string;
  fileId?: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
}

// GET — list semua beasiswa + dokumen
export const GET: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const runtime = (locals as any).runtime;
  const db = drizzle(runtime?.env?.DB, { schema });

  try {
    const all = await db.select().from(beasiswa).orderBy(beasiswa.id);
    const allDocs = await db.select().from(beasiswaDokumen).orderBy(beasiswaDokumen.id);

    const beasiswaWithDocs = all.map((b) => ({
      ...b,
      dokumen: allDocs.filter((d) => d.beasiswaId === b.id),
    }));

    return new Response(JSON.stringify({ success: true, beasiswa: beasiswaWithDocs }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper: sync dokumen list for a beasiswa
async function syncDokumen(db: any, beasiswaId: number, dokumen: DokumenInput[] | undefined) {
  if (!Array.isArray(dokumen)) return;

  const now = new Date().toISOString();
  const existing = await db.select().from(beasiswaDokumen).where(eq(beasiswaDokumen.beasiswaId, beasiswaId));

  const existingIds = new Set(existing.map((d: any) => d.id));
  const incomingIds = new Set<number>();

  for (const doc of dokumen) {
    if (!doc.judul && !doc.fileId && !doc.originalFilename) continue;

    if (doc.id !== undefined && existingIds.has(doc.id)) {
      // Update existing
      incomingIds.add(doc.id);
      await db.update(beasiswaDokumen).set({
        judul: doc.judul || '',
        deskripsi: doc.deskripsi || null,
        fileId: doc.fileId || null,
        originalFilename: doc.originalFilename || null,
        mimeType: doc.mimeType || null,
        fileSize: doc.fileSize || null,
        updatedAt: now,
      }).where(eq(beasiswaDokumen.id, doc.id));
    } else {
      // Insert new
      await db.insert(beasiswaDokumen).values({
        beasiswaId,
        judul: doc.judul || '',
        deskripsi: doc.deskripsi || null,
        fileId: doc.fileId || null,
        originalFilename: doc.originalFilename || null,
        mimeType: doc.mimeType || null,
        fileSize: doc.fileSize || null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Delete removed docs
  for (const ex of existing) {
    if (!incomingIds.has(ex.id)) {
      await db.delete(beasiswaDokumen).where(eq(beasiswaDokumen.id, ex.id));
    }
  }
}

// POST — create beasiswa baru
export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const runtime = (locals as any).runtime;
  const db = drizzle(runtime?.env?.DB, { schema });

  try {
    const body = await request.json();
    const { nama, deskripsi, persyaratan, dibuka_pada, ditutup_pada, dokumen } = body;

    if (!nama) {
      return new Response(JSON.stringify({ success: false, message: 'Nama beasiswa wajib diisi' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const slug = slugify(nama);
    const now = new Date().toISOString();

    const existing = await db.select().from(beasiswa).where(eq(beasiswa.slug, slug)).limit(1);
    if (existing.length > 0) {
      return new Response(JSON.stringify({ success: false, message: 'Beasiswa dengan nama serupa sudah ada' }), {
        status: 409, headers: { 'Content-Type': 'application/json' }
      });
    }

    const inserted = await db.insert(beasiswa).values({
      nama,
      slug,
      deskripsi: deskripsi || null,
      persyaratan: persyaratan || null,
      aktif: 1,
      dibukaPada: dibuka_pada || null,
      ditutupPada: ditutup_pada || null,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: beasiswa.id });

    const newId = inserted[0]?.id;
    if (newId && dokumen) {
      await syncDokumen(db, newId, dokumen);
    }

    return new Response(JSON.stringify({ success: true, message: 'Beasiswa berhasil ditambahkan', id: newId }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT — update beasiswa
export const PUT: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const runtime = (locals as any).runtime;
  const db = drizzle(runtime?.env?.DB, { schema });

  try {
    const body = await request.json();
    const { id, nama, deskripsi, persyaratan, dibuka_pada, ditutup_pada, dokumen } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID beasiswa wajib' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const updates: any = { updatedAt: now };
    if (nama !== undefined) { updates.nama = nama; updates.slug = slugify(nama); }
    if (deskripsi !== undefined) updates.deskripsi = deskripsi;
    if (persyaratan !== undefined) updates.persyaratan = persyaratan;
    if (dibuka_pada !== undefined) updates.dibukaPada = dibuka_pada;
    if (ditutup_pada !== undefined) updates.ditutupPada = ditutup_pada;

    await db.update(beasiswa).set(updates).where(eq(beasiswa.id, id));

    if (dokumen !== undefined) {
      await syncDokumen(db, id, dokumen);
    }

    return new Response(JSON.stringify({ success: true, message: 'Beasiswa berhasil diupdate' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PATCH — toggle aktif/nonaktif
export const PATCH: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const runtime = (locals as any).runtime;
  const db = drizzle(runtime?.env?.DB, { schema });

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID beasiswa wajib' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = await db.select().from(beasiswa).where(eq(beasiswa.id, id)).limit(1);
    if (existing.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Beasiswa tidak ditemukan' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }

    const newAktif = existing[0].aktif ? 0 : 1;
    await db.update(beasiswa).set({
      aktif: newAktif,
      updatedAt: new Date().toISOString(),
    }).where(eq(beasiswa.id, id));

    return new Response(JSON.stringify({
      success: true,
      message: newAktif ? 'Beasiswa diaktifkan' : 'Beasiswa dinonaktifkan',
      aktif: newAktif,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
