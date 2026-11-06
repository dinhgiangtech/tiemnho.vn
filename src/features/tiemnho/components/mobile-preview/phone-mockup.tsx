'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { ResponsiveStorefrontView } from '../storefront/responsive-storefront-view';
import { ProductDetailView } from '../storefront/product-detail-view';
import { ProductCard } from '../storefront/product-card';
import { ProfileHeader } from '../storefront/profile-header';
import { Logo } from '@/components/common/logo';
import { Lock } from 'lucide-react';

interface PhoneMockupProps {
  profile: CreatorProfile;
  products: Product[];
  paymentConfig: PaymentConfig;
  className?: string;
  previewView?: 'storefront' | 'detail';
  deviceMode?: 'mobile' | 'desktop';
  activeProduct?: Product;
}

export function PhoneMockup({
  profile,
  products,
  paymentConfig,
  className,
  previewView = 'storefront',
  deviceMode = 'mobile',
  activeProduct
}: PhoneMockupProps) {
  const currentProduct = activeProduct || products[0];
  const [desktopSelectedProduct, setDesktopSelectedProduct] = React.useState<Product | null>(null);

  // Khi activeProduct thay đổi và ở tab detail, đồng bộ sản phẩm đang xem
  const activeDetailProduct = previewView === 'detail' ? currentProduct : desktopSelectedProduct;

  // =========================================================================
  // 1. CHẾ ĐỘ MÁY TÍNH (DESKTOP MOCKUP)
  // =========================================================================
  if (deviceMode === 'desktop') {
    return (
      <div className={`relative mx-auto flex justify-center select-none w-full ${className || ''}`}>
        <div className='relative w-full max-w-[460px] xl:max-w-[500px] h-[690px] rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-card shadow-[0_20px_50px_-10px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col [transform:translateZ(0)]'>
          {/* Browser Header Bar */}
          <div className='h-9 bg-neutral-100 dark:bg-neutral-800 px-3.5 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 shrink-0'>
            {/* 3 nút macOS */}
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 rounded-full bg-[#FF5F56]' />
              <div className='w-2.5 h-2.5 rounded-full bg-[#FFBD2E]' />
              <div className='w-2.5 h-2.5 rounded-full bg-[#27C93F]' />
            </div>

            {/* Thanh địa chỉ URL giả lập */}
            <div className='flex-1 max-w-[240px] mx-auto h-6 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-2 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 font-mono truncate'>
              <Lock className='w-2.5 h-2.5 text-neutral-400 shrink-0' />
              <span className='truncate'>tiemnho.com/@{profile.username || 'creator'}</span>
            </div>
          </div>

          {/* Nội dung màn hình máy tính */}
          <div className='flex-1 overflow-y-auto overscroll-contain scrollbar-none bg-[#F6F6F8] p-3 text-xs'>
            {activeDetailProduct ? (
              <ProductDetailView
                product={activeDetailProduct}
                profile={profile}
                paymentConfig={paymentConfig}
                onBack={() => setDesktopSelectedProduct(null)}
                isSimulator={true}
              />
            ) : (
              <div className='space-y-4'>
                {/* Mini Top Navbar */}
                <div className='h-10 bg-white/90 backdrop-blur-md rounded-xl px-3 flex items-center justify-between border border-neutral-200/80 shadow-2xs'>
                  <Logo size='sm' href='#' showIconBadge={false} />
                  <span className='text-[10px] font-semibold text-neutral-600 truncate max-w-[120px]'>
                    @{profile.username || 'creator'}
                  </span>
                </div>

                {/* Profile Header mini */}
                <div className='bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-2xs'>
                  <ProfileHeader profile={profile} variant='mobile' />
                </div>

                {/* Desktop Product Cards List */}
                <div className='space-y-3 pb-6'>
                  <div className='text-xs font-bold text-neutral-800 dark:text-neutral-200 px-1'>
                    Sản phẩm nổi bật ({products.length})
                  </div>
                  <div className='grid grid-cols-1 gap-3'>
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onClick={(prod) => setDesktopSelectedProduct(prod)}
                        layout='desktop'
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. CHẾ ĐỘ ĐIỆN THOẠI (COMPACT CUTE PHONE MOCKUP CHUẨN STAN STORE)
  // =========================================================================
  return (
    <div className={`relative mx-auto flex justify-center select-none ${className || ''}`}>
      {/* Khung điện thoại nhỏ xinh tỷ lệ chuẩn */}
      <div className='relative w-[285px] h-[570px] rounded-[42px] border-[3.5px] border-black bg-black shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] transition-all duration-300'>
        {/* Nút vật lý sườn trái */}
        <div className='absolute -left-[3px] top-[100px] h-6 w-[2.5px] rounded-l-xs bg-black' />
        <div className='absolute -left-[3px] top-[134px] h-6 w-[2.5px] rounded-l-xs bg-black' />

        {/* Nút nguồn sườn phải */}
        <div className='absolute -right-[3px] top-[115px] h-10 w-[2.5px] rounded-r-xs bg-black' />

        {/* Màn hình hiển thị tinh gọn bên trong */}
        <div className='relative h-full w-full overflow-hidden rounded-[38px] bg-white flex flex-col [transform:translateZ(0)]'>
          {/* Interactive Screen Scroll Container */}
          <div className='flex-1 overflow-y-auto overscroll-contain scrollbar-none'>
            {previewView === 'detail' && currentProduct ? (
              <ProductDetailView
                product={currentProduct}
                profile={profile}
                paymentConfig={paymentConfig}
                isSimulator={true}
              />
            ) : (
              <ResponsiveStorefrontView
                profile={profile}
                products={products}
                paymentConfig={paymentConfig}
                isPreview={true}
                previewMode='mobile'
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
