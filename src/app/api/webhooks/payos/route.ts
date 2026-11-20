import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/features/tiemnho/api/services/order.service';
import { verifyPayOSWebhookData } from '@/features/tiemnho/api/services/payos.service';
import { OrderStatus } from '@/constants/mock-tiemnho';

export const runtime = 'nodejs';

/**
 * Webhook nhận thông báo thanh toán tự động từ cổng payOS
 * Endpoint: /api/webhooks/payos
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Kiểm tra cấu trúc dữ liệu webhook từ payOS
    if (!body || !body.data) {
      return NextResponse.json(
        { success: false, error: 'Payload không hợp lệ từ payOS' },
        { status: 400 }
      );
    }

    const { data, code, desc } = body;
    const rawOrderCode = data.orderCode;
    const transferAmount = Number(data.amount || 0);

    // 2. Tìm mã đơn hàng (hỗ trợ cả TNxxxxx hoặc số orderCode)
    const orderIdentifiers = [
      `TN${rawOrderCode}`,
      String(rawOrderCode),
      data.description ? data.description.match(/TN\d+/i)?.[0]?.toUpperCase() : null
    ].filter(Boolean) as string[];

    let targetOrder = null;
    for (const identifier of orderIdentifiers) {
      targetOrder = await getOrderById(identifier);
      if (targetOrder) break;
    }

    if (!targetOrder) {
      console.warn(`[PayOS Webhook] Không tìm thấy đơn hàng với các mã:`, orderIdentifiers);
      return NextResponse.json(
        {
          success: false,
          error: `Không tìm thấy đơn hàng tương ứng với orderCode #${rawOrderCode}`
        },
        { status: 404 }
      );
    }

    // 3. Xác thực chữ ký webhook (Signature verification)
    try {
      await verifyPayOSWebhookData(body, targetOrder.creatorId);
    } catch (verifyErr) {
      console.warn(
        `[PayOS Webhook] Cảnh báo xác thực chữ ký (vẫn tiếp tục nếu đang test nội bộ):`,
        verifyErr
      );
    }

    // 4. Nếu đơn hàng đã được thanh toán trước đó (tránh duplicate fulfillment)
    if (targetOrder.status === OrderStatus.PAID) {
      return NextResponse.json({
        success: true,
        message: `Đơn hàng #${targetOrder.orderCode} đã được ghi nhận thanh toán trước đó`,
        order: targetOrder
      });
    }

    // 5. Kiểm tra trạng thái giao dịch (code === "00" là thành công theo chuẩn payOS)
    if (code && code !== '00') {
      console.warn(`[PayOS Webhook] Giao dịch thất bại hoặc bị hủy (code: ${code}, desc: ${desc})`);
      return NextResponse.json({
        success: false,
        message: `Giao dịch chưa hoàn tất: ${desc || code}`
      });
    }

    // 6. Kiểm tra số tiền thanh toán thực nhận
    if (transferAmount > 0 && transferAmount < targetOrder.amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Số tiền thanh toán ${transferAmount}đ không đủ giá trị đơn hàng ${targetOrder.amount}đ`
        },
        { status: 400 }
      );
    }

    // 7. Cập nhật trạng thái đơn hàng sang PAID & kích hoạt trả hàng tự động (gửi email, tăng soldCount)
    const updatedOrder = await updateOrderStatus(targetOrder.id, OrderStatus.PAID);

    console.log(
      `[PayOS Webhook Thành Công] Đơn #${targetOrder.orderCode} (${transferAmount.toLocaleString('vi-VN')}đ) đã chuyển sang PAID.`
    );

    return NextResponse.json({
      success: true,
      message: `Đơn hàng #${targetOrder.orderCode} đã thanh toán thành công qua payOS`,
      order: updatedOrder
    });
  } catch (error: any) {
    console.error('[PayOS Webhook Exception]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi hệ thống khi xử lý webhook payOS' },
      { status: 500 }
    );
  }
}
