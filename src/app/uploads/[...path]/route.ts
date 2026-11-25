import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Bảng ánh xạ MIME type thông dụng
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip'
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];

    // Chống Path Traversal attack
    const safePathSegments = pathSegments.map((segment) =>
      segment.replace(/(\.\.[\/\\])/g, '').replace(/[\/\\]/g, '')
    );

    // Kiểm tra nhiều đường dẫn khả thi (Standalone mode của Next.js trong Docker)
    const possiblePaths = [
      path.join(process.cwd(), 'uploads', ...safePathSegments),
      path.join(process.cwd(), '..', 'uploads', ...safePathSegments),
      path.join('/app', 'uploads', ...safePathSegments),
      path.join(process.cwd(), 'public', 'uploads', ...safePathSegments)
    ];

    let filePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const s = fs.statSync(p);
          if (s.isFile()) {
            filePath = p;
            break;
          }
        } catch {
          // ignore stat errors
        }
      }
    }

    // Kiểm tra file có tồn tại không
    if (!filePath) {
      console.warn(`[Uploads Route] 404 File Not Found. Tried paths:`, possiblePaths);
      return new NextResponse('File Not Found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return new NextResponse('File Not Found', { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Lỗi khi đọc file uploads:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
