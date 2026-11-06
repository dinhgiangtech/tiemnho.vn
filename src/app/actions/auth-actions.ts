'use server';

import { prisma } from '@/lib/prisma';
import { createSession, destroySession, hashPassword, verifyPassword } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type AuthResponse = {
  success: boolean;
  error?: string;
};

// Chuẩn hóa username (slug)
function sanitizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .trim();
}

/**
 * Kiểm tra tính khả dụng của username theo thời gian thực
 */
export async function checkUsername(rawUsername: string): Promise<{
  available: boolean;
  normalized: string;
  error?: string;
}> {
  const normalized = sanitizeUsername(rawUsername);

  if (!normalized) {
    return { available: false, normalized: '', error: 'Vui lòng nhập tên tiệm' };
  }

  if (normalized.length < 3) {
    return { available: false, normalized, error: 'Tối thiểu 3 ký tự' };
  }

  const reservedWords = [
    'admin',
    'dashboard',
    'api',
    'auth',
    'sign-in',
    'sign-up',
    'login',
    'register',
    'onboarding',
    'settings',
    'help',
    'terms',
    'privacy',
    'blog',
    'support'
  ];

  if (reservedWords.includes(normalized)) {
    return { available: false, normalized, error: 'Tên này được hệ thống bảo lưu' };
  }

  const existingUser = await prisma.user.findUnique({
    where: { username: normalized }
  });

  const existingProfile = await prisma.creatorProfile.findUnique({
    where: { username: normalized }
  });

  if (existingUser || existingProfile) {
    return { available: false, normalized, error: 'Tên đường link này đã có người dùng' };
  }

  return { available: true, normalized };
}

/**
 * Đăng ký tài khoản Creator mới (Chuẩn theo Form Stan Store)
 */
export async function registerCreator(data: {
  username: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse> {
  const cleanUsername = sanitizeUsername(data.username);
  const cleanEmail = data.email?.toLowerCase().trim();
  const cleanName = data.name?.trim();
  const cleanPhone = data.phone?.trim() || null;
  const password = data.password;

  // Validate các trường
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Tên đường link tiệm phải có tối thiểu 3 ký tự!' };
  }

  if (!cleanName) {
    return { success: false, error: 'Vui lòng nhập họ và tên của bạn!' };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Vui lòng nhập địa chỉ email hợp lệ!' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'Mật khẩu phải có tối thiểu 6 ký tự!' };
  }

  // Kiểm tra trùng lặp username
  const checkSlug = await checkUsername(cleanUsername);
  if (!checkSlug.available) {
    return { success: false, error: checkSlug.error || 'Đường link này đã có người sử dụng!' };
  }

  // Kiểm tra trùng lặp email
  const existingEmail = await prisma.user.findUnique({
    where: { email: cleanEmail }
  });

  if (existingEmail) {
    return { success: false, error: 'Email này đã được đăng ký. Vui lòng đăng nhập!' };
  }

  try {
    const hashedPassword = await hashPassword(password);

    // 1. Tạo bản ghi User
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: cleanName,
        username: cleanUsername,
        phone: cleanPhone,
        avatarUrl: '/default-avatar.svg',
        bio: 'Chào mừng bạn ghé Tiệm Nhỏ! Nơi chia sẻ các tài nguyên số chất lượng cao.'
      }
    });

    // 2. Đồng bộ tạo CreatorProfile cho Storefront
    await prisma.creatorProfile.upsert({
      where: { username: cleanUsername },
      update: {
        userId: user.id,
        displayName: cleanName,
        avatarUrl: '/default-avatar.svg'
      },
      create: {
        userId: user.id,
        username: cleanUsername,
        displayName: cleanName,
        avatarUrl: '/default-avatar.svg',
        bio: 'Chào mừng bạn ghé Tiệm Nhỏ! Nơi chia sẻ các tài nguyên số chất lượng cao.',
        theme: 'obsidian',
        verified: true
      }
    });

    // 3. Khởi tạo session cookie
    await createSession(user.id);

    return { success: true };
  } catch (err: any) {
    console.error('[registerCreator] Error:', err);
    return { success: false, error: 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại!' };
  }
}

/**
 * Đăng nhập Creator bằng Email/Username + Mật khẩu
 */
export async function loginCreator(data: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> {
  const identifier = data.identifier?.trim();
  const password = data.password;

  if (!identifier || !password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ thông tin đăng nhập!' };
  }

  try {
    const cleanId = identifier.toLowerCase().replace(/^@/, '');

    // Tìm theo email hoặc username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanId }, { username: cleanId }]
      }
    });

    if (!user || !user.password) {
      return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác!' };
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác!' };
    }

    // Đăng nhập thành công -> Cấp session
    await createSession(user.id);

    return { success: true };
  } catch (err: any) {
    console.error('[loginCreator] Error:', err);
    return { success: false, error: 'Đăng nhập thất bại. Vui lòng thử lại!' };
  }
}

/**
 * Đăng xuất
 */
export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
