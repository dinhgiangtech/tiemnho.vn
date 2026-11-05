import PageContainer from '@/components/layout/page-container';
import { getProfile, getProducts, getPaymentConfig } from '@/features/tiemnho/api/service';
import { LivePreviewContainer } from '@/features/tiemnho/components/mobile-preview/live-preview-container';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Xem trước tiệm | Tiệm Nhỏ'
};

export default async function PreviewPage() {
  const [profile, products, paymentConfig] = await Promise.all([
    getProfile(),
    getProducts(),
    getPaymentConfig()
  ]);

  return (
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
      <div className='flex flex-col items-center justify-center py-2 w-full'>
        <LivePreviewContainer
          profile={profile}
          products={products}
          paymentConfig={paymentConfig}
          className='w-full'
        />
      </div>
    </PageContainer>
  );
}
