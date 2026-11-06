import PageContainer from '@/components/layout/page-container';
import { StorefrontSettingsView } from '@/features/tiemnho/components/settings/storefront-settings-view';
import { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  profileQueryOptions,
  productsQueryOptions,
  paymentConfigQueryOptions
} from '@/features/tiemnho/api/queries';

export const metadata: Metadata = {
  title: 'Thiết kế tiệm | Tiệm Nhỏ'
};

export default async function StorefrontSettingsPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(profileQueryOptions());
  void queryClient.prefetchQuery(productsQueryOptions());
  void queryClient.prefetchQuery(paymentConfigQueryOptions());

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StorefrontSettingsView />
      </HydrationBoundary>
    </PageContainer>
  );
}
