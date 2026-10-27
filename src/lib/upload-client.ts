export interface UploadClientOptions {
  storageType?: 'local' | 'r2';
  folder?: string;
}

export interface UploadClientResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storage: 'local' | 'r2';
}

/**
 * Gửi file lên API /api/upload
 * Tùy chọn storageType:
 * - 'local': Lưu vào thư mục /public/uploads
 * - 'r2': Tải lên Cloudflare R2
 * - undefined: Server tự động chọn R2 nếu có biến môi trường, hoặc fallback về /public/uploads
 */
export async function uploadClientFile(
  file: File,
  options: UploadClientOptions = {}
): Promise<UploadClientResponse> {
  const formData = new FormData();
  formData.append('file', file);

  if (options.storageType) {
    formData.append('storageType', options.storageType);
  }
  if (options.folder) {
    formData.append('folder', options.folder);
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Không thể tải file lên server');
  }

  return data.data as UploadClientResponse;
}
