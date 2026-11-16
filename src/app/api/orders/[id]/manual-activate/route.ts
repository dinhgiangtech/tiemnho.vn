import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fakeTiemNhoDb, OrderStatus } from '@/constants/mock-tiemnho';
import { manualActivateOrder } from '@/features/tiemnho/api/service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Mã đơn hàng không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra authentication nếu có session
    let currentUserId: string | null = null;
    try {
      const session = await getSession();
      currentUserId = session?.userId || null;
    } catch {
      // fallback
    }

    // Kích hoạt thủ công đơn hàng qua service
    const result = await manualActivateOrder(id, currentUserId || undefined);

    // Đồng bộ vào fakeTiemNhoDb cho mock memory nếu có
    try {
      await fakeTiemNhoDb.updateOrderStatus(id, OrderStatus.PAID);
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt đơn hàng #${result.order.orderCode} thành công! Hệ thống đã gửi email giao hàng tới khách.`,
      order: result.order,
      grant: result.grant
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error('Error in manual-activate route:', error);
    return NextResponse.json(
      { error: err?.message || 'Lỗi khi kích hoạt đơn hàng thủ công' },
      { status: err?.status || 500 }
    );
  }
}
