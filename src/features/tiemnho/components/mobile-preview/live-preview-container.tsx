'use client';

import * as React from 'react';
import { CreatorProfile, Product, PaymentConfig } from '@/constants/mock-tiemnho';
import { ResponsiveStorefrontView } from '../storefront/responsive-storefront-view';
import { Smartphone, Monitor, Copy, Check, ExternalLink, X, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn, getAppBaseUrl } from '@/lib/utils';
import { useAppDomain } from '@/hooks/use-app-domain';
import { toast } from 'sonner';

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
  const [copied, setCopied] = React.useState(false);
  const domain = useAppDomain();

  // Khi click vào chế độ "Máy tính", mở Modal Dialog phóng to toàn màn hình mô phỏng giao diện Web Storefront
  const handleSelectMode = (newMode: 'mobile' | 'desktop') => {
    setMode(newMode);
    if (newMode === 'desktop') {
      setIsDesktopModalOpen(true);
    }
  };

  const handleCopyLink = () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/@${profile.username}`
        : `${getAppBaseUrl()}/@${profile.username}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Đã sao chép liên kết tiệm của bạn!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn('flex flex-col items-center w-full select-none', className)}>
      {/* 1. Header trên cùng: Đường dẫn Storefront + Bộ nút chuyển đổi Phone / Desktop */}
      <div className='w-full max-w-[285px] flex flex-col items-center gap-2 mb-2.5'>
        {/* Đường link tiệm kèm nút ghé tiệm & nút sao chép như Stan Store */}
        <div className='w-full flex items-center justify-between px-0.5 text-xs'>
          <a
            href={`/@${profile.username}`}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors'
            title='Mở tiệm thực tế trong tab mới'
          >
            <ExternalLink className='w-3 h-3' />
            <span>Ghé tiệm</span>
          </a>

          <button
            type='button'
            onClick={handleCopyLink}
            className='inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B55F6] hover:text-[#4338CA] transition-colors cursor-pointer group'
            title='Sao chép link tiệm của bạn'
          >
            <span className='font-mono'>
              {domain}/@{profile.username || 'creator'}
            </span>
            {copied ? (
              <Check className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
            ) : (
              <Copy className='w-3.5 h-3.5 text-[#5B55F6] shrink-0' />
            )}
          </button>
        </div>

        {/* Nút chuyển chế độ dạng Pill Capsule */}
        <div className='inline-flex items-center p-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700/80 shadow-2xs'>
          <button
            type='button'
            onClick={() => handleSelectMode('mobile')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
              mode === 'mobile'
                ? 'bg-[#5B55F6] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <Smartphone className='w-3.5 h-3.5' />
            <span>Phone</span>
          </button>

          <button
            type='button'
            onClick={() => handleSelectMode('desktop')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer',
              mode === 'desktop'
                ? 'bg-[#5B55F6] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <Monitor className='w-3.5 h-3.5' />
            <span>Desktop</span>
          </button>
        </div>
      </div>

      {/* 2. KHUNG ĐIỆN THOẠI NHO NHỎ XINH XINH CHUẨN STAN STORE */}
      <div className='w-full flex justify-center transition-all duration-300 ease-in-out'>
        <div className='relative w-[285px] h-[570px] rounded-[42px] border-[3.5px] border-black bg-black shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] transition-all duration-300'>
          {/* Nút vật lý sườn trái */}
          <div className='absolute -left-[3px] top-[100px] h-6 w-[2.5px] rounded-l-xs bg-black' />
          <div className='absolute -left-[3px] top-[134px] h-6 w-[2.5px] rounded-l-xs bg-black' />

          {/* Nút nguồn sườn phải */}
          <div className='absolute -right-[3px] top-[115px] h-10 w-[2.5px] rounded-r-xs bg-black' />

          {/* Màn hình hiển thị tinh gọn bên trong */}
          <div className='relative h-full w-full overflow-hidden rounded-[38px] bg-white flex flex-col'>
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
          </div>
        </div>
      </div>

      {/* 3. POPUP TO (DESKTOP MODAL) ĐỂ XEM ĐỦ VIEW TOÀN BỘ WEBSITE TRÊN MÁY TÍNH */}
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
                <Lock className='w-3 h-3 text-emerald-500 shrink-0' />
                <span className='truncate font-medium text-foreground'>
                  {domain}/@{profile.username}
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
