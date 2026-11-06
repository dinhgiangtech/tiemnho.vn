import PageContainer from '@/components/layout/page-container';
import { CreateProductView } from '@/features/tiemnho/components/products/create-product-view';
import { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  profileQueryOptions,
  paymentConfigQueryOptions,
  productsQueryOptions
} from '@/features/tiemnho/api/queries';

export const metadata: Metadata = {
  title: 'Tạo sản phẩm mới | Tiệm Nhỏ'
};

export default async function CreateProductPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(profileQueryOptions());
  void queryClient.prefetchQuery(paymentConfigQueryOptions());
  void queryClient.prefetchQuery(productsQueryOptions());

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CreateProductView />
      </HydrationBoundary>
    </PageContainer>
  );
}
