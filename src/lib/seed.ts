import { prisma } from './prisma';

export async function ensureDatabaseSeeded() {
  try {
    const profileCount = await prisma.creatorProfile.count();
    if (profileCount > 0) {
      return;
    }

    console.log('🌱 Creating initial clean Creator Profile and Payment Config...');

    // 1. Creator Profile (clean baseline)
    await prisma.creatorProfile.create({
      data: {
        id: 'creator-giangdinh',
        username: 'giangdinh',
        displayName: 'Giang Định',
        bio: 'Chào mừng bạn đến với Tiệm Nhỏ! Nơi chia sẻ các tài nguyên số và sản phẩm chọn lọc.',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
        coverUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        verified: true,
        theme: 'obsidian',
        tiktok: null,
        instagram: null,
        youtube: null,
        threads: null,
        facebook: null,
        zalo: null
      }
    });

    // 2. Payment Config (default)
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

    console.log('✅ Clean baseline created successfully!');
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}
