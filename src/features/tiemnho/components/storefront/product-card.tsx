'use client';

import * as React from 'react';
import Image from 'next/image';
import { Product } from '@/constants/mock-tiemnho';
import { ArrowSquareOut, Gift, FileText, Package } from '@phosphor-icons/react/dist/ssr';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  layout?: 'mobile' | 'desktop';
}

export function ProductCard({ product, onClick, layout = 'mobile' }: ProductCardProps) {
  const isLead = product.type === 'LEAD_MAGNET';
  const isLink = product.type === 'EXTERNAL_LINK';

  const formatPrice = (p: number) => {
    if (p === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  };

  const getCtaLabel = (p: Product) => {
    if (p.type === 'PHYSICAL' && p.stock !== undefined && p.stock <= 0) {
      return 'Hết hàng';
    }
    if (p.buttonText && p.buttonText.trim()) {
      return p.buttonText.trim();
    }
    if (p.type === 'EXTERNAL_LINK') return 'Mở liên kết';
    if (p.type === 'LEAD_MAGNET') return 'Nhận miễn phí';
    if (p.type === 'PHYSICAL') return 'Đặt hàng trước';
    return 'Mua ngay';
  };

  // Card dùng trường dòng tóm tắt (subtitle), nếu chưa có mới fallback sang mô tả ngắn gọn
  const summaryText = React.useMemo(() => {
    if (product.subtitle && product.subtitle.trim()) {
      return product.subtitle.trim();
    }
    if (!product.description) return '';
    return product.description
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/<u>(.*?)<\/u>/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/^>\s*/gm, '')
      .replace(/^[-*•✅]\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();
  }, [product.subtitle, product.description]);

  // ==========================================
  // MOBILE CARD: Thumbnail vừa vặn + Dòng tóm tắt + Giá + Nút CTA tinh gọn
  // ==========================================
  if (layout === 'mobile') {
    return (
      <div
        onClick={() => onClick(product)}
        className='w-full bg-white border border-neutral-100 rounded-2xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 group'
      >
        <div className='flex items-start gap-2.5'>
          {/* Thumbnail 1:1 tỉ lệ đẹp gọn gàng bo góc mượt mà */}
          <div className='w-14 h-14 sm:w-18 sm:h-18 rounded-md overflow-hidden shrink-0 bg-neutral-100 relative border border-neutral-100 shadow-2xs'>
            <Image
              src={product.coverImage}
              alt={product.title}
              fill
              className='object-cover group-hover:scale-105 transition-transform duration-300'
              unoptimized
            />
            {product.isFeatured && (
              <span className='absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#FE2C55] text-white text-[8px] font-bold uppercase leading-tight shadow-xs'>
                HOT
              </span>
            )}
          </div>

          {/* Tiêu đề + Dòng tóm tắt + Giá bán */}
          <div className='flex-1 min-w-0 text-left'>
            <h3 className='font-bold text-xs sm:text-[13px] text-neutral-900 leading-snug line-clamp-2 group-hover:text-[#FE2C55] transition-colors'>
              {product.title}
            </h3>
            {summaryText ? (
              <p className='font-normal text-[11px] sm:text-xs text-neutral-500 line-clamp-4 mt-0.5 leading-snug'>
                {summaryText}
              </p>
            ) : null}
            <div className='flex items-baseline gap-1.5 mt-1'>
              <span className='text-xs sm:text-sm font-bold text-[#FE2C55]'>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className='text-[10px] text-neutral-400 line-through'>
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nút bấm CTA gọn gàng ở đáy thẻ */}
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onClick(product);
          }}
          className={`w-full py-2 rounded-xl font-medium text-xs text-white shadow-2xs active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isLead
              ? 'bg-[#161823] hover:bg-neutral-800'
              : isLink
                ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          <span>{getCtaLabel(product)}</span>
        </button>
      </div>
    );
  }

  // ==========================================
  // DESKTOP CARD: Thumbnail 16:9 ở trên, Tiêu đề + Dòng tóm tắt + Giá ở dưới + Nút CTA ở đáy
  // ==========================================
  return (
    <div
      onClick={() => onClick(product)}
      className='w-full bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-neutral-300 transition-all cursor-pointer flex flex-col justify-between group'
    >
      <div>
        {/* Thumbnail 16:9 phía trên */}
        <div className='w-full aspect-video rounded-xl overflow-hidden bg-neutral-100 relative border border-neutral-100 mb-3.5 shadow-2xs'>
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            className='object-cover group-hover:scale-105 transition-transform duration-300'
            unoptimized
          />
          {product.isFeatured && (
            <span className='absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#FE2C55] text-white text-[9px] font-bold uppercase leading-tight shadow-xs'>
              NỔI BẬT
            </span>
          )}
        </div>

        {/* Tiêu đề + Dòng tóm tắt + Giá bán */}
        <div className='text-left space-y-1.5'>
          <h3 className='font-bold text-[15px] text-neutral-900 line-clamp-1 group-hover:text-[#FE2C55] transition-colors'>
            {product.title}
          </h3>
          {summaryText ? (
            <p className='font-normal text-[13.5px] text-neutral-600 line-clamp-2 leading-relaxed'>
              {summaryText}
            </p>
          ) : null}
          <div className='flex items-baseline gap-2 pt-1'>
            <span className='text-base font-bold text-[#FE2C55]'>{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className='text-xs text-neutral-400 line-through'>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nút bấm CTA full-width ở đáy thẻ */}
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onClick(product);
        }}
        className={`w-full mt-4 py-3 rounded-xl font-medium text-sm text-white shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          isLead
            ? 'bg-[#161823] hover:bg-neutral-800'
            : isLink
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        }`}
      >
        {isLead ? (
          <Gift size={16} weight='bold' className='shrink-0' />
        ) : isLink ? null : product.type === 'PHYSICAL' ? (
          <Package size={16} weight='bold' className='shrink-0' />
        ) : (
          <FileText size={16} weight='bold' className='shrink-0' />
        )}
        <span>{getCtaLabel(product)}</span>
        {isLink && <ArrowSquareOut size={16} weight='bold' className='ml-1 shrink-0' />}
      </button>
    </div>
  );
}
