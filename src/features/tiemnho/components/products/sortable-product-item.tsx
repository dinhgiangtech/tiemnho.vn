'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '@/constants/mock-tiemnho';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  FileText,
  Gift,
  Package,
  ArrowSquareOut,
  DotsSixVertical
} from '@phosphor-icons/react/dist/ssr';
import { Pencil, Trash2 } from 'lucide-react';

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

  const formatPrice = (price: number) => {
    if (price === 0) return '0 đ (Miễn phí)';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  // Badge config theo loại sản phẩm
  const typeConfig = isDigital
    ? {
        label: 'Sản phẩm số',
        icon: FileText,
        badgeClass:
          'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
      }
    : isLead
      ? {
          label: 'Quà 0đ',
          icon: Gift,
          badgeClass:
            'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
        }
      : isPhysical
        ? {
            label: 'Hàng đặt trước',
            icon: Package,
            badgeClass:
              'bg-amber-50 text-amber-600 dark:text-amber-400 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40'
          }
        : {
            label: 'Liên kết',
            icon: ArrowSquareOut,
            badgeClass:
              'bg-purple-50 text-purple-600 dark:text-purple-400 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40'
          };

  const TypeIcon = typeConfig.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-card transition-all duration-200 select-none shadow-xs',
        isDragging
          ? 'opacity-85 shadow-2xl ring-2 ring-primary/60 scale-[1.01] z-50 bg-white dark:bg-card border-primary/50'
          : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm',
        !product.isPublished &&
          'opacity-65 bg-neutral-50/50 dark:bg-neutral-900/30 border-dashed border-neutral-300 dark:border-neutral-700'
      )}
    >
      {/* 1. TẦNG TRÊN: Grip kéo thả + Ảnh vuông 1:1 + Khối thông tin (Badge & Tiêu đề 2 dòng) */}
      <div className='flex items-start gap-3 min-w-0'>
        {/* Grip handle kéo thả */}
        <div
          {...attributes}
          {...listeners}
          className='p-1.5 -ml-1 mt-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-grab active:cursor-grabbing touch-none shrink-0 transition-colors'
          title='Kéo thả để sắp xếp vị trí'
        >
          <DotsSixVertical size={18} weight='bold' className='shrink-0' />
        </div>

        {/* Ảnh bìa sản phẩm cố định tỷ lệ vuông 1:1 (w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-100) */}
        <div className='relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shadow-2xs'>
          {product.coverImage ? (
            <img
              src={product.coverImage}
              alt={product.title}
              className='w-full h-full object-cover shrink-0 transition-transform group-hover:scale-105 duration-300'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-neutral-400 bg-neutral-100 dark:bg-neutral-800'>
              <Package size={20} className='text-neutral-400' />
            </div>
          )}
          {product.isFeatured && (
            <span className='absolute top-1 left-1 rounded-md bg-primary px-1 py-0.2 text-[8px] font-black uppercase text-primary-foreground shadow-xs z-10'>
              HOT
            </span>
          )}
        </div>

        {/* Khối thông tin: Badge nhỏ phía trên + Tiêu đề 2 dòng thoáng mắt */}
        <div className='min-w-0 flex-1 space-y-1'>
          <div>
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border',
                typeConfig.badgeClass
              )}
            >
              <TypeIcon size={12} weight='bold' className='shrink-0' />
              <span>{typeConfig.label}</span>
            </span>
          </div>

          <h4
            onClick={() => onEdit(product)}
            className='font-bold text-[15px] text-neutral-900 dark:text-white leading-snug line-clamp-2 cursor-pointer hover:text-primary transition-colors tracking-tight'
            title={product.title}
          >
            {product.title}
          </h4>
        </div>
      </div>

      {/* 2. TẦNG DƯỚI (Thanh trạng thái và thao tác): Phía trái giá & đã bán - Phía phải Switch, Sửa, Xóa */}
      <div className='flex items-center justify-between gap-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80'>
        {/* Phía trái: Giá bán in đậm to rõ kèm tag nhỏ Đã bán */}
        <div className='flex items-center gap-2 flex-wrap min-w-0'>
          <span className='font-extrabold text-[#161823] dark:text-white text-[15px] font-mono'>
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className='text-neutral-400 line-through text-[11px] font-mono'>
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className='inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-500 dark:text-neutral-400 shrink-0'>
            Đã bán: {product.soldCount ?? 0} lượt
          </span>
          {isPhysical && product.stock !== undefined && (
            <span className='inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-500 dark:text-neutral-400 shrink-0'>
              Kho: {product.stock}
            </span>
          )}
        </div>

        {/* Phía phải: Cụm công tắc Switch, nút Sửa & nút Xóa (touch target tối thiểu 36px) */}
        <div className='flex items-center gap-2 shrink-0'>
          <div className='flex items-center justify-center p-1'>
            <Switch
              checked={product.isPublished}
              onCheckedChange={() => onTogglePublish(product)}
              title={product.isPublished ? 'Đang hiển thị trên tiệm' : 'Đang tạm ẩn'}
            />
          </div>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => onEdit(product)}
            className='h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white cursor-pointer transition-colors'
            title='Chỉnh sửa sản phẩm'
          >
            <Pencil className='h-4 w-4' />
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={() => onDelete(product.id)}
            className='h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-xl text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors'
            title='Xóa sản phẩm'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
