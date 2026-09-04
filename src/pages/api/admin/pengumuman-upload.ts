// path: src/pages/api/admin/pengumuman-upload.ts
// Upload SK (PDF) pengumuman ke Google Drive (auth: GARDA SSO superadmin)
import type { APIRoute } from 'astro';
import { uploadToDrive } from '../../../lib/drive';
import { verifyGardaToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (gardaAdmin.role !== 'superadmin') {
    return new Response(JSON.stringify({ success: false, message: 'Forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const env = (locals as any).runtime?.env;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ success: false, message: 'File wajib' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validasi PDF only untuk SK
    if ((file.type && file.type !== 'application/pdf') && !/\.pdf$/i.test(file.name)) {
      return new Response(JSON.stringify({ success: false, message: 'SK harus berupa file PDF' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const folderId = env.GDRIVE_FOLDER_ID;
    if (!folderId) {
      return new Response(JSON.stringify({ success: false, message: 'GDRIVE_FOLDER_ID tidak diset' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const customName = `sk_pengumuman_${Date.now()}_${file.name}`;
    const result = await uploadToDrive(file, env, folderId, customName);

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      url: `https://drive.google.com/file/d/${result.id}/view`,
      filename: file.name,
      size: file.size,
      mimeType: file.type || 'application/pdf',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error('Pengumuman Upload Error:', e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
