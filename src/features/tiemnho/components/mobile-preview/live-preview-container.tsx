'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { ResponsiveStorefrontView } from '../storefront/responsive-storefront-view';
import { Smartphone, Monitor, Maximize2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface LivePreviewContainerProps {
  profile: CreatorProfile;
  products: Product[];
  paymentConfig: PaymentConfig;
  defaultMode?: 'mobile' | 'desktop';
  className?: string;
}

export function LivePreviewContainer({
  profile,
  products,
  paymentConfig,
  defaultMode = 'mobile',
  className
}: LivePreviewContainerProps) {
  const [mode, setMode] = React.useState<'mobile' | 'desktop'>(defaultMode);
  const [isDesktopModalOpen, setIsDesktopModalOpen] = React.useState(false);

  // Khi click vào chế độ "Máy tính", mở Modal Dialog phóng to toàn màn hình mô phỏng giao diện Web Storefront
  const handleSelectMode = (newMode: 'mobile' | 'desktop') => {
    setMode(newMode);
    if (newMode === 'desktop') {
      setIsDesktopModalOpen(true);
    }
  };

  return (
    <div className={cn('flex flex-col items-center w-full space-y-4 select-none', className)}>
      {/* 1. Toggle Controls: Mobile vs Desktop */}
      <div className='inline-flex items-center p-1 rounded-2xl bg-muted/80 border border-border shadow-2xs'>
        <button
          type='button'
          onClick={() => handleSelectMode('mobile')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
            mode === 'mobile'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Smartphone className='w-4 h-4' />
          <span>Điện thoại</span>
        </button>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type='button'
                onClick={() => handleSelectMode('desktop')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  mode === 'desktop'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              />
            }
          >
            <Monitor className='w-4 h-4' />
            <span>Máy tính</span>
          </TooltipTrigger>
          <TooltipContent side='top' className='text-xs'>
            Xem trước giao diện khách thấy trên máy tính
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 2. Responsive Simulator Frame Trong Cột Dashboard */}
      <div className='w-full flex justify-center transition-all duration-300 ease-in-out overflow-hidden'>
        {/* ======================================================== */}
        {/* MOBILE SIMULATOR: Khung mô phỏng iPhone tỷ lệ chuẩn       */}
        {/* ======================================================== */}
        <div className='relative w-full max-w-[390px] h-[780px] rounded-[52px] p-3.5 bg-zinc-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.12)] ring-1 ring-zinc-800 transition-all duration-300'>
          {/* Buttons on Side */}
          <div className='absolute -left-[3px] top-[120px] h-8 w-[3px] rounded-l-sm bg-zinc-700' />
          <div className='absolute -left-[3px] top-[165px] h-12 w-[3px] rounded-l-sm bg-zinc-700' />
          <div className='absolute -left-[3px] top-[225px] h-12 w-[3px] rounded-l-sm bg-zinc-700' />
          <div className='absolute -right-[3px] top-[170px] h-16 w-[3px] rounded-r-sm bg-zinc-700' />

          {/* Screen Glass */}
          <div className='relative h-full w-full overflow-hidden rounded-[40px] bg-white border border-border/40 flex flex-col'>
            {/* iOS Status Bar */}
            <div className='relative z-30 flex h-9 w-full shrink-0 items-center justify-between px-6 pt-1 text-[11px] font-semibold text-zinc-900'>
              <span>9:41</span>
              {/* Dynamic Island */}
              <div className='absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black shadow-xs' />
              <div className='flex items-center gap-1.5'>
                <svg className='h-3 w-3 fill-current' viewBox='0 0 24 24'>
                  <path d='M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z' />
                </svg>
                <div className='h-2.5 w-5 rounded-xs border border-current p-0.5'>
                  <div className='h-full w-full rounded-2xs bg-current' />
                </div>
              </div>
            </div>

            {/* Scrollable Mobile View */}
            <div className='flex-1 overflow-y-auto overscroll-contain scrollbar-none'>
              <ResponsiveStorefrontView
                profile={profile}
                products={products}
                paymentConfig={paymentConfig}
                isPreview={true}
                previewMode='mobile'
              />
            </div>

            {/* iOS Home Indicator Bar */}
            <div className='relative z-30 flex h-4 w-full shrink-0 items-center justify-center pb-1'>
              <div className='h-1 w-28 rounded-full bg-zinc-400' />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. POPUP TO (DESKTOP MODAL) ĐỂ XEM ĐỦ VIEW TOÀN BỘ WEBSITE */}
      {/* ======================================================== */}
      <Dialog
        open={isDesktopModalOpen}
        onOpenChange={(open) => {
          setIsDesktopModalOpen(open);
          if (!open) {
            setMode('mobile');
          }
        }}
      >
        <DialogContent
          className='sm:max-w-6xl w-[96vw] max-w-[1400px] h-[92vh] p-0 rounded-3xl overflow-hidden border border-neutral-200/90 bg-card shadow-2xl flex flex-col'
          showCloseButton={false}
        >
          {/* Header trình duyệt Desktop với thanh địa chỉ & nút đóng */}
          <div className='h-12 bg-neutral-100 dark:bg-neutral-900 border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0'>
            {/* macOS 3 dots */}
            <div className='flex items-center gap-2'>
              <div className='h-3 w-3 rounded-full bg-rose-400' />
              <div className='h-3 w-3 rounded-full bg-amber-400' />
              <div className='h-3 w-3 rounded-full bg-emerald-400' />
              <span className='text-xs font-semibold text-muted-foreground ml-2 hidden sm:inline'>
                Xem trước giao diện máy tính (Desktop Full View)
              </span>
            </div>

            {/* Thanh địa chỉ URL giả lập */}
            <div className='flex-1 max-w-md mx-4'>
              <div className='w-full h-8 px-4 rounded-xl bg-background border border-border/80 text-xs font-mono text-muted-foreground flex items-center justify-center gap-2 shadow-2xs'>
                <span className='text-emerald-500 text-[10px]'>🔒</span>
                <span className='truncate font-medium text-foreground'>
                  tiemnho.vn/@{profile.username}
                </span>
              </div>
            </div>

            {/* Nút đóng popup */}
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => {
                  setIsDesktopModalOpen(false);
                  setMode('mobile');
                }}
                className='h-8 px-3 rounded-xl bg-background hover:bg-muted text-xs font-semibold text-foreground border border-border flex items-center gap-1.5 transition-colors cursor-pointer'
              >
                <X className='h-3.5 w-3.5' />
                <span>Đóng</span>
              </button>
            </div>
          </div>

          {/* Vùng hiển thị toàn màn hình chuẩn Desktop 100% */}
          <div className='flex-1 overflow-y-auto bg-[#F4F4F5]'>
            <ResponsiveStorefrontView
              profile={profile}
              products={products}
              paymentConfig={paymentConfig}
              isPreview={false}
              previewMode='desktop'
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
