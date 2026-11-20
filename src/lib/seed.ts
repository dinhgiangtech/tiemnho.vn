import { prisma } from './prisma';

export async function ensureDatabaseSeeded() {
  // Không tự động inject dữ liệu thanh toán giả lập nữa
  return;
}
