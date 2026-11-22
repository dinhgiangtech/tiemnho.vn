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
      // Tìm thông tin creator để khởi tạo tên chủ tài khoản thật nếu có
      const creator = await prisma.user.findUnique({ where: { id: targetUserId } });
      const defaultName = (creator?.displayName || creator?.name || 'CHỦ TÀI KHOẢN').toUpperCase();

      config = await prisma.paymentConfig.create({
        data: {
          userId: targetUserId,
          bankBin: '',
          bankAccountNumber: '',
          bankAccountName: defaultName,
          bankId: 'MB',
          bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
          provider: PaymentProvider.PAYOS,
          isActive: false,
          isPayosEnabled: false
        }
      });
    }

    return formatPaymentConfig(config);
  }

  // Fallback: Lấy user đầu tiên trong hệ thống để tìm đúng paymentConfig của user đó
  const defaultUser = await prisma.user.findFirst();
  if (defaultUser) {
    const userConfig = await prisma.paymentConfig.findUnique({
      where: { userId: defaultUser.id }
    });
    if (userConfig) return formatPaymentConfig(userConfig);
  }

  let fallbackConfig = await prisma.paymentConfig.findFirst();

  if (!fallbackConfig) {
    // Trả về cấu hình trống an toàn thay vì crash
    return {
      bankId: 'MB',
      bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
      accountNumber: '',
      accountName: '',
      bankBin: '970422',
      bankAccountNumber: '',
      bankAccountName: '',
      provider: PaymentProvider.PAYOS,
      apiKey: '',
      checksumKey: '',
      webhookUrl: '',
      isActive: false
    };
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
  let userId = targetUserId || session?.userId;

  if (!userId) {
    const defaultUser = await prisma.user.findFirst();
    if (defaultUser) {
      userId = defaultUser.id;
    }
  }

  if (!userId) {
    // Fallback: cập nhật bản ghi đầu tiên nếu hoàn toàn không có user nào
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
        ...(updates.isPayosEnabled !== undefined && { isPayosEnabled: updates.isPayosEnabled }),
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
      bankBin: updates.bankBin || '',
      bankAccountNumber: updates.bankAccountNumber || updates.accountNumber || '',
      bankAccountName: updates.bankAccountName || updates.accountName || '',
      bankId: updates.bankId || 'MB',
      bankName: updates.bankName || 'Ngân hàng TMCP Quân Đội (MB Bank)',
      provider: (updates.provider as PaymentProvider) || PaymentProvider.PAYOS,
      clientId: updates.clientId || null,
      apiKey: updates.apiKey || null,
      checksumKey: updates.checksumKey || null,
      webhookUrl: updates.webhookUrl || null,
      isActive: updates.isActive ?? false,
      isPayosEnabled: updates.isPayosEnabled ?? false
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
      ...(updates.isPayosEnabled !== undefined && { isPayosEnabled: updates.isPayosEnabled }),
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
