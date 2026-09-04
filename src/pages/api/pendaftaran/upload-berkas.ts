// path: src/pages/api/pendaftaran/upload-berkas.ts
// POST — mahasiswa Lolos (accepted) mengupload Format 1 / Lampiran II untuk satu beasiswa.
// Body (multipart): file, beasiswaId, type ('format1' | 'lampiran2')
// Hanya boleh jika pendaftaran status === 'accepted' (Lolos).

import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import * as schema from "../../../db/schema";
import { sessions, users, pendaftaran } from "../../../db/schema";
import { getCookieName } from "../../../lib/auth";
import { uploadToDrive } from "../../../lib/drive";

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const token = cookies.get(getCookieName())?.value;
  if (!token) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const env = (locals as any).runtime?.env;
    if (!env?.DB) {
      return new Response(JSON.stringify({ success: false, message: "Database tidak tersedia" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const db = drizzle(env.DB, { schema });

    const session = await db.select()
      .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token)).limit(1);

    if (session.length === 0 || new Date(session[0].sessions.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ success: false, message: "Session expired" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const user = session[0].users;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const beasiswaId = Number(formData.get("beasiswaId") || formData.get("beasiswa_id") || 0);
    const type = (formData.get("type")?.toString() || "").toLowerCase();

    if (!file || !beasiswaId || !["format1", "lampiran2"].includes(type)) {
      return new Response(JSON.stringify({ success: false, message: "File, beasiswaId, dan type (format1|lampiran2) wajib" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    // Ambil pendaftaran & pastikan milik user ini + status Lolos
    const reg = await db.select().from(pendaftaran)
      .where(and(eq(pendaftaran.userId, user.id), eq(pendaftaran.beasiswaId, beasiswaId)))
      .limit(1);

    if (reg.length === 0) {
      return new Response(JSON.stringify({ success: false, message: "Pendaftaran tidak ditemukan" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }

    if (reg[0].status !== "accepted") {
      return new Response(JSON.stringify({ success: false, message: "Berkas hanya dapat diunggah setelah dinyatakan Lolos." }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }

    const folderId = env.GDRIVE_FOLDER_ID;
    if (!folderId) {
      return new Response(JSON.stringify({ success: false, message: "GDRIVE_FOLDER_ID tidak diset" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const nim = user.nik || user.nim || "MHS";
    const ext = file.name.split(".").pop() || "bin";
    const customName = `${nim}_berkas_lolos_bea${beasiswaId}_${type}.${ext}`;

    const result = await uploadToDrive(file, env, folderId, customName);
    const now = new Date().toISOString();

    // Simpan di baris pendaftaran ini
    const updates: Record<string, any> = { updatedAt: now };
    if (type === "format1") {
      updates.format1FileId = result.id;
      updates.format1OriginalFilename = file.name;
    } else {
      updates.lampiran2FileId = result.id;
      updates.lampiran2OriginalFilename = file.name;
    }
    updates.berkasUploadedAt = now;

    await db.update(pendaftaran).set(updates)
      .where(eq(pendaftaran.id, reg[0].id));

    return new Response(JSON.stringify({
      success: true, id: result.id, url: result.url,
      filename: file.name, size: file.size, type,
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("Upload Berkas Error:", e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
