'use server';

import { prisma } from '@/lib/prisma';
import { createSession, destroySession, hashPassword, verifyPassword } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  sendOnboardingOtpEmail,
  sendLoginOtpEmail
} from '@/features/tiemnho/api/services/email.service';

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

  if (existingUser) {
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
        displayName: cleanName,
        username: cleanUsername,
        phone: cleanPhone,
        avatarUrl: '/default-avatar.svg',
        bio: 'Chào mừng bạn ghé Tiệm Nhỏ! Nơi chia sẻ các tài nguyên số chất lượng cao.'
      }
    });

    // 2. Khởi tạo session cookie
    await createSession(user.id);

    return { success: true };
  } catch (err: any) {
    console.error('[registerCreator] Error:', err);
    return { success: false, error: 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại!' };
  }
}

/**
 * Bước 1 Onboarding: Kiểm tra dữ liệu & Gửi mã OTP xác thực qua email Resend
 */
export async function sendOnboardingOtp(data: {
  username: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<AuthResponse & { email?: string }> {
  const cleanUsername = sanitizeUsername(data.username);
  const cleanEmail = data.email?.toLowerCase().trim();
  const cleanName = data.name?.trim();
  const cleanPhone = data.phone?.trim() || null;
  const password = data.password;

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
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const payload = JSON.stringify({
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: hashedPassword
    });

    // Xóa các OTP cũ chưa dùng của email này nếu có
    await prisma.otpVerification.deleteMany({
      where: { email: cleanEmail }
    });

    // Tạo bản ghi OTP mới trong cơ sở dữ liệu
    await prisma.otpVerification.create({
      data: {
        email: cleanEmail,
        code: otpCode,
        payload,
        expiresAt
      }
    });

    // Gửi email chứa OTP qua Resend
    const emailRes = await sendOnboardingOtpEmail({
      to: cleanEmail,
      name: cleanName,
      otpCode,
      expiresMinutes: 10
    });

    if (!emailRes.success && !emailRes.simulated) {
      return { success: false, error: emailRes.error || 'Không thể gửi email mã xác thực' };
    }

    return { success: true, email: cleanEmail };
  } catch (err: any) {
    console.error('[sendOnboardingOtp] Error:', err);
    return { success: false, error: 'Có lỗi xảy ra khi tạo mã xác thực. Vui lòng thử lại!' };
  }
}

/**
 * Gửi lại mã OTP qua email (Resend OTP)
 */
export async function resendOnboardingOtp(email: string): Promise<AuthResponse> {
  const cleanEmail = email?.toLowerCase().trim();
  if (!cleanEmail) {
    return { success: false, error: 'Email không hợp lệ' };
  }

  const pending = await prisma.otpVerification.findFirst({
    where: { email: cleanEmail },
    orderBy: { createdAt: 'desc' }
  });

  if (!pending || !pending.payload) {
    return { success: false, error: 'Không tìm thấy phiên đăng ký. Vui lòng điền lại thông tin.' };
  }

  try {
    let name = 'bạn';
    try {
      const parsed = JSON.parse(pending.payload);
      if (parsed.name) name = parsed.name;
    } catch {}

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.update({
      where: { id: pending.id },
      data: {
        code: newCode,
        expiresAt
      }
    });

    await sendOnboardingOtpEmail({
      to: cleanEmail,
      name,
      otpCode: newCode,
      expiresMinutes: 10
    });

    return { success: true };
  } catch (err: any) {
    console.error('[resendOnboardingOtp] Error:', err);
    return { success: false, error: 'Không thể gửi lại mã xác thực. Vui lòng thử lại sau.' };
  }
}

/**
 * Bước 2 Onboarding: Xác thực mã OTP và hoàn tất khởi tạo Creator + Tiệm
 */
export async function verifyOnboardingOtp(data: {
  email: string;
  code: string;
}): Promise<AuthResponse> {
  const cleanEmail = data.email?.toLowerCase().trim();
  const cleanCode = data.code?.trim();

  if (!cleanEmail || !cleanCode) {
    return { success: false, error: 'Vui lòng nhập đầy đủ mã OTP 6 số' };
  }

  try {
    const record = await prisma.otpVerification.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return { success: false, error: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!' };
    }

    if (new Date() > record.expiresAt) {
      return { success: false, error: 'Mã xác thực OTP đã hết hạn. Vui lòng nhấn gửi lại mã mới!' };
    }

    if (!record.payload) {
      return {
        success: false,
        error: 'Dữ liệu đăng ký không hợp lệ. Vui lòng thực hiện lại từ đầu!'
      };
    }

    const payload = JSON.parse(record.payload) as {
      username: string;
      name: string;
      email: string;
      phone?: string | null;
      passwordHash: string;
    };

    // Kiểm tra trùng lặp lần cuối trước khi ghi
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email }
    });
    if (existingUser) {
      return { success: false, error: 'Email này đã được sử dụng. Vui lòng đăng nhập!' };
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: payload.username }
    });
    if (existingUsername) {
      return { success: false, error: 'Tên đường link tiệm đã có người đăng ký!' };
    }

    // 1. Tạo bản ghi User chính thức
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        password: payload.passwordHash,
        name: payload.name,
        displayName: payload.name,
        username: payload.username,
        phone: payload.phone,
        avatarUrl: '/default-avatar.svg',
        bio: 'Chào mừng bạn ghé Tiệm Nhỏ! Nơi chia sẻ các tài nguyên số chất lượng cao.'
      }
    });

    // 2. Xóa bản ghi OTP đã xác thực thành công
    await prisma.otpVerification.deleteMany({
      where: { email: cleanEmail }
    });

    // 3. Khởi tạo session cookie
    await createSession(user.id);

    return { success: true };
  } catch (err: any) {
    console.error('[verifyOnboardingOtp] Error:', err);
    return { success: false, error: 'Có lỗi xảy ra khi xác thực OTP. Vui lòng thử lại!' };
  }
}

/**
 * 1. Gửi mã OTP đăng nhập nhanh qua Email (Passwordless Login)
 */
export async function sendLoginOtp(email: string): Promise<AuthResponse & { email?: string }> {
  const cleanEmail = email?.toLowerCase().trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Vui lòng nhập địa chỉ email hợp lệ!' };
  }

  try {
    // 1. Kiểm tra xem người dùng có tồn tại không
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return {
        success: false,
        error: 'Email này chưa đăng ký tài khoản. Vui lòng kiểm tra lại hoặc tạo tiệm mới!'
      };
    }

    // 2. Tạo mã OTP 6 số ngẫu nhiên
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    // 3. Xóa các OTP cũ của email này
    await prisma.otpVerification.deleteMany({
      where: { email: cleanEmail }
    });

    // 4. Lưu bản ghi OTP mới
    await prisma.otpVerification.create({
      data: {
        email: cleanEmail,
        code: otpCode,
        payload: JSON.stringify({ type: 'LOGIN', userId: user.id }),
        expiresAt
      }
    });

    // 5. Gửi email qua Resend
    const emailRes = await sendLoginOtpEmail({
      to: cleanEmail,
      name: user.name || user.username || 'bạn',
      otpCode,
      expiresMinutes: 10
    });

    if (!emailRes.success && !emailRes.simulated) {
      return { success: false, error: emailRes.error || 'Không thể gửi email mã đăng nhập' };
    }

    return { success: true, email: cleanEmail };
  } catch (err: any) {
    console.error('[sendLoginOtp] Error:', err);
    return { success: false, error: 'Không thể tạo mã xác thực. Vui lòng thử lại!' };
  }
}

/**
 * 2. Gửi lại mã OTP đăng nhập nhanh
 */
export async function resendLoginOtp(email: string): Promise<AuthResponse> {
  const cleanEmail = email?.toLowerCase().trim();
  if (!cleanEmail) {
    return { success: false, error: 'Email không hợp lệ' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return { success: false, error: 'Không tìm thấy tài khoản tương ứng với email này' };
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.deleteMany({
      where: { email: cleanEmail }
    });

    await prisma.otpVerification.create({
      data: {
        email: cleanEmail,
        code: newCode,
        payload: JSON.stringify({ type: 'LOGIN', userId: user.id }),
        expiresAt
      }
    });

    await sendLoginOtpEmail({
      to: cleanEmail,
      name: user.name || user.username || 'bạn',
      otpCode: newCode,
      expiresMinutes: 10
    });

    return { success: true };
  } catch (err: any) {
    console.error('[resendLoginOtp] Error:', err);
    return { success: false, error: 'Không thể gửi lại mã xác thực' };
  }
}

/**
 * 3. Xác thực OTP đăng nhập nhanh và khởi tạo phiên đăng nhập
 */
export async function verifyLoginOtp(data: { email: string; code: string }): Promise<AuthResponse> {
  const cleanEmail = data.email?.toLowerCase().trim();
  const cleanCode = data.code?.trim();

  if (!cleanEmail || !cleanCode) {
    return { success: false, error: 'Vui lòng nhập đầy đủ mã OTP 6 chữ số' };
  }

  try {
    const record = await prisma.otpVerification.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!record) {
      return { success: false, error: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!' };
    }

    if (new Date() > new Date(record.expiresAt)) {
      await prisma.otpVerification.deleteMany({ where: { email: cleanEmail } });
      return { success: false, error: 'Mã xác thực đã hết hạn. Vui lòng nhấn gửi lại mã mới!' };
    }

    // Tìm tài khoản User
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return { success: false, error: 'Không tìm thấy tài khoản người dùng!' };
    }

    // Xóa bản ghi OTP đã sử dụng
    await prisma.otpVerification.deleteMany({
      where: { email: cleanEmail }
    });

    // Cấp session đăng nhập
    await createSession(user.id);

    return { success: true };
  } catch (err: any) {
    console.error('[verifyLoginOtp] Error:', err);
    return { success: false, error: 'Có lỗi xảy ra khi xác thực OTP đăng nhập. Vui lòng thử lại!' };
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
