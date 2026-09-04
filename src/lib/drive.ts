// path: src/lib/drive.ts
// Google Drive upload via Service Account (Workers-compatible)
// Uses jose library for JWT signing (no google-auth-library needed)
import { SignJWT, importPKCS8 } from 'jose';

let _cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Google Access Token from Service Account JSON
 * Caches token until 5 minutes before expiry
 */
export async function getAccessToken(env: any): Promise<string> {
  // Check cache
  if (_cachedToken && _cachedToken.expiresAt > Date.now() + 300_000) {
    return _cachedToken.token;
  }

  // Prefer separate env vars, fallback to JSON
  let privateKeyPEM: string;
  let clientEmail: string;

  if (env.GOOGLE_PRIVATE_KEY && env.GOOGLE_CLIENT_EMAIL) {
    // Direct env vars (preferred)
    // Key might have literal \n or actual newlines — handle both
    privateKeyPEM = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    clientEmail = env.GOOGLE_CLIENT_EMAIL;
  } else if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // JSON fallback
    const saJson = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    privateKeyPEM = saJson.private_key.replace(/\\n/g, '\n');
    clientEmail = saJson.client_email;
  } else {
    throw new Error('Google credentials tidak ditemukan di environment');
  }

  const algorithm = 'RS256';
  const privateKey = await importPKCS8(privateKeyPEM, algorithm);

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents',
  })
    .setProtectedHeader({ alg: algorithm })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(`Google Auth gagal: ${JSON.stringify(data)}`);
  }

  _cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Upload file to Google Drive (resumable upload)
 */
export async function uploadToDrive(
  file: File,
  env: any,
  rawFolderId: string,
  customFileName: string | null = null
): Promise<{ id: string; url: string }> {
  const folderId = rawFolderId?.trim();
  if (!folderId) throw new Error('Folder ID Google Drive kosong.');

  const finalFileName = customFileName || file.name;
  const token = await getAccessToken(env);

  // Clean duplicate files
  try {
    const q = `name = '${finalFileName}' and '${folderId}' in parents and trashed = false`;
    const searchParams = new URLSearchParams({
      q,
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });

    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (listRes.ok) {
      const listData = (await listRes.json()) as any;
      if (listData.files?.length > 0) {
        await Promise.all(
          listData.files.map((f: any) =>
            fetch(
              `https://www.googleapis.com/drive/v3/files/${f.id}?supportsAllDrives=true`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ trashed: true }),
              }
            )
          )
        );
      }
    }
  } catch (e) {
    console.warn('Warning: Gagal clean file lama', e);
  }

  // Init resumable upload
  const initUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true`;
  const initRes = await fetch(initUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: finalFileName,
      parents: [folderId],
      mimeType: file.type,
    }),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Gagal inisialisasi GDrive (${initRes.status}): ${errText}`);
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('Tidak mendapatkan URL upload dari Google');

  // Upload file content
  const arrayBuffer = await file.arrayBuffer();
  const fileSize = arrayBuffer.byteLength;
  const fileData = new Uint8Array(arrayBuffer);

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': fileSize.toString(),
      'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
    },
    body: fileData,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Google Drive Reject (${uploadRes.status}): ${errorText}`);
  }

  const fileRes = (await uploadRes.json()) as any;

  return {
    id: fileRes.id,
    url: fileRes.id,
  };
}

/**
 * Create a new Google Doc via Drive API
 */
export async function createGoogleDoc(
  title: string,
  env: any
): Promise<{ id: string; url: string }> {
  const token = await getAccessToken(env);
  const folderId = env.GDRIVE_BLOG_FOLDER_ID || env.GDRIVE_FOLDER_ID;
  
  const body: any = {
    name: title,
    mimeType: 'application/vnd.google-apps.document',
  };
  if (folderId) body.parents = [folderId.trim()];

  const res = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal membuat Google Doc (${res.status}): ${err}`);
  }

  const data = (await res.json()) as any;
  return { id: data.id, url: `https://docs.google.com/document/d/${data.id}/edit` };
}

/**
 * Set Google Drive file to be editable by anyone with the link
 */
export async function setPublicEditPermission(
  fileId: string,
  env: any
): Promise<void> {
  const token = await getAccessToken(env);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'anyone',
        role: 'writer',
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal set permission (${res.status}): ${err}`);
  }
}

/**
 * Export a Google Doc as HTML text
 */
export async function exportDocAsHtml(
  fileId: string,
  env: any
): Promise<string> {
  const token = await getAccessToken(env);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal export doc (${res.status}): ${err}`);
  }

  const html = await res.text();

  // Strip Google Docs wrapper — extract only body content
  // Remove <!DOCTYPE>, <html>, <head>, <body> wrapper and its inline styles
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1]
      // Remove Google Docs internal comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove empty spans with only Google Docs metadata
      .replace(/<span[^>]*>\s*<\/span>/g, '')
      .trim();
  }
  return html;
}

/**
 * Delete file from Google Drive (soft delete / trash)
 */
export async function deleteFromDrive(
  fileId: string,
  env: any
): Promise<{ status: string }> {
  const token = await getAccessToken(env);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trashed: true }),
    }
  );

  if (res.status === 200) return { status: 'trashed' };
  if (res.status === 404) return { status: 'not_found' };

  throw new Error(`Delete failed: ${res.status}`);
}
