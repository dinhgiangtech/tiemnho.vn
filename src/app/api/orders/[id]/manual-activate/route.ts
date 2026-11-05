import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { fakeTiemNhoDb } from '@/constants/mock-tiemnho';
import { manualActivateOrder } from '@/features/tiemnho/api/service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Mã đơn hàng không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra authentication nếu có Clerk session
    let clerkUserId: string | null = null;
    try {
      const authData = await auth();
      clerkUserId = authData.userId;
    } catch {
      // Keyless/development fallback
    }

    // Kích hoạt thủ công đơn hàng qua service
    const result = await manualActivateOrder(id, clerkUserId || undefined);

    // Đồng bộ vào fakeTiemNhoDb cho mock memory nếu có
    try {
      await fakeTiemNhoDb.updateOrderStatus(id, 'PAID');
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt đơn hàng #${result.order.orderCode} thành công! Hệ thống đã gửi email giao hàng tới khách.`,
      order: result.order,
      grant: result.grant
    });
  } catch (error: any) {
    console.error('Error in manual-activate route:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi kích hoạt đơn hàng thủ công' },
      { status: error?.status || 500 }
    );
  }
}
