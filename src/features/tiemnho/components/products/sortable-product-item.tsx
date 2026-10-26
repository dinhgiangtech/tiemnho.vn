'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '@/constants/mock-tiemnho';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { GripVertical, FileText, Gift, Package, Link2, ExternalLink } from 'lucide-react';

interface SortableProductItemProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (product: Product) => void;
}

export function SortableProductItem({
  product,
  onEdit,
  onDelete,
  onTogglePublish
}: SortableProductItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isLead = product.type === 'LEAD_MAGNET';
  const isPhysical = product.type === 'PHYSICAL';
  const isLink = product.type === 'EXTERNAL_LINK';

  const formatPrice = (price: number) => {
    if (price === 0) return '0 đ (Miễn phí)';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-2xl border border-border/80 bg-card hover:border-border hover:shadow-xs transition-all duration-200 select-none',
        isDragging && 'opacity-60 shadow-xl ring-2 ring-primary z-50 bg-accent/40',
        !product.isPublished && 'opacity-70 bg-muted/20'
      )}
    >
      {/* 1. Grip Handle kéo thả lucide-react */}
      <div
        {...attributes}
        {...listeners}
        className='p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none shrink-0 transition-colors'
        title='Kéo thả để sắp xếp thứ tự hiển thị'
      >
        <GripVertical className='w-4 h-4 text-gray-400' strokeWidth={1.75} />
      </div>

      {/* 2. Ảnh Thumbnail 1:1 */}
      <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted'>
        <img src={product.coverImage} alt={product.title} className='h-full w-full object-cover' />
        {product.isFeatured && (
          <span className='absolute top-0.5 left-0.5 rounded-xs bg-[#FE2C55] px-1 text-[8px] font-bold text-white'>
            HOT
          </span>
        )}
      </div>

      {/* 3. Tiêu đề & Thông tin cơ bản */}
      <div className='flex-1 min-w-0 pr-2'>
        <div className='flex items-center gap-1.5 mb-0.5'>
          <Badge
            variant='outline'
            className='text-[9px] font-medium px-1.5 py-0 gap-1 border-border/60'
          >
            {product.type === 'DIGITAL' && (
              <>
                <FileText className='w-3 h-3 text-blue-500' strokeWidth={1.75} />
                <span>Sản phẩm số</span>
              </>
            )}
            {product.type === 'LEAD_MAGNET' && (
              <>
                <Gift className='w-3 h-3 text-emerald-500' strokeWidth={1.75} />
                <span>Quà 0đ</span>
              </>
            )}
            {product.type === 'PHYSICAL' && (
              <>
                <Package className='w-3 h-3 text-amber-500' strokeWidth={1.75} />
                <span>Hàng vật lý</span>
              </>
            )}
            {product.type === 'EXTERNAL_LINK' && (
              <>
                <Link2 className='w-3 h-3 text-purple-500' strokeWidth={1.75} />
                <span>Nút link</span>
              </>
            )}
          </Badge>
          <span className='text-[10px] text-muted-foreground font-mono'>
            #{product.displayOrder}
          </span>
          {product.soldCount > 0 && (
            <span className='text-[10px] text-muted-foreground'>• Đã bán {product.soldCount}</span>
          )}
        </div>
        <h4 className='text-xs font-semibold text-foreground line-clamp-1'>{product.title}</h4>
        <div className='text-[11px] font-bold text-foreground mt-0.5'>
          <span className={cn(isLead && 'text-emerald-500')}>{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className='ml-1 text-[10px] text-muted-foreground line-through font-normal'>
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      {/* 4. Switch Bật / Tắt hiển thị (isPublished) */}
      <div className='flex items-center gap-2 shrink-0 px-1'>
        <div className='text-right hidden sm:block'>
          <span className='text-[10px] text-muted-foreground block leading-none'>
            {product.isPublished ? 'Hiển thị' : 'Đã ẩn'}
          </span>
        </div>
        <Switch
          checked={product.isPublished}
          onCheckedChange={() => onTogglePublish(product)}
          title={product.isPublished ? 'Đang hiển thị trên Storefront' : 'Đang ẩn khỏi Storefront'}
        />
      </div>

      {/* 5. Nút Thao tác nhanh (Sửa / Xóa) */}
      <div className='flex items-center gap-1 shrink-0'>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 rounded-xl hover:text-primary'
          onClick={() => onEdit(product)}
          title='Chỉnh sửa sản phẩm'
        >
          <Icons.edit className='h-3.5 w-3.5' />
        </Button>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 rounded-xl hover:text-destructive'
          onClick={() => onDelete(product.id)}
          title='Xóa sản phẩm'
        >
          <Icons.trash className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}
