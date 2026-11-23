'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// Kiểm tra quyền Super Admin
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Bạn không có quyền truy cập khu vực Quản trị');
  }
  return user;
}

// 1. Thống kê Platform Overview
export async function getAdminOverview() {
  await requireAdmin();

  const [totalCreators, totalProducts, totalOrders, paidOrders, recentOrders, topCreators] =
    await Promise.all([
      prisma.user.count({ where: { role: 'CREATOR' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({
        where: { status: 'PAID' },
        select: { amount: true, paymentMethod: true }
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { title: true, type: true } },
          user: { select: { displayName: true, username: true } }
        }
      }),
      prisma.user.findMany({
        where: { role: 'CREATOR' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          displayName: true,
          username: true,
          avatarUrl: true,
          verified: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { products: true, orders: true }
          }
        }
      })
    ]);

  const totalGMV = paidOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const payosCount = paidOrders.filter((o) => o.paymentMethod === 'PAYOS').length;
  const vietqrCount = paidOrders.filter((o) => o.paymentMethod !== 'PAYOS').length;

  return {
    totalCreators,
    totalProducts,
    totalOrders,
    totalGMV,
    paidOrdersCount: paidOrders.length,
    payosCount,
    vietqrCount,
    recentOrders,
    topCreators
  };
}

// 2. Quản lý danh sách Creators
export async function getAdminCreators(query?: { search?: string }) {
  await requireAdmin();

  const whereClause: any = { role: 'CREATOR' };
  if (query?.search) {
    const s = query.search.trim();
    whereClause.OR = [
      { displayName: { contains: s, mode: 'insensitive' } },
      { username: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } }
    ];
  }

  const creators = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      phone: true,
      verified: true,
      isActive: true,
      createdAt: true,
      bankAccountNumber: true,
      bankBin: true,
      _count: {
        select: { products: true, orders: true, leads: true }
      }
    }
  });

  return creators;
}

// Cập nhật trạng thái Creator (Verified / Active)
export async function toggleCreatorVerified(userId: string, verified: boolean) {
  await requireAdmin();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { verified }
  });
  revalidatePath('/admin/creators');
  return { success: true, verified: updated.verified };
}

export async function toggleCreatorActive(userId: string, isActive: boolean) {
  await requireAdmin();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive }
  });
  revalidatePath('/admin/creators');
  return { success: true, isActive: updated.isActive };
}

// 3. Quản lý tất cả sản phẩm sàn
export async function getAdminProducts(query?: { search?: string }) {
  await requireAdmin();

  const whereClause: any = {};
  if (query?.search) {
    const s = query.search.trim();
    whereClause.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { user: { username: { contains: s, mode: 'insensitive' } } }
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true
        }
      }
    }
  });

  return products;
}

export async function toggleProductPublished(productId: string, isPublished: boolean) {
  await requireAdmin();
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { isPublished }
  });
  revalidatePath('/admin/products');
  return { success: true, isPublished: updated.isPublished };
}

// 4. Quản lý tất cả đơn hàng sàn
export async function getAdminOrders(query?: { search?: string }) {
  await requireAdmin();

  const whereClause: any = {};
  if (query?.search) {
    const s = query.search.trim();
    whereClause.OR = [
      { orderCode: { contains: s, mode: 'insensitive' } },
      { customerName: { contains: s, mode: 'insensitive' } },
      { customerEmail: { contains: s, mode: 'insensitive' } },
      { user: { username: { contains: s, mode: 'insensitive' } } }
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          type: true,
          coverImage: true
        }
      },
      user: {
        select: {
          id: true,
          displayName: true,
          username: true
        }
      }
    }
  });

  return orders;
}
