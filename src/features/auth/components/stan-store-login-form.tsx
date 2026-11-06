'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/common/logo';
import { InteractiveGridPattern } from './interactive-grid';
import { loginCreator } from '@/app/actions/auth-actions';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function StanStoreLoginForm() {
  const router = useRouter();

  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Vui lòng nhập email/tên đăng nhập và mật khẩu!');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginCreator({ identifier, password });

      if (!res.success) {
        setErrorMessage(res.error || 'Đăng nhập không thành công!');
        setIsLoading(false);
        return;
      }

      toast.success('Đăng nhập thành công!');
      router.push('/dashboard/products');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
      setIsLoading(false);
    }
  };

  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-[#FAFAFA] dark:bg-[#0B0C0E] text-[#161823] dark:text-white selection:bg-[#FE2C55] selection:text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6'>
      {/* 1. Nền sáng tinh tế, Lưới Grid mờ & Vệt sáng Glow TikTok */}
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-[#FE2C55]/6 blur-[130px]' />
        <div className='absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-[#20D5EC]/6 blur-[140px]' />

        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(650px_circle_at_center,black,transparent)]',
            'inset-0 h-full w-full opacity-40 stroke-black/[0.04] dark:stroke-white/[0.04]'
          )}
        />
      </div>

      {/* 2. Container Form Đăng Nhập Căn Giữa Chuẩn Base UI */}
      <div className='relative z-20 w-full max-w-md mx-auto'>
        {/* Logo Tiệm Nhỏ */}
        <div className='flex justify-center mb-6'>
          <Logo size='lg' href='/' showIconBadge={true} />
        </div>

        {/* Khung Card Form Tiệm Nhỏ */}
        <div className='w-full bg-white dark:bg-[#141519] border border-[#E3E3E4] dark:border-neutral-800 rounded-3xl shadow-[0_12px_35px_rgba(0,0,0,0.05)] p-6 sm:p-8 space-y-6'>
          {/* Header */}
          <div className='text-center space-y-2'>
            <h1 className='text-2xl sm:text-[26px] font-extrabold text-[#161823] dark:text-white tracking-tight leading-tight'>
              Đăng nhập Tiệm Nhỏ
            </h1>
            <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed'>
              Quản lý tiệm và theo dõi đơn hàng, doanh thu của bạn.
            </p>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className='p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400'>
              <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Email hoặc Tên đăng nhập */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='identifier'
                className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
              >
                Email hoặc Tên tiệm (@username)
              </Label>
              <div className='relative flex items-center'>
                <User className='w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none' />
                <Input
                  id='identifier'
                  type='text'
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder='vidu@gmail.com hoặc ten-tiem'
                  disabled={isLoading}
                  className='h-11 pl-10 pr-3.5 text-sm rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#161823] dark:text-white placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/15 focus-visible:border-[#FE2C55]'
                  autoFocus
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='password'
                className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
              >
                Mật khẩu
              </Label>
              <div className='relative flex items-center'>
                <Lock className='w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Nhập mật khẩu của bạn'
                  disabled={isLoading}
                  className='h-11 pl-10 pr-10 text-sm rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#161823] dark:text-white placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/15 focus-visible:border-[#FE2C55]'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-0.5'
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <Button
              type='submit'
              // disabled={isLoading || !identifier.trim() || !password}
              className='w-full h-11 py-2.5 rounded-xl font-bold text-sm text-white shadow-md shadow-[#FE2C55]/20 bg-[#FE2C55] hover:bg-[#EF244B] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập vào tiệm →</span>
              )}
            </Button>
          </form>

          {/* Footer chuyển sang Đăng ký */}
          <div className='text-center pt-2 text-xs text-neutral-500 dark:text-neutral-400 border-t border-[#E3E3E4] dark:border-neutral-800'>
            Chưa có tiệm trên Tiệm Nhỏ?{' '}
            <Link
              href='/onboarding'
              className='font-bold text-[#FE2C55] hover:underline transition-colors'
            >
              Khởi tạo ngay
            </Link>
          </div>
        </div>

        {/* Nút quay về trang chủ */}
        <div className='text-center mt-6'>
          <Link
            href='/'
            className='text-xs font-semibold text-[#73747B] hover:text-[#161823] dark:text-neutral-400 dark:hover:text-white transition-colors'
          >
            ← Quay lại trang chủ Tiệm Nhỏ
          </Link>
        </div>
      </div>
    </div>
  );
}
