import { cn } from '@/lib/utils';
import { SignIn as ClerkSignInForm } from '@clerk/nextjs';
import { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/common/logo';
import { InteractiveGridPattern } from './interactive-grid';
import { Sparkles, ArrowLeft, Percent, Wallet, Smartphone, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Đăng nhập | Tiệm Nhỏ',
  description: 'Nền tảng Bio Storefront cho Creator Việt Nam.'
};

export default function SignInViewPage() {
  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-[#FAFAFA] text-[#161823] selection:bg-[#FE2C55] selection:text-white flex items-center justify-center'>
      {/* 1. Nền sáng tinh tế, Lưới Grid mờ & Vệt sáng Glow TikTok */}
      <div className='pointer-events-none absolute inset-0'>
        {/* Vệt sáng hồng đỏ TikTok #FE2C55 rất nhẹ ở góc trên */}
        <div className='absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-[#FE2C55]/6 blur-[130px]' />
        {/* Vệt sáng xanh ngọc ở góc dưới */}
        <div className='absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-[#20D5EC]/6 blur-[140px]' />

        {/* Lưới grid pattern sáng thanh thoát */}
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(650px_circle_at_center,black,transparent)]',
            'inset-0 h-full w-full opacity-40 stroke-black/[0.04]'
          )}
        />
      </div>

      {/* 2. Nút quay lại trang chủ (Góc trên) */}
      <Link
        href='/'
        className='absolute top-6 left-6 z-30 inline-flex items-center gap-2 rounded-full border border-[#E3E3E4] bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#73747B] backdrop-blur-md shadow-2xs transition-all hover:border-[#161823]/30 hover:bg-white hover:text-[#161823]'
      >
        <ArrowLeft className='h-3.5 w-3.5' />
        <span>Về trang chủ</span>
      </Link>

      {/* 3. Bố cục chính 2 Cột chuẩn Light Theme Tối Giản */}
      <div className='relative z-20 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-12 lg:py-12'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: Branding & Social Proof                         */}
        {/* ========================================================= */}
        <div className='flex flex-col justify-center space-y-8 lg:col-span-6 lg:pr-6'>
          {/* Header Logo */}
          <div className='flex items-center gap-3'>
            <div className='inline-flex items-center rounded-2xl border border-[#E3E3E4] bg-white px-4 py-2 shadow-2xs'>
              <Logo size='md' href='/' showIconBadge={true} />
            </div>
          </div>

          {/* Headline & Badge */}
          <div className='space-y-4'>
            <div className='inline-flex items-center gap-2 rounded-full border border-[#FE2C55]/20 bg-[#FE2C55]/5 px-3.5 py-1 text-[11px] font-bold tracking-wider text-[#FE2C55] uppercase'>
              <Sparkles className='h-3.5 w-3.5' />
              <span>MỞ TIỆM BIO ALL-IN-ONE CỦA RIÊNG BẠN</span>
            </div>

            <h1 className='text-3xl font-extrabold tracking-tight text-[#161823] sm:text-4xl lg:text-[42px] lg:leading-[1.15]'>
              Cách đơn giản nhất để biến sáng tạo thành thu nhập tự động
            </h1>

            <p className='text-sm text-[#73747B] leading-relaxed max-w-lg'>
              Tài nguyên số, Template Notion, Ebook và quà tặng 0đ — tất cả được gói gọn và vận hành
              tự động ngay trong một đường link bio duy nhất.
            </p>
          </div>

          {/* 3 Bullet Lợi Ích Nổi Bật */}
          <div className='space-y-3 pt-1 max-w-lg'>
            <div className='flex items-center gap-3 rounded-xl border border-[#E3E3E4] bg-white p-3.5 shadow-2xs transition-all hover:border-[#161823]/30 hover:shadow-xs'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FE2C55]/10 text-[#FE2C55]'>
                <Percent className='h-4 w-4' strokeWidth={2.5} />
              </div>
              <div className='text-xs font-semibold text-[#161823]'>
                0% hoa hồng trên mọi đơn hàng
              </div>
            </div>

            <div className='flex items-center gap-3 rounded-xl border border-[#E3E3E4] bg-white p-3.5 shadow-2xs transition-all hover:border-[#161823]/30 hover:shadow-xs'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#20D5EC]/15 text-[#0DA5B8]'>
                <Wallet className='h-4 w-4' strokeWidth={2.5} />
              </div>
              <div className='text-xs font-semibold text-[#161823]'>
                Tiền về thẳng STK cá nhân qua VietQR
              </div>
            </div>

            <div className='flex items-center gap-3 rounded-xl border border-[#E3E3E4] bg-white p-3.5 shadow-2xs transition-all hover:border-[#161823]/30 hover:shadow-xs'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600'>
                <Smartphone className='h-4 w-4' strokeWidth={2.5} />
              </div>
              <div className='text-xs font-semibold text-[#161823]'>
                Tối ưu chuyển đổi tức thì trên TikTok WebView
              </div>
            </div>
          </div>

          {/* Lời chứng thực (Testimonial Card) */}
          <div className='relative rounded-2xl border border-[#E3E3E4] bg-white p-4.5 shadow-xs max-w-lg'>
            <Quote className='absolute top-3.5 right-4 h-6 w-6 text-zinc-200' />
            <p className='text-xs text-[#54565F] italic leading-relaxed'>
              &ldquo;Khách bấm vào bio, quét mã VietQR và nhận file ngay lập tức. Mình không còn
              phải mất thời gian check tin nhắn chuyển khoản thủ công nữa.&rdquo;
            </p>
            <div className='mt-3 flex items-center gap-2.5'>
              <div className='h-7 w-7 rounded-full bg-linear-to-tr from-[#FE2C55] to-[#20D5EC] flex items-center justify-center text-[10px] font-black text-white shadow-2xs'>
                TN
              </div>
              <div>
                <div className='text-xs font-bold text-[#161823]'>Thảo My</div>
                <div className='text-[10px] text-[#73747B] font-medium'>
                  Lifestyle Creator (140k followers)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: Form Clerk Light Mode Tối Giản                  */}
        {/* ========================================================= */}
        <div className='flex w-full items-center justify-center lg:col-span-6 lg:justify-end'>
          <div className='w-full max-w-md'>
            <ClerkSignInForm
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'w-full bg-white border border-[#E3E3E4] rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.06)] p-6 sm:p-8',
                  headerTitle: 'text-xl font-bold text-[#161823] tracking-tight',
                  headerSubtitle: 'text-xs text-[#73747B]',
                  socialButtonsBlockButton:
                    'bg-white hover:bg-[#F8F8F8] text-[#161823] text-xs font-bold py-2.5 rounded-xl border border-[#E3E3E4] shadow-2xs transition-all duration-200',
                  socialButtonsBlockButtonText: 'font-bold text-[#161823]',
                  dividerLine: 'bg-[#E3E3E4]',
                  dividerText: 'text-[11px] text-[#73747B] uppercase font-semibold tracking-wider',
                  formFieldLabel: 'text-xs font-semibold text-[#161823]',
                  formFieldInput:
                    'bg-white border border-[#E3E3E4] text-[#161823] rounded-xl text-sm py-2.5 px-3.5 focus:border-[#FE2C55] focus:ring-2 focus:ring-[#FE2C55]/15 placeholder:text-zinc-400 transition-all',
                  formButtonPrimary:
                    'bg-[#FE2C55] hover:bg-[#EF244B] text-white text-sm font-semibold py-2.5 rounded-xl shadow-md shadow-[#FE2C55]/20 transition-all duration-200 active:scale-[0.99]',
                  footerActionText: 'text-xs text-[#73747B]',
                  footerActionLink:
                    'text-[#FE2C55] hover:text-[#EF244B] font-semibold text-xs transition-colors',
                  identityPreviewText: 'text-xs font-medium text-[#161823]',
                  identityPreviewEditButton: 'text-[#FE2C55] hover:text-[#EF244B]',
                  formFieldAction: 'text-xs text-[#FE2C55] hover:text-[#EF244B] font-medium'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
