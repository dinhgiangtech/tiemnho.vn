import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/features/tiemnho/api/services/order.service';
import { OrderStatus } from '@/constants/mock-tiemnho';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    paidAt: order.paidAt,
    downloadUrl: order.downloadUrl,
    checkoutUrl: order.checkoutUrl,
    qrCode: order.qrCode
  });
}

// Allow simulated quick payment directly from test UI
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
  }

  const updated = await updateOrderStatus(order.id, OrderStatus.PAID);
  return NextResponse.json({
    success: true,
    message: 'Thanh toán mô phỏng thành công!',
    order: updated
  });
}
