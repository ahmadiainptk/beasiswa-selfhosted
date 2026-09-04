// path: src/pages/api/upload.ts
import type { APIRoute } from 'astro';
import { uploadToDrive } from '../../lib/drive';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { sessions, users, dokumen } from '../../db/schema';
import { getCookieName } from '../../lib/auth';

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const token = cookies.get(getCookieName())?.value;
  if (!token) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;

    if (!env?.DB) {
      return new Response(JSON.stringify({ success: false, message: 'Database tidak tersedia' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = drizzle(env.DB, { schema });

    const session = await db.select()
      .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token)).limit(1);

    if (session.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = session[0].users;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bagian = formData.get('bagian')?.toString() || '';
    const fieldName = formData.get('field_name')?.toString() || '';

    if (!file || !bagian || !fieldName) {
      return new Response(JSON.stringify({ success: false, message: 'File, bagian, dan field_name wajib' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const nim = user.nik || user.nim || 'MHS';
    const ext = file.name.split('.').pop() || 'bin';
    const customName = `${nim}_${bagian}_${fieldName}.${ext}`;

    const folderId = env.GDRIVE_FOLDER_ID;
    if (!folderId) {
      return new Response(JSON.stringify({ success: false, message: 'GDRIVE_FOLDER_ID tidak diset' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await uploadToDrive(file, env, folderId, customName);
    const now = new Date().toISOString();

    // Upsert dokumen by userId + fieldName
    const existing = await db.select().from(dokumen)
      .where(and(eq(dokumen.userId, user.id), eq(dokumen.fieldName, fieldName)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(dokumen).set({
        r2Key: result.id,
        originalFilename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        uploadedAt: now,
      }).where(eq(dokumen.id, existing[0].id));
    } else {
      await db.insert(dokumen).values({
        userId: user.id, bagian, fieldName,
        r2Key: result.id,
        originalFilename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        uploadedAt: now,
      });
    }

    return new Response(JSON.stringify({
      success: true, id: result.id, url: result.url,
      filename: file.name, size: file.size,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error('Upload Error:', e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
