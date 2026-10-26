'use client';

import * as React from 'react';
import Image from 'next/image';
import { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { TikTokCheckoutDrawer } from './tiktok-checkout-drawer';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Share2,
  Store,
  ChevronRight,
  ExternalLink,
  Gift,
  ShoppingBag,
  Sparkles,
  Copy
} from 'lucide-react';
import { Logo } from '@/components/common/logo';

interface TikTokStorefrontViewProps {
  profile: CreatorProfile;
  products: Product[];
  paymentConfig: PaymentConfig;
  isPreview?: boolean;
}

export function TikTokStorefrontView({
  profile,
  products,
  paymentConfig,
  isPreview = false
}: TikTokStorefrontViewProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>('ALL');

  // Lọc sản phẩm theo danh mục & sắp xếp theo displayOrder
  const filteredProducts = React.useMemo(() => {
    return products
      .filter((p) => p.isPublished)
      .filter((p) => {
        if (activeCategory === 'ALL') return true;
        return p.type === activeCategory;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [products, activeCategory]);

  const formatPrice = (p: number) => {
    if (p === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  };

  const getCtaLabel = (product: Product) => {
    if (product.type === 'EXTERNAL_LINK') return 'Mở link';
    if (product.type === 'LEAD_MAGNET') return 'Nhận ngay';
    if (product.type === 'PHYSICAL') return 'Đặt trước';
    return 'Mua ngay';
  };

  const handleProductClick = (product: Product) => {
    if (product.type === 'EXTERNAL_LINK' && product.externalUrl) {
      window.open(product.externalUrl, '_blank');
      return;
    }
    // Mở drawer thanh toán 1-chạm không rời trang
    setSelectedProduct(product);
  };

  const handleShareBio = () => {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/@${profile.username}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Đã sao chép link Bio cá nhân của bạn!');
    }
  };

  const handleScrollToShop = () => {
    const el = document.getElementById('tiktok-products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`w-full mx-auto min-h-screen bg-white text-[#161823] font-sans antialiased selection:bg-[#FE2C55] selection:text-white ${
        isPreview ? 'max-w-full px-3 py-3 text-xs' : 'max-w-md px-4 py-6 shadow-xs'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. HEADER PROFILE (TIKTOK PROFILE LIGHT STYLE)            */}
      {/* ========================================================= */}
      <section className='flex flex-col items-center text-center space-y-3.5 pb-5 border-b border-[#E3E3E4]'>
        {/* Avatar tròn viền nhẹ */}
        <div className='relative'>
          <div className='h-24 w-24 sm:h-26 sm:w-26 rounded-full p-[2.5px] border-2 border-[#E3E3E4] bg-white shadow-xs'>
            <div className='relative h-full w-full rounded-full overflow-hidden bg-[#F8F8F8]'>
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className='object-cover'
                unoptimized
              />
            </div>
          </div>
          {profile.verified && (
            <div className='absolute bottom-1 right-1' title='Tài khoản Creator đã xác thực'>
              <CheckCircle2
                className='w-5 h-5 text-[#20D5EC] fill-[#20D5EC] stroke-white drop-shadow-xs'
                strokeWidth={2}
              />
            </div>
          )}
        </div>

        {/* Username in đậm & Tên hiển thị */}
        <div className='space-y-0.5'>
          <div className='flex items-center justify-center gap-1.5'>
            <h1 className='text-base sm:text-lg font-bold tracking-tight text-[#161823]'>
              @{profile.username}
            </h1>
            {profile.verified && (
              <span className='inline-flex items-center'>
                <CheckCircle2
                  className='w-4 h-4 text-[#20D5EC] fill-[#20D5EC] stroke-white'
                  strokeWidth={2}
                />
              </span>
            )}
          </div>
          <p className='text-xs font-semibold text-[#73747B]'>{profile.displayName}</p>
        </div>

        {/* Cụm Nút Hành Động: [Ghé Tiệm] + [Nút Share] */}
        <div className='flex items-center gap-2.5 w-full max-w-xs justify-center pt-0.5'>
          <button
            onClick={handleScrollToShop}
            className='flex-1 h-9 px-4 rounded-md bg-[#FE2C55] hover:bg-[#EF244B] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]'
          >
            <Store className='h-3.5 w-3.5' strokeWidth={1.75} />
            <span>Ghé Tiệm</span>
          </button>

          <button
            onClick={handleShareBio}
            className='h-9 w-9 rounded-md border border-[#E3E3E4] bg-white hover:bg-[#F8F8F8] text-[#161823] transition-colors flex items-center justify-center shadow-2xs cursor-pointer active:scale-[0.98]'
            title='Chia sẻ Bio'
          >
            <Share2 className='h-4 w-4 text-[#161823]' strokeWidth={1.75} />
          </button>
        </div>

        {/* Phần mô tả Bio ngắn gọn */}
        <p className='text-xs leading-relaxed text-[#73747B] max-w-xs px-2 font-normal'>
          {profile.bio}
        </p>
      </section>

      {/* ========================================================= */}
      {/* 2. CATEGORY FILTER CHIPS (TỐI GIẢN)                       */}
      {/* ========================================================= */}
      <section id='tiktok-products-section' className='py-3.5'>
        <div className='flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1'>
          {[
            { key: 'ALL', label: 'Tất cả sản phẩm' },
            { key: 'DIGITAL', label: 'Tài nguyên số' },
            { key: 'LEAD_MAGNET', label: 'Quà 0đ' },
            { key: 'PHYSICAL', label: 'Hàng vật lý' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeCategory === tab.key
                  ? 'bg-[#161823] text-white shadow-xs'
                  : 'bg-[#F1F1F2] text-[#73747B] hover:bg-[#E3E3E4] hover:text-[#161823]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DANH SÁCH SẢN PHẨM (PRODUCT ROW CARDS - TIKTOK LIGHT)  */}
      {/* ========================================================= */}
      <section className='space-y-2.5 pb-8'>
        {filteredProducts.map((product) => {
          const isLead = product.type === 'LEAD_MAGNET';
          const isPhysical = product.type === 'PHYSICAL';
          const isLink = product.type === 'EXTERNAL_LINK';

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className='group relative flex items-center justify-between p-3 rounded-md border border-[#E3E3E4] bg-white shadow-2xs hover:border-[#161823]/40 hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.99]'
            >
              {/* Bên trái: Cover vuông nhỏ (56x56) + Thông tin sản phẩm */}
              <div className='flex items-center gap-3 min-w-0 pr-2'>
                <div className='relative h-14 w-14 rounded-md overflow-hidden shrink-0 border border-[#E3E3E4] bg-[#F8F8F8]'>
                  <Image
                    src={product.coverImage}
                    alt={product.title}
                    fill
                    className='object-cover transition-transform duration-300 group-hover:scale-105'
                    unoptimized
                  />
                  {product.isFeatured && (
                    <span className='absolute top-1 left-1 px-1 py-0.2 rounded bg-[#FE2C55] text-white text-[8px] font-black uppercase leading-tight'>
                      HOT
                    </span>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <h3 className='text-xs font-semibold text-[#161823] line-clamp-1 leading-snug group-hover:text-[#FE2C55] transition-colors'>
                    {product.title}
                  </h3>
                  <p className='text-[10px] text-[#73747B] line-clamp-1 mt-0.5'>
                    {product.description}
                  </p>
                  <div className='flex items-baseline gap-1.5 mt-1'>
                    <span className='font-bold text-xs text-[#FE2C55]'>
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className='text-[10px] text-[#73747B] line-through'>
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bên phải: Nút CTA nhỏ gọn bo góc nhẹ 4-6px kèm icon ChevronRight */}
              <div className='shrink-0 pl-1'>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                  className={`h-7.5 px-3 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all duration-200 shadow-2xs cursor-pointer ${
                    isLead
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                      : isLink
                        ? 'bg-[#F1F1F2] text-[#161823] hover:bg-[#E3E3E4]'
                        : 'bg-[#FE2C55] hover:bg-[#EF244B] text-white'
                  }`}
                >
                  <span>{getCtaLabel(product)}</span>
                  {isLink ? (
                    <ExternalLink className='h-3 w-3' strokeWidth={1.75} />
                  ) : (
                    <ChevronRight className='h-3 w-3' strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className='py-12 text-center text-xs text-[#73747B]'>
            Chưa có sản phẩm nào trong mục này.
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 4. FOOTER: POWERED BY TIỆM NHỎ                            */}
      {/* ========================================================= */}
      <footer className='mt-8 pb-10 text-center border-t border-[#E3E3E4] pt-6'>
        <div className='inline-flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity'>
          <span className='text-[11px] text-[#73747B] font-medium'>Được cung cấp bởi</span>
          <Logo size='sm' href='/' showIconBadge={true} />
        </div>
      </footer>

      {/* ========================================================= */}
      {/* 5. CHECKOUT DRAWER (QUÉT VIETQR TẠI CHỖ KHÔNG RỜI TRANG)   */}
      {/* ========================================================= */}
      <TikTokCheckoutDrawer
        product={selectedProduct}
        paymentConfig={paymentConfig}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
