'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/common/logo';
import { InteractiveGridPattern } from './interactive-grid';
import { registerCreator, checkUsername } from '@/app/actions/auth-actions';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Danh sách mã quốc gia hỗ trợ
const COUNTRY_CODES = [
  { code: '+84', country: 'Việt Nam', flag: '🇻🇳' },
  { code: '+1', country: 'Hoa Kỳ (US)', flag: '🇺🇸' },
  { code: '+81', country: 'Nhật Bản (JP)', flag: '🇯🇵' },
  { code: '+82', country: 'Hàn Quốc (KR)', flag: '🇰🇷' },
  { code: '+65', country: 'Singapore (SG)', flag: '🇸🇬' },
  { code: '+44', country: 'Vương quốc Anh (UK)', flag: '🇬🇧' },
  { code: '+61', country: 'Úc (AU)', flag: '🇦🇺' },
  { code: '+886', country: 'Đài Loan (TW)', flag: '🇹🇼' }
];

export function StanStoreRegisterForm() {
  const router = useRouter();

  // Form states
  const [username, setUsername] = React.useState('');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [countryCode, setCountryCode] = React.useState('+84');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Dropdown mã quốc gia
  const [isCountryOpen, setIsCountryOpen] = React.useState(false);
  const countryDropdownRef = React.useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  // Trạng thái kiểm tra username realtime
  const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
  const [usernameStatus, setUsernameStatus] = React.useState<{
    available: boolean | null;
    message: string;
  }>({ available: null, message: '' });

  // Tự động đóng dropdown khi click ra ngoài
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động chuẩn hóa username khi gõ
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
  };

  // Debounce kiểm tra trùng lặp username
  React.useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus({ available: null, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const res = await checkUsername(username);
        if (res.available) {
          setUsernameStatus({ available: true, message: 'Đường link hợp lệ!' });
        } else {
          setUsernameStatus({
            available: false,
            message: res.error || 'Đường link này đã có người sử dụng'
          });
        }
      } catch {
        setUsernameStatus({ available: null, message: '' });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  // Xử lý gửi Form đăng ký
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username || username.length < 3) {
      setErrorMessage('Đường link tiệm phải có tối thiểu 3 ký tự!');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn!');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = phone.trim() ? `${countryCode} ${phone.trim()}` : undefined;
      const res = await registerCreator({
        username,
        name,
        email,
        phone: fullPhone,
        password
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Có lỗi xảy ra khi tạo tài khoản!');
        setIsLoading(false);
        return;
      }

      toast.success('Mở tiệm thành công! Chào mừng bạn đến với Tiệm Nhỏ.');
      router.push('/dashboard/products');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại!');
      setIsLoading(false);
    }
  };

  const displayUsername = username.trim() || 'bạn';
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

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

      {/* 2. Container Form Đăng Ký Căn Giữa Chuẩn Base UI Dự Án */}
      <div className='relative z-20 w-full max-w-md mx-auto'>
        {/* Logo Tiệm Nhỏ */}
        <div className='flex justify-center mb-6'>
          <Logo size='lg' href='/' showIconBadge={true} />
        </div>

        {/* Khung Card Form Tiệm Nhỏ */}
        <div className='w-full bg-white dark:bg-[#141519] border border-[#E3E3E4] dark:border-neutral-800 rounded-3xl shadow-[0_12px_35px_rgba(0,0,0,0.05)] p-6 sm:p-8 space-y-6'>
          {/* Header tương tác */}
          <div className='text-center space-y-2'>
            <h1 className='text-2xl sm:text-[26px] font-extrabold text-[#161823] dark:text-white tracking-tight leading-tight'>
              Chào @{displayUsername}
            </h1>
            <p className='text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed'>
              Khởi tạo Tiệm Nhỏ để bắt đầu bán tài nguyên số và nhận tiền tự động qua VietQR.
            </p>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMessage && (
            <div className='p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400'>
              <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form 5 trường thông tin */}
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Trường 1: Đường link tiệm của bạn */}
            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='username'
                  className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
                >
                  Đường link tiệm của bạn <span className='text-[#FE2C55]'>*</span>
                </Label>
                {isCheckingUsername ? (
                  <span className='text-[11px] text-neutral-400 flex items-center gap-1 font-medium'>
                    <Loader2 className='w-3 h-3 animate-spin' />
                    Đang kiểm tra...
                  </span>
                ) : usernameStatus.available === true ? (
                  <span className='text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1'>
                    <CheckCircle2 className='w-3 h-3' />
                    Có thể đăng ký
                  </span>
                ) : usernameStatus.available === false ? (
                  <span className='text-[11px] text-[#FE2C55] font-semibold flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3' />
                    {usernameStatus.message}
                  </span>
                ) : null}
              </div>

              {/* Ô input link có prefix tiemnho.vn/@ */}
              <div className='relative flex items-center rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-neutral-900 focus-within:border-[#FE2C55] focus-within:ring-2 focus-within:ring-[#FE2C55]/15 transition-all shadow-2xs'>
                <div className='flex items-center pl-3.5 pr-0.5 text-neutral-400 dark:text-neutral-500 font-medium text-sm select-none'>
                  <span>tiemnho.vn/@</span>
                </div>
                <Input
                  id='username'
                  type='text'
                  required
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder='ten-tiem'
                  disabled={isLoading}
                  className='h-11 pl-0 pr-3 text-sm font-bold border-0 bg-transparent text-[#161823] dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus-visible:ring-0 shadow-none'
                  autoFocus
                />
              </div>
            </div>

            {/* Trường 2: Tên tiệm / Họ tên */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='name'
                className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
              >
                Họ và tên của bạn <span className='text-[#FE2C55]'>*</span>
              </Label>
              <div className='relative flex items-center'>
                <User className='w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none' />
                <Input
                  id='name'
                  type='text'
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Ví dụ: An Nhiên, Giang Đinh...'
                  disabled={isLoading}
                  className='h-11 pl-10 pr-3.5 text-sm rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#161823] dark:text-white placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/15 focus-visible:border-[#FE2C55]'
                />
              </div>
            </div>

            {/* Trường 3: Địa chỉ Email */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='email'
                className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
              >
                Địa chỉ Email <span className='text-[#FE2C55]'>*</span>
              </Label>
              <div className='relative flex items-center'>
                <Mail className='w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none' />
                <Input
                  id='email'
                  type='email'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='vidu@gmail.com'
                  disabled={isLoading}
                  className='h-11 pl-10 pr-3.5 text-sm rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[#161823] dark:text-white placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/15 focus-visible:border-[#FE2C55]'
                />
              </div>
            </div>

            {/* Trường 4: Số điện thoại (Kèm Select chọn mã quốc gia) */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='phone'
                className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
              >
                Số điện thoại liên hệ
              </Label>
              <div className='relative flex items-center rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-neutral-900 focus-within:border-[#FE2C55] focus-within:ring-2 focus-within:ring-[#FE2C55]/15 transition-all shadow-2xs'>
                {/* Select chọn mã quốc gia */}
                <div className='relative' ref={countryDropdownRef}>
                  <button
                    type='button'
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                    className='h-11 px-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-l-xl transition-colors cursor-pointer border-r border-[#E3E3E4] dark:border-neutral-800 select-none'
                  >
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <ChevronDown className='w-3.5 h-3.5 text-neutral-400' />
                  </button>

                  {/* Menu danh sách quốc gia */}
                  {isCountryOpen && (
                    <div className='absolute left-0 top-12 z-50 w-56 rounded-xl border border-[#E3E3E4] dark:border-neutral-800 bg-white dark:bg-[#1A1C22] shadow-xl py-1 text-xs max-h-56 overflow-y-auto'>
                      {COUNTRY_CODES.map((item) => (
                        <button
                          key={item.code}
                          type='button'
                          onClick={() => {
                            setCountryCode(item.code);
                            setIsCountryOpen(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer',
                            countryCode === item.code && 'bg-[#FE2C55]/10 text-[#FE2C55] font-bold'
                          )}
                        >
                          <span className='flex items-center gap-2'>
                            <span className='text-sm'>{item.flag}</span>
                            <span>{item.country}</span>
                          </span>
                          <span className='text-neutral-400 font-mono'>{item.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input số điện thoại */}
                <Input
                  id='phone'
                  type='tel'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder='0987 654 321'
                  disabled={isLoading}
                  className='h-11 pl-3 pr-3.5 text-sm border-0 bg-transparent text-[#161823] dark:text-white placeholder:text-neutral-400 focus-visible:ring-0 shadow-none'
                />
              </div>
            </div>

            {/* Trường 5: Mật khẩu */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='password'
                className='text-xs font-semibold text-[#161823] dark:text-neutral-300'
              >
                Mật khẩu <span className='text-[#FE2C55]'>*</span>
              </Label>
              <div className='relative flex items-center'>
                <Lock className='w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Tối thiểu 6 ký tự'
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

            {/* Nút bấm chính: [ 🚀 Bắt đầu mở tiệm ] */}
            <Button
              type='submit'
              disabled={isLoading || isCheckingUsername || usernameStatus.available === false}
              className='w-full h-11 py-2.5 rounded-xl font-bold text-sm text-white shadow-md shadow-[#FE2C55]/20 bg-[#FE2C55] hover:bg-[#EF244B] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Đang khởi tạo tiệm...</span>
                </>
              ) : (
                <span>Bắt đầu mở tiệm</span>
              )}
            </Button>
          </form>

          {/* Footer chuyển sang Đăng nhập */}
          <div className='text-center pt-2 text-xs text-neutral-500 dark:text-neutral-400 border-t border-[#E3E3E4] dark:border-neutral-800'>
            Đã có tài khoản tiệm?{' '}
            <Link
              href='/login'
              className='font-bold text-[#FE2C55] hover:underline transition-colors'
            >
              Đăng nhập ngay
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
