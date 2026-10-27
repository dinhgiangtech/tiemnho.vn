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
  const isDigital = product.type === 'DIGITAL';
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
        'group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border bg-card transition-all duration-200 select-none shadow-xs',
        isDragging
          ? 'opacity-85 shadow-2xl ring-2 ring-primary/60 scale-[1.01] z-50 bg-card border-primary/50'
          : 'border-border/70 hover:border-border hover:shadow-md hover:bg-card/95',
        !product.isPublished && 'opacity-60 bg-muted/20 border-dashed border-border/60'
      )}
    >
      {/* Cụm trái: Grip handle + Thumbnail + Tiêu đề & giá */}
      <div className='flex items-center gap-3.5 min-w-0 flex-1'>
        {/* 1. Grip Handle kéo thả */}
        <div
          {...attributes}
          {...listeners}
          className='p-1 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted cursor-grab active:cursor-grabbing touch-none shrink-0 transition-colors'
          title='Kéo thả để đổi vị trí'
        >
          <Icons.gripVertical className='w-4 h-4 text-muted-foreground' />
        </div>

        {/* 2. Ảnh Thumbnail vuông */}
        <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-2xs'>
          <img
            src={product.coverImage}
            alt={product.title}
            className='h-full w-full object-cover transition-transform group-hover:scale-105 duration-300'
          />
          {product.isFeatured && (
            <span className='absolute top-1 left-1 rounded-md bg-[#FE2C55] px-1 py-0.2 text-[8px] font-black uppercase text-white shadow-xs'>
              HOT
            </span>
          )}
        </div>

        {/* 3. Tiêu đề + icon loại + giá */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <h4 className='text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors'>
              {product.title}
            </h4>
            {isLead ? (
              <Icons.gift className='w-3.5 h-3.5 text-muted-foreground/70 shrink-0' />
            ) : isLink ? (
              <Icons.link className='w-3.5 h-3.5 text-muted-foreground/70 shrink-0' />
            ) : isDigital ? (
              <Icons.post className='w-3.5 h-3.5 text-muted-foreground/70 shrink-0' />
            ) : (
              <Icons.product className='w-3.5 h-3.5 text-muted-foreground/70 shrink-0' />
            )}
          </div>

          <div className='flex items-center gap-2 mt-0.5'>
            <span className='text-xs font-semibold text-muted-foreground'>
              {formatPrice(product.price)}
            </span>
            {product.soldCount > 0 && (
              <span className='text-[11px] text-muted-foreground/70 hidden sm:inline'>
                • Đã bán {product.soldCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Cụm phải: Switch hiển thị + Menu Thao tác */}
      <div className='flex items-center gap-2 shrink-0'>
        <Switch
          checked={product.isPublished}
          onCheckedChange={() => onTogglePublish(product)}
          title={product.isPublished ? 'Đang hiển thị trên Storefront' : 'Đang tạm ẩn'}
        />

        {/* Action Menu (Chỉnh sửa / Xóa) */}
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(product)}
            className='h-8 w-8 p-0 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer'
            title='Chỉnh sửa sản phẩm'
          >
            <Icons.edit className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => onDelete(product.id)}
            className='h-8 w-8 p-0 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer'
            title='Xóa sản phẩm'
          >
            <Icons.trash className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
