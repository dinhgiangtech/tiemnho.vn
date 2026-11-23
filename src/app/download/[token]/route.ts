import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.epub': 'application/epub+zip',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

/**
 * Endpoint tải tài liệu số bảo mật cho khách hàng sau khi thanh toán thành công
 * Định dạng link: /download/[token]?file=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const targetFile = searchParams.get('file');

    // 1. Kiểm tra tính hợp lệ của token tải về
    if (!token || (!token.startsWith('gr_') && token.length < 8)) {
      return new NextResponse('Mã tải xuống không hợp lệ hoặc đã hết hạn', { status: 400 });
    }

    if (!targetFile) {
      return new NextResponse('Không tìm thấy tệp đính kèm tương ứng với đơn hàng', {
        status: 404
      });
    }

    // 2. Nếu file là liên kết Google Drive, Notion, Canva, Dropbox, v.v. -> Redirect trực tiếp
    if (targetFile.startsWith('http://') || targetFile.startsWith('https://')) {
      // Nếu là link nội bộ uploads của chính domain -> Chuyển về xử lý stream file
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      if (!targetFile.startsWith(`${appUrl}/uploads`)) {
        return NextResponse.redirect(targetFile);
      }
    }

    // 3. Xử lý tải file vật lý được lưu trữ nội bộ (uploads/...)
    // Chuẩn hóa đường dẫn file cục bộ
    const cleanPath = targetFile.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    const safeSegments = cleanPath
      .split(/[/\\]/)
      .map((seg) => seg.replace(/(\.\.[\/\\])/g, '').replace(/[\/\\]/g, ''))
      .filter(Boolean);

    const filePath = path.join(process.cwd(), 'uploads', ...safeSegments);

    if (!fs.existsSync(filePath)) {
      // Thử tìm trong public/uploads nếu uploads nằm trong public
      const publicPath = path.join(process.cwd(), 'public', 'uploads', ...safeSegments);
      if (fs.existsSync(publicPath)) {
        return streamLocalFile(publicPath);
      }
      return new NextResponse('Tệp tài liệu không còn tồn tại trên máy chủ', { status: 404 });
    }

    return streamLocalFile(filePath);
  } catch (error) {
    console.error('[Download Route Error]:', error);
    return new NextResponse('Lỗi máy chủ khi tải tệp', { status: 500 });
  }
}

function streamLocalFile(filePath: string) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    return new NextResponse('Tệp không hợp lệ', { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileName = path.basename(filePath);

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': stat.size.toString(),
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}
