// path: src/pages/api/admin/export.ts
import type { APIRoute } from 'astro';
import { drizzle } from 'drizzle-orm/d1';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '../../../db/schema';
import { users, identitasPribadi, riwayatPendidikan, prestasiTahfidz, identitasKeluarga, kondisiRumah, domisiliOrtu, kebutuhanKhusus, dokumen } from '../../../db/schema';
import { verifyGardaToken } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) return new Response('Unauthorized', { status: 401 });

  try {
    const runtime = (locals as any).runtime;
    const db = drizzle(runtime?.env?.DB, { schema });

    const allUsers = await db.select({
      id: users.id, nama: users.namaLengkap, nim: users.nim, email: users.email,
      profileStatus: users.profileStatus, profileSubmittedAt: users.profileSubmittedAt,
      profileVerifiedAt: users.profileVerifiedAt,
    }).from(users).where(eq(users.role, 'mahasiswa'));

    // ── BATCH-LOAD semua section SEKALIGUS (bukan N+1 per user) ──
    const ids = allUsers.map(u => u.id);
    // Satu query per section, semua user sekaligus, lalu index by userId di JS.
    const [s1map, s2map, s3map, s4map, s5map, s6map, s7map, docmap] = await Promise.all([
      db.select().from(identitasPribadi).where(inArray(identitasPribadi.userId, ids)),
      db.select().from(riwayatPendidikan).where(inArray(riwayatPendidikan.userId, ids)),
      db.select().from(prestasiTahfidz).where(inArray(prestasiTahfidz.userId, ids)),
      db.select().from(identitasKeluarga).where(inArray(identitasKeluarga.userId, ids)),
      db.select().from(kondisiRumah).where(inArray(kondisiRumah.userId, ids)),
      db.select().from(domisiliOrtu).where(inArray(domisiliOrtu.userId, ids)),
      db.select().from(kebutuhanKhusus).where(inArray(kebutuhanKhusus.userId, ids)),
      db.select().from(dokumen).where(inArray(dokumen.userId, ids)),
    ]);
    const idx = (rows: any[]) => { const m = new Map<number, any>(); for (const r of rows) if (!m.has(r.userId)) m.set(r.userId, r); return m; };
    const S1 = idx(s1map), S2 = idx(s2map), S3 = idx(s3map), S4 = idx(s4map), S5 = idx(s5map), S6 = idx(s6map), S7 = idx(s7map);
    const docCount = new Map<number, number>();
    for (const d of docmap) docCount.set(d.userId, (docCount.get(d.userId) || 0) + 1);

    const rows: string[][] = [];
    rows.push([
      'User ID', 'NIM', 'Nama', 'Email', 'Status Profil', 'Tanggal Submit',
      'NIK', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'No HP',
      'Provinsi', 'Kabupaten', 'Kecamatan', 'Kelurahan', 'Alamat', 'RT/RW', 'Kode Pos', 'No KIP',
      'Jenis Sekolah', 'NISN', 'Nama Sekolah', 'Lulus Tahun', 'Lulus Jalur',
      'Kategori UKT', 'Nominal UKT', 'Fakultas', 'Prodi',
      'Nama Lomba', 'Jenis Lomba', 'Tingkat', 'Juara', 'Jumlah Juzz',
      'Nama Ayah', 'Status Ayah', 'Penghasilan Ayah',
      'Nama Ibu', 'Status Ibu', 'Penghasilan Ibu',
      'No KK', 'Jumlah Tanggungan',
      'Luas Tanah', 'Kepemilikan', 'Daya Listrik', 'Status Listrik',
      'Provinsi Ayah', 'Kabupaten Ayah', 'Alamat Ayah',
      'Provinsi Ibu', 'Kabupaten Ibu', 'Alamat Ibu',
      'Penyandang Disabilitas', 'Jenis Disabilitas',
      'Jumlah Dokumen',
    ]);

    for (const u of allUsers) {
      const s1 = S1.get(u.id), s2 = S2.get(u.id), s3 = S3.get(u.id), s4 = S4.get(u.id);
      const s5 = S5.get(u.id), s6 = S6.get(u.id), s7 = S7.get(u.id);

      rows.push([
        String(u.id), u.nim || '', u.nama, u.email,
        u.profileStatus || '', u.profileSubmittedAt || '',
        s1?.nik || '', s1?.tempatLahir || '', s1?.tanggalLahir || '', s1?.jenisKelamin || '', s1?.noHp || '',
        s1?.provinsi || '', s1?.kabupaten || '', s1?.kecamatan || '', s1?.kelurahan || '',
        s1?.alamat || '', s1?.rtRw || '', s1?.kodePos || '', s1?.noKip || '',
        s2?.jenisSekolah || '', s2?.nisn || '', s2?.namaSekolah || '',
        s2?.lulusTahun || '', s2?.lulusJalur || '',
        s2?.kategoriUkt || '', s2?.nominalUkt ? String(s2.nominalUkt) : '',
        s2?.fakultas || '', s2?.prodi || '',
        s3?.namaLomba || '', s3?.jenisLomba || '', s3?.tingkatLomba || '',
        s3?.predikatJuara || '', s3?.jumlahJuzz ? String(s3.jumlahJuzz) : '',
        s4?.namaAyah || '', s4?.statusAyah || '', s4?.penghasilanAyah ? String(s4.penghasilanAyah) : '',
        s4?.namaIbu || '', s4?.statusIbu || '', s4?.penghasilanIbu ? String(s4.penghasilanIbu) : '',
        s4?.nomorKk || '', s4?.jumlahTanggungan ? String(s4.jumlahTanggungan) : '',
        s5?.luasTanah || '', s5?.kepemilikanRumah || '', s5?.dayaListrik || '', s5?.statusListrik || '',
        s6?.provinsiAyah || '', s6?.kabupatenAyah || '', s6?.alamatAyah || '',
        s6?.provinsiIbu || '', s6?.kabupatenIbu || '', s6?.alamatIbu || '',
        s7?.penyandangDisabilitas === 1 ? 'Ya' : 'Tidak', s7?.jenisDisabilitas || '',
        String(docCount.get(u.id) || 0),
      ]);
    }

    const csv = rows.map(row =>
      row.map(cell => {
        const escaped = cell.replace(/"/g, '""');
        return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    ).join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="profil_mahasiswa_beasiswa.csv"',
      },
    });

  } catch (e: any) {
    console.error('Export Error:', e);
    return new Response('Error: ' + e.message, { status: 500 });
  }
};
