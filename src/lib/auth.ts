import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = 'tiemnho_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'tiemnho_super_secret_auth_key_2026';

// 1. Mã hóa & xác thực mật khẩu
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// 2. Ký và giải mã Session Token an toàn (HMAC SHA-256)
function signToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.userId ? { userId: data.userId } : null;
  } catch {
    return null;
  }
}

// 3. Quản lý Session Cookie
export async function createSession(userId: string) {
  const token = signToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
    path: '/'
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// 4. Lấy thông tin User hiện tại từ Database
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId }
  });
}
