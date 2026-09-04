// path: src/pages/api/admin/upload-cover.ts
import type { APIRoute } from 'astro';
import { uploadToDrive } from '../../../lib/drive';
import { verifyGardaToken } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const gardaAdmin = await verifyGardaToken(
    request.headers.get('cookie'), (locals as any).runtime?.env
  );
  if (!gardaAdmin) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) throw new Error('File tidak ditemukan');

    const runtime = (locals as any).runtime;
    const env = runtime?.env;
    const folderId = env.GDRIVE_BLOG_FOLDER_ID || env.GDRIVE_FOLDER_ID;
    if (!folderId) throw new Error('Folder ID tidak dikonfigurasi');

    const result = await uploadToDrive(file, env, folderId, `blog_${Date.now()}.${file.name.split('.').pop()}`);

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      url: `https://beasiswa.iainptk.ac.id/api/img/${result.id}`,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
