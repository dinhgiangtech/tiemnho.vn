'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/common/logo';
import { InteractiveGridPattern } from './interactive-grid';
import {
  loginCreator,
  sendLoginOtp,
  resendLoginOtp,
  verifyLoginOtp
} from '@/app/actions/auth-actions';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RotateCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function StanStoreLoginForm() {
  const router = useRouter();

  // Chế độ đăng nhập: 'PASSWORD' (Tên/Email + Mật khẩu, mặc định) | 'OTP' (Mã OTP qua email)
  const [authMode, setAuthMode] = React.useState<'OTP' | 'PASSWORD'>('PASSWORD');

  // Password mode states
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // OTP mode states
  const [otpStep, setOtpStep] = React.useState<'EMAIL' | 'OTP'>('EMAIL');
  const [otpEmail, setOtpEmail] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [countdown, setCountdown] = React.useState(0);
  const [isResending, setIsResending] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  // Đếm ngược 60 giây khi gửi OTP
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Đăng nhập bằng Mật khẩu
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      // Dùng window.location.href để ép trình duyệt load lại toàn bộ cookie session mới nhất
      window.location.href = '/dashboard/products';
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
      setIsLoading(false);
    }
  };

  // Bước 1 OTP: Gửi mã OTP đăng nhập
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = otpEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendLoginOtp(cleanEmail);

      if (!res.success) {
        setErrorMessage(res.error || 'Không thể gửi mã đăng nhập!');
        setIsLoading(false);
        return;
      }

      setOtpStep('OTP');
      setCountdown(60);
      setOtpCode('');
      toast.success(`Mã OTP đã được gửi đến ${cleanEmail}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2 OTP: Xác thực mã OTP và đăng nhập
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    if (code.length < 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số mã xác thực!');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await verifyLoginOtp({
        email: otpEmail.trim(),
        code
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Mã xác thực không chính xác!');
        setIsLoading(false);
        return;
      }

      toast.success('Đăng nhập thành công!');
      // Dùng window.location.href để ép trình duyệt load lại toàn bộ cookie session mới nhất
      window.location.href = '/dashboard/products';
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Không thể xác thực mã OTP. Vui lòng thử lại!');
      setIsLoading(false);
    }
  };

  // Gửi lại mã OTP đăng nhập
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');

    try {
      const res = await resendLoginOtp(otpEmail.trim());
      if (!res.success) {
        toast.error(res.error || 'Không thể gửi lại mã xác thực');
      } else {
        toast.success(`Đã gửi lại mã xác thực mới đến ${otpEmail.trim()}`);
        setCountdown(60);
        setOtpCode('');
      }
    } catch {
      toast.error('Lỗi khi gửi lại mã OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-[#FAFAFA] dark:bg-[#0B0C0E] text-[#161823] dark:text-white selection:bg-[#FE2C55] selection:text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6'>
      {/* 1. Nền sáng tinh tế, Lưới Grid mờ & Vệt sáng Glow */}
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

      {/* 2. Container Form Đăng Nhập Căn Giữa */}
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
              {authMode === 'OTP' && otpStep === 'OTP'
                ? 'Xác thực đăng nhập'
                : 'Đăng nhập Tiệm Nhỏ'}
            </h1>
            <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed'>
              {authMode === 'OTP' && otpStep === 'OTP'
                ? `Nhập mã 6 chữ số vừa được gửi đến email ${otpEmail}`
                : 'Quản lý tiệm và theo dõi đơn hàng, doanh thu của bạn.'}
            </p>
          </div>

          {/* Bộ chọn phương thức đăng nhập (Chỉ hiển thị khi chưa vào bước nhập mã OTP) */}
          {!(authMode === 'OTP' && otpStep === 'OTP') && (
            <div className='flex rounded-xl bg-neutral-100 dark:bg-neutral-900 p-1 border border-neutral-200/60 dark:border-neutral-800'>
              <button
                type='button'
                onClick={() => {
                  setAuthMode('PASSWORD');
                  setErrorMessage('');
                }}
                className={cn(
                  'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  authMode === 'PASSWORD'
                    ? 'bg-white dark:bg-[#1A1C22] text-[#161823] dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
                )}
              >
                Mật khẩu
              </button>
              <button
                type='button'
                onClick={() => {
                  setAuthMode('OTP');
                  setErrorMessage('');
                }}
                className={cn(
                  'flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  authMode === 'OTP'
                    ? 'bg-white dark:bg-[#1A1C22] text-[#161823] dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white'
                )}
              >
                Mã OTP Email (Nhanh)
              </button>
            </div>
          )}

          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className='p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400'>
              <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Phương thức 1: Đăng nhập OTP */}
          {authMode === 'OTP' ? (
            otpStep === 'EMAIL' ? (
              /* Bước 1: Nhập email nhận OTP */
              <form onSubmit={handleSendOtp} className='space-y-4'>
                <div className='space-y-1.5'>
                  <Label
                    htmlFor='otpEmail'
                    className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
                  >
                    Địa chỉ Email của bạn <span className='text-[#FE2C55]'>*</span>
                  </Label>
                  <div className='relative flex items-center'>
                    <Mail className='w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none' />
                    <Input
                      id='otpEmail'
                      type='email'
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder='vidu@gmail.com'
                      disabled={isLoading}
                      className='h-11 pl-10 pr-3.5 text-sm rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#161823] dark:text-white placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/15 focus-visible:border-[#FE2C55]'
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type='submit'
                  disabled={isLoading || !otpEmail.trim()}
                  className='w-full h-11 py-2.5 rounded-xl font-bold text-sm text-white shadow-md shadow-[#FE2C55]/20 bg-[#FE2C55] hover:bg-[#EF244B] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span>Đang gửi mã đăng nhập...</span>
                    </>
                  ) : (
                    <span>Gửi mã OTP đăng nhập</span>
                  )}
                </Button>
              </form>
            ) : (
              /* Bước 2: Nhập mã OTP 6 số */
              <div className='space-y-5'>
                <div className='flex flex-col items-center justify-center space-y-3 pt-2'>
                  <Label className='text-xs font-semibold text-neutral-600 dark:text-neutral-300'>
                    Nhập mã 6 chữ số gửi tới email
                  </Label>
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(val) => {
                      setOtpCode(val);
                      if (val.length === 6) {
                        handleVerifyOtp(val);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <InputOTPGroup className='gap-2 sm:gap-2.5'>
                      <InputOTPSlot
                        index={0}
                        className='rounded-xl border border-[#E3E3E4] dark:border-neutral-800 h-12 w-11 sm:h-13 sm:w-12 text-base font-bold'
                      />
                      <InputOTPSlot
                        index={1}
                        className='rounded-xl border border-[#E3E3E4] dark:border-neutral-800 h-12 w-11 sm:h-13 sm:w-12 text-base font-bold'
                      />
                      <InputOTPSlot
                        index={2}
                        className='rounded-xl border border-[#E3E3E4] dark:border-neutral-800 h-12 w-11 sm:h-13 sm:w-12 text-base font-bold'
                      />
                      <InputOTPSlot
                        index={3}
                        className='rounded-xl border border-[#E3E3E4] dark:border-neutral-800 h-12 w-11 sm:h-13 sm:w-12 text-base font-bold'
                      />
                      <InputOTPSlot
                        index={4}
                        className='rounded-xl border border-[#E3E3E4] dark:border-neutral-800 h-12 w-11 sm:h-13 sm:w-12 text-base font-bold'
                      />
                      <InputOTPSlot
                        index={5}
                        className='rounded-xl border border-[#E3E3E4] dark:border-neutral-800 h-12 w-11 sm:h-13 sm:w-12 text-base font-bold'
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type='button'
                  onClick={() => handleVerifyOtp()}
                  disabled={isLoading || otpCode.length < 6}
                  className='w-full h-11 py-2.5 rounded-xl font-bold text-sm text-white shadow-md shadow-[#FE2C55]/20 bg-[#FE2C55] hover:bg-[#EF244B] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <span>Xác nhận & Vào tiệm ngay</span>
                  )}
                </Button>

                {/* Điều hướng quay lại & gửi lại mã OTP */}
                <div className='flex items-center justify-between text-xs pt-1 px-1'>
                  <button
                    type='button'
                    onClick={() => {
                      setOtpStep('EMAIL');
                      setErrorMessage('');
                    }}
                    className='text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer'
                  >
                    <ArrowLeft className='w-3.5 h-3.5' />
                    <span>Đổi email</span>
                  </button>

                  <button
                    type='button'
                    disabled={countdown > 0 || isResending}
                    onClick={handleResendOtp}
                    className='text-neutral-600 dark:text-neutral-300 hover:text-[#FE2C55] disabled:text-neutral-400 disabled:cursor-not-allowed font-medium flex items-center gap-1 transition-colors cursor-pointer'
                  >
                    <RotateCw className={cn('w-3.5 h-3.5', isResending && 'animate-spin')} />
                    {countdown > 0 ? `Gửi lại sau (${countdown}s)` : 'Gửi lại mã'}
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Phương thức 2: Đăng nhập bằng Mật khẩu */
            <form onSubmit={handlePasswordSubmit} className='space-y-4'>
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

              <Button
                type='submit'
                disabled={isLoading || !identifier.trim() || !password}
                className='w-full h-11 py-2.5 rounded-xl font-bold text-sm text-white shadow-md shadow-[#FE2C55]/20 bg-[#FE2C55] hover:bg-[#EF244B] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <span>Đăng nhập vào tiệm</span>
                )}
              </Button>
            </form>
          )}

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
