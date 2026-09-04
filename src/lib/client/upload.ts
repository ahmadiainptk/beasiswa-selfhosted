// path: src/lib/client/upload.ts
// Client-side file upload with XHR progress bar
// Adapted from wisuda-astro/src/lib/client/upload.ts

interface UploadCallbacks {
  onProgress?: (percent: number) => void;
  onSuccess?: (result: { id: string; url: string; filename: string }) => void;
  onError?: (message: string) => void;
}

/**
 * Upload file to /api/upload with progress tracking
 */
export function uploadFile(
  file: File,
  bagian: string,
  fieldName: string,
  callbacks: UploadCallbacks = {}
): XMLHttpRequest {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bagian', bagian);
  formData.append('field_name', fieldName);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/upload', true);

  // Progress tracking
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable && callbacks.onProgress) {
      const percent = Math.round((e.loaded / e.total) * 100);
      callbacks.onProgress(percent);
    }
  };

  // Response handling
  xhr.onload = () => {
    try {
      const res = JSON.parse(xhr.responseText);
      if (xhr.status === 200 && res.success) {
        callbacks.onSuccess?.({
          id: res.id,
          url: res.url,
          filename: res.filename,
        });
      } else {
        callbacks.onError?.(res.message || 'Upload gagal');
      }
    } catch (e) {
      callbacks.onError?.('Respon server tidak valid');
    }
  };

  xhr.onerror = () => {
    callbacks.onError?.('Koneksi terputus saat upload');
  };

  xhr.send(formData);
  return xhr;
}

/**
 * Get file preview URL from Google Drive file ID
 * Uses the CF Worker image proxy pattern
 */
export function getGDriveViewUrl(fileId: string): string {
  if (!fileId) return '';
  if (fileId.startsWith('http')) return fileId;
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Get file download URL from Google Drive file ID
 */
export function getGDriveDownloadUrl(fileId: string): string {
  if (!fileId) return '';
  if (fileId.startsWith('http')) return fileId;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
