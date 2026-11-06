import { prisma } from './prisma';

export async function ensureDatabaseSeeded() {
  try {
    // 1. Payment Config (default)
    await prisma.paymentConfig.upsert({
      where: { id: 'default-payment' },
      update: {},
      create: {
        id: 'default-payment',
        bankId: 'MB',
        bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
        accountNumber: '0988667788',
        accountName: 'DINH VAN GIANG',
        provider: 'payOS',
        apiKey: 'pos_live_3992019488bfa0',
        checksumKey: 'cs_88302019bcae8841',
        webhookUrl: 'https://tiemnho.vn/api/webhooks/vietqr',
        isActive: true,
        lastPingTestAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}
