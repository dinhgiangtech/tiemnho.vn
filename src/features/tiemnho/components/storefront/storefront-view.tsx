'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig, ProductType } from '@/constants/mock-tiemnho';
import { CheckoutDrawer } from './checkout-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StorefrontViewProps {
  profile: CreatorProfile;
  products: Product[];
  paymentConfig: PaymentConfig;
  isPreview?: boolean;
}

export function StorefrontView({
  profile,
  products,
  paymentConfig,
  isPreview = false
}: StorefrontViewProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>('ALL');

  const filteredProducts = React.useMemo(() => {
    return products
      .filter((p) => p.isPublished)
      .filter((p) => {
        if (activeTab === 'ALL') return true;
        return p.type === activeTab;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [products, activeTab]);

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Đã sao chép link Bio của bạn!');
    }
  };

  return (
    <div
      className={cn(
        'w-full mx-auto relative transition-colors duration-300',
        isPreview
          ? 'max-w-full px-3 py-4 text-xs'
          : 'max-w-md min-h-screen px-4 py-8 shadow-xl bg-background/95 backdrop-blur-md'
      )}
    >
      {/* Bio Header */}
      <div className='flex flex-col items-center text-center space-y-3 pt-2 pb-5'>
        {/* Avatar with gradient ring */}
        <div className='relative group'>
          <div className='h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-primary via-emerald-500 to-indigo-500 shadow-lg shadow-primary/20'>
            <div className='h-full w-full rounded-full overflow-hidden bg-card'>
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
              />
            </div>
          </div>
          {profile.verified && (
            <div
              className='absolute bottom-0 right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center ring-2 ring-background shadow-xs'
              title='Đã xác minh bởi Tiệm Nhỏ'
            >
              <Icons.check className='h-3.5 w-3.5 stroke-[3]' />
            </div>
          )}
        </div>

        {/* Display Name & Handle */}
        <div className='space-y-1'>
          <div className='flex items-center justify-center gap-1.5'>
            <h1 className='text-xl font-bold tracking-tight text-foreground'>
              {profile.displayName}
            </h1>
          </div>
          <button
            onClick={handleShareBio}
            className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer'
            title='Bấm để sao chép link'
          >
            <span>@{profile.username}</span>
            <Icons.copy className='h-3 w-3 opacity-70' />
          </button>
        </div>

        {/* Bio Text */}
        <p className='text-xs leading-relaxed text-muted-foreground max-w-xs'>{profile.bio}</p>

        {/* Social Icons Bar */}
        <div className='flex items-center gap-2 pt-1'>
          {profile.socials.tiktok && (
            <a
              href={profile.socials.tiktok}
              target='_blank'
              rel='noreferrer'
              className='h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-all duration-200'
              title='TikTok'
            >
              <Icons.tiktok className='h-4 w-4' />
            </a>
          )}
          {profile.socials.instagram && (
            <a
              href={profile.socials.instagram}
              target='_blank'
              rel='noreferrer'
              className='h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-all duration-200'
              title='Instagram'
            >
              <Icons.instagram className='h-4 w-4' />
            </a>
          )}
          {profile.socials.youtube && (
            <a
              href={profile.socials.youtube}
              target='_blank'
              rel='noreferrer'
              className='h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-all duration-200'
              title='YouTube'
            >
              <Icons.youtube className='h-4 w-4' />
            </a>
          )}
          {profile.socials.facebook && (
            <a
              href={profile.socials.facebook}
              target='_blank'
              rel='noreferrer'
              className='h-8 w-8 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-all duration-200'
              title='Facebook'
            >
              <Icons.facebook className='h-4 w-4' />
            </a>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className='flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none justify-start sm:justify-center'>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'DIGITAL', label: 'Sản phẩm số' },
          { key: 'LEAD_MAGNET', label: 'Quà 0đ' },
          { key: 'PHYSICAL', label: 'Hàng vật lý' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
              activeTab === tab.key
                ? 'bg-foreground text-background shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Stack */}
      <div className='space-y-3.5 pt-2'>
        {filteredProducts.map((product) => {
          const isLead = product.type === 'LEAD_MAGNET';
          const isPhysical = product.type === 'PHYSICAL';
          const isLink = product.type === 'EXTERNAL_LINK';

          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-sm transition-all duration-200 cursor-pointer hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]',
                product.isFeatured &&
                  'ring-1.5 ring-primary/40 bg-linear-to-b from-primary/5 to-transparent'
              )}
            >
              <div className='flex items-start gap-3.5'>
                {/* Cover Image */}
                <div className='relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted shadow-xs'>
                  <img
                    src={product.coverImage}
                    alt={product.title}
                    className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                  {product.isFeatured && (
                    <div className='absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs'>
                      HOT
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className='flex-1 min-w-0 flex flex-col justify-between self-stretch'>
                  <div>
                    <div className='flex items-center gap-1.5 mb-1'>
                      <Badge
                        variant={isLead ? 'secondary' : isPhysical ? 'outline' : 'default'}
                        className='text-[10px] font-medium px-1.5 py-0'
                      >
                        {product.type === 'DIGITAL' && 'Tài liệu số'}
                        {product.type === 'LEAD_MAGNET' && 'Miễn phí'}
                        {product.type === 'PHYSICAL' && 'Hàng giới hạn'}
                        {product.type === 'EXTERNAL_LINK' && 'Cộng đồng'}
                      </Badge>
                      {product.soldCount > 0 && (
                        <span className='text-[10px] text-muted-foreground'>
                          • Đã bán {product.soldCount}
                        </span>
                      )}
                    </div>

                    <h3 className='text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors'>
                      {product.title}
                    </h3>
                  </div>

                  <div className='flex items-center justify-between pt-2 mt-auto'>
                    <div className='flex items-baseline gap-1.5'>
                      <span
                        className={cn(
                          'font-bold text-sm',
                          isLead ? 'text-emerald-500' : 'text-foreground'
                        )}
                      >
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className='text-[11px] text-muted-foreground line-through'>
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className='flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform'>
                      <span>{isLink ? 'Mở link' : isLead ? 'Nhận ngay' : 'Mua ngay'}</span>
                      {isLink ? (
                        <Icons.externalLink className='h-3.5 w-3.5' />
                      ) : (
                        <Icons.arrowRight className='h-3.5 w-3.5' />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className='py-12 text-center text-muted-foreground text-xs'>
            Chưa có sản phẩm nào trong danh mục này.
          </div>
        )}
      </div>

      {/* Powered by Tiệm Nhỏ Footer Badge */}
      <div className='pt-8 pb-4 text-center'>
        <a
          href='/'
          className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all border border-border/40 shadow-xs'
        >
          <Icons.sparkles className='h-3.5 w-3.5 text-primary' />
          <span>
            Tạo Storefront chuẩn Stan Store cùng <strong>Tiệm Nhỏ</strong>
          </span>
        </a>
      </div>

      {/* 1-Tap Checkout Drawer */}
      <CheckoutDrawer
        product={selectedProduct}
        paymentConfig={paymentConfig}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
