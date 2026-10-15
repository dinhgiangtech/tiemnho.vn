import {
  fakeTiemNhoDb,
  Product,
  Order,
  Lead,
  CreatorProfile,
  PaymentConfig,
  OrderStatus,
  ShippingStatus
} from '@/constants/mock-tiemnho';
import type {
  ProductFilterParams,
  OrderFilterParams,
  CreateProductInput,
  CreateOrderInput
} from './types';

// Profile
export async function getProfile(): Promise<CreatorProfile> {
  return fakeTiemNhoDb.getProfile();
}

export async function updateProfile(updates: Partial<CreatorProfile>): Promise<CreatorProfile> {
  return fakeTiemNhoDb.updateProfile(updates);
}

// Payment Settings
export async function getPaymentConfig(): Promise<PaymentConfig> {
  return fakeTiemNhoDb.getPaymentConfig();
}

export async function updatePaymentConfig(updates: Partial<PaymentConfig>): Promise<PaymentConfig> {
  return fakeTiemNhoDb.updatePaymentConfig(updates);
}

export async function pingTest() {
  return fakeTiemNhoDb.pingTest();
}

// Products
export async function getProducts(filters?: ProductFilterParams): Promise<Product[]> {
  return fakeTiemNhoDb.getProducts(filters);
}

export async function getProductById(id: string): Promise<Product | null> {
  return fakeTiemNhoDb.getProductById(id);
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  return fakeTiemNhoDb.createProduct(data);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  return fakeTiemNhoDb.updateProduct(id, updates);
}

export async function deleteProduct(id: string): Promise<boolean> {
  return fakeTiemNhoDb.deleteProduct(id);
}

export async function reorderProducts(ids: string[]): Promise<Product[]> {
  return fakeTiemNhoDb.reorderProducts(ids);
}

// Orders
export async function getOrders(filters?: OrderFilterParams): Promise<Order[]> {
  return fakeTiemNhoDb.getOrders(filters);
}

export async function getOrderById(id: string): Promise<Order | null> {
  return fakeTiemNhoDb.getOrderById(id);
}

export async function createOrder(data: CreateOrderInput): Promise<Order> {
  return fakeTiemNhoDb.createOrder(data);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  shippingStatus?: ShippingStatus
): Promise<Order> {
  return fakeTiemNhoDb.updateOrderStatus(id, status, shippingStatus);
}

// Leads
export async function getLeads(search?: string): Promise<Lead[]> {
  return fakeTiemNhoDb.getLeads(search);
}

// Dashboard Analytics
export async function getDashboardAnalytics() {
  return fakeTiemNhoDb.getDashboardAnalytics();
}
