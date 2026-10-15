import { NextRequest, NextResponse } from 'next/server';
import { fakeTiemNhoDb } from '@/constants/mock-tiemnho';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both payOS and SePay payload formats
    // payOS: { code: '00', desc: 'success', data: { orderCode: 10823, amount: 149000, ... } }
    // SePay: { gateway: 'MBBank', content: 'TN10823', transferAmount: 149000, ... }
    let orderCode = '';
    let amount = 0;

    if (body.data?.orderCode) {
      orderCode = `TN${body.data.orderCode}`;
      amount = Number(body.data.amount || 0);
    } else if (body.content) {
      const match = String(body.content).match(/TN\d+/i);
      orderCode = match ? match[0].toUpperCase() : '';
      amount = Number(body.transferAmount || 0);
    } else if (body.orderCode) {
      orderCode = String(body.orderCode);
      amount = Number(body.amount || 0);
    }

    if (!orderCode) {
      return NextResponse.json({ error: 'Không tìm thấy mã đơn hàng TN...' }, { status: 400 });
    }

    const order = await fakeTiemNhoDb.getOrderById(orderCode);
    if (!order) {
      return NextResponse.json({ error: `Đơn hàng ${orderCode} không tồn tại` }, { status: 404 });
    }

    // Check amount
    if (amount > 0 && amount < order.amount) {
      return NextResponse.json(
        { error: `Số tiền chuyển ${amount}đ nhỏ hơn giá trị đơn hàng ${order.amount}đ` },
        { status: 400 }
      );
    }

    // Update order status to PAID
    const updated = await fakeTiemNhoDb.updateOrderStatus(order.id, 'PAID');

    return NextResponse.json({
      success: true,
      message: `Đơn hàng ${orderCode} đã được thanh toán thành công qua VietQR`,
      order: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý webhook' }, { status: 500 });
  }
}
