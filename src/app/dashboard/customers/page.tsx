import PageContainer from '@/components/layout/page-container';
import { LeadsTable } from '@/features/tiemnho/components/leads/leads-table';
import { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { leadsQueryOptions } from '@/features/tiemnho/api/queries';

export const metadata: Metadata = {
  title: 'Khách hàng | Tiệm Nhỏ'
};

export default async function CustomersPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(leadsQueryOptions());

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <LeadsTable />
      </HydrationBoundary>
    </PageContainer>
  );
}
