// path: src/pages/api/pendaftaran/formulir-pdf.ts
// GET — generate "Formulir Data Mahasiswa" PDF (form 1-7) for a verified student.
// Auth: mahasiswa session. Hanya bisa download setelah profil diverifikasi (profileStatus === 'verified').

import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../../../db/schema";
import {
  sessions, users, identitasPribadi, riwayatPendidikan, prestasiTahfidz,
  identitasKeluarga, kondisiRumah, domisiliOrtu, kebutuhanKhusus, dokumen,
} from "../../../db/schema";
import { getCookieName } from "../../../lib/auth";
import { generateFormulirPdf } from "../../../lib/formulir-pdf";

export const GET: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime?.env;
  const db = drizzle(env?.DB, { schema });

  // 1. Auth — mahasiswa session
  const cookie = request.headers.get("cookie") || "";
  const tokenMatch = cookie.match(/(?:^|;\s*)beasiswa_session=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  if (!token || !env?.DB) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const session = await db.select()
    .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token)).limit(1);

  if (session.length === 0 || new Date(session[0].sessions.expiresAt) < new Date()) {
    return new Response(JSON.stringify({ success: false, error: "Session expired" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const user = session[0].users;

  // 2. WAJIB terverifikasi sebelum bisa download formulir
  if (user.profileStatus !== "verified") {
    return new Response(JSON.stringify({
      success: false,
      error: "Formulir hanya dapat diunduh setelah data Anda diverifikasi oleh admin.",
    }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  // 3. Fetch all section data (form 1-7)
  const [s1, s2, s3, s4, s5, s6, s7] = await Promise.all([
    db.select().from(identitasPribadi).where(eq(identitasPribadi.userId, user.id)).limit(1),
    db.select().from(riwayatPendidikan).where(eq(riwayatPendidikan.userId, user.id)).limit(1),
    db.select().from(prestasiTahfidz).where(eq(prestasiTahfidz.userId, user.id)).limit(1),
    db.select().from(identitasKeluarga).where(eq(identitasKeluarga.userId, user.id)).limit(1),
    db.select().from(kondisiRumah).where(eq(kondisiRumah.userId, user.id)).limit(1),
    db.select().from(domisiliOrtu).where(eq(domisiliOrtu.userId, user.id)).limit(1),
    db.select().from(kebutuhanKhusus).where(eq(kebutuhanKhusus.userId, user.id)).limit(1),
  ]);

  // 4. Fetch uploaded dokumen
  const docs = await db.select().from(dokumen).where(eq(dokumen.userId, user.id));

  // 5. Generate PDF
  const pdfBytes = await generateFormulirPdf({
    user: { namaLengkap: user.namaLengkap, nim: user.nim, nik: user.nik },
    sections: [
      { title: "1. Identitas Pribadi", data: s1[0] || null },
      { title: "2. Riwayat Pendidikan", data: s2[0] || null },
      { title: "3. Prestasi & Tahfidz", data: s3[0] || null },
      { title: "4. Identitas Keluarga", data: s4[0] || null },
      { title: "5. Kondisi Rumah", data: s5[0] || null },
      { title: "6. Domisili Ortu/Wali", data: s6[0] || null },
      { title: "7. Kebutuhan Khusus", data: s7[0] || null },
    ],
    dokumen: docs.map((d) => ({ fieldName: d.fieldName, originalFilename: d.originalFilename })),
    verifiedAt: user.profileVerifiedAt,
  });

  // 6. Return as binary PDF download
  const safeName = (user.namaLengkap || "mahasiswa").replace(/[^a-zA-Z0-9]+/g, "_");
  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Formulir_${safeName}_${user.nim || ""}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
};
