import { queryOptions } from '@tanstack/react-query';
import {
  getProfile,
  getPaymentConfig,
  getProducts,
  getProductById,
  getOrders,
  getOrderById,
  getLeads,
  getDashboardAnalytics
} from './service';
import type { ProductFilterParams, OrderFilterParams } from './types';

export const tiemNhoKeys = {
  all: ['tiemnho'] as const,
  profile: () => [...tiemNhoKeys.all, 'profile'] as const,
  paymentConfig: () => [...tiemNhoKeys.all, 'payment-config'] as const,
  products: (filters?: ProductFilterParams) => [...tiemNhoKeys.all, 'products', filters] as const,
  productDetail: (id: string) => [...tiemNhoKeys.all, 'product', id] as const,
  orders: (filters?: OrderFilterParams) => [...tiemNhoKeys.all, 'orders', filters] as const,
  orderDetail: (id: string) => [...tiemNhoKeys.all, 'order', id] as const,
  leads: (search?: string) => [...tiemNhoKeys.all, 'leads', search] as const,
  analytics: () => [...tiemNhoKeys.all, 'analytics'] as const
};

export const profileQueryOptions = () =>
  queryOptions({
    queryKey: tiemNhoKeys.profile(),
    queryFn: () => getProfile()
  });

export const paymentConfigQueryOptions = () =>
  queryOptions({
    queryKey: tiemNhoKeys.paymentConfig(),
    queryFn: () => getPaymentConfig()
  });

export const productsQueryOptions = (filters?: ProductFilterParams) =>
  queryOptions({
    queryKey: tiemNhoKeys.products(filters),
    queryFn: () => getProducts(filters)
  });

export const productByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: tiemNhoKeys.productDetail(id),
    queryFn: () => getProductById(id)
  });

export const ordersQueryOptions = (filters?: OrderFilterParams) =>
  queryOptions({
    queryKey: tiemNhoKeys.orders(filters),
    queryFn: () => getOrders(filters)
  });

export const orderByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: tiemNhoKeys.orderDetail(id),
    queryFn: () => getOrderById(id)
  });

export const leadsQueryOptions = (search?: string) =>
  queryOptions({
    queryKey: tiemNhoKeys.leads(search),
    queryFn: () => getLeads(search)
  });

export const analyticsQueryOptions = () =>
  queryOptions({
    queryKey: tiemNhoKeys.analytics(),
    queryFn: () => getDashboardAnalytics()
  });
