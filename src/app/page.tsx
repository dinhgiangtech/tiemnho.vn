import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Logo } from '@/components/common/logo';
import { getProfile, getProducts, getPaymentConfig } from '@/features/tiemnho/api/service';
import { PhoneMockup } from '@/features/tiemnho/components/mobile-preview/phone-mockup';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

export const metadata = {
  title: 'Tiệm Nhỏ (TiemNho.vn) - Nền tảng Bán Hàng & Nhận Tiền Cho Creator Việt Nam',
  description:
    'Biến Link-in-Bio thành cỗ máy bán tài nguyên số & nhận tiền tự động 24/7 bằng VietQR. 0% hoa hồng, tiền về thẳng 100% tài khoản ngân hàng của bạn.'
};

export default async function LandingPage() {
  const { userId } = await auth();
  const [profile, products, paymentConfig] = await Promise.all([
    getProfile(),
    getProducts(),
    getPaymentConfig()
  ]);

  return (
    <div className='min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground'>
      {/* Top Navbar */}
      <header className='sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md'>
        <div className='max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6'>
          {/* Logo */}
          <div className='flex items-center gap-3'>
            <Logo size='md' href='/' showIconBadge={true} />
            <Badge
              variant='outline'
              className='hidden sm:inline-flex text-[10px] uppercase font-bold text-foreground border-border bg-muted/40'
            >
              Tiệm Nhỏ VN
            </Badge>
          </div>

          {/* Nav Links */}
          <nav className='hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground'>
            <a href='#features' className='hover:text-foreground transition-colors'>
              Tính năng
            </a>
            <a href='#pricing' className='hover:text-foreground transition-colors'>
              Bảng giá SaaS
            </a>
            <Link
              href='/@giangdinh'
              target='_blank'
              className='hover:text-primary transition-colors flex items-center gap-1'
            >
              Store mẫu (@giangdinh)
              <Icons.externalLink className='h-3.5 w-3.5' />
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className='flex items-center gap-2.5'>
            {userId ? (
              <div className='flex items-center gap-2'>
                <Link href='/dashboard/overview'>
                  <Button size='sm' className='rounded-xl font-semibold gap-1.5 shadow-sm'>
                    <Icons.dashboard className='h-4 w-4' />
                    Vào Dashboard
                  </Button>
                </Link>
                <UserButton />
              </div>
            ) : (
              <>
                <Link href='/auth/sign-in'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='rounded-xl text-xs sm:text-sm font-medium'
                  >
                    Đăng nhập
                  </Button>
                </Link>
                <Link href='/auth/sign-up'>
                  <Button
                    size='sm'
                    className='rounded-xl font-semibold shadow-sm text-xs sm:text-sm'
                  >
                    Tạo Tiệm Miễn Phí
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-28 border-b border-border/40'>
        {/* Ambient Glows */}
        <div className='pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[700px] rounded-full bg-muted/60 blur-[130px]' />

        <div className='max-w-4xl mx-auto px-4 sm:px-6 relative text-center space-y-6'>
          {/* Dòng 1: Kicker / Tag nhỏ trên cùng */}
          <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 border border-border text-foreground text-xs font-semibold shadow-xs'>
            <Icons.sparkles className='h-3.5 w-3.5 text-amber-500' />
            <span>Mở tiệm Bio All-in-One của riêng bạn</span>
          </div>

          {/* Dòng 2: Headline H1 chính, font to, đầm chắc */}
          <h1 className='text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15] max-w-3xl mx-auto'>
            Cách đơn giản nhất để biến sáng tạo thành thu nhập tự động
          </h1>

          {/* Dòng 3: Sub-headline / Mô tả phụ */}
          <p className='text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto'>
            Tài nguyên số, Template Notion, Ebook và quà tặng 0đ — tất cả được gói gọn và vận hành
            tự động ngay trong một đường link bio duy nhất.
          </p>

          {/* CTAs */}
          <div className='flex flex-col sm:flex-row items-center justify-center gap-3 pt-4'>
            <Link href={userId ? '/dashboard/overview' : '/auth/sign-up'}>
              <Button
                size='lg'
                className='w-full sm:w-auto h-12 px-7 rounded-2xl text-sm font-bold shadow-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 gap-2 cursor-pointer'
              >
                <Icons.shoppingCart className='h-4 w-4' />
                Bắt đầu dùng thử 14 ngày miễn phí
              </Button>
            </Link>

            <Link href='/@giangdinh' target='_blank'>
              <Button
                variant='outline'
                size='lg'
                className='w-full sm:w-auto h-12 px-6 rounded-2xl text-sm font-semibold gap-2 border-border text-foreground hover:bg-muted'
              >
                <Icons.deviceMobile className='h-4 w-4 text-foreground' />
                Ghé tiệm mẫu (@giangdinh)
              </Button>
            </Link>
          </div>

          {/* Social Proof Badges */}
          <div className='pt-6 border-t border-border/60 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground'>
            <div className='flex items-center gap-1.5'>
              <Icons.check className='h-4 w-4 text-emerald-500' />
              <span>
                <strong>0% Hoa hồng</strong> đơn hàng
              </span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Icons.check className='h-4 w-4 text-emerald-500' />
              <span>
                <strong>No Escrow:</strong> Tiền về thẳng STK
              </span>
            </div>
            <div className='flex items-center gap-1.5'>
              <Icons.check className='h-4 w-4 text-emerald-500' />
              <span>
                <strong>1-Tap Checkout:</strong> Dưới 1.5 giây
              </span>
            </div>
          </div>

          {/* Interactive Phone Preview Mockup Centered */}
          <div className='pt-10 flex justify-center'>
            <div className='relative'>
              <div className='absolute -inset-1 rounded-[60px] bg-gradient-to-tr from-primary/30 via-emerald-500/20 to-indigo-500/30 blur-2xl opacity-60' />
              <PhoneMockup
                profile={profile}
                products={products}
                paymentConfig={paymentConfig}
                className='scale-[0.85] sm:scale-95 md:scale-100 shadow-2xl'
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4 Loại sản phẩm Phase 1 MVP */}
      <section id='features' className='py-16 md:py-24 border-b border-border/40'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6'>
          <div className='text-center max-w-2xl mx-auto mb-12 space-y-3'>
            <Badge
              variant='outline'
              className='text-xs font-semibold uppercase tracking-wider text-primary'
            >
              Tính năng linh hoạt
            </Badge>
            <h2 className='text-2xl sm:text-4xl font-bold tracking-tight'>
              Hỗ trợ đầy đủ 4 loại sản phẩm & quà tặng
            </h2>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              Từ tài nguyên số tự động giao đến cẩm nang thu thập data khách hàng tiềm năng.
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            {[
              {
                title: 'Sản phẩm số (Digital)',
                tag: 'DIGITAL',
                desc: 'Ebook, Template Notion, Preset Lightroom, video LUTs, bảng tính Excel...',
                action: 'Nút tải file tức thì + Email dự phòng'
              },
              {
                title: 'Quà tặng 0đ (Lead Magnet)',
                tag: 'LEAD_MAGNET',
                desc: 'Checklist, cẩm nang tóm tắt để thu thập họ tên, Email & SĐT khách hàng tiềm năng.',
                action: 'Gửi link ngay không cần VietQR'
              },
              {
                title: 'Hàng theo yêu cầu (Physical)',
                tag: 'PHYSICAL',
                desc: 'Sách in kèm chữ ký, áo thun merch, đồ handmade làm theo yêu cầu số lượng giới hạn.',
                action: 'Form nhập địa chỉ + Xuất CSV gửi bưu điện'
              },
              {
                title: 'Nút chuyển hướng',
                tag: 'EXTERNAL_LINK',
                desc: 'Trỏ sang Shopee, TikTok Shop, nhóm kín Zalo, Telegram, YouTube hoặc link Affiliate.',
                action: 'Mở tab mới trực tiếp'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className='rounded-2xl border border-border p-5 space-y-3 bg-card shadow-xs flex flex-col justify-between'
              >
                <div className='space-y-2'>
                  <Badge variant='secondary' className='text-[10px] font-bold'>
                    {item.tag}
                  </Badge>
                  <h3 className='font-bold text-sm text-foreground'>{item.title}</h3>
                  <p className='text-xs text-muted-foreground leading-relaxed'>{item.desc}</p>
                </div>
                <div className='pt-2 border-t border-border/60 text-[11px] font-medium text-primary'>
                  ✓ {item.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bảng giá SaaS Thuần thuê bao */}
      <section id='pricing' className='py-16 md:py-24 bg-muted/20 border-b border-border/40'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6'>
          <div className='text-center max-w-xl mx-auto mb-12 space-y-3'>
            <Badge
              variant='outline'
              className='text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
            >
              Minh bạch 100%
            </Badge>
            <h2 className='text-2xl sm:text-4xl font-bold tracking-tight'>
              Mô hình SaaS thuần thuê bao
            </h2>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              Không cắt phế phần trăm doanh thu đơn hàng. Bạn giữ trọn 100% số tiền kiếm được.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Gói dùng thử */}
            <div className='rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs'>
              <div className='space-y-1.5'>
                <h3 className='font-bold text-lg text-foreground'>Gói Trải Nghiệm</h3>
                <p className='text-xs text-muted-foreground'>
                  Thử nghiệm đầy đủ tính năng kết nối VietQR.
                </p>
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='text-3xl font-extrabold text-foreground'>0 đ</span>
                <span className='text-xs text-muted-foreground'>/ 14 ngày dùng thử</span>
              </div>
              <ul className='space-y-2 text-xs text-muted-foreground'>
                <li className='flex items-center gap-2'>✓ Kết nối tài khoản ngân hàng VietQR</li>
                <li className='flex items-center gap-2'>✓ Đăng tối đa 3 sản phẩm số / 0đ</li>
                <li className='flex items-center gap-2'>✓ 1-Tap Checkout Drawer</li>
                <li className='flex items-center gap-2'>✓ 0% hoa hồng trên mọi đơn hàng</li>
              </ul>
              <Link href='/auth/sign-up'>
                <Button variant='outline' className='w-full rounded-xl text-xs font-semibold h-10'>
                  Bắt đầu dùng thử miễn phí
                </Button>
              </Link>
            </div>

            {/* Gói Creator Pro */}
            <div className='rounded-2xl border-2 border-zinc-900 dark:border-white bg-card p-6 space-y-5 shadow-lg relative'>
              <div className='absolute -top-3 right-6 rounded-full bg-zinc-900 dark:bg-white px-3 py-0.5 text-[10px] font-bold text-white dark:text-zinc-900 uppercase tracking-wider'>
                Phổ biến nhất
              </div>
              <div className='space-y-1.5'>
                <h3 className='font-bold text-lg text-foreground'>Gói Creator Pro</h3>
                <p className='text-xs text-muted-foreground'>
                  Dành cho Creator nghiêm túc kiếm tiền thụ động.
                </p>
              </div>
              <div className='flex items-baseline gap-1'>
                <span className='text-3xl font-extrabold text-foreground'>99.000 đ</span>
                <span className='text-xs text-muted-foreground'>/ tháng (hoặc 990k/năm)</span>
              </div>
              <ul className='space-y-2 text-xs text-foreground'>
                <li className='flex items-center gap-2 font-medium'>
                  ✓ <strong>0% hoa hồng vĩnh viễn</strong> (giữ 100% tiền)
                </li>
                <li className='flex items-center gap-2'>✓ Không giới hạn số lượng sản phẩm</li>
                <li className='flex items-center gap-2'>
                  ✓ Xuất file CSV danh bạ Leads & Đơn hàng
                </li>
                <li className='flex items-center gap-2'>
                  ✓ Tắt huy hiệu &quot;Powered by Tiệm Nhỏ&quot;
                </li>
                <li className='flex items-center gap-2'>
                  ✓ Live Mobile Preview & Hỗ trợ kỹ thuật 24/7
                </li>
              </ul>
              <Link href='/auth/sign-up'>
                <Button className='w-full rounded-xl text-xs font-bold h-10 shadow-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 cursor-pointer'>
                  Đăng ký Creator Pro ngay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='py-8 border-t border-border/60 bg-background text-xs text-muted-foreground'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-2.5'>
            <Logo size='sm' href='/' showIconBadge={true} />
            <span className='hidden sm:inline'>• Nền tảng Bio Storefront cho Creator Việt Nam</span>
          </div>

          <div className='flex items-center gap-4 text-xs'>
            <Link href='/@giangdinh' className='hover:text-primary transition-colors'>
              Gian hàng mẫu (@giangdinh)
            </Link>
            <Link href='/dashboard/overview' className='hover:text-primary transition-colors'>
              Creator Dashboard
            </Link>
            <Link href='/auth/sign-in' className='hover:text-primary transition-colors'>
              Đăng nhập
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
