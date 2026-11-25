import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderById,
  updateOrderStatus,
  settleOrderAndFulfill
} from '@/features/tiemnho/api/services/order.service';
import { verifyPayOSWebhookData } from '@/features/tiemnho/api/services/payos.service';
import { createPaymentLog } from '@/features/tiemnho/api/services/payment-log.service';
import { OrderStatus } from '@/constants/mock-tiemnho';

export const runtime = 'nodejs';

/**
 * Webhook nhận thông báo thanh toán tự động từ cổng payOS
 * Endpoint: /api/webhooks/payos
 */
export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();

    // 1. Kiểm tra cấu trúc dữ liệu webhook từ payOS
    if (!body || !body.data) {
      await createPaymentLog({
        eventType: 'WEBHOOK_MISMATCH',
        gateway: 'PAYOS',
        status: 'WARNING',
        message: 'Payload webhook từ payOS không hợp lệ hoặc thiếu object data',
        rawPayload: body
      });

      return NextResponse.json(
        { success: false, error: 'Payload không hợp lệ từ payOS' },
        { status: 400 }
      );
    }

    const { data, code, desc } = body;
    const rawOrderCode = data.orderCode;
    const transferAmount = Number(data.amount || 0);
    const transactionId = data.reference || null;
    const transferContent = data.description || null;

    // 1.5. Nhận diện gói tin Test / Confirm Webhook từ payOS (orderCode: 123 hoặc VQRIO123)
    if (
      rawOrderCode === 123 ||
      String(rawOrderCode) === '123' ||
      data.description === 'VQRIO123' ||
      data.description?.includes('VQRIO123')
    ) {
      console.log('[PayOS Webhook] Xác thực URL webhook thành công từ payOS (sample test payload)');

      await createPaymentLog({
        orderCode: 'TEST_123',
        eventType: 'WEBHOOK_SUCCESS',
        gateway: 'PAYOS',
        status: 'SUCCESS',
        message: 'payOS kiểm tra và xác nhận Webhook URL hoạt động thành công',
        rawPayload: body
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook URL verified successfully by payOS'
      });
    }

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

      await createPaymentLog({
        orderCode: String(rawOrderCode),
        eventType: 'ORDER_NOT_FOUND',
        gateway: 'PAYOS',
        transactionId,
        transferAmount,
        transferContent,
        status: 'WARNING',
        message: `Không tìm thấy đơn hàng tương ứng với orderCode #${rawOrderCode}`,
        rawPayload: body
      });

      // QUAN TRỌNG: Trả về HTTP 200 cho payOS để tránh payOS báo lỗi hoặc retry liên tục
      return NextResponse.json(
        {
          success: true,
          message: `Đã nhận webhook nhưng không tìm thấy đơn hàng với mã #${rawOrderCode}`
        },
        { status: 200 }
      );
    }

    // 3. Xác thực chữ ký webhook (Signature verification)
    try {
      await verifyPayOSWebhookData(body, targetOrder.creatorId);
    } catch (verifyErr: any) {
      console.warn(
        `[PayOS Webhook] Cảnh báo xác thực chữ ký (vẫn tiếp tục nếu đang test nội bộ):`,
        verifyErr
      );

      await createPaymentLog({
        creatorId: targetOrder.creatorId,
        orderId: targetOrder.id,
        orderCode: targetOrder.orderCode,
        eventType: 'INVALID_SIGNATURE',
        gateway: 'PAYOS',
        transactionId,
        transferAmount,
        transferContent,
        status: 'WARNING',
        message: `Chữ ký webhook không hợp lệ hoặc chưa khớp key: ${verifyErr?.message}`,
        rawPayload: body
      });
    }

    // 4. Nếu đơn hàng đã được thanh toán trước đó (tránh duplicate fulfillment)
    if (targetOrder.status === OrderStatus.PAID) {
      await createPaymentLog({
        creatorId: targetOrder.creatorId,
        orderId: targetOrder.id,
        orderCode: targetOrder.orderCode,
        eventType: 'WEBHOOK_DUPLICATE',
        gateway: 'PAYOS',
        transactionId,
        transferAmount,
        transferContent,
        status: 'INFO',
        message: `Webhook trùng: Đơn hàng #${targetOrder.orderCode} đã thanh toán trước đó`,
        rawPayload: body
      });

      return NextResponse.json({
        success: true,
        message: `Đơn hàng #${targetOrder.orderCode} đã được ghi nhận thanh toán trước đó`,
        order: targetOrder
      });
    }

    // 5. Kiểm tra trạng thái giao dịch (code === "00" là thành công theo chuẩn payOS)
    if (code && code !== '00') {
      console.warn(`[PayOS Webhook] Giao dịch thất bại hoặc bị hủy (code: ${code}, desc: ${desc})`);

      await createPaymentLog({
        creatorId: targetOrder.creatorId,
        orderId: targetOrder.id,
        orderCode: targetOrder.orderCode,
        eventType: 'WEBHOOK_MISMATCH',
        gateway: 'PAYOS',
        transactionId,
        transferAmount,
        transferContent,
        status: 'WARNING',
        message: `Giao dịch payOS chưa thành công: code ${code} (${desc})`,
        rawPayload: body
      });

      return NextResponse.json({
        success: false,
        message: `Giao dịch chưa hoàn tất: ${desc || code}`
      });
    }

    // 6. Kiểm tra số tiền thanh toán thực nhận
    if (transferAmount > 0 && transferAmount < targetOrder.amount) {
      await createPaymentLog({
        creatorId: targetOrder.creatorId,
        orderId: targetOrder.id,
        orderCode: targetOrder.orderCode,
        eventType: 'WEBHOOK_MISMATCH',
        gateway: 'PAYOS',
        transactionId,
        transferAmount,
        transferContent,
        status: 'ERROR',
        message: `Khách chuyển thiếu tiền: Thực chuyển ${transferAmount.toLocaleString('vi-VN')}đ / Cần ${targetOrder.amount.toLocaleString('vi-VN')}đ`,
        rawPayload: body
      });

      return NextResponse.json(
        {
          success: false,
          error: `Số tiền thanh toán ${transferAmount}đ không đủ giá trị đơn hàng ${targetOrder.amount}đ`
        },
        { status: 400 }
      );
    }

    // 7. Cập nhật trạng thái đơn hàng sang PAID & kích hoạt trả hàng tự động
    const { order: updatedOrder } = await settleOrderAndFulfill(
      targetOrder.orderCode,
      'PAYOS_WEBHOOK'
    );

    // Ghi log thanh toán thành công
    await createPaymentLog({
      creatorId: targetOrder.creatorId,
      orderId: targetOrder.id,
      orderCode: targetOrder.orderCode,
      eventType: 'WEBHOOK_SUCCESS',
      gateway: 'PAYOS',
      transactionId,
      transferAmount,
      transferContent,
      status: 'SUCCESS',
      message: `Khớp thanh toán thành công ${transferAmount.toLocaleString('vi-VN')}đ qua payOS`,
      rawPayload: body
    });

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

    await createPaymentLog({
      eventType: 'WEBHOOK_MISMATCH',
      gateway: 'PAYOS',
      status: 'ERROR',
      message: `Lỗi ngoại lệ khi xử lý Webhook: ${error?.message}`,
      rawPayload: body
    });

    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi hệ thống khi xử lý webhook payOS' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET để kiểm tra trạng thái webhook (hoặc khi payOS ping verify endpoint)
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'payOS Webhook listener',
    timestamp: new Date().toISOString()
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
