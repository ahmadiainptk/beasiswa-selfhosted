// path: src/pages/api/admin/beasiswa-upload.ts
// Upload dokumen beasiswa ke Google Drive (auth: GARDA SSO admin)
import type { APIRoute } from 'astro';
import { uploadToDrive } from '../../../lib/drive';
import { verifyGardaToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(request.headers.get('cookie'), (locals as any).runtime?.env);
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const runtime = (locals as any).runtime;
    const env = runtime?.env;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ success: false, message: 'File wajib' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const folderId = env.GDRIVE_FOLDER_ID;
    if (!folderId) {
      return new Response(JSON.stringify({ success: false, message: 'GDRIVE_FOLDER_ID tidak diset' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const ext = file.name.split('.').pop() || 'bin';
    const customName = `beasiswa_dok_${Date.now()}_${file.name}`;
    const result = await uploadToDrive(file, env, folderId, customName);

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      url: `https://drive.google.com/file/d/${result.id}/view`,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error('Beasiswa Upload Error:', e);
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
