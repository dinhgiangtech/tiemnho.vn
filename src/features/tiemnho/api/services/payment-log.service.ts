import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type PaymentEventType =
  | 'LINK_CREATED'
  | 'FALLBACK_TRIGGERED'
  | 'BUYER_CONFIRMED'
  | 'WEBHOOK_SUCCESS'
  | 'WEBHOOK_MISMATCH'
  | 'WEBHOOK_DUPLICATE'
  | 'ORDER_NOT_FOUND'
  | 'INVALID_SIGNATURE'
  | 'MANUAL_APPROVED'
  | 'EMAIL_SENT'
  | 'EMAIL_FAILED'
  | 'CONFIG_CHANGED';

export type PaymentGatewayType =
  | 'PAYOS'
  | 'MANUAL_VIETQR'
  | 'MANUAL_TELEGRAM'
  | 'MANUAL_CREATOR'
  | 'RESEND'
  | 'FREE_LEAD';

export type PaymentLogStatus = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface CreatePaymentLogParams {
  creatorId?: string | null;
  orderId?: string | null;
  orderCode?: string | null;
  eventType: PaymentEventType;
  gateway?: PaymentGatewayType | string | null;
  transactionId?: string | null;
  transferAmount?: number;
  transferContent?: string | null;
  status: PaymentLogStatus;
  message?: string | null;
  rawPayload?: any;
}

/**
 * Ghi lại nhật ký thanh toán an toàn, không làm ngắt quãng luồng chính nếu có lỗi DB
 */
export async function createPaymentLog(params: CreatePaymentLogParams) {
  try {
    return await prisma.paymentLog.create({
      data: {
        creatorId: params.creatorId,
        orderId: params.orderId,
        orderCode: params.orderCode,
        eventType: params.eventType,
        gateway: params.gateway,
        transactionId: params.transactionId,
        transferAmount: Math.round(params.transferAmount || 0),
        transferContent: params.transferContent,
        status: params.status,
        message: params.message,
        rawPayload: params.rawPayload ? (params.rawPayload as Prisma.InputJsonValue) : undefined
      }
    });
  } catch (err) {
    console.error('[PaymentLog Error]: Không thể ghi log thanh toán:', err);
    return null;
  }
}

/**
 * Lấy danh sách Payment Logs (Dành cho Admin hoặc Creator xem theo tiệm)
 */
export async function getPaymentLogs(query?: {
  creatorId?: string;
  orderCode?: string;
  eventType?: string;
  status?: string;
  limit?: number;
}) {
  const whereClause: Prisma.PaymentLogWhereInput = {};

  if (query?.creatorId) whereClause.creatorId = query.creatorId;
  if (query?.orderCode) whereClause.orderCode = { contains: query.orderCode, mode: 'insensitive' };
  if (query?.eventType && query.eventType !== 'ALL') whereClause.eventType = query.eventType;
  if (query?.status && query.status !== 'ALL') whereClause.status = query.status;

  return prisma.paymentLog.findMany({
    where: whereClause,
    take: query?.limit || 100,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { displayName: true, username: true, email: true } },
      order: { select: { productTitle: true, amount: true, status: true } }
    }
  });
}
