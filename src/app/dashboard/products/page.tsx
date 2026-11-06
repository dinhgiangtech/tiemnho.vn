import PageContainer from '@/components/layout/page-container';
import { ProductsManagementView } from '@/features/tiemnho/components/products/products-management-view';
import { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  productsQueryOptions,
  profileQueryOptions,
  paymentConfigQueryOptions
} from '@/features/tiemnho/api/queries';

export const metadata: Metadata = {
  title: 'Tiệm của bạn | Tiệm Nhỏ'
};

export default async function ProductsPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(productsQueryOptions());
  void queryClient.prefetchQuery(profileQueryOptions());
  void queryClient.prefetchQuery(paymentConfigQueryOptions());

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductsManagementView />
      </HydrationBoundary>
    </PageContainer>
  );
}
