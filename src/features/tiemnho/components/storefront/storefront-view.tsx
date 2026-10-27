'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig, ProductType } from '@/constants/mock-tiemnho';
import { CheckoutDrawer } from './checkout-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  ShoppingBag,
  Flame,
  ShoppingCart,
  ExternalLink,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SocialIconBadge } from '@/components/common/social-icons';

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
  const isTikTokTheme = profile.theme === 'tiktok';
  // Hỗ trợ 3 kiểu hiển thị: ROW (chuẩn Stan Store), ACCORDION (Gập mở), GRID (Showcase TikTok 2 cột)
  const [cardStyle, setCardStyle] = React.useState<'ROW' | 'ACCORDION' | 'GRID'>(
    isTikTokTheme ? 'GRID' : 'ROW'
  );
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Sync default card style if theme changes to tiktok
  React.useEffect(() => {
    if (profile.theme === 'tiktok') {
      setCardStyle('GRID');
    }
  }, [profile.theme]);

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

  const getCtaLabel = (product: Product) => {
    if (product.type === 'PHYSICAL' && product.stock !== undefined && product.stock <= 0) {
      return 'Hết hàng';
    }
    if (product.buttonText && product.buttonText.trim()) {
      return product.buttonText.trim();
    }
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

    if (cardStyle === 'ACCORDION') {
      // Toggle accordion open/close
      setExpandedId((prev) => (prev === product.id ? null : product.id));
    } else {
      // Direct checkout trigger
      setSelectedProduct(product);
    }
  };

  const handleTriggerCheckout = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
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
        'w-full mx-auto relative transition-colors duration-300 font-sans',
        isTikTokTheme ? 'bg-[#0f0f12] text-zinc-100' : 'bg-background/95 text-foreground',
        isPreview
          ? 'max-w-full px-3 py-3 text-xs'
          : 'max-w-md min-h-screen px-4 py-8 shadow-2xl backdrop-blur-md'
      )}
    >
      {/* 2.1 Header Profile */}
      <div className='flex flex-col items-center text-center space-y-3 pt-1 pb-3'>
        {/* Avatar tròn bo viền nổi bật */}
        <div className='relative group'>
          <div
            className={cn(
              'h-22 w-22 sm:h-24 sm:w-24 rounded-full p-1 shadow-xl',
              isTikTokTheme
                ? 'bg-gradient-to-tr from-[#fe2c55] via-purple-500 to-[#25f4ee] shadow-[#fe2c55]/20 animate-pulse'
                : 'bg-gradient-to-tr from-primary via-emerald-500 to-indigo-500 shadow-primary/20'
            )}
          >
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
              className={cn(
                'absolute bottom-0 right-1 h-6 w-6 rounded-full flex items-center justify-center ring-2 shadow-sm',
                isTikTokTheme
                  ? 'bg-[#20d5ec] text-black ring-[#0f0f12]'
                  : 'bg-primary text-primary-foreground ring-background'
              )}
              title='Đã xác minh bởi Tiệm Nhỏ'
            >
              <Icons.check className='h-3.5 w-3.5 stroke-[3]' />
            </div>
          )}
        </div>

        {/* Display Name & Handle */}
        <div className='space-y-1'>
          <div className='flex items-center justify-center gap-1.5'>
            <h1 className='text-lg sm:text-xl font-bold tracking-tight'>{profile.displayName}</h1>
            {isTikTokTheme && (
              <span className='px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-[#fe2c55]/15 text-[#fe2c55] border border-[#fe2c55]/30 rounded-full'>
                TikTok Creator
              </span>
            )}
          </div>
          <button
            onClick={handleShareBio}
            className={cn(
              'inline-flex items-center gap-1 text-xs transition-colors cursor-pointer',
              isTikTokTheme
                ? 'text-zinc-400 hover:text-[#25f4ee]'
                : 'text-muted-foreground hover:text-primary'
            )}
            title='Bấm để sao chép link'
          >
            <span>@{profile.username}</span>
            <Icons.copy className='h-3 w-3 opacity-70' />
          </button>
        </div>

        {/* TikTok Counter Bar: Đang Follow | Follower | Thích */}
        {isTikTokTheme && (
          <div className='flex items-center justify-center divide-x divide-zinc-800 py-1.5 px-4 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 shadow-xs'>
            <div className='px-3 text-center'>
              <div className='text-xs font-black text-white'>128</div>
              <div className='text-[10px] text-zinc-400 font-medium'>Đang follow</div>
            </div>
            <div className='px-3 text-center'>
              <div className='text-xs font-black text-[#fe2c55]'>48.5K</div>
              <div className='text-[10px] text-zinc-400 font-medium'>Follower</div>
            </div>
            <div className='px-3 text-center'>
              <div className='text-xs font-black text-[#25f4ee]'>1.2M</div>
              <div className='text-[10px] text-zinc-400 font-medium'>Thích</div>
            </div>
          </div>
        )}

        {/* Tagline 1-2 dòng ngắn gọn */}
        <p
          className={cn(
            'text-xs leading-relaxed max-w-xs px-2 font-normal',
            isTikTokTheme ? 'text-zinc-300' : 'text-muted-foreground'
          )}
        >
          {profile.bio}
        </p>

        {/* Social Icons Bar */}
        <div className='flex items-center gap-2 pt-1 flex-wrap justify-center'>
          {profile.socials.tiktok && (
            <a
              href={profile.socials.tiktok}
              target='_blank'
              rel='noreferrer'
              className='transition-transform hover:scale-110 active:scale-95'
              title='TikTok'
            >
              <SocialIconBadge platform='tiktok' size='sm' />
            </a>
          )}
          {profile.socials.instagram && (
            <a
              href={profile.socials.instagram}
              target='_blank'
              rel='noreferrer'
              className='transition-transform hover:scale-110 active:scale-95'
              title='Instagram'
            >
              <SocialIconBadge platform='instagram' size='sm' />
            </a>
          )}
          {profile.socials.youtube && (
            <a
              href={profile.socials.youtube}
              target='_blank'
              rel='noreferrer'
              className='transition-transform hover:scale-110 active:scale-95'
              title='YouTube'
            >
              <SocialIconBadge platform='youtube' size='sm' />
            </a>
          )}
          {profile.socials.facebook && (
            <a
              href={profile.socials.facebook}
              target='_blank'
              rel='noreferrer'
              className='transition-transform hover:scale-110 active:scale-95'
              title='Facebook'
            >
              <SocialIconBadge platform='facebook' size='sm' />
            </a>
          )}
          {profile.socials.zalo && (
            <a
              href={`https://zalo.me/${profile.socials.zalo}`}
              target='_blank'
              rel='noreferrer'
              className='transition-transform hover:scale-110 active:scale-95'
              title='Zalo'
            >
              <SocialIconBadge platform='zalo' size='sm' />
            </a>
          )}
          {profile.socials.threads && (
            <a
              href={profile.socials.threads}
              target='_blank'
              rel='noreferrer'
              className='transition-transform hover:scale-110 active:scale-95'
              title='Threads'
            >
              <SocialIconBadge platform='threads' size='sm' />
            </a>
          )}
        </div>
      </div>

      {/* Style Switcher & Category Filter Bar */}
      <div className='space-y-2.5 pb-3 pt-1'>
        <div className='flex items-center justify-between px-0.5 text-xs'>
          {/* Category Tabs */}
          <div className='flex items-center gap-1.5 overflow-x-auto scrollbar-none'>
            {[
              {
                key: 'ALL',
                label: isTikTokTheme ? (
                  <span className='flex items-center gap-1'>
                    <ShoppingBag className='w-3 h-3' strokeWidth={1.75} /> Giỏ hàng
                  </span>
                ) : (
                  'Tất cả'
                )
              },
              { key: 'DIGITAL', label: 'Tài liệu số' },
              { key: 'LEAD_MAGNET', label: 'Quà 0đ' },
              { key: 'PHYSICAL', label: 'Hàng vật lý' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
                  isTikTokTheme
                    ? activeTab === tab.key
                      ? 'bg-[#fe2c55] text-white font-bold shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    : activeTab === tab.key
                      ? 'bg-foreground text-background shadow-xs font-semibold'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 3 Kiểu hiển thị Thẻ (Stan Store Row Card vs Accordion Card vs TikTok 2-Column Grid) */}
          <div
            className={cn(
              'flex items-center p-0.5 rounded-lg shrink-0 ml-1',
              isTikTokTheme ? 'bg-zinc-900 border border-zinc-800' : 'bg-muted/80'
            )}
          >
            <button
              onClick={() => setCardStyle('GRID')}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer',
                cardStyle === 'GRID'
                  ? isTikTokTheme
                    ? 'bg-[#fe2c55] text-white shadow-xs font-bold'
                    : 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title='Kiểu TikTok: Lưới 2 cột Showcase chuẩn TikTok Shop'
            >
              <Icons.dashboard className='h-3 w-3' />
              <span className='hidden sm:inline'>TikTok</span>
            </button>
            <button
              onClick={() => setCardStyle('ROW')}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer',
                cardStyle === 'ROW'
                  ? isTikTokTheme
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title='Kiểu 1: Row Card tối giản chuẩn Stan Store'
            >
              <Icons.page className='h-3 w-3' />
              <span className='hidden sm:inline'>Row</span>
            </button>
            <button
              onClick={() => setCardStyle('ACCORDION')}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer',
                cardStyle === 'ACCORDION'
                  ? isTikTokTheme
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title='Kiểu 2: Expandable Accordion Card'
            >
              <Icons.chevronDown className='h-3 w-3' />
              <span className='hidden sm:inline'>Gập</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2.2 Product Feed (Hỗ trợ TikTok 2-Column Grid / Stan Store Row / Accordion) */}
      <div
        className={cn(
          'pt-1',
          cardStyle === 'GRID' ? 'grid grid-cols-2 gap-2.5 sm:gap-3' : 'space-y-3'
        )}
      >
        {filteredProducts.map((product) => {
          const isLead = product.type === 'LEAD_MAGNET';
          const isPhysical = product.type === 'PHYSICAL';
          const isLink = product.type === 'EXTERNAL_LINK';
          const isExpanded = expandedId === product.id;

          // KIỂU 0: TIKTOK 2-COLUMN SHOWCASE GRID (CHUẨN TIKTOK SHOP)
          if (cardStyle === 'GRID') {
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col',
                  isTikTokTheme
                    ? 'bg-zinc-900/90 border-zinc-800/80 hover:border-[#fe2c55]/60 hover:shadow-lg hover:shadow-[#fe2c55]/10 active:scale-[0.98]'
                    : 'bg-card border-border/80 hover:border-primary/50 hover:shadow-md active:scale-[0.98]',
                  product.isFeatured &&
                    (isTikTokTheme
                      ? 'ring-1 ring-[#fe2c55]/50 bg-gradient-to-b from-[#fe2c55]/10 to-transparent'
                      : 'ring-1.5 ring-primary/40 bg-gradient-to-b from-primary/5 to-transparent')
                )}
              >
                {/* Media Image: Tỉ lệ 1:1 hoặc 4:3 dọc chuẩn TikTok Showcase */}
                <div className='relative w-full aspect-square overflow-hidden bg-zinc-800'>
                  <img
                    src={product.coverImage}
                    alt={product.title}
                    className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                  {/* Badges: Hot / Flash Sale / Quà tặng */}
                  <div className='absolute top-2 left-2 flex flex-col gap-1'>
                    {product.isFeatured && (
                      <span className='px-1.5 py-0.5 rounded-md bg-[#fe2c55] text-white text-[9px] font-black uppercase shadow-xs tracking-tight flex items-center gap-0.5'>
                        <Flame className='w-2.5 h-2.5 fill-current' /> HOT
                      </span>
                    )}
                    {isLead && (
                      <span className='px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-bold shadow-xs'>
                        0Đ Free
                      </span>
                    )}
                  </div>

                  {/* Lượt đã bán chuẩn TikTok Shop: 'Đã bán 1.2k' */}
                  <div className='absolute bottom-1.5 left-2 rounded-md bg-black/60 backdrop-blur-xs px-1.5 py-0.5 text-[9px] text-zinc-300 font-medium'>
                    Đã bán {product.soldCount > 0 ? product.soldCount : 128}
                  </div>
                </div>

                {/* Body Content */}
                <div className='p-2.5 flex flex-col flex-1 justify-between gap-2'>
                  <div>
                    <h3
                      className={cn(
                        'text-xs font-semibold line-clamp-2 leading-snug group-hover:text-[#fe2c55] transition-colors',
                        isTikTokTheme ? 'text-zinc-100' : 'text-foreground'
                      )}
                    >
                      {product.title}
                    </h3>

                    {/* Giá & Giảm giá */}
                    <div className='flex items-baseline gap-1 mt-1.5 flex-wrap'>
                      <span
                        className={cn(
                          'font-black text-xs sm:text-sm',
                          isLead
                            ? 'text-emerald-400'
                            : isTikTokTheme
                              ? 'text-[#fe2c55]'
                              : 'text-foreground'
                        )}
                      >
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className='text-[10px] text-zinc-500 line-through'>
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nút Giỏ Hàng Mua Ngay Nhanh Chuẩn TikTok */}
                  <Button
                    size='sm'
                    onClick={(e) => handleTriggerCheckout(e, product)}
                    className={cn(
                      'w-full h-7.5 px-2 text-[11px] font-bold rounded-xl gap-1 shadow-xs transition-all duration-200 mt-1',
                      isTikTokTheme
                        ? 'bg-[#fe2c55] hover:bg-[#fe2c55]/90 text-white'
                        : isLead
                          ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/20'
                          : 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icons.shoppingCart className='h-3 w-3' />
                    <span>{getCtaLabel(product)}</span>
                  </Button>
                </div>
              </div>
            );
          }

          // KIỂU 1: ROW CARD TỐI GIẢN (CHUẨN STAN STORE)
          if (cardStyle === 'ROW') {
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border p-3 shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.99]',
                  isTikTokTheme
                    ? 'bg-zinc-900/90 border-zinc-800 hover:border-[#fe2c55]/60'
                    : 'bg-card border-border/80 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5',
                  product.isFeatured &&
                    (isTikTokTheme
                      ? 'ring-1 ring-[#fe2c55]/40 bg-gradient-to-b from-[#fe2c55]/10 to-transparent'
                      : 'ring-1.5 ring-primary/40 bg-gradient-to-b from-primary/5 to-transparent')
                )}
              >
                <div className='flex items-center gap-3'>
                  {/* Cột trái: Ảnh thumbnail / cover vuông 1:1 bo góc mềm */}
                  <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted shadow-xs'>
                    <img
                      src={product.coverImage}
                      alt={product.title}
                      className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                    {product.isFeatured && (
                      <div className='absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground shadow-xs'>
                        HOT
                      </div>
                    )}
                  </div>

                  {/* Cột giữa: Tiêu đề in đậm 1-2 dòng + Nhãn giá VNĐ / nhãn Miễn phí xanh lá */}
                  <div className='flex-1 min-w-0 pr-1'>
                    <div className='flex items-center gap-1.5 mb-0.5'>
                      {isLink && product.iconType && (
                        <SocialIconBadge platform={product.iconType} size='sm' />
                      )}
                      <h3 className='text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors'>
                        {product.title}
                      </h3>
                    </div>
                    {isLink ? (
                      <p className='text-[11px] text-muted-foreground line-clamp-1'>
                        {product.subtitle || product.description || 'Liên kết ngoài'}
                      </p>
                    ) : (
                      <div className='flex items-baseline gap-1.5 mt-1'>
                        <span
                          className={cn(
                            'font-bold text-xs sm:text-sm',
                            isLead ? 'text-emerald-500' : 'text-foreground'
                          )}
                        >
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className='text-[10px] text-muted-foreground line-through'>
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cột phải: Nút CTA nhỏ gọn (Nhận ngay, Mua ngay, Đặt trước) */}
                  <div className='shrink-0'>
                    <Button
                      size='sm'
                      variant={isLead ? 'secondary' : 'default'}
                      onClick={(e) => handleTriggerCheckout(e, product)}
                      className={cn(
                        'h-8 px-3 text-xs font-semibold rounded-xl gap-1 shadow-xs transition-all duration-200',
                        isLead &&
                          'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                        isPhysical && 'bg-amber-600 hover:bg-amber-700 text-white'
                      )}
                    >
                      <span>{getCtaLabel(product)}</span>
                      {isLink ? (
                        <Icons.externalLink className='h-3 w-3' />
                      ) : (
                        <Icons.arrowRight className='h-3 w-3' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          // KIỂU 2: EXPANDABLE ACCORDION CARD (THẺ GẬP/MỞ TẠI CHỖ)
          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 shadow-xs transition-all duration-200 cursor-pointer hover:border-primary/50',
                isExpanded && 'border-primary shadow-md bg-card/95',
                product.isFeatured &&
                  'ring-1.5 ring-primary/40 bg-gradient-to-b from-primary/5 to-transparent'
              )}
            >
              {/* Header hàng trên của Accordion Card */}
              <div className='flex items-center gap-3'>
                <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted shadow-xs'>
                  <img
                    src={product.coverImage}
                    alt={product.title}
                    className='h-full w-full object-cover transition-transform duration-300'
                  />
                  {product.isFeatured && (
                    <div className='absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground shadow-xs'>
                      HOT
                    </div>
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <h3 className='text-xs sm:text-sm font-semibold text-foreground line-clamp-1'>
                    {product.title}
                  </h3>
                  <div className='flex items-baseline gap-1.5 mt-0.5'>
                    <span
                      className={cn(
                        'font-bold text-xs sm:text-sm',
                        isLead ? 'text-emerald-500' : 'text-foreground'
                      )}
                    >
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className='text-[10px] text-muted-foreground line-through'>
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className='shrink-0 text-muted-foreground transition-transform duration-300'>
                  <Icons.chevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-300',
                      isExpanded && 'rotate-180 text-primary'
                    )}
                  />
                </div>
              </div>

              {/* Nội dung trượt mở rộng mượt mà */}
              {isExpanded && (
                <div className='pt-3 mt-3 border-t border-border/60 space-y-3 animate-in fade-in-50 duration-200'>
                  <p className='text-xs text-muted-foreground leading-relaxed line-clamp-3'>
                    {product.description ||
                      'Tài nguyên độc quyền từ Creator giúp bạn đạt kết quả nhanh chóng.'}
                  </p>

                  {/* Nút CTA to bản ở dưới đáy thẻ */}
                  <Button
                    onClick={(e) => handleTriggerCheckout(e, product)}
                    className='w-full h-10 text-xs font-bold rounded-xl shadow-md gap-2'
                  >
                    <span>
                      {getCtaLabel(product)}{' '}
                      {product.price > 0 && `• ${formatPrice(product.price)}`}
                    </span>
                    {isLink ? (
                      <Icons.externalLink className='h-3.5 w-3.5' />
                    ) : (
                      <Icons.arrowRight className='h-3.5 w-3.5' />
                    )}
                  </Button>
                </div>
              )}
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

      {/* 2.3 & 2.4 Luồng Checkout 1-Chạm (Bottom Sheet Drawer) */}
      <CheckoutDrawer
        product={selectedProduct}
        paymentConfig={paymentConfig}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
