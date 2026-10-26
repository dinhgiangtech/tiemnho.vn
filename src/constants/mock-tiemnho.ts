import { matchSorter } from 'match-sorter';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// 1. DATA TYPES
// ==========================================

export type ProductType = 'DIGITAL' | 'LEAD_MAGNET' | 'PHYSICAL' | 'EXTERNAL_LINK';

export type CreatorProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  verified: boolean;
  theme: 'obsidian' | 'minimal' | 'latte' | 'emerald' | 'rose' | 'tiktok';
  socials: {
    tiktok?: string;
    instagram?: string;
    youtube?: string;
    threads?: string;
    facebook?: string;
    zalo?: string;
  };
};

export type Product = {
  id: string;
  creatorId: string;
  type: ProductType;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  fileUrl?: string;
  fileName?: string;
  externalUrl?: string;
  buttonText?: string;
  isPublished: boolean;
  isFeatured: boolean;
  displayOrder: number;
  soldCount: number;
  stock?: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type ShippingStatus = 'UNFULFILLED' | 'SHIPPING' | 'COMPLETED';

export type Order = {
  id: string;
  orderCode: string; // e.g. TN10823
  creatorId: string;
  productId: string;
  productTitle: string;
  productType: ProductType;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  customerNote?: string;
  status: OrderStatus;
  shippingStatus?: ShippingStatus;
  paymentMethod: 'VIETQR';
  paidAt?: string;
  downloadUrl?: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  creatorId: string;
  name: string;
  email: string;
  phone: string;
  sourceProduct: string;
  sourceType: 'LEAD_MAGNET' | 'PURCHASE';
  totalSpent: number;
  ordersCount: number;
  createdAt: string;
};

export type PaymentConfig = {
  bankId: string; // e.g. MB, VCB, TCB
  bankName: string;
  accountNumber: string;
  accountName: string;
  provider: 'payOS' | 'SePay';
  apiKey: string;
  checksumKey: string;
  webhookUrl: string;
  isActive: boolean;
  lastPingTestAt?: string;
};

export type BankInfo = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  bin: string;
  logo: string;
};

export const VIETNAMESE_BANKS: BankInfo[] = [
  {
    id: 'MB',
    code: 'MBBANK',
    name: 'Ngân hàng TMCP Quân Đội',
    shortName: 'MB Bank',
    bin: '970422',
    logo: 'https://api.vietqr.io/img/MB.png'
  },
  {
    id: 'VCB',
    code: 'VIETCOMBANK',
    name: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
    shortName: 'Vietcombank',
    bin: '970436',
    logo: 'https://api.vietqr.io/img/VCB.png'
  },
  {
    id: 'TCB',
    code: 'TECHCOMBANK',
    name: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
    shortName: 'Techcombank',
    bin: '970407',
    logo: 'https://api.vietqr.io/img/TCB.png'
  },
  {
    id: 'ACB',
    code: 'ACB',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    bin: '970416',
    logo: 'https://api.vietqr.io/img/ACB.png'
  },
  {
    id: 'VPB',
    code: 'VPBANK',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    shortName: 'VPBank',
    bin: '970432',
    logo: 'https://api.vietqr.io/img/VPB.png'
  },
  {
    id: 'TPB',
    code: 'TPBANK',
    name: 'Ngân hàng TMCP Tiên Phong',
    shortName: 'TPBank',
    bin: '970423',
    logo: 'https://api.vietqr.io/img/TPB.png'
  },
  {
    id: 'BIDV',
    code: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển VN',
    shortName: 'BIDV',
    bin: '970418',
    logo: 'https://api.vietqr.io/img/BIDV.png'
  },
  {
    id: 'CTG',
    code: 'VIETINBANK',
    name: 'Ngân hàng TMCP Công Thương Việt Nam',
    shortName: 'VietinBank',
    bin: '970415',
    logo: 'https://api.vietqr.io/img/CTG.png'
  },
  {
    id: 'OCB',
    code: 'OCB',
    name: 'Ngân hàng TMCP Phương Đông',
    shortName: 'OCB',
    bin: '970448',
    logo: 'https://api.vietqr.io/img/OCB.png'
  },
  {
    id: 'VIB',
    code: 'VIB',
    name: 'Ngân hàng TMCP Quốc tế Việt Nam',
    shortName: 'VIB',
    bin: '970441',
    logo: 'https://api.vietqr.io/img/VIB.png'
  },
  {
    id: 'STB',
    code: 'SACOMBANK',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    shortName: 'Sacombank',
    bin: '970403',
    logo: 'https://api.vietqr.io/img/STB.png'
  }
];

// ==========================================
// 2. INITIAL MOCK DATABASE
// ==========================================

export const defaultCreatorProfile: CreatorProfile = {
  id: 'creator-giangdinh',
  username: 'giangdinh',
  displayName: 'Giang Định',
  bio: 'Xây dựng sản phẩm số & tự do tài chính. Chia sẻ template Notion, ebook & kiến thức thực chiến.',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
  coverUrl:
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  verified: true,
  theme: 'obsidian',
  socials: {
    tiktok: 'https://tiktok.com/@giangdinh',
    instagram: 'https://instagram.com/giangdinh',
    youtube: 'https://youtube.com/@giangdinh',
    threads: 'https://threads.net/@giangdinh',
    facebook: 'https://facebook.com/giangdinh',
    zalo: 'https://zalo.me/0988667788'
  }
};

export const defaultPaymentConfig: PaymentConfig = {
  bankId: 'MB',
  bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
  accountNumber: '0988667788',
  accountName: 'DINH VAN GIANG',
  provider: 'payOS',
  apiKey: 'pos_live_3992019488bfa0',
  checksumKey: 'cs_88302019bcae8841',
  webhookUrl: 'https://tiemnho.vn/api/webhooks/vietqr',
  isActive: true,
  lastPingTestAt: '2026-10-14T08:30:00.000Z'
};

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    creatorId: 'creator-giangdinh',
    type: 'DIGITAL',
    title: 'Kho Template Notion Quản Lý Cuộc Sống & Tài Chính (PARA System)',
    description:
      'Hệ thống quản lý Notion tinh gọn: quản lý dự án, chi tiêu cá nhân, thói quen và mục tiêu năm. Kèm video hướng dẫn thiết lập 20 phút.',
    price: 149000,
    originalPrice: 299000,
    coverImage:
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://notion.so/giangdinh/para-mastery-template-download',
    fileName: 'Notion-PARA-Mastery-Guide.pdf',
    isPublished: true,
    isFeatured: true,
    displayOrder: 1,
    soldCount: 142,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-10-12T14:20:00.000Z'
  },
  {
    id: 'prod-2',
    creatorId: 'creator-giangdinh',
    type: 'LEAD_MAGNET',
    title: 'Ebook: 7 Bước Tạo Thu Nhập $1,000 Đầu Tiên Từ Sản Phẩm Số (0đ)',
    description:
      'Bản hướng dẫn chi tiết cách đóng gói kiến thức thành Ebook, Template Notion và Preset bán tự động 24/7 bằng VietQR.',
    price: 0,
    coverImage:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    fileUrl: 'https://tiemnho.vn/downloads/7-buoc-tao-thu-nhap-san-pham-so.pdf',
    fileName: '7-Buoc-Tao-Thu-Nhap-Creator-2026.pdf',
    isPublished: true,
    isFeatured: true,
    displayOrder: 2,
    soldCount: 389,
    createdAt: '2026-09-05T08:00:00.000Z',
    updatedAt: '2026-10-10T09:15:00.000Z'
  },
  {
    id: 'prod-3',
    creatorId: 'creator-giangdinh',
    type: 'PHYSICAL',
    title: 'Sổ Tay Lập Kế Hoạch 90 Ngày & Bút Ký Kim Loại (Có Chữ Ký)',
    description:
      'Sổ bìa da PU cao cấp, giấy chống lóa 100gsm, thiết kế layout độc quyền giúp tập trung và đạt mục tiêu nhanh hơn x3 lần.',
    price: 189000,
    originalPrice: 249000,
    coverImage:
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    stock: 45,
    isPublished: true,
    isFeatured: false,
    displayOrder: 3,
    soldCount: 38,
    createdAt: '2026-09-12T11:30:00.000Z',
    updatedAt: '2026-10-11T16:00:00.000Z'
  },
  {
    id: 'prod-4',
    creatorId: 'creator-giangdinh',
    type: 'EXTERNAL_LINK',
    title: 'Tham Gia Nhóm Kín Zalo: Creator Lab Việt Nam',
    description:
      'Cộng đồng 3.200+ content creator cùng nhau thảo luận, review storefront và chia sẻ kinh nghiệm kiếm tiền tự động.',
    price: 0,
    coverImage:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    externalUrl: 'https://zalo.me/g/creatorvietnam',
    buttonText: 'Vào nhóm Zalo miễn phí',
    isPublished: true,
    isFeatured: false,
    displayOrder: 4,
    soldCount: 520,
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-10-13T10:00:00.000Z'
  }
];

const initialOrders: Order[] = [
  {
    id: 'ord-10823',
    orderCode: 'TN10823',
    creatorId: 'creator-giangdinh',
    productId: 'prod-1',
    productTitle: 'Kho Template Notion Quản Lý Cuộc Sống & Tài Chính (PARA System)',
    productType: 'DIGITAL',
    amount: 149000,
    customerName: 'Nguyễn Văn An',
    customerEmail: 'vanan.nguyen@gmail.com',
    customerPhone: '0912345678',
    status: 'PAID',
    paymentMethod: 'VIETQR',
    paidAt: '2026-10-14T07:15:22.000Z',
    downloadUrl: 'https://notion.so/giangdinh/para-mastery-template-download',
    createdAt: '2026-10-14T07:14:10.000Z'
  },
  {
    id: 'ord-10824',
    orderCode: 'TN10824',
    creatorId: 'creator-giangdinh',
    productId: 'prod-3',
    productTitle: 'Sổ Tay Lập Kế Hoạch 90 Ngày & Bút Ký Kim Loại (Có Chữ Ký)',
    productType: 'PHYSICAL',
    amount: 189000,
    customerName: 'Trần Thị Mai',
    customerEmail: 'maitt.designer@gmail.com',
    customerPhone: '0988776655',
    shippingAddress: 'Số 45, Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    customerNote: 'Kèm chữ ký chúc may mắn giúp mình nhé!',
    status: 'PAID',
    shippingStatus: 'SHIPPING',
    paymentMethod: 'VIETQR',
    paidAt: '2026-10-13T16:20:00.000Z',
    createdAt: '2026-10-13T16:18:30.000Z'
  },
  {
    id: 'ord-10825',
    orderCode: 'TN10825',
    creatorId: 'creator-giangdinh',
    productId: 'prod-1',
    productTitle: 'Kho Template Notion Quản Lý Cuộc Sống & Tài Chính (PARA System)',
    productType: 'DIGITAL',
    amount: 149000,
    customerName: 'Lê Hoàng Nam',
    customerEmail: 'namle.developer@gmail.com',
    customerPhone: '0903456789',
    status: 'PAID',
    paymentMethod: 'VIETQR',
    paidAt: '2026-10-13T11:45:12.000Z',
    downloadUrl: 'https://notion.so/giangdinh/para-mastery-template-download',
    createdAt: '2026-10-13T11:43:00.000Z'
  },
  {
    id: 'ord-10826',
    orderCode: 'TN10826',
    creatorId: 'creator-giangdinh',
    productId: 'prod-3',
    productTitle: 'Sổ Tay Lập Kế Hoạch 90 Ngày & Bút Ký Kim Loại (Có Chữ Ký)',
    productType: 'PHYSICAL',
    amount: 189000,
    customerName: 'Phạm Minh Khoa',
    customerEmail: 'khoa.pm@outlook.com',
    customerPhone: '0977123456',
    shippingAddress: 'Tòa nhà Landmark 81, P.22, Q. Bình Thạnh, TP. HCM',
    customerNote: 'Giao giờ hành chính',
    status: 'PAID',
    shippingStatus: 'UNFULFILLED',
    paymentMethod: 'VIETQR',
    paidAt: '2026-10-14T06:10:00.000Z',
    createdAt: '2026-10-14T06:08:15.000Z'
  },
  {
    id: 'ord-10827',
    orderCode: 'TN10827',
    creatorId: 'creator-giangdinh',
    productId: 'prod-1',
    productTitle: 'Kho Template Notion Quản Lý Cuộc Sống & Tài Chính (PARA System)',
    productType: 'DIGITAL',
    amount: 149000,
    customerName: 'Đỗ Quỳnh Trang',
    customerEmail: 'trangdq@gmail.com',
    customerPhone: '0934567890',
    status: 'PENDING',
    paymentMethod: 'VIETQR',
    createdAt: '2026-10-14T09:02:10.000Z'
  },
  {
    id: 'ord-10828',
    orderCode: 'TN10828',
    creatorId: 'creator-giangdinh',
    productId: 'prod-3',
    productTitle: 'Sổ Tay Lập Kế Hoạch 90 Ngày & Bút Ký Kim Loại (Có Chữ Ký)',
    productType: 'PHYSICAL',
    amount: 189000,
    customerName: 'Vũ Hải Đăng',
    customerEmail: 'dangvh@fpt.edu.vn',
    customerPhone: '0966889900',
    shippingAddress: 'Số 12 ngõ 89 Xuân Thủy, Cầu Giấy, Hà Nội',
    status: 'PAID',
    shippingStatus: 'COMPLETED',
    paymentMethod: 'VIETQR',
    paidAt: '2026-10-12T14:30:00.000Z',
    createdAt: '2026-10-12T14:28:00.000Z'
  }
];

const initialLeads: Lead[] = [
  {
    id: 'lead-1',
    creatorId: 'creator-giangdinh',
    name: 'Nguyễn Văn An',
    email: 'vanan.nguyen@gmail.com',
    phone: '0912345678',
    sourceProduct: 'Kho Template Notion (PARA)',
    sourceType: 'PURCHASE',
    totalSpent: 149000,
    ordersCount: 1,
    createdAt: '2026-10-14T07:15:22.000Z'
  },
  {
    id: 'lead-2',
    creatorId: 'creator-giangdinh',
    name: 'Trần Thị Mai',
    email: 'maitt.designer@gmail.com',
    phone: '0988776655',
    sourceProduct: 'Sổ Tay Lập Kế Hoạch 90 Ngày',
    sourceType: 'PURCHASE',
    totalSpent: 189000,
    ordersCount: 1,
    createdAt: '2026-10-13T16:20:00.000Z'
  },
  {
    id: 'lead-3',
    creatorId: 'creator-giangdinh',
    name: 'Võ Thanh Tùng',
    email: 'tung.vo@startup.vn',
    phone: '0918273645',
    sourceProduct: 'Ebook: 7 Bước Tạo Thu Nhập $1,000 Đầu Tiên',
    sourceType: 'LEAD_MAGNET',
    totalSpent: 0,
    ordersCount: 0,
    createdAt: '2026-10-14T05:30:10.000Z'
  },
  {
    id: 'lead-4',
    creatorId: 'creator-giangdinh',
    name: 'Bùi Phương Anh',
    email: 'phuonganh.bui@agency.com',
    phone: '0945678123',
    sourceProduct: 'Ebook: 7 Bước Tạo Thu Nhập $1,000 Đầu Tiên',
    sourceType: 'LEAD_MAGNET',
    totalSpent: 0,
    ordersCount: 0,
    createdAt: '2026-10-13T20:10:00.000Z'
  },
  {
    id: 'lead-5',
    creatorId: 'creator-giangdinh',
    name: 'Lê Hoàng Nam',
    email: 'namle.developer@gmail.com',
    phone: '0903456789',
    sourceProduct: 'Kho Template Notion (PARA)',
    sourceType: 'PURCHASE',
    totalSpent: 149000,
    ordersCount: 1,
    createdAt: '2026-10-13T11:45:12.000Z'
  }
];

// ==========================================
// 3. FAKE DATABASE SINGLETON
// ==========================================

export const fakeTiemNhoDb = {
  profile: { ...defaultCreatorProfile },
  paymentConfig: { ...defaultPaymentConfig },
  products: [...initialProducts],
  orders: [...initialOrders],
  leads: [...initialLeads],

  // Profile
  async getProfile(): Promise<CreatorProfile> {
    await delay(200);
    return { ...this.profile };
  },

  async updateProfile(updates: Partial<CreatorProfile>): Promise<CreatorProfile> {
    await delay(300);
    this.profile = {
      ...this.profile,
      ...updates,
      socials: {
        ...this.profile.socials,
        ...(updates.socials || {})
      }
    };
    return { ...this.profile };
  },

  // Payment Settings
  async getPaymentConfig(): Promise<PaymentConfig> {
    await delay(200);
    return { ...this.paymentConfig };
  },

  async updatePaymentConfig(updates: Partial<PaymentConfig>): Promise<PaymentConfig> {
    await delay(350);
    this.paymentConfig = {
      ...this.paymentConfig,
      ...updates
    };
    return { ...this.paymentConfig };
  },

  async pingTest(): Promise<{
    success: boolean;
    message: string;
    simulatedOrderCode: string;
    amount: number;
    time: string;
  }> {
    await delay(600);
    const testCode = `TN${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();
    this.paymentConfig.lastPingTestAt = now;

    // Add simulated test order
    const testOrder: Order = {
      id: `ord-${Date.now()}`,
      orderCode: testCode,
      creatorId: this.profile.id,
      productId: 'prod-1',
      productTitle: 'Kho Template Notion (Ping Test Giao Dịch Thử)',
      productType: 'DIGITAL',
      amount: 10000,
      customerName: 'Kiểm Tra Webhook PayOS/SePay',
      customerEmail: 'webhook-test@tiemnho.vn',
      customerPhone: '0999999999',
      status: 'PAID',
      paymentMethod: 'VIETQR',
      paidAt: now,
      downloadUrl: 'https://notion.so/giangdinh/para-mastery-template-download',
      createdAt: now
    };
    this.orders.unshift(testOrder);

    return {
      success: true,
      message: `Kết nối thành công! Nhận biến động số dư 10.000đ từ cổng ${this.paymentConfig.provider} vào tài khoản ${this.paymentConfig.accountNumber}.`,
      simulatedOrderCode: testCode,
      amount: 10000,
      time: now
    };
  },

  // Products
  async getProducts(filters?: {
    type?: string;
    search?: string;
    publishedOnly?: boolean;
  }): Promise<Product[]> {
    await delay(250);
    let list = [...this.products].sort((a, b) => a.displayOrder - b.displayOrder);

    if (filters?.publishedOnly) {
      list = list.filter((p) => p.isPublished);
    }
    if (filters?.type && filters.type !== 'ALL') {
      list = list.filter((p) => p.type === filters.type);
    }
    if (filters?.search) {
      list = matchSorter(list, filters.search, { keys: ['title', 'description'] });
    }
    return list;
  },

  async getProductById(id: string): Promise<Product | null> {
    await delay(200);
    const p = this.products.find((item) => item.id === id);
    return p ? { ...p } : null;
  },

  async createProduct(
    data: Omit<
      Product,
      'id' | 'createdAt' | 'updatedAt' | 'soldCount' | 'displayOrder' | 'creatorId'
    >
  ): Promise<Product> {
    await delay(400);
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      creatorId: this.profile.id,
      soldCount: 0,
      displayOrder: this.products.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.products.push(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    await delay(350);
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Product ${id} not found`);

    this.products[index] = {
      ...this.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return { ...this.products[index] };
  },

  async deleteProduct(id: string): Promise<boolean> {
    await delay(300);
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    return this.products.length < initialLen;
  },

  async reorderProducts(orderedIds: string[]): Promise<Product[]> {
    await delay(200);
    orderedIds.forEach((id, index) => {
      const prod = this.products.find((p) => p.id === id);
      if (prod) prod.displayOrder = index + 1;
    });
    return this.getProducts();
  },

  // Orders
  async getOrders(filters?: { status?: string; search?: string; type?: string }): Promise<Order[]> {
    await delay(300);
    let list = [...this.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.type && filters.type !== 'ALL') {
      list = list.filter((o) => o.productType === filters.type);
    }
    if (filters?.search) {
      list = matchSorter(list, filters.search, {
        keys: ['orderCode', 'customerName', 'customerEmail', 'customerPhone', 'productTitle']
      });
    }
    return list;
  },

  async getOrderById(id: string): Promise<Order | null> {
    await delay(200);
    const o = this.orders.find((item) => item.id === id || item.orderCode === id);
    return o ? { ...o } : null;
  },

  async createOrder(data: {
    productId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress?: string;
    customerNote?: string;
  }): Promise<Order> {
    await delay(400);
    const product = this.products.find((p) => p.id === data.productId);
    if (!product) throw new Error('Sản phẩm không tồn tại');

    const orderCode = `TN${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();
    const isFree = product.price === 0;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderCode,
      creatorId: this.profile.id,
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
      paidAt: isFree ? now : undefined,
      downloadUrl: product.fileUrl,
      createdAt: now
    };

    this.orders.unshift(newOrder);

    // Save lead
    const existingLead = this.leads.find(
      (l) => l.email.toLowerCase() === data.customerEmail.toLowerCase()
    );
    if (existingLead) {
      existingLead.totalSpent += product.price;
      existingLead.ordersCount += 1;
      existingLead.phone = data.customerPhone || existingLead.phone;
    } else {
      this.leads.unshift({
        id: `lead-${Date.now()}`,
        creatorId: this.profile.id,
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
        sourceProduct: product.title,
        sourceType: isFree ? 'LEAD_MAGNET' : 'PURCHASE',
        totalSpent: product.price,
        ordersCount: 1,
        createdAt: now
      });
    }

    if (isFree) {
      product.soldCount += 1;
    }

    return newOrder;
  },

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    shippingStatus?: ShippingStatus
  ): Promise<Order> {
    await delay(300);
    const order = this.orders.find((o) => o.id === id || o.orderCode === id);
    if (!order) throw new Error(`Order ${id} not found`);

    order.status = status;
    if (shippingStatus) order.shippingStatus = shippingStatus;
    if (status === 'PAID' && !order.paidAt) {
      order.paidAt = new Date().toISOString();
      // increment product sold count
      const prod = this.products.find((p) => p.id === order.productId);
      if (prod) prod.soldCount += 1;
    }
    return { ...order };
  },

  // Leads
  async getLeads(search?: string): Promise<Lead[]> {
    await delay(250);
    let list = [...this.leads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (search) {
      list = matchSorter(list, search, { keys: ['name', 'email', 'phone', 'sourceProduct'] });
    }
    return list;
  },

  // Overview / Analytics
  async getDashboardAnalytics() {
    await delay(300);
    const paidOrders = this.orders.filter((o) => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = paidOrders.length;
    const totalLeads = this.leads.length;
    const pendingOrders = this.orders.filter((o) => o.status === 'PENDING').length;

    // Daily revenue chart data (last 7 days)
    const chartData = [
      { date: '08/10', revenue: 298000, orders: 2 },
      { date: '09/10', revenue: 447000, orders: 3 },
      { date: '10/10', revenue: 149000, orders: 1 },
      { date: '11/10', revenue: 527000, orders: 3 },
      { date: '12/10', revenue: 338000, orders: 2 },
      { date: '13/10', revenue: 487000, orders: 3 },
      { date: '14/10', revenue: 348000, orders: 2 }
    ];

    return {
      totalRevenue,
      totalOrders,
      totalLeads,
      pendingOrders,
      chartData,
      recentOrders: this.orders.slice(0, 5)
    };
  }
};

// VietQR Quicklink Generator helper
export function generateVietQrUrl({
  bankId,
  accountNumber,
  accountName,
  amount,
  orderCode
}: {
  bankId: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  orderCode: string;
}) {
  const encodedName = encodeURIComponent(accountName.trim().toUpperCase());
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${orderCode}&accountName=${encodedName}`;
}
