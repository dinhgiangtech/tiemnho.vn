'use server';

import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import { formatOrder } from './formatters';

export async function getDashboardAnalytics() {
  await ensureDatabaseSeeded();

  const [paidOrders, totalOrders, totalLeads, pendingOrders, recentOrders] = await Promise.all([
    prisma.order.findMany({ where: { status: 'PAID' } }),
    prisma.order.count(),
    prisma.lead.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0);

  // Revenue chart by last 7 days based on real orders
  const chartData: { date: string; revenue: number; orders: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const dayOrders = paidOrders.filter((o) => {
      const oDate = new Date(o.createdAt);
      return oDate >= dayStart && oDate <= dayEnd;
    });

    const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.amount), 0);
    chartData.push({
      date: dayStr,
      revenue: dayRevenue,
      orders: dayOrders.length
    });
  }

  return {
    totalRevenue,
    totalOrders,
    totalLeads,
    pendingOrders,
    chartData,
    recentOrders: recentOrders.map(formatOrder)
  };
}
