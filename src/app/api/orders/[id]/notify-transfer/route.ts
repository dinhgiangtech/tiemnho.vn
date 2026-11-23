import { NextRequest, NextResponse } from 'next/server';
import { sendOrderAlertToCreator } from '@/features/tiemnho/api/services/telegram.service';
import { getOrderById } from '@/features/tiemnho/api/services/order.service';
import { createPaymentLog } from '@/features/tiemnho/api/services/payment-log.service';

export const runtime = 'nodejs';

/**
 * Khach hang bam Toi da chuyen khoan o don hang MANUAL_VIETQR
 * Endpoint: POST /api/orders/[id]/notify-transfer
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thieu ma don hang' }, { status: 400 });
    }

    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Khong tim thay don hang' },
        { status: 404 }
      );
    }

    // Ghi log Buyer Confirmed
    await createPaymentLog({
      creatorId: order.creatorId,
      orderId: order.id,
      orderCode: order.orderCode,
      eventType: 'BUYER_CONFIRMED',
      gateway: 'MANUAL_VIETQR',
      transferAmount: Math.round(order.amount),
      status: 'INFO',
      message: `Khách hàng ${order.customerName} bấm xác nhận đã chuyển khoản đơn #${order.orderCode}`
    });

    // Ban thong bao ve Telegram Creator kem nut duyet 1-cham
    const sent = await sendOrderAlertToCreator(order.orderCode);

    return NextResponse.json({
      success: true,
      message: 'Da ghi nhan thong tin chuyen khoan. Creator dang kiem tra va se duyet don.',
      telegramNotified: sent
    });
  } catch (error: any) {
    console.error('[notify-transfer exception]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Loi gui thong bao chuyen khoan' },
      { status: 500 }
    );
  }
}
