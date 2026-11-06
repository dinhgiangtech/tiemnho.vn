import PageContainer from '@/components/layout/page-container';
import { PaymentSettingsView } from '@/features/tiemnho/components/settings/payment-settings-view';
import { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { paymentConfigQueryOptions } from '@/features/tiemnho/api/queries';

export const metadata: Metadata = {
  title: 'Nhận tiền QR | Tiệm Nhỏ'
};

export default async function SettingsPaymentPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(paymentConfigQueryOptions());

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PaymentSettingsView />
      </HydrationBoundary>
    </PageContainer>
  );
}
