// path: src/pages/api/delete-file.ts
import type { APIRoute } from 'astro';
import { deleteFromDrive } from '../../lib/drive';
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
    const db_binding = env?.DB;

    if (!db_binding) {
      return new Response(JSON.stringify({ success: false, message: 'Database tidak tersedia' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = drizzle(db_binding, { schema });

    const session = await db.select()
      .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token)).limit(1);

    if (session.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Session expired' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = session[0].users;
    const body = await request.json();
    const { file_id, field_name } = body;

    if (!file_id) {
      return new Response(JSON.stringify({ success: false, message: 'file_id wajib diisi' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from Google Drive
    await deleteFromDrive(file_id, env);

    // Delete metadata from D1 (scoped to user)
    if (field_name) {
      await db.delete(dokumen)
        .where(and(eq(dokumen.userId, user.id), eq(dokumen.fieldName, field_name)));
    }

    return new Response(JSON.stringify({ success: true, message: 'File berhasil dihapus' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('Delete Error:', e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
