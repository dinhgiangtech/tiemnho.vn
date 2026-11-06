import PageContainer from '@/components/layout/page-container';
import { OrdersTable } from '@/features/tiemnho/components/orders/orders-table';
import { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ordersQueryOptions } from '@/features/tiemnho/api/queries';

export const metadata: Metadata = {
  title: 'Doanh thu & Đơn hàng | Tiệm Nhỏ'
};

export default async function OrdersPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(ordersQueryOptions());

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OrdersTable />
      </HydrationBoundary>
    </PageContainer>
  );
}
