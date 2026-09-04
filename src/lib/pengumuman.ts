// path: src/lib/pengumuman.ts
// Helper untuk menilai apakah pengumuman hasil seleksi sudah dirilis (published)
// untuk sebuah beasiswa. Dipakai agar status lolos/gagal TIDAK bocor ke mahasiswa
// sebelum pengumuman diterbitkan.
import { and, eq, inArray } from 'drizzle-orm';
import { pengumuman } from '../db/schema';

/**
 * True jika beasiswa punya minimal 1 pengumuman yang sudah diterbitkan (published=1).
 * Mahasiswa baru boleh lihat status lolos/gagal kalau ini true.
 */
export async function isPengumumanRilis(
  db: any,
  beasiswaId: number
): Promise<boolean> {
  const rows = await db
    .select({ id: pengumuman.id })
    .from(pengumuman)
    .where(and(eq(pengumuman.beasiswaId, beasiswaId), eq(pengumuman.published, 1)))
    .limit(1);
  return rows.length > 0;
}

/**
 * Kumpulan beasiswaId yang pengumumannya sudah dirilis.
 * Untuk menandai banyak pendaftaran sekaligus (dibanding satu-satu).
 */
export async function getRilisBeasiswaIds(
  db: any,
  beasiswaIds: number[]
): Promise<Set<number>> {
  const ids = [...new Set(beasiswaIds)].filter((id) => Number.isInteger(id));
  if (ids.length === 0) return new Set();
  const rows = await db
    .select({ beasiswaId: pengumuman.beasiswaId })
    .from(pengumuman)
    .where(and(eq(pengumuman.published, 1), inArray(pengumuman.beasiswaId, ids)));
  return new Set(rows.map((r: any) => r.beasiswaId));
}
