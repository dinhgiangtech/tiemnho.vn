'use server';

import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { getSession } from '@/lib/auth';
import { PaymentProvider, type PaymentConfig } from '@/constants/mock-tiemnho';
import { formatPaymentConfig } from './formatters';

/**
 * Lấy cấu hình thanh toán theo người dùng (Multi-tenant)
 * - Nếu truyền userIdOrUsername: tìm theo userId hoặc username của Creator
 * - Nếu không truyền: tự động lấy theo session của Creator đang đăng nhập
 * - Fallback: lấy bản ghi đầu tiên nếu chưa đăng nhập (dành cho demo / preview)
 */
export async function getPaymentConfig(userIdOrUsername?: string): Promise<PaymentConfig> {
  await ensureDatabaseSeeded();

  let targetUserId: string | null = null;

  if (userIdOrUsername) {
    // 1. Kiểm tra xem có phải là userId trực tiếp
    const userById = await prisma.user.findUnique({
      where: { id: userIdOrUsername }
    });
    if (userById) {
      targetUserId = userById.id;
    } else {
      // 2. Kiểm tra xem có phải là username của User
      const cleanUsername = userIdOrUsername.replace(/^@/, '');
      const userByUsername = await prisma.user.findUnique({
        where: { username: cleanUsername }
      });
      if (userByUsername) {
        targetUserId = userByUsername.id;
      }
    }
  } else {
    const session = await getSession();
    if (session?.userId) {
      targetUserId = session.userId;
    }
  }

  // Nếu xác định được user
  if (targetUserId) {
    let config = await prisma.paymentConfig.findUnique({
      where: { userId: targetUserId }
    });

    if (!config) {
      // Tự động khởi tạo PaymentConfig mặc định cho Creator này nếu chưa có
      config = await prisma.paymentConfig.create({
        data: {
          userId: targetUserId,
          bankBin: '970422',
          bankAccountNumber: '0988667788',
          bankAccountName: 'DINH VAN GIANG',
          bankId: 'MB',
          bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
          provider: PaymentProvider.PAYOS,
          isActive: true
        }
      });
    }

    return formatPaymentConfig(config);
  }

  // Fallback: Tìm bản ghi đầu tiên trong hệ thống
  let fallbackConfig = await prisma.paymentConfig.findFirst();
  if (!fallbackConfig) {
    await ensureDatabaseSeeded();
    fallbackConfig = await prisma.paymentConfig.findFirst();
  }

  if (!fallbackConfig) {
    throw new Error('Payment config could not be found.');
  }

  return formatPaymentConfig(fallbackConfig);
}

/**
 * Cập nhật cấu hình thanh toán của Creator hiện tại (Multi-tenant)
 */
export async function updatePaymentConfig(
  updates: Partial<PaymentConfig>,
  targetUserId?: string
): Promise<PaymentConfig> {
  const session = await getSession();
  const userId = targetUserId || session?.userId;

  if (!userId) {
    // Fallback: cập nhật bản ghi đầu tiên nếu không có session
    const current = await prisma.paymentConfig.findFirst();
    if (!current) throw new Error('Không tìm thấy cấu hình thanh toán');

    const updated = await prisma.paymentConfig.update({
      where: { id: current.id },
      data: {
        ...(updates.bankBin !== undefined && { bankBin: updates.bankBin }),
        ...((updates.bankAccountNumber !== undefined || updates.accountNumber !== undefined) && {
          bankAccountNumber: updates.bankAccountNumber || updates.accountNumber
        }),
        ...((updates.bankAccountName !== undefined || updates.accountName !== undefined) && {
          bankAccountName: updates.bankAccountName || updates.accountName
        }),
        ...(updates.bankId !== undefined && { bankId: updates.bankId }),
        ...(updates.bankName !== undefined && { bankName: updates.bankName }),
        ...(updates.provider !== undefined && { provider: updates.provider as PaymentProvider }),
        ...(updates.clientId !== undefined && { clientId: updates.clientId }),
        ...(updates.apiKey !== undefined && { apiKey: updates.apiKey }),
        ...(updates.checksumKey !== undefined && { checksumKey: updates.checksumKey }),
        ...(updates.webhookUrl !== undefined && { webhookUrl: updates.webhookUrl }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        ...(updates.lastPingTestAt !== undefined && {
          lastPingTestAt: new Date(updates.lastPingTestAt)
        })
      }
    });
    return formatPaymentConfig(updated);
  }

  const updated = await prisma.paymentConfig.upsert({
    where: { userId },
    create: {
      userId,
      bankBin: updates.bankBin || '970422',
      bankAccountNumber: updates.bankAccountNumber || updates.accountNumber || '0988667788',
      bankAccountName: updates.bankAccountName || updates.accountName || 'DINH VAN GIANG',
      bankId: updates.bankId || 'MB',
      bankName: updates.bankName || 'Ngân hàng TMCP Quân Đội (MB Bank)',
      provider: (updates.provider as PaymentProvider) || PaymentProvider.PAYOS,
      clientId: updates.clientId,
      apiKey: updates.apiKey,
      checksumKey: updates.checksumKey,
      webhookUrl: updates.webhookUrl,
      isActive: updates.isActive ?? true
    },
    update: {
      ...(updates.bankBin !== undefined && { bankBin: updates.bankBin }),
      ...((updates.bankAccountNumber !== undefined || updates.accountNumber !== undefined) && {
        bankAccountNumber: updates.bankAccountNumber || updates.accountNumber
      }),
      ...((updates.bankAccountName !== undefined || updates.accountName !== undefined) && {
        bankAccountName: updates.bankAccountName || updates.accountName
      }),
      ...(updates.bankId !== undefined && { bankId: updates.bankId }),
      ...(updates.bankName !== undefined && { bankName: updates.bankName }),
      ...(updates.provider !== undefined && { provider: updates.provider as PaymentProvider }),
      ...(updates.clientId !== undefined && { clientId: updates.clientId }),
      ...(updates.apiKey !== undefined && { apiKey: updates.apiKey }),
      ...(updates.checksumKey !== undefined && { checksumKey: updates.checksumKey }),
      ...(updates.webhookUrl !== undefined && { webhookUrl: updates.webhookUrl }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      ...(updates.lastPingTestAt !== undefined && {
        lastPingTestAt: new Date(updates.lastPingTestAt)
      })
    }
  });

  return formatPaymentConfig(updated);
}

/**
 * Kiểm tra kết nối giả lập (Ping test)
 */
export async function pingTest(targetUserId?: string) {
  const config = await getPaymentConfig(targetUserId);
  const testCode = `TN${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();

  if (config.id) {
    await prisma.paymentConfig.update({
      where: { id: config.id },
      data: { lastPingTestAt: now }
    });
  }

  return {
    success: true,
    message: `Kết nối thành công! Nhận biến động số dư 10.000đ từ cổng ${config.provider} vào tài khoản ${config.accountNumber}.`,
    simulatedOrderCode: testCode,
    amount: 10000,
    time: now.toISOString()
  };
}
