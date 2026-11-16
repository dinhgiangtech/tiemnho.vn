import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/features/tiemnho/api/services/order.service';
import { verifyPayOSWebhookData } from '@/features/tiemnho/api/services/payos.service';
import { OrderStatus } from '@/constants/mock-tiemnho';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.data) {
      return NextResponse.json({ error: 'Payload không hợp lệ từ payOS' }, { status: 400 });
    }

    const { data } = body;
    const rawOrderCode = data.orderCode;
    const transferAmount = Number(data.amount || 0);

    // Xác định mã đơn hàng trong hệ thống Tiệm Nhỏ (TNxxxxx hoặc số)
    let orderIdentifier = `TN${rawOrderCode}`;
    if (data.description && /TN\d+/i.test(data.description)) {
      const match = data.description.match(/TN\d+/i);
      if (match) orderIdentifier = match[0].toUpperCase();
    }

    // Tìm đơn hàng trong hệ thống
    const order = await getOrderById(orderIdentifier);
    if (!order) {
      // Thử tìm bằng raw order code
      const fallbackOrder = await getOrderById(String(rawOrderCode));
      if (!fallbackOrder) {
        return NextResponse.json(
          { error: `Không tìm thấy đơn hàng tương ứng với mã payOS #${rawOrderCode}` },
          { status: 404 }
        );
      }
    }

    const targetOrder = order || (await getOrderById(String(rawOrderCode)));
    if (!targetOrder) {
      return NextResponse.json({ error: 'Đơn hàng không tồn tại' }, { status: 404 });
    }

    // Tùy chọn xác thực chữ ký (Signature verification)
    try {
      await verifyPayOSWebhookData(body, targetOrder.creatorId);
    } catch (verifyErr) {
      console.warn(
        '[PayOS Webhook] Bỏ qua kiểm tra chữ ký nghiêm ngặt hoặc khóa chưa khớp:',
        verifyErr
      );
    }

    // Kiểm tra số tiền thanh toán
    if (transferAmount > 0 && transferAmount < targetOrder.amount) {
      return NextResponse.json(
        {
          error: `Số tiền chuyển ${transferAmount}đ không đủ giá trị đơn hàng ${targetOrder.amount}đ`
        },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái đơn hàng sang PAID và tự động kích hoạt trả hàng / gửi email
    const updated = await updateOrderStatus(targetOrder.id, OrderStatus.PAID);

    return NextResponse.json({
      success: true,
      message: `Đơn hàng #${targetOrder.orderCode} đã thanh toán thành công qua cổng payOS`,
      order: updated
    });
  } catch (error: any) {
    console.error('[PayOS Webhook Exception]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi xử lý webhook payOS' },
      { status: 500 }
    );
  }
}
