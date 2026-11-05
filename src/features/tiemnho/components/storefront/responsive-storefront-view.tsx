'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { ProfileHeader } from './profile-header';
import { ProductCard } from './product-card';
import { ProductDetailView } from './product-detail-view';
import { Logo } from '@/components/common/logo';
import { SocialIconBadge } from '@/components/common/social-icons';
import { ShieldCheck, Globe, ChevronDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResponsiveStorefrontViewProps {
  profile: CreatorProfile;
  products: Product[];
  paymentConfig: PaymentConfig;
  isPreview?: boolean;
  previewMode?: 'mobile' | 'desktop';
}

export function ResponsiveStorefrontView({
  profile,
  products,
  paymentConfig,
  isPreview = false,
  previewMode
}: ResponsiveStorefrontViewProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);

  // Danh sách sản phẩm hiển thị sắp xếp theo displayOrder
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => p.isPublished).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [products]);

  const handleProductClick = (product: Product) => {
    if (product.type === 'EXTERNAL_LINK' && product.externalUrl) {
      window.open(product.externalUrl, '_blank');
      return;
    }
    setSelectedProduct(product);
  };

  const handleShareBio = () => {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/@${profile.username}` : '';
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success('Đã sao chép liên kết tiệm của bạn!'))
        .catch(() => {
          try {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast.success('Đã sao chép liên kết tiệm của bạn!');
          } catch {
            toast.info(`Liên kết tiệm: ${url}`);
          }
        });
      return;
    }
    toast.info(`Liên kết tiệm: ${url}`);
  };

  // =========================================================================
  // VIEW 1: PREVIEW IN IPHONE SIMULATOR CONTAINER (Dashboard)
  // =========================================================================
  if (isPreview && previewMode === 'mobile') {
    // Nếu đang chọn xem chi tiết sản phẩm: hiển thị màn chi tiết kèm QR thanh toán trong Phone
    if (selectedProduct) {
      return (
        <ProductDetailView
          product={selectedProduct}
          profile={profile}
          paymentConfig={paymentConfig}
          onBack={() => setSelectedProduct(null)}
          isSimulator={true}
        />
      );
    }

    return (
      <div className='w-full mx-auto bg-white text-[#161823] font-sans antialiased px-4 pt-8 pb-4 text-xs selection:bg-[#FE2C55] selection:text-white flex flex-col justify-between min-h-full'>
        {/* Profile Header chuẩn Mobile Stan Store */}
        <ProfileHeader profile={profile} variant='mobile' />

        {/* Danh sách thẻ sản phẩm dọc */}
        <div className='space-y-3 mt-5 pb-6 flex-1'>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={handleProductClick}
              layout='mobile'
            />
          ))}

          {filteredProducts.length === 0 && (
            <div className='py-8 text-center text-xs text-neutral-400 bg-neutral-50/60 rounded-xl border border-dashed border-neutral-200'>
              Chưa có sản phẩm nào.
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className='pt-4 pb-2 text-center mt-auto border-t border-neutral-100'>
          <div className='flex items-center justify-center gap-3 text-[10px] font-medium text-neutral-400'>
            <span className='inline-flex items-center gap-1 hover:text-neutral-700 cursor-pointer'>
              <ShieldCheck className='w-3 h-3 text-neutral-400' />
              <span>Privacy Policy</span>
            </span>
            <span className='text-neutral-300'>|</span>
            <div className='inline-flex items-center gap-1 hover:text-neutral-700 cursor-pointer'>
              <Globe className='w-3 h-3 text-neutral-400' />
              <span>EN</span>
              <ChevronDown className='w-2.5 h-2.5 text-neutral-400' />
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // NẾU ĐANG CHỌN SẢN PHẨM TRÊN GIAO DIỆN STOREFRONT: HIỂN THỊ MÀN CHI TIẾT
  // =========================================================================
  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        profile={profile}
        paymentConfig={paymentConfig}
        onBack={() => setSelectedProduct(null)}
        isSimulator={false}
      />
    );
  }

  // =========================================================================
  // VIEW 2: FULL ADAPTIVE STOREFRONT (Mobile < 768px & Desktop >= 768px)
  // =========================================================================
  return (
    <div className='w-full min-h-screen bg-[#F6F6F8] text-[#161823] font-sans antialiased flex flex-col items-center selection:bg-[#FE2C55] selection:text-white'>
      {/* ----------------------------------------------------------------- */}
      {/* A. MOBILE VIEW (< 768px)                                          */}
      {/* Khung dọc 1 cột chuẩn Stan Store / In-App WebView                   */}
      {/* ----------------------------------------------------------------- */}
      <div className='w-full max-w-[420px] mx-auto min-h-screen px-4 py-8 bg-white flex flex-col items-center justify-between md:hidden shadow-xs'>
        <div className='w-full flex flex-col items-center'>
          {/* Profile Header Mobile */}
          <ProfileHeader profile={profile} variant='mobile' className='w-full' />

          {/* Danh sách thẻ sản phẩm cuộn dọc 1 cột */}
          <div className='w-full space-y-3.5 mt-5 pb-6'>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
                layout='mobile'
              />
            ))}

            {filteredProducts.length === 0 && (
              <div className='py-12 text-center text-xs text-neutral-400 bg-neutral-50/60 rounded-2xl border border-dashed border-neutral-200'>
                Chưa có sản phẩm nào.
              </div>
            )}
          </div>
        </div>

        {/* Footer đáy trang Mobile */}
        <footer className='w-full pt-8 pb-2 text-center mt-auto border-t border-neutral-100'>
          <div className='flex items-center justify-center gap-3 text-xs font-medium text-neutral-400'>
            <a
              href='/privacy'
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1.5 hover:text-[#161823] transition-colors'
            >
              <ShieldCheck className='w-3.5 h-3.5 text-neutral-500' />
              <span>Privacy Policy</span>
            </a>
            <span className='text-neutral-300'>|</span>
            <div className='inline-flex items-center gap-1 hover:text-[#161823] cursor-pointer transition-colors'>
              <Globe className='w-3.5 h-3.5 text-neutral-500' />
              <span>EN</span>
              <ChevronDown className='w-3 h-3 text-neutral-400' />
            </div>
          </div>
        </footer>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* B. DESKTOP VIEW (>= 768px)                                        */}
      {/* Giao diện Web Desktop phóng khoáng, Navbar + Bento Hero + Grid    */}
      {/* ----------------------------------------------------------------- */}
      <div className='hidden md:flex flex-col w-full max-w-5xl mx-auto px-6 py-8 min-h-screen'>
        {/* 1. Top Navbar mỏng cố định trên cùng */}
        <nav className='h-14 border border-neutral-200/80 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between rounded-2xl mb-8 shadow-xs sticky top-4 z-30'>
          <div className='flex items-center gap-3'>
            <Logo size='md' href='/' showIconBadge={true} />
          </div>

          <div className='flex items-center gap-4'>
            {profile.socials && Object.values(profile.socials).some(Boolean) && (
              <div className='flex items-center gap-1.5'>
                {profile.socials.tiktok && (
                  <a
                    href={profile.socials.tiktok}
                    target='_blank'
                    rel='noreferrer'
                    className='h-8 w-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors'
                    title='TikTok'
                  >
                    <SocialIconBadge platform='tiktok' size='sm' />
                  </a>
                )}
                {profile.socials.youtube && (
                  <a
                    href={profile.socials.youtube}
                    target='_blank'
                    rel='noreferrer'
                    className='h-8 w-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors'
                    title='YouTube'
                  >
                    <SocialIconBadge platform='youtube' size='sm' />
                  </a>
                )}
                {profile.socials.instagram && (
                  <a
                    href={profile.socials.instagram}
                    target='_blank'
                    rel='noreferrer'
                    className='h-8 w-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors'
                    title='Instagram'
                  >
                    <SocialIconBadge platform='instagram' size='sm' />
                  </a>
                )}
                {profile.socials.facebook && (
                  <a
                    href={profile.socials.facebook}
                    target='_blank'
                    rel='noreferrer'
                    className='h-8 w-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors'
                    title='Facebook'
                  >
                    <SocialIconBadge platform='facebook' size='sm' />
                  </a>
                )}
              </div>
            )}

            <button
              type='button'
              onClick={handleShareBio}
              className='h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer'
            >
              <Share2 className='w-3.5 h-3.5' />
              <span>Chia sẻ tiệm</span>
            </button>
          </div>
        </nav>

        {/* 2. Profile Hero Section phong cách Bento/Creator */}
        <ProfileHeader profile={profile} variant='desktop' />

        {/* 3. Khu vực sản phẩm trên Web: Grid 2-3 cột */}
        <div className='flex-1 flex flex-col space-y-6 pt-2 pb-12'>
          {/* Lưới sản phẩm 2 hoặc 3 cột (Grid 2-3 columns) */}
          <div className='grid grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
                layout='desktop'
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className='col-span-full py-16 text-center text-sm text-neutral-400 bg-white rounded-2xl border border-dashed border-neutral-200'>
              Chưa có sản phẩm nào.
            </div>
          )}
        </div>

        {/* 4. Footer đáy trang Web Desktop */}
        <footer className='pt-8 pb-6 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-500 mt-auto'>
          <div className='flex items-center gap-2'>
            <Logo size='sm' href='/' showIconBadge={false} />
            <span className='text-neutral-400'>• Nền tảng Bio Storefront cho Creator</span>
          </div>

          <div className='flex items-center gap-4'>
            <a
              href='/privacy'
              target='_blank'
              rel='noreferrer'
              className='hover:text-neutral-900 transition-colors flex items-center gap-1'
            >
              <ShieldCheck className='w-3.5 h-3.5' />
              <span>Chính sách bảo mật</span>
            </a>
            <span className='text-neutral-300'>|</span>
            <div className='inline-flex items-center gap-1 hover:text-neutral-900 cursor-pointer'>
              <Globe className='w-3.5 h-3.5' />
              <span>VI / EN</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
