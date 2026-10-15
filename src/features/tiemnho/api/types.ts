export type {
  Product,
  ProductType,
  Order,
  OrderStatus,
  ShippingStatus,
  Lead,
  CreatorProfile,
  PaymentConfig,
  BankInfo
} from '@/constants/mock-tiemnho';

export type ProductFilterParams = {
  type?: string;
  search?: string;
  publishedOnly?: boolean;
};

export type OrderFilterParams = {
  status?: string;
  type?: string;
  search?: string;
};

export type CreateProductInput = {
  type: import('@/constants/mock-tiemnho').ProductType;
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
  stock?: number;
};

export type CreateOrderInput = {
  productId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string;
  customerNote?: string;
};
