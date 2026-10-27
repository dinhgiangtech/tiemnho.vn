import PageContainer from '@/components/layout/page-container';
import { getProfile, getProducts, getPaymentConfig } from '@/features/tiemnho/api/service';
import { PhoneMockup } from '@/features/tiemnho/components/mobile-preview/phone-mockup';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Metadata } from 'next';
import Link from 'next/link';

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
      pageTitle='Xem trước tiệm của bạn'
      pageDescription='Trải nghiệm tiệm của bạn chính xác như người mua nhìn thấy trên điện thoại hoặc trình duyệt in-app (TikTok, Reels, Threads).'
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
      <div className='flex flex-col items-center justify-center py-4 space-y-6'>
        <div className='flex items-center gap-2 p-2 rounded-2xl bg-muted/50 border border-border text-xs text-muted-foreground'>
          <Icons.deviceMobile className='h-4 w-4 text-primary' />
          <span>
            Mô phỏng iPhone 16 Pro • Màn hình có thể cuộn, bấm sản phẩm và test VietQR trực tiếp
          </span>
        </div>

        <PhoneMockup profile={profile} products={products} paymentConfig={paymentConfig} />
      </div>
    </PageContainer>
  );
}
