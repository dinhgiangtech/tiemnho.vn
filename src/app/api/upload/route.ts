import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, UploadStorageType } from '@/lib/storage-service';

export const runtime = 'nodejs';

// Giới hạn dung lượng tối đa (ví dụ: 50MB cho file tài nguyên hoặc ảnh chất lượng cao)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const storageType = (formData.get('storageType') as UploadStorageType) || undefined;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn file để tải lên.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Dung lượng file vượt quá giới hạn cho phép (50MB).' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(buffer, file.name, file.type, {
      storageType,
      folder
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Lỗi khi tải file lên:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Có lỗi xảy ra trong quá trình lưu trữ file.'
      },
      { status: 500 }
    );
  }
}
