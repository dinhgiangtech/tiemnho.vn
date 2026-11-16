'use server';

import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import type { Lead } from '@/constants/mock-tiemnho';
import { formatLead } from './formatters';

export async function getLeads(search?: string): Promise<Lead[]> {
  await ensureDatabaseSeeded();

  const whereClause: Record<string, unknown> = {};

  if (search && search.trim()) {
    const s = search.trim();
    whereClause.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { sourceProduct: { contains: s, mode: 'insensitive' } }
    ];
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  return leads.map(formatLead);
}
