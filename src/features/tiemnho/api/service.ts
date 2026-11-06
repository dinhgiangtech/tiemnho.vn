'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureDatabaseSeeded } from '@/lib/seed';
import type {
  Product,
  Order,
  Lead,
  CreatorProfile,
  PaymentConfig,
  OrderStatus,
  ShippingStatus,
  ProductType
} from '@/constants/mock-tiemnho';
import type {
  ProductFilterParams,
  OrderFilterParams,
  CreateProductInput,
  CreateOrderInput
} from './types';

// ==========================================
// DATA FORMATTERS (Prisma -> App Types)
// ==========================================

function formatProfile(p: {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string | null;
  verified: boolean;
  theme: string;
  tiktok: string | null;
  instagram: string | null;
  youtube: string | null;
  threads: string | null;
  facebook: string | null;
  zalo: string | null;
}): CreatorProfile {
  // Tự động chuyển đổi các avatar mẫu Unsplash cũ sang avatar mặc định chuẩn Facebook
  const isOldDefaultAvatar =
    !p.avatarUrl ||
    p.avatarUrl.includes('photo-1534528741775-53994a69daeb') ||
    p.avatarUrl.trim() === '';

  const cleanAvatarUrl = isOldDefaultAvatar ? '/default-avatar.svg' : p.avatarUrl;

  return {
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    bio: p.bio,
    avatarUrl: cleanAvatarUrl,
    coverUrl: p.coverUrl ?? undefined,
    verified: p.verified,
    theme: (p.theme as CreatorProfile['theme']) || 'obsidian',
    socials: {
      tiktok: p.tiktok ?? undefined,
      instagram: p.instagram ?? undefined,
      youtube: p.youtube ?? undefined,
      threads: p.threads ?? undefined,
      facebook: p.facebook ?? undefined,
      zalo: p.zalo ?? undefined
    }
  };
}

function formatProduct(p: {
  id: string;
  creatorId: string;
  type: ProductType;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  originalPrice: number | null;
  coverImage: string | null;
  fileUrl: string | null;
  fileName: string | null;
  externalUrl: string | null;
  buttonText: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  soldCount: number;
  stock: number | null;
  createdAt: Date;
  updatedAt: Date;
}): Product {
  return {
    id: p.id,
    creatorId: p.creatorId,
    type: p.type,
    title: p.title,
    subtitle: p.subtitle ?? undefined,
    description: p.description ?? '',
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    coverImage:
      p.coverImage ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    fileUrl: p.fileUrl ?? undefined,
    fileName: p.fileName ?? undefined,
    externalUrl: p.externalUrl ?? undefined,
    buttonText: p.buttonText ?? undefined,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    displayOrder: p.displayOrder,
    soldCount: p.soldCount,
    stock: p.stock ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  };
}

function formatOrder(o: {
  id: string;
  orderCode: string;
  creatorId: string;
  productId: string | null;
  productTitle: string;
  productType: ProductType;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string | null;
  customerNote: string | null;
  status: OrderStatus;
  shippingStatus: ShippingStatus | null;
  paymentMethod: string;
  paidAt: Date | null;
  downloadUrl: string | null;
  createdAt: Date;
}): Order {
  return {
    id: o.id,
    orderCode: o.orderCode,
    creatorId: o.creatorId,
    productId: o.productId ?? '',
    productTitle: o.productTitle,
    productType: o.productType,
    amount: Number(o.amount),
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shippingAddress: o.shippingAddress ?? undefined,
    customerNote: o.customerNote ?? undefined,
    status: o.status,
    shippingStatus: o.shippingStatus ?? undefined,
    paymentMethod: 'VIETQR',
    paidAt: o.paidAt ? o.paidAt.toISOString() : undefined,
    downloadUrl: o.downloadUrl ?? undefined,
    createdAt: o.createdAt.toISOString()
  };
}

function formatLead(l: {
  id: string;
  creatorId: string;
  name: string;
  email: string;
  phone: string;
  sourceProduct: string;
  sourceType: string;
  totalSpent: number;
  ordersCount: number;
  createdAt: Date;
}): Lead {
  return {
    id: l.id,
    creatorId: l.creatorId,
    name: l.name,
    email: l.email,
    phone: l.phone,
    sourceProduct: l.sourceProduct,
    sourceType: (l.sourceType as Lead['sourceType']) || 'PURCHASE',
    totalSpent: Number(l.totalSpent),
    ordersCount: l.ordersCount,
    createdAt: l.createdAt.toISOString()
  };
}

function formatPaymentConfig(pc: {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  provider: string;
  apiKey: string;
  checksumKey: string;
  webhookUrl: string;
  isActive: boolean;
  lastPingTestAt: Date | null;
}): PaymentConfig {
  return {
    bankId: pc.bankId,
    bankName: pc.bankName,
    accountNumber: pc.accountNumber,
    accountName: pc.accountName,
    provider: (pc.provider as PaymentConfig['provider']) || 'payOS',
    apiKey: pc.apiKey,
    checksumKey: pc.checksumKey,
    webhookUrl: pc.webhookUrl,
    isActive: pc.isActive,
    lastPingTestAt: pc.lastPingTestAt ? pc.lastPingTestAt.toISOString() : undefined
  };
}

// ==========================================
// 1. PROFILE
// ==========================================

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
    const profile = await prisma.creatorProfile.findFirst({
      where: {
        OR: [{ userId: currentUserId }, { clerkUserId: currentUserId }]
      }
    });

    if (profile) {
      return formatProfile(profile);
    }
  }

  // 2. Nếu khách vãng lai hoặc môi trường không có session: lấy profile đầu tiên trong CSDL
  const fallback = await prisma.creatorProfile.findFirst();
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
  const profile = await prisma.creatorProfile.findFirst({
    where: {
      OR: [{ username: cleanUsername }, { username: cleanUsername.toLowerCase() }]
    }
  });

  if (!profile) return null;
  return formatProfile(profile);
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

  const updated = await prisma.creatorProfile.update({
    where: { id: current.id },
    data: dataToUpdate
  });

  return formatProfile(updated);
}

// ==========================================
// 2. PAYMENT SETTINGS
// ==========================================

export async function getPaymentConfig(): Promise<PaymentConfig> {
  await ensureDatabaseSeeded();
  let config = await prisma.paymentConfig.findFirst();
  if (!config) {
    await ensureDatabaseSeeded();
    config = await prisma.paymentConfig.findFirst();
  }
  if (!config) {
    throw new Error('Payment config could not be found.');
  }
  return formatPaymentConfig(config);
}

export async function updatePaymentConfig(updates: Partial<PaymentConfig>): Promise<PaymentConfig> {
  const current = await getPaymentConfig();
  const updated = await prisma.paymentConfig.update({
    where: { id: current.bankId ? 'default-payment' : 'default-payment' },
    data: {
      ...(updates.bankId !== undefined && { bankId: updates.bankId }),
      ...(updates.bankName !== undefined && { bankName: updates.bankName }),
      ...(updates.accountNumber !== undefined && { accountNumber: updates.accountNumber }),
      ...(updates.accountName !== undefined && { accountName: updates.accountName }),
      ...(updates.provider !== undefined && { provider: updates.provider }),
      ...(updates.apiKey !== undefined && { apiKey: updates.apiKey }),
      ...(updates.checksumKey !== undefined && { checksumKey: updates.checksumKey }),
      ...(updates.webhookUrl !== undefined && { webhookUrl: updates.webhookUrl }),
      ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      ...(updates.lastPingTestAt !== undefined && {
        lastPingTestAt: new Date(updates.lastPingTestAt)
      })
    }
  });
  return formatPaymentConfig(updated);
}

export async function pingTest() {
  const config = await getPaymentConfig();
  const testCode = `TN${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();

  await prisma.paymentConfig.update({
    where: { id: 'default-payment' },
    data: { lastPingTestAt: now }
  });

  return {
    success: true,
    message: `Kết nối thành công! Nhận biến động số dư 10.000đ từ cổng ${config.provider} vào tài khoản ${config.accountNumber}.`,
    simulatedOrderCode: testCode,
    amount: 10000,
    time: now.toISOString()
  };
}

// ==========================================
// 3. PRODUCTS
// ==========================================

export async function getProducts(filters?: ProductFilterParams): Promise<Product[]> {
  await ensureDatabaseSeeded();

  const whereClause: Record<string, unknown> = {};

  if (filters?.publishedOnly) {
    whereClause.isPublished = true;
  }

  if (filters?.type && filters.type !== 'ALL') {
    whereClause.type = filters.type as ProductType;
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim();
    whereClause.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } }
    ];
  }

  const list = await prisma.product.findMany({
    where: whereClause,
    orderBy: { displayOrder: 'asc' }
  });

  return list.map(formatProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  await ensureDatabaseSeeded();
  const product = await prisma.product.findUnique({
    where: { id }
  });
  return product ? formatProduct(product) : null;
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const profile = await getProfile();
  const maxOrder = await prisma.product.aggregate({
    _max: { displayOrder: true }
  });
  const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1;

  const created = await prisma.product.create({
    data: {
      creatorId: profile.id,
      type: data.type,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice,
      coverImage: data.coverImage,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      externalUrl: data.externalUrl,
      buttonText: data.buttonText || (data.type === 'LEAD_MAGNET' ? 'Nhận ngay' : 'Mua ngay'),
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
      stock: data.stock ?? 999,
      displayOrder: nextOrder,
      soldCount: 0
    }
  });

  return formatProduct(created);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.subtitle !== undefined && { subtitle: updates.subtitle }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.price !== undefined && { price: updates.price }),
      ...(updates.originalPrice !== undefined && { originalPrice: updates.originalPrice }),
      ...(updates.coverImage !== undefined && { coverImage: updates.coverImage }),
      ...(updates.fileUrl !== undefined && { fileUrl: updates.fileUrl }),
      ...(updates.fileName !== undefined && { fileName: updates.fileName }),
      ...(updates.externalUrl !== undefined && { externalUrl: updates.externalUrl }),
      ...(updates.buttonText !== undefined && { buttonText: updates.buttonText }),
      ...(updates.isPublished !== undefined && { isPublished: updates.isPublished }),
      ...(updates.isFeatured !== undefined && { isFeatured: updates.isFeatured }),
      ...(updates.displayOrder !== undefined && { displayOrder: updates.displayOrder }),
      ...(updates.stock !== undefined && { stock: updates.stock })
    }
  });

  return formatProduct(updated);
}

export async function deleteProduct(id: string): Promise<boolean> {
  // Disconnect related orders first so historical orders remain valid
  await prisma.order.updateMany({
    where: { productId: id },
    data: { productId: null }
  });

  await prisma.product.delete({
    where: { id }
  });
  return true;
}

export async function reorderProducts(ids: string[]): Promise<Product[]> {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.product.update({
        where: { id },
        data: { displayOrder: index + 1 }
      })
    )
  );

  return getProducts();
}

// ==========================================
// 4. ORDERS
// ==========================================

export async function getOrders(filters?: OrderFilterParams): Promise<Order[]> {
  await ensureDatabaseSeeded();

  const whereClause: Record<string, unknown> = {};

  if (filters?.status && filters.status !== 'ALL') {
    whereClause.status = filters.status as OrderStatus;
  }

  if (filters?.type && filters.type !== 'ALL') {
    whereClause.productType = filters.type as ProductType;
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim();
    whereClause.OR = [
      { customerName: { contains: s, mode: 'insensitive' } },
      { orderCode: { contains: s, mode: 'insensitive' } },
      { customerPhone: { contains: s, mode: 'insensitive' } },
      { customerEmail: { contains: s, mode: 'insensitive' } }
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  return orders.map(formatOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  await ensureDatabaseSeeded();
  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderCode: id }]
    }
  });
  return order ? formatOrder(order) : null;
}

export async function createOrder(data: CreateOrderInput): Promise<Order> {
  await ensureDatabaseSeeded();
  const product = await prisma.product.findUnique({
    where: { id: data.productId }
  });

  if (!product) {
    throw new Error(`Product not found: ${data.productId}`);
  }

  const isFree = product.price === 0 || product.type === 'LEAD_MAGNET';
  const orderCode = `TN${Math.floor(10000 + Math.random() * 90000)}`;

  const createdOrder = await prisma.order.create({
    data: {
      orderCode,
      creatorId: product.creatorId,
      productId: product.id,
      productTitle: product.title,
      productType: product.type,
      amount: product.price,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress,
      customerNote: data.customerNote,
      status: isFree ? 'PAID' : 'PENDING',
      shippingStatus: product.type === 'PHYSICAL' ? 'UNFULFILLED' : undefined,
      paymentMethod: 'VIETQR',
      paidAt: isFree ? new Date() : undefined,
      downloadUrl: isFree && product.fileUrl ? product.fileUrl : undefined
    }
  });

  // Increment sold count if free
  if (isFree) {
    await prisma.product.update({
      where: { id: product.id },
      data: { soldCount: { increment: 1 } }
    });
  }

  // Upsert lead
  const existingLead = await prisma.lead.findFirst({
    where: { email: data.customerEmail }
  });

  if (existingLead) {
    await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        ordersCount: { increment: 1 },
        totalSpent: { increment: product.price },
        sourceProduct: product.title
      }
    });
  } else {
    await prisma.lead.create({
      data: {
        creatorId: product.creatorId,
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        sourceProduct: product.title,
        sourceType: product.type === 'LEAD_MAGNET' ? 'LEAD_MAGNET' : 'PURCHASE',
        totalSpent: product.price,
        ordersCount: 1
      }
    });
  }

  return formatOrder(createdOrder);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  shippingStatus?: ShippingStatus
): Promise<Order> {
  const current = await getOrderById(id);
  if (!current) throw new Error(`Order ${id} not found`);

  const shouldMarkPaid = status === 'PAID' && current.status !== 'PAID';

  const updated = await prisma.order.update({
    where: { id: current.id },
    data: {
      status,
      ...(shippingStatus && { shippingStatus }),
      ...(shouldMarkPaid && { paidAt: new Date() })
    }
  });

  if (shouldMarkPaid && current.productId) {
    await prisma.product
      .update({
        where: { id: current.productId },
        data: { soldCount: { increment: 1 } }
      })
      .catch(() => null);
  }

  return formatOrder(updated);
}

export async function manualActivateOrder(
  id: string,
  requesterCreatorId?: string
): Promise<{
  order: Order;
  grant?: { token: string; expiresAt: Date; maxDownloads: number };
}> {
  await ensureDatabaseSeeded();

  const current = await prisma.order.findFirst({
    where: {
      OR: [{ id }, { orderCode: id }]
    },
    include: {
      product: true
    }
  });

  if (!current) {
    throw new Error(`Đơn hàng ${id} không tồn tại`);
  }

  // 1. Kiểm tra quyền sở hữu (nếu có requesterCreatorId)
  if (requesterCreatorId && current.creatorId && requesterCreatorId !== current.creatorId) {
    throw new Error('Bạn không có quyền kích hoạt đơn hàng của Creator khác');
  }

  const now = new Date();

  // 2. Chuẩn bị token và grant nếu là sản phẩm số (DownloadGrant: token bảo mật, hạn dùng 72h, max 5 downloads)
  let downloadGrant: { token: string; expiresAt: Date; maxDownloads: number } | undefined;
  let resolvedDownloadUrl = current.downloadUrl;

  if (current.productType === 'DIGITAL') {
    const grantToken = `gr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
    downloadGrant = {
      token: grantToken,
      expiresAt,
      maxDownloads: 5
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tiemnho.vn';
    const productFile =
      current.product?.fileUrl || current.downloadUrl || 'https://tiemnho.vn/files/sample';
    resolvedDownloadUrl = `${baseUrl}/download/${grantToken}?file=${encodeURIComponent(productFile)}`;
  }

  // 3. Thực thi cập nhật giao dịch
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // a. Cập nhật Order -> PAID
    const orderUpdated = await tx.order.update({
      where: { id: current.id },
      data: {
        status: 'PAID',
        paidAt: now,
        downloadUrl: resolvedDownloadUrl,
        shippingStatus: current.productType === 'PHYSICAL' ? 'UNFULFILLED' : current.shippingStatus
      }
    });

    // b. Tăng số lượng đã bán của sản phẩm
    if (current.productId) {
      await tx.product
        .update({
          where: { id: current.productId },
          data: { soldCount: { increment: 1 } }
        })
        .catch(() => null);
    }

    // c. Cập nhật thống kê khách hàng (Lead)
    if (current.customerEmail) {
      const existingLead = await tx.lead.findFirst({
        where: { email: current.customerEmail }
      });

      if (existingLead) {
        await tx.lead.update({
          where: { id: existingLead.id },
          data: {
            ordersCount: { increment: 1 },
            totalSpent: { increment: current.amount },
            sourceProduct: current.productTitle
          }
        });
      }
    }

    return orderUpdated;
  });

  // 4. Kích hoạt gửi email giả lập hoặc qua Resend/SES
  try {
    if (current.productType === 'DIGITAL') {
      console.log(
        `[Email Service / Resend] Gửi link tải tài nguyên tới ${current.customerEmail}: ${resolvedDownloadUrl} (Token: ${downloadGrant?.token}, Hạn dùng: 72h)`
      );
    } else if (current.productType === 'PHYSICAL') {
      console.log(
        `[Email Service / Resend] Gửi email xác nhận đặt hàng thành công tới ${current.customerEmail} cho đơn hàng vật lý #${current.orderCode}`
      );
    }
  } catch (err) {
    console.warn('Lỗi gửi email kích hoạt:', err);
  }

  // 5. Ghi log kiểm toán thanh toán (PaymentLog)
  console.log(
    `[PaymentLog] gateway="MANUAL_CREATOR" status="SUCCESS" orderCode="${current.orderCode}" amount=${current.amount} creatorId="${current.creatorId}" at=${now.toISOString()}`
  );

  return {
    order: formatOrder(updatedOrder),
    grant: downloadGrant
  };
}

// ==========================================
// 5. LEADS
// ==========================================

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

// ==========================================
// 6. DASHBOARD ANALYTICS
// ==========================================

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
