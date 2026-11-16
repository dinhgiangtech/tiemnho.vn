'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import type { CreatorProfile } from '@/constants/mock-tiemnho';
import { formatProfile } from './formatters';

export async function getProfile(): Promise<CreatorProfile> {
  await ensureDatabaseSeeded();

  let currentUserId: string | null = null;
  try {
    const session = await getSession();
    currentUserId = session?.userId || null;
  } catch {
    // Không có context auth (môi trường build hoặc public) -> an toàn bỏ qua
  }

  // 1. Nếu User đã đăng nhập -> Tìm hồ sơ của tài khoản này
  if (currentUserId) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: currentUserId }, { clerkUserId: currentUserId }]
      }
    });

    if (user) {
      return formatProfile(user);
    }
  }

  // 2. Nếu khách vãng lai hoặc môi trường không có session: lấy user đầu tiên trong CSDL
  const fallback = await prisma.user.findFirst();
  if (fallback) {
    return formatProfile(fallback);
  }

  // 3. Nếu CSDL hoàn toàn trống (chưa có ai mở tiệm): trả về cấu hình mẫu mặc định
  return {
    id: 'creator-preview',
    username: 'tiemnho',
    displayName: 'Tiệm Nhỏ Creator',
    bio: 'Chào mừng bạn ghé Tiệm Nhỏ! Nơi chia sẻ các tài nguyên số chất lượng cao.',
    avatarUrl: '/default-avatar.svg',
    coverUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    verified: true,
    theme: 'obsidian',
    socials: {}
  };
}

export async function getProfileByUsername(username: string): Promise<CreatorProfile | null> {
  await ensureDatabaseSeeded();
  const cleanUsername = decodeURIComponent(username).replace(/^@/, '').trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: cleanUsername }, { username: cleanUsername.toLowerCase() }]
    }
  });

  if (!user) return null;
  return formatProfile(user);
}

export async function updateProfile(updates: Partial<CreatorProfile>): Promise<CreatorProfile> {
  const current = await getProfile();

  const dataToUpdate: Record<string, unknown> = {};
  if (updates.displayName !== undefined) dataToUpdate.displayName = updates.displayName;
  if (updates.bio !== undefined) dataToUpdate.bio = updates.bio;
  if (updates.avatarUrl !== undefined) dataToUpdate.avatarUrl = updates.avatarUrl;
  if (updates.coverUrl !== undefined) dataToUpdate.coverUrl = updates.coverUrl;
  if (updates.theme !== undefined) dataToUpdate.theme = updates.theme;
  if (updates.socials) {
    if ('tiktok' in updates.socials) dataToUpdate.tiktok = updates.socials.tiktok || null;
    if ('instagram' in updates.socials) dataToUpdate.instagram = updates.socials.instagram || null;
    if ('youtube' in updates.socials) dataToUpdate.youtube = updates.socials.youtube || null;
    if ('threads' in updates.socials) dataToUpdate.threads = updates.socials.threads || null;
    if ('facebook' in updates.socials) dataToUpdate.facebook = updates.socials.facebook || null;
    if ('zalo' in updates.socials) dataToUpdate.zalo = updates.socials.zalo || null;
  }

  const updated = await prisma.user.update({
    where: { id: current.id },
    data: dataToUpdate
  });

  return formatProfile(updated);
}
