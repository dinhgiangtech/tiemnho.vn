import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  updateProfile,
  updatePaymentConfig,
  pingTest,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  createOrder,
  updateOrderStatus
} from './service';
import { tiemNhoKeys } from './queries';
import type {
  CreateProductInput,
  CreateOrderInput,
  CreatorProfile,
  PaymentConfig,
  Product,
  OrderStatus,
  ShippingStatus
} from './types';

export const updateProfileMutation = mutationOptions({
  mutationFn: (data: Partial<CreatorProfile>) => updateProfile(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tiemNhoKeys.profile() });
  }
});

export const updatePaymentConfigMutation = mutationOptions({
  mutationFn: (data: Partial<PaymentConfig>) => updatePaymentConfig(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tiemNhoKeys.paymentConfig() });
  }
});

export const pingTestMutation = mutationOptions({
  mutationFn: () => pingTest(),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: tiemNhoKeys.paymentConfig() });
    qc.invalidateQueries({ queryKey: tiemNhoKeys.orders() });
    qc.invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
  }
});

export const createProductMutation = mutationOptions({
  mutationFn: (data: CreateProductInput) => createProduct(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tiemNhoKeys.products() });
    getQueryClient().invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
  }
});

export const updateProductMutation = mutationOptions({
  mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
    updateProduct(id, updates),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tiemNhoKeys.products() });
  }
});

export const deleteProductMutation = mutationOptions({
  mutationFn: (id: string) => deleteProduct(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tiemNhoKeys.products() });
  }
});

export const reorderProductsMutation = mutationOptions({
  mutationFn: (ids: string[]) => reorderProducts(ids),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tiemNhoKeys.products() });
  }
});

export const createOrderMutation = mutationOptions({
  mutationFn: (data: CreateOrderInput) => createOrder(data),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: tiemNhoKeys.orders() });
    qc.invalidateQueries({ queryKey: tiemNhoKeys.leads() });
    qc.invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
  }
});

export const updateOrderStatusMutation = mutationOptions({
  mutationFn: ({
    id,
    status,
    shippingStatus
  }: {
    id: string;
    status: OrderStatus;
    shippingStatus?: ShippingStatus;
  }) => updateOrderStatus(id, status, shippingStatus),
  onSuccess: () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: tiemNhoKeys.orders() });
    qc.invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
  }
});
