// path: src/pages/api/pengumuman/[beasiswaId].ts
// ENDPOINT PUBLIK — cek daftar pendaftar + yang LOLOS untuk satu beasiswa.
// Tidak butuh login. Hanya menampilkan pengumuman yang sudah diterbitkan (published=1).
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, asc, and } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { pengumuman, pendaftaran, users, beasiswa } from '../../../db/schema';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sanitize(s: any) {
  return s === null || s === undefined ? null : String(s);
}

export const GET: APIRoute = async ({ request, params, locals }) => {
  try {
    const db = drizzle((locals as any).runtime?.env?.DB, { schema });
    const beasiswaId = parseInt(params.beasiswaId || '0');
    if (!beasiswaId) return json({ success: false, message: 'Beasiswa tidak valid' }, 400);

    // Beasiswa terkait (pastikan aktif)
    const bs = await db.select().from(beasiswa).where(eq(beasiswa.id, beasiswaId)).limit(1);
    if (bs.length === 0) return json({ success: false, message: 'Beasiswa tidak ditemukan' }, 404);

    // Pengumuman yang sudah diterbitkan untuk beasiswa ini (terbaru dulu)
    const peng = await db.select().from(pengumuman)
      .where(and(eq(pengumuman.beasiswaId, beasiswaId), eq(pengumuman.published, 1)))
      .orderBy(desc(pengumuman.publishedAt));

    // Daftar pendaftar beasiswa ini (join users)
    const rows = await db.select({
      nama: users.namaLengkap,
      nim: users.nim,
      status: pendaftaran.status,
    }).from(pendaftaran)
      .innerJoin(users, eq(pendaftaran.userId, users.id))
      .where(eq(pendaftaran.beasiswaId, beasiswaId))
      .orderBy(asc(users.namaLengkap));

    const pendaftarList = rows.map((r) => ({
      nama: r.nama,
      nim: r.nim,
      status: r.status, // pending | accepted (lolos) | rejected
    }));

    const acceptedList = pendaftarList.filter((p) => p.status === 'accepted');

    // Handle case: pengumuman terbit benar (published) tapi tidak ada isi/daftar lolos — tetap valid
    return json({
      success: true,
      beasiswa: {
        id: bs[0].id,
        nama: bs[0].nama,
        deskripsi: sanitize(bs[0].deskripsi),
      },
      pengumuman: peng.map((p) => ({
        id: p.id,
        judul: p.judul,
        isi: p.isi,
        skFileId: p.skFileId,
        skOriginalFilename: p.skOriginalFilename,
        skMimeType: p.skMimeType,
        skFileSize: p.skFileSize,
        publishedAt: p.publishedAt,
      })),
      totalPendaftar: pendaftarList.length,
      totalLolos: acceptedList.length,
      pendaftar: pendaftarList,
      lolos: acceptedList,
    }, 200);
  } catch (e: any) {
    return json({ success: false, message: e.message }, 500);
  }
};
