import { prisma } from './prisma';

export async function ensureDatabaseSeeded() {
  try {
    const existing = await prisma.paymentConfig.findFirst();
    if (existing) return;

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@tiemnho.vn',
          name: 'Đinh Văn Giang',
          username: 'tiemnho',
          avatarUrl: '/default-avatar.svg'
        }
      });
    }

    await prisma.paymentConfig.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bankBin: '970422',
        bankAccountNumber: '0988667788',
        bankAccountName: 'DINH VAN GIANG',
        bankId: 'MB',
        bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
        provider: 'PAYOS',
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
