import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type UploadStorageType = 'local' | 'r2';

export interface UploadOptions {
  storageType?: UploadStorageType; // 'local' hoặc 'r2'
  folder?: string; // Ví dụ: 'products', 'banners', 'files'
}

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storage: UploadStorageType;
}

// ----------------------------------------------------------------------
// 1. Cấu hình Cloudflare R2 Client (S3 Compatible)
// ----------------------------------------------------------------------
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''; // Ví dụ: https://pub-xxx.r2.dev hoặc https://cdn.tiemnho.vn

// Provider mặc định: 'local' (lưu tại /public/uploads) hoặc 'r2' (Cloudflare R2)
// Hiện tại dự án ưu tiên dùng tạm phương án 1 ('local')
const UPLOAD_PROVIDER: UploadStorageType =
  (process.env.UPLOAD_PROVIDER as UploadStorageType) || 'local';

export function isR2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

const s2Client = isR2Configured()
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    })
  : null;

// Helper: Sinh tên file ngẫu nhiên an toàn, giữ nguyên đuôi file
function generateSafeFileName(originalName: string): string {
  const ext = path.extname(originalName) || '.bin';
  const cleanBase = path
    .basename(originalName, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
  const uniqueId = crypto.randomBytes(6).toString('hex');
  return `${cleanBase}-${Date.now()}-${uniqueId}${ext}`;
}

// ----------------------------------------------------------------------
// 2. Upload file cục bộ vào thư mục /public/uploads
// ----------------------------------------------------------------------
export async function uploadToLocal(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const safeName = generateSafeFileName(originalName);
  const targetDir = path.join(process.cwd(), 'public', folder);

  // Đảm bảo thư mục tồn tại
  await mkdir(targetDir, { recursive: true });

  const filePath = path.join(targetDir, safeName);
  await writeFile(filePath, fileBuffer);

  // Đường dẫn tương đối phục vụ web browser (vd: /uploads/abc-123.jpg)
  const webPath = `/${folder}/${safeName}`.replace(/\\/g, '/');

  return {
    url: webPath,
    fileName: safeName,
    fileSize: fileBuffer.length,
    mimeType,
    storage: 'local'
  };
}

// ----------------------------------------------------------------------
// 3. Upload file lên Cloudflare R2
// ----------------------------------------------------------------------
export async function uploadToR2(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  if (!s2Client || !R2_BUCKET_NAME) {
    throw new Error(
      'Cloudflare R2 chưa được cấu hình. Vui lòng kiểm tra R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME trong .env.'
    );
  }

  const safeName = generateSafeFileName(originalName);
  const key = folder ? `${folder}/${safeName}` : safeName;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType
  });

  await s2Client.send(command);

  // Xây dựng public URL
  const publicBase = R2_PUBLIC_URL.replace(/\/+$/, '');
  const url = publicBase
    ? `${publicBase}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return {
    url,
    fileName: safeName,
    fileSize: fileBuffer.length,
    mimeType,
    storage: 'r2'
  };
}

// ----------------------------------------------------------------------
// 4. Unified Uploader Service: Tự động hoặc chỉ định storage
// ----------------------------------------------------------------------
export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { storageType, folder = 'uploads' } = options;

  // Quyết định provider: ưu tiên option truyền vào, nếu không thì dùng UPLOAD_PROVIDER ('local')
  const targetProvider = storageType || UPLOAD_PROVIDER;

  if (targetProvider === 'r2') {
    if (isR2Configured()) {
      try {
        return await uploadToR2(fileBuffer, originalName, mimeType, folder);
      } catch (err) {
        console.warn('Upload R2 thất bại, tự động chuyển về lưu public local:', err);
        return await uploadToLocal(fileBuffer, originalName, mimeType, folder);
      }
    } else {
      console.warn('R2 chưa được cấu hình, tự động lưu trữ tại /public/uploads');
      return await uploadToLocal(fileBuffer, originalName, mimeType, folder);
    }
  }

  // Mặc định hiện tại: Phương án 1 (Lưu cục bộ vào public/uploads)
  return await uploadToLocal(fileBuffer, originalName, mimeType, folder);
}
