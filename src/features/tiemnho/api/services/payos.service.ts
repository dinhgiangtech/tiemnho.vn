'use server';

import { PayOS } from '@payos/node';
import type { Webhook, WebhookData } from '@payos/node';
import { getPaymentConfig } from './payment.service';

export interface CreatePayOSLinkParams {
  orderCodeNumber: number;
  orderCodeString: string;
  amount: number;
  productTitle: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  creatorId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayOSLinkResult {
  success: boolean;
  checkoutUrl?: string;
  qrCode?: string;
  paymentLinkId?: string;
  orderCode?: number;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Khởi tạo client PayOS dựa trên cấu hình Creator hoặc biến môi trường hệ thống
 */
export async function getPayOSClient(creatorId?: string): Promise<{
  client: PayOS | null;
  config: Awaited<ReturnType<typeof getPaymentConfig>> | null;
}> {
  try {
    const config = await getPaymentConfig(creatorId);

    const clientId = config?.clientId || process.env.PAYOS_CLIENT_ID;
    const apiKey = config?.apiKey || process.env.PAYOS_API_KEY;
    const checksumKey = config?.checksumKey || process.env.PAYOS_CHECKSUM_KEY;

    if (!clientId || !apiKey || !checksumKey) {
      return { client: null, config };
    }

    const client = new PayOS({
      clientId,
      apiKey,
      checksumKey
    });

    return { client, config };
  } catch (error) {
    console.warn('[PayOS Client Init Warning]:', error);
    return { client: null, config: null };
  }
}

/**
 * Tạo link thanh toán payOS cho đơn hàng
 */
export async function createPayOSPaymentLink(
  params: CreatePayOSLinkParams
): Promise<PayOSLinkResult> {
  const {
    orderCodeNumber,
    orderCodeString,
    amount,
    productTitle,
    customerName,
    customerEmail,
    customerPhone,
    creatorId,
    returnUrl,
    cancelUrl
  } = params;

  const { client } = await getPayOSClient(creatorId);

  // Nếu chưa cấu hình đủ bộ 3 khóa PayOS, trả về simulated fallback để chuyển sang VietQR thường
  if (!client) {
    return {
      success: false,
      simulated: true,
      error: 'Chưa cấu hình đầy đủ thông tin API PayOS (clientId, apiKey, checksumKey).'
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tiemnho.vn';
  const effectiveReturnUrl = returnUrl || `${baseUrl}/orders/${orderCodeString}/success`;
  const effectiveCancelUrl = cancelUrl || `${baseUrl}/orders/${orderCodeString}/cancel`;

  try {
    const response = await client.paymentRequests.create({
      orderCode: orderCodeNumber,
      amount: Math.round(amount),
      description: orderCodeString.slice(0, 25),
      returnUrl: effectiveReturnUrl,
      cancelUrl: effectiveCancelUrl,
      items: [
        {
          name: productTitle.slice(0, 50),
          quantity: 1,
          price: Math.round(amount)
        }
      ],
      buyerName: customerName,
      buyerEmail: customerEmail,
      buyerPhone: customerPhone
    });

    return {
      success: true,
      checkoutUrl: response.checkoutUrl,
      qrCode: response.qrCode,
      paymentLinkId: response.paymentLinkId,
      orderCode: response.orderCode,
      accountNumber: response.accountNumber,
      accountName: response.accountName,
      bin: response.bin
    };
  } catch (error: any) {
    console.error('[PayOS CreatePaymentLink Error]:', error);
    return {
      success: false,
      error: error?.message || 'Lỗi khi gọi API tạo link thanh toán PayOS'
    };
  }
}

/**
 * Xác thực dữ liệu webhook từ payOS
 */
export async function verifyPayOSWebhookData(
  webhookBody: Webhook,
  creatorId?: string
): Promise<WebhookData | null> {
  const { client } = await getPayOSClient(creatorId);
  if (!client) {
    throw new Error('Chưa thiết lập PayOS client để xác thực chữ ký webhook');
  }

  return client.webhooks.verify(webhookBody);
}
