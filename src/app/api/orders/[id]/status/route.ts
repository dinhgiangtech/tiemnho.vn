import { NextRequest, NextResponse } from 'next/server';
import { fakeTiemNhoDb } from '@/constants/mock-tiemnho';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await fakeTiemNhoDb.getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    paidAt: order.paidAt,
    downloadUrl: order.downloadUrl
  });
}

// Allow simulated quick payment directly from test UI
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await fakeTiemNhoDb.getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
  }

  const updated = await fakeTiemNhoDb.updateOrderStatus(order.id, 'PAID');
  return NextResponse.json({
    success: true,
    message: 'Thanh toán mô phỏng thành công!',
    order: updated
  });
}
