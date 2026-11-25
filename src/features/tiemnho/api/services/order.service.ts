'use server';

import { prisma } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/utils';
import { createPaymentLog } from './payment-log.service';
import { ensureDatabaseSeeded } from '@/lib/seed';
import {
  ProductType,
  OrderStatus,
  ShippingStatus,
  PaymentMethod,
  LeadSourceType
} from '@/constants/mock-tiemnho';
import type { Order } from '@/constants/mock-tiemnho';
import type { OrderFilterParams, CreateOrderInput } from '../types';
import { formatOrder } from './formatters';
import { sendOrderFulfillmentEmail } from './email.service';
import { createPayOSPaymentLink } from './payos.service';
import { getPaymentConfig } from './payment.service';

export async function getOrders(filters?: OrderFilterParams): Promise<Order[]> {
  await ensureDatabaseSeeded();

  const whereClause: Record<string, unknown> = {};

  if (filters?.status && filters.status !== 'ALL') {
    whereClause.status = filters.status as OrderStatus;
  }

  if (filters?.type && filters.type !== 'ALL') {
    whereClause.productType = filters.type as ProductType;
  }

  if (filters?.userId) {
    whereClause.userId = filters.userId;
  }

  if (filters?.creatorId) {
    whereClause.creatorId = filters.creatorId;
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim();
    whereClause.OR = [
      { customerName: { contains: s, mode: 'insensitive' } },
      { orderCode: { contains: s, mode: 'insensitive' } },
      { customerPhone: { contains: s, mode: 'insensitive' } },
      { customerEmail: { contains: s, mode: 'insensitive' } }
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  return orders.map(formatOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  await ensureDatabaseSeeded();
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderCode: id }]
    }
  });
  return order ? formatOrder(order) : null;
}

export async function createOrder(data: CreateOrderInput): Promise<Order> {
  await ensureDatabaseSeeded();
  const product = await prisma.product.findUnique({
    where: { id: data.productId }
  });

  if (!product) {
    throw new Error(`Product not found: ${data.productId}`);
  }

  const isFree = product.price === 0 || product.type === ProductType.LEAD_MAGNET;
  const orderCodeNumber = Math.floor(100000 + Math.random() * 900000);
  const orderCode = `TN${orderCodeNumber}`;

  let paymentMethod = 'PAYOS';
  let payosCheckoutUrl: string | undefined;
  let payosQrCode: string | undefined;
  let payosPaymentLinkId: string | undefined;
  let payosAccountNumber: string | undefined;
  let payosAccountName: string | undefined;
  let payosBin: string | undefined;

  if (!isFree) {
    try {
      // Kiểm tra Creator có bật công tắc PayOS và cấu hình hợp lệ không
      const creatorConfig = await getPaymentConfig(product.creatorId);
      const isPayosEnabled = creatorConfig?.isPayosEnabled ?? false;
      const hasPayOSConfig =
        isPayosEnabled &&
        Boolean(creatorConfig?.clientId && creatorConfig?.apiKey && creatorConfig?.checksumKey);

      if (hasPayOSConfig) {
        const payosResult = await createPayOSPaymentLink({
          orderCodeNumber,
          orderCodeString: orderCode,
          amount: product.price,
          productTitle: product.title,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          creatorId: product.creatorId
        });

        if (payosResult.success) {
          paymentMethod = 'PAYOS';
          payosCheckoutUrl = payosResult.checkoutUrl;
          payosQrCode = payosResult.qrCode;
          payosPaymentLinkId = payosResult.paymentLinkId;
          payosAccountNumber = payosResult.accountNumber;
          payosAccountName = payosResult.accountName;
          payosBin = payosResult.bin;

          // Ghi log tạo link payOS thành công
          await createPaymentLog({
            creatorId: product.creatorId,
            orderCode,
            eventType: 'LINK_CREATED',
            gateway: 'PAYOS',
            transactionId: payosResult.paymentLinkId,
            transferAmount: product.price,
            status: 'INFO',
            message: `Tạo link thanh toán payOS thành công cho đơn #${orderCode}`,
            rawPayload: { checkoutUrl: payosCheckoutUrl, paymentLinkId: payosPaymentLinkId }
          });
        } else {
          // Fallback nếu gọi payOS thất bại
          paymentMethod = 'MANUAL_VIETQR';

          await createPaymentLog({
            creatorId: product.creatorId,
            orderCode,
            eventType: 'FALLBACK_TRIGGERED',
            gateway: 'MANUAL_VIETQR',
            transferAmount: product.price,
            status: 'WARNING',
            message: `payOS trả về lỗi (${payosResult.error}), kích hoạt fallback sang VietQR tĩnh`,
            rawPayload: payosResult
          });
        }
      } else {
        // Creator chưa cấu hình PayOS -> Tự động chuyển fallback sang MANUAL_VIETQR
        paymentMethod = 'MANUAL_VIETQR';
      }
    } catch (err: any) {
      console.warn(
        '[Payment Hybrid] Lỗi tạo link PayOS, tự động fallback sang MANUAL_VIETQR:',
        err
      );
      paymentMethod = 'MANUAL_VIETQR';

      await createPaymentLog({
        creatorId: product.creatorId,
        orderCode,
        eventType: 'FALLBACK_TRIGGERED',
        gateway: 'MANUAL_VIETQR',
        transferAmount: product.price,
        status: 'WARNING',
        message: `Lỗi ngoại lệ payOS (${err?.message}), tự động fallback sang VietQR tĩnh`
      });
    }
  }

  // Xác định userId của Creator sở hữu đơn hàng
  const creatorUserId = product.userId || product.creatorId;

  const createdOrder = await prisma.order.create({
    data: {
      orderCode,
      userId: creatorUserId,
      creatorId: product.creatorId,
      productId: product.id,
      productTitle: product.title,
      productType: product.type,
      amount: product.price,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress,
      customerNote: data.customerNote,
      status: isFree ? OrderStatus.PAID : OrderStatus.PENDING,
      shippingStatus:
        product.type === ProductType.PHYSICAL ? ShippingStatus.UNFULFILLED : undefined,
      paymentMethod,
      paidAt: isFree ? new Date() : undefined,
      downloadUrl: isFree && product.fileUrl ? product.fileUrl : undefined,
      checkoutUrl: payosCheckoutUrl,
      qrCode: payosQrCode,
      paymentLinkId: payosPaymentLinkId,
      accountNumber: payosAccountNumber,
      accountName: payosAccountName,
      bin: payosBin
    } as any
  });

  // Increment sold count if free
  if (isFree) {
    await prisma.product.update({
      where: { id: product.id },
      data: { soldCount: { increment: 1 } }
    });
  }

  // Upsert lead
  const existingLead = await prisma.lead.findFirst({
    where: { email: data.customerEmail }
  });

  if (existingLead) {
    await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        ordersCount: { increment: 1 },
        totalSpent: { increment: product.price },
        sourceProduct: product.title
      }
    });
  } else {
    await prisma.lead.create({
      data: {
        creatorId: product.creatorId,
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        sourceProduct: product.title,
        sourceType:
          product.type === ProductType.LEAD_MAGNET
            ? LeadSourceType.LEAD_MAGNET
            : LeadSourceType.PURCHASE,
        totalSpent: product.price,
        ordersCount: 1
      }
    });
  }

  const formatted = formatOrder(createdOrder);

  // Tự động gửi email giao tài liệu cho đơn hàng miễn phí (0đ / Lead Magnet)
  if (isFree && data.customerEmail) {
    try {
      await sendOrderFulfillmentEmail(formatted);
    } catch (err) {
      console.warn('[Resend] Lỗi gửi email cho đơn hàng miễn phí:', err);
    }
  }

  return formatted;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  shippingStatus?: ShippingStatus
): Promise<Order> {
  const current = await getOrderById(id);
  if (!current) throw new Error(`Order ${id} not found`);

  const shouldMarkPaid = status === OrderStatus.PAID && current.status !== OrderStatus.PAID;

  let productFileUrl: string | undefined = undefined;
  if (shouldMarkPaid && current.productId) {
    const product = await prisma.product
      .update({
        where: { id: current.productId },
        data: { soldCount: { increment: 1 } }
      })
      .catch(() => null);

    if (product?.fileUrl) {
      productFileUrl = product.fileUrl;
    }
  }

  const updated = await prisma.order.update({
    where: { id: current.id },
    data: {
      status,
      ...(shippingStatus && { shippingStatus }),
      ...(shouldMarkPaid && {
        paidAt: new Date(),
        ...(productFileUrl && !current.downloadUrl && { downloadUrl: productFileUrl })
      })
    }
  });

  // Tự động kích hoạt gửi email bàn giao qua Resend
  if (shouldMarkPaid) {
    try {
      const formattedUpdated = formatOrder(updated);
      await sendOrderFulfillmentEmail(formattedUpdated, {
        downloadUrl: formattedUpdated.downloadUrl || productFileUrl
      });
    } catch (err) {
      console.warn('[Resend] Lỗi gửi email tự động khi cập nhật trạng thái đơn hàng:', err);
    }
  }

  return formatOrder(updated);
}

export async function manualActivateOrder(
  id: string,
  requesterCreatorId?: string
): Promise<{
  order: Order;
  grant?: { token: string; expiresAt: Date; maxDownloads: number };
}> {
  return settleOrderAndFulfill(id, 'MANUAL_CREATOR', requesterCreatorId);
}

/**
 * Hàm gạch nợ lõi dùng chung (settleOrderAndFulfill)
 * Hỗ trợ các nguồn duyệt: "MANUAL_CREATOR" | "MANUAL_TELEGRAM" | "PAYOS_WEBHOOK" | "SEPAY_WEBHOOK"
 */
export async function settleOrderAndFulfill(
  idOrOrderCode: string,
  gateway: string = 'MANUAL_TELEGRAM',
  requesterCreatorId?: string
): Promise<{
  order: Order;
  grant?: { token: string; expiresAt: Date; maxDownloads: number };
}> {
  await ensureDatabaseSeeded();

  const current = await prisma.order.findFirst({
    where: {
      OR: [{ id: idOrOrderCode }, { orderCode: idOrOrderCode }]
    },
    include: {
      product: true
    }
  });

  if (!current) {
    throw new Error(`Đơn hàng ${idOrOrderCode} không tồn tại`);
  }

  // Idempotent check: Nếu đơn đã thanh toán rồi thì trả về kết quả hiện tại
  if (current.status === OrderStatus.PAID) {
    return {
      order: formatOrder(current)
    };
  }

  // 1. Kiểm tra quyền sở hữu nếu là Creator thao tác thủ công
  if (requesterCreatorId) {
    const isOwner =
      (current.userId && current.userId === requesterCreatorId) ||
      (current.creatorId && current.creatorId === requesterCreatorId);

    if (!isOwner) {
      throw new Error('Bạn không có quyền kích hoạt đơn hàng của Creator khác');
    }
  }

  const now = new Date();

  // 2. Chuẩn bị token và grant nếu là sản phẩm số (DownloadGrant: token bảo mật, hạn dùng 72h, max 5 downloads)
  let downloadGrant: { token: string; expiresAt: Date; maxDownloads: number } | undefined;
  let resolvedDownloadUrl = current.downloadUrl || current.product?.fileUrl;

  if (current.productType === ProductType.DIGITAL) {
    const grantToken = `gr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
    downloadGrant = {
      token: grantToken,
      expiresAt,
      maxDownloads: 5
    };

    const baseUrl = getAppBaseUrl();
    const productFile =
      current.product?.fileUrl || current.downloadUrl || `${baseUrl}/files/sample`;
    resolvedDownloadUrl = `${baseUrl}/download/${grantToken}?file=${encodeURIComponent(productFile)}`;
  }

  // 3. Thực thi cập nhật giao dịch
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // a. Cập nhật Order -> PAID
    const orderUpdated = await tx.order.update({
      where: { id: current.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: now,
        downloadUrl: resolvedDownloadUrl,
        shippingStatus:
          current.productType === ProductType.PHYSICAL
            ? ShippingStatus.UNFULFILLED
            : current.shippingStatus
      }
    });

    // b. Tăng số lượng đã bán của sản phẩm
    if (current.productId) {
      await tx.product
        .update({
          where: { id: current.productId },
          data: { soldCount: { increment: 1 } }
        })
        .catch(() => null);
    }

    // c. Cập nhật thống kê khách hàng (Lead)
    if (current.customerEmail) {
      const existingLead = await tx.lead.findFirst({
        where: { email: current.customerEmail }
      });

      if (existingLead) {
        await tx.lead.update({
          where: { id: existingLead.id },
          data: {
            ordersCount: { increment: 1 },
            totalSpent: { increment: current.amount },
            sourceProduct: current.productTitle
          }
        });
      }
    }

    return orderUpdated;
  });

  // 4. Kích hoạt gửi email tự động qua Resend
  const formatted = formatOrder(updatedOrder);
  try {
    const emailRes = await sendOrderFulfillmentEmail(formatted, {
      downloadUrl: resolvedDownloadUrl || undefined,
      expiresHours: 72
    });

    await createPaymentLog({
      creatorId: current.creatorId,
      orderId: current.id,
      orderCode: current.orderCode,
      eventType: emailRes.success ? 'EMAIL_SENT' : 'EMAIL_FAILED',
      gateway: 'RESEND',
      transactionId: emailRes.id,
      status: emailRes.success ? 'SUCCESS' : 'WARNING',
      message: emailRes.success
        ? `Đã gửi email đơn hàng và link tải tài liệu tới ${current.customerEmail}`
        : `Gửi email thất bại: ${emailRes.error}`,
      rawPayload: emailRes
    });
  } catch (err: any) {
    console.warn('[Resend] Lỗi gửi email kích hoạt:', err);
    await createPaymentLog({
      creatorId: current.creatorId,
      orderId: current.id,
      orderCode: current.orderCode,
      eventType: 'EMAIL_FAILED',
      gateway: 'RESEND',
      status: 'ERROR',
      message: `Ngoại lệ khi gọi Resend: ${err?.message}`
    });
  }

  // 4.5. Bắn thông báo đơn hàng đã thanh toán thành công về Telegram của Creator
  try {
    const { sendOrderPaidAlertToCreator } = await import('./telegram.service');
    await sendOrderPaidAlertToCreator(current.orderCode, gateway);
  } catch (teleErr) {
    console.warn('[Telegram Alert Failed]:', teleErr);
  }

  // 5. Ghi log hoàn tất thanh toán (PaymentLog)
  const isManual = gateway.includes('MANUAL') || gateway.includes('TELEGRAM');
  await createPaymentLog({
    creatorId: current.creatorId,
    orderId: current.id,
    orderCode: current.orderCode,
    eventType: isManual ? 'MANUAL_APPROVED' : 'WEBHOOK_SUCCESS',
    gateway,
    transferAmount: Math.round(current.amount),
    status: 'SUCCESS',
    message: isManual
      ? `Chủ tiệm duyệt thủ công đơn #${current.orderCode} qua ${gateway}`
      : `Đơn hàng #${current.orderCode} đã thanh toán thành công qua ${gateway}`
  });

  return {
    order: formatOrder(updatedOrder),
    grant: downloadGrant
  };
}
