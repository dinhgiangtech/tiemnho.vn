import {
  ProductType,
  OrderStatus,
  ShippingStatus,
  PaymentMethod,
  LeadSourceType
} from '@/constants/mock-tiemnho';
import type { Product, Order, Lead, CreatorProfile, PaymentConfig } from '@/constants/mock-tiemnho';

export function formatProfile(p: {
  id: string;
  username: string | null;
  name?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  verified?: boolean | null;
  theme?: string | null;
  tiktok?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  threads?: string | null;
  facebook?: string | null;
  zalo?: string | null;
  telegramChatId?: string | null;
  telegramLinkToken?: string | null;
}): CreatorProfile {
  // Tự động chuyển đổi các avatar mẫu Unsplash cũ sang avatar mặc định chuẩn Facebook
  const isOldDefaultAvatar =
    !p.avatarUrl ||
    p.avatarUrl.includes('photo-1534528741775-53994a69daeb') ||
    p.avatarUrl.trim() === '';

  const cleanAvatarUrl = isOldDefaultAvatar || !p.avatarUrl ? '/default-avatar.svg' : p.avatarUrl;

  return {
    id: p.id,
    username: p.username || 'tiemnho',
    displayName: p.displayName || p.name || 'Tiệm Nhỏ Creator',
    bio: p.bio || 'Chào mừng bạn ghé Tiệm Nhỏ! Nơi chia sẻ các tài nguyên số chất lượng cao.',
    avatarUrl: cleanAvatarUrl,
    coverUrl: p.coverUrl ?? undefined,
    verified: p.verified ?? true,
    theme: (p.theme as CreatorProfile['theme']) || 'obsidian',
    telegramChatId: p.telegramChatId ?? undefined,
    telegramLinkToken: p.telegramLinkToken ?? undefined,
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

export function formatProduct(p: {
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

export function formatOrder(o: {
  id: string;
  orderCode: string;
  userId?: string | null;
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
  checkoutUrl?: string | null;
  qrCode?: string | null;
  paymentLinkId?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  bin?: string | null;
  createdAt: Date;
}): Order {
  return {
    id: o.id,
    orderCode: o.orderCode,
    userId: o.userId ?? undefined,
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
    paymentMethod: (o.paymentMethod as any) || PaymentMethod.PAYOS,
    paidAt: o.paidAt ? o.paidAt.toISOString() : undefined,
    downloadUrl: o.downloadUrl ?? undefined,
    checkoutUrl: o.checkoutUrl ?? undefined,
    qrCode: o.qrCode ?? undefined,
    paymentLinkId: o.paymentLinkId ?? undefined,
    accountNumber: (o as any).accountNumber ?? undefined,
    accountName: (o as any).accountName ?? undefined,
    bin: (o as any).bin ?? undefined,
    createdAt: o.createdAt.toISOString()
  };
}

export function formatLead(l: {
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
    sourceType: (l.sourceType as LeadSourceType) || LeadSourceType.PURCHASE,
    totalSpent: Number(l.totalSpent),
    ordersCount: l.ordersCount,
    createdAt: l.createdAt.toISOString()
  };
}

export function formatPaymentConfig(pc: {
  id?: string;
  userId?: string | null;
  bankId?: string | null;
  bankName?: string | null;
  bankBin?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  clientId?: string | null;
  provider: string;
  apiKey?: string | null;
  checksumKey?: string | null;
  webhookUrl?: string | null;
  isActive: boolean;
  isPayosEnabled?: boolean;
  lastPingTestAt?: Date | null;
}): PaymentConfig {
  const accNum = pc.bankAccountNumber || pc.accountNumber || '';
  const accName = pc.bankAccountName || pc.accountName || '';
  const bId = pc.bankId || 'MB';
  const bName = pc.bankName || 'Ngân hàng TMCP Quân Đội (MB Bank)';
  const bBin = pc.bankBin || '970422';

  return {
    id: pc.id,
    userId: pc.userId ?? undefined,
    bankId: bId,
    bankName: bName,
    accountNumber: accNum,
    accountName: accName,
    bankBin: bBin,
    bankAccountNumber: accNum,
    bankAccountName: accName,
    clientId: pc.clientId ?? undefined,
    provider: (pc.provider as PaymentConfig['provider']) || 'PAYOS',
    apiKey: pc.apiKey || '',
    checksumKey: pc.checksumKey || '',
    webhookUrl: pc.webhookUrl || '',
    isActive: pc.isActive,
    isPayosEnabled: (pc as any).isPayosEnabled ?? false,
    lastPingTestAt: pc.lastPingTestAt ? pc.lastPingTestAt.toISOString() : undefined
  };
}
