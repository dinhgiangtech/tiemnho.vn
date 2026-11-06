import PageContainer from '@/components/layout/page-container';
import { PreviewView } from '@/features/tiemnho/components/preview/preview-view';
import { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  profileQueryOptions,
  productsQueryOptions,
  paymentConfigQueryOptions
} from '@/features/tiemnho/api/queries';
import { getProfile } from '@/features/tiemnho/api/service';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Xem trước tiệm | Tiệm Nhỏ'
};

export default async function PreviewPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(profileQueryOptions());
  void queryClient.prefetchQuery(productsQueryOptions());
  void queryClient.prefetchQuery(paymentConfigQueryOptions());

  const profile = await getProfile();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContainer
        pageHeaderAction={
          <div className='flex items-center gap-2'>
            <a href={`/@${profile.username}`} target='_blank' rel='noreferrer'>
              <Button size='sm' className='h-9 text-xs gap-1.5 rounded-xl font-semibold'>
                <Icons.externalLink className='h-3.5 w-3.5' />
                Ghé tiệm thực tế
              </Button>
            </a>
          </div>
        }
      >
        <PreviewView />
      </PageContainer>
    </HydrationBoundary>
  );
}
