import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { getProfile, getProducts, getPaymentConfig } from '@/features/tiemnho/api/service';
import { PhoneMockup } from '@/features/tiemnho/components/mobile-preview/phone-mockup';
import { auth } from '@clerk/nextjs/server';

export const metadata = {
  title: 'Tiệm Nhỏ (TiemNho.vn) - Nền tảng Bio Storefront Chuẩn Stan Store Cho Creator Việt Nam',
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
          <Link href='/' className='flex items-center gap-2.5'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-emerald-500 text-primary-foreground shadow-md shadow-primary/20'>
              <Icons.shoppingCart className='h-5 w-5' />
            </div>
            <div className='flex items-center gap-1.5'>
              <span className='font-bold text-lg tracking-tight'>Tiệm Nhỏ</span>
              <Badge
                variant='outline'
                className='text-[10px] uppercase font-bold text-primary border-primary/30'
              >
                Stan Store VN
              </Badge>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className='hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground'>
            <a href='#features' className='hover:text-foreground transition-colors'>
              Tính năng
            </a>
            <a href='#no-escrow' className='hover:text-foreground transition-colors'>
              Triết lý 0% Phí
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
              <Link href='/dashboard/overview'>
                <Button size='sm' className='rounded-xl font-semibold gap-1.5 shadow-sm'>
                  <Icons.dashboard className='h-4 w-4' />
                  Vào Dashboard
                </Button>
              </Link>
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
      <section className='relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-border/40'>
        {/* Ambient Glows */}
        <div className='pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[700px] rounded-full bg-primary/10 blur-[130px]' />

        <div className='max-w-6xl mx-auto px-4 sm:px-6 relative'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
            {/* Left Column: Value Prop */}
            <div className='lg:col-span-7 space-y-6 text-center lg:text-left'>
              <div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold'>
                <Icons.sparkles className='h-3.5 w-3.5 text-amber-500' />
                <span>Nền tảng Bio Storefront số 1 cho Creator Việt Nam 🇻🇳</span>
              </div>

              <h1 className='text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]'>
                Biến Link-in-Bio thành cỗ máy{' '}
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-indigo-500'>
                  bán tài nguyên số & nhận tiền tự động 24/7
                </span>
              </h1>

              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0'>
                Chuẩn phong cách <strong>Stan Store</strong> tối ưu riêng cho thị trường Việt Nam.
                Quét mã <strong>VietQR Napas 247</strong> tự động — tiền chạy thẳng{' '}
                <strong>100% vào số tài khoản ngân hàng chính chủ</strong> của Creator. Không hoa
                hồng, không giữ tiền hộ.
              </p>

              {/* CTAs */}
              <div className='flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2'>
                <Link href={userId ? '/dashboard/overview' : '/auth/sign-up'}>
                  <Button
                    size='lg'
                    className='w-full sm:w-auto h-12 px-7 rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 gap-2'
                  >
                    <Icons.shoppingCart className='h-4 w-4' />
                    Bắt đầu dùng thử 14 ngày miễn phí
                  </Button>
                </Link>

                <Link href='/@giangdinh' target='_blank'>
                  <Button
                    variant='outline'
                    size='lg'
                    className='w-full sm:w-auto h-12 px-6 rounded-2xl text-sm font-semibold gap-2 border-border/80'
                  >
                    <Icons.deviceMobile className='h-4 w-4 text-primary' />
                    Xem Storefront mẫu (@giangdinh)
                  </Button>
                </Link>
              </div>

              {/* Social Proof Badges */}
              <div className='pt-6 border-t border-border/60 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-muted-foreground'>
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
            </div>

            {/* Right Column: Interactive Phone Preview */}
            <div className='lg:col-span-5 flex justify-center'>
              <div className='relative'>
                <div className='absolute -inset-1 rounded-[60px] bg-gradient-to-tr from-primary/30 via-emerald-500/20 to-indigo-500/30 blur-2xl opacity-60' />
                <PhoneMockup
                  profile={profile}
                  products={products}
                  paymentConfig={paymentConfig}
                  className='scale-[0.85] sm:scale-[0.95]'
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Triết lý Dòng tiền (No Escrow & 0% Phí) */}
      <section id='no-escrow' className='py-16 md:py-24 bg-muted/20 border-b border-border/40'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6'>
          <div className='text-center max-w-2xl mx-auto mb-12 space-y-3'>
            <Badge
              variant='outline'
              className='text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
            >
              Triết lý cốt lõi bất di bất dịch
            </Badge>
            <h2 className='text-2xl sm:text-4xl font-bold tracking-tight'>
              Không giữ tiền trung gian. Giữ trọn 100% doanh thu.
            </h2>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              Tiệm Nhỏ đóng vai trò là giải pháp công cụ phần mềm tự động hóa (SaaS). Chúng tôi
              không mở ví, không giữ tiền hộ.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs'>
              <div className='h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center'>
                <Icons.buildingBank className='h-6 w-6' />
              </div>
              <h3 className='font-bold text-base text-foreground'>
                Tiền chạy thẳng vào STK của bạn
              </h3>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                Người mua quét mã VietQR là tiền chạy thẳng 100% vào tài khoản ngân hàng chính chủ
                của Creator (MB, VCB, TCB...) mà không qua bất kỳ tài khoản trung gian nào.
              </p>
            </div>

            <div className='rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs'>
              <div className='h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
                <Icons.qrcode className='h-6 w-6' />
              </div>
              <h3 className='font-bold text-base text-foreground'>Xác thực Napas 247 tức thì</h3>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                Tích hợp SDK đối soát chuẩn payOS & SePay. Ngay khi có biến động số dư khớp mã đơn,
                hệ thống tự động mở khóa nút tải tài nguyên và gửi email dự phòng.
              </p>
            </div>

            <div className='rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs'>
              <div className='h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center'>
                <Icons.bolt className='h-6 w-6' />
              </div>
              <h3 className='font-bold text-base text-foreground'>1-Tap Drawer không rời trang</h3>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                Tối ưu đặc biệt cho trình duyệt in-app của TikTok, Instagram Reels và Threads. Toàn
                bộ quá trình điền thông tin và thanh toán diễn ra trong Drawer mượt mà dưới 1.5
                giây.
              </p>
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
            <div className='rounded-2xl border-2 border-primary bg-card p-6 space-y-5 shadow-lg relative'>
              <div className='absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground uppercase tracking-wider'>
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
                <Button className='w-full rounded-xl text-xs font-bold h-10 shadow-md'>
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
          <div className='flex items-center gap-2'>
            <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs'>
              TN
            </div>
            <span className='font-bold text-foreground'>Tiệm Nhỏ (tiemnho.vn)</span>
            <span>• Nền tảng Bio Storefront cho Creator Việt Nam</span>
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
