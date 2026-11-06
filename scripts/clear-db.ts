import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Bắt đầu xóa sạch dữ liệu trong database...');

  try {
    // 1. Xóa các bảng có liên kết khóa ngoại trước
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`🗑️ Đã xóa ${deletedOrders.count} đơn hàng (Order)`);

    const deletedLeads = await prisma.lead.deleteMany({});
    console.log(`🗑️ Đã xóa ${deletedLeads.count} khách hàng / liên hệ (Lead)`);

    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`🗑️ Đã xóa ${deletedProducts.count} sản phẩm (Product)`);

    const deletedProfiles = await prisma.creatorProfile.deleteMany({});
    console.log(`🗑️ Đã xóa ${deletedProfiles.count} hồ sơ người bán (CreatorProfile)`);

    console.log('✨ Đã dọn sạch toàn bộ dữ liệu Đơn hàng, Khách hàng, Sản phẩm và Hồ sơ Creator!');
    console.log('🚀 Hệ thống đã sẵn sàng 100% ở trạng thái sạch để kiểm thử đồng bộ Clerk!');
  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();

