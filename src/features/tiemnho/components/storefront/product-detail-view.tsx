'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreatorProfile, Order, PaymentConfig, Product } from '@/constants/mock-tiemnho';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Download,
  ExternalLink,
  QrCode,
  Share2,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createOrder } from '../../api/service';
import { tiemNhoKeys } from '../../api/queries';
import { CheckoutDrawerStep1, CheckoutStep1Values } from './CheckoutDrawerStep1';
import { VietQrPaymentPopup } from './VietQrPaymentPopup';

interface ProductDetailViewProps {
  product: Product;
  profile: CreatorProfile;
  paymentConfig: PaymentConfig;
  onBack?: () => void;
  isSimulator?: boolean;
}

export function ProductDetailView({
  product,
  profile,
  paymentConfig,
  onBack,
  isSimulator = false
}: ProductDetailViewProps) {
  const router = useRouter();

  // Khởi tạo mã đơn hàng ngẫu nhiên để gắn vào nội dung chuyển khoản VietQR
  const [orderCode] = React.useState(() => `TN${Math.floor(10000 + Math.random() * 90000)}`);

  // Form khách hàng
  const [customerName, setCustomerName] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [shippingAddress, setShippingAddress] = React.useState('');
  const [customerNote, setCustomerNote] = React.useState('');

  // Trạng thái màn hình: FORM (thông tin checkout) -> SUCCESS (thành công)
  const [step, setStep] = React.useState<'FORM' | 'SUCCESS'>('FORM');
  const [confirmedOrder, setConfirmedOrder] = React.useState<Order | null>(null);
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = React.useState(false);

  // Trạng thái thu gọn / xem thêm mô tả (5-10 dòng)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  // Kiểm tra mô tả có dài quá 5 dòng hoặc 200 ký tự hay không
  const hasLongDescription = React.useMemo(() => {
    if (!product.description) return false;
    const lines = product.description.split('\n').filter((l) => l.trim().length > 0);
    return lines.length > 5 || product.description.length > 220;
  }, [product.description]);

  // Real-time Polling kiểm tra trạng thái thanh toán khi có đơn hàng chưa PAID
  React.useEffect(() => {
    if (!confirmedOrder || confirmedOrder.status === 'PAID') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${confirmedOrder.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'PAID') {
            clearInterval(interval);
            setConfirmedOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'PAID',
                    paidAt: data.paidAt,
                    downloadUrl: data.downloadUrl || prev.downloadUrl
                  }
                : null
            );
            setStep('SUCCESS');
            setIsPaymentPopupOpen(false);
            toast.success('Thanh toán thành công! VietQR đã xác nhận.');
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [confirmedOrder]);

  const isPhysical = product.type === 'PHYSICAL';
  const isFree = product.price === 0 || product.type === 'LEAD_MAGNET';
  const isLink = product.type === 'EXTERNAL_LINK';

  const formatPrice = (p: number) => {
    if (p === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        toast.success('Đã sao chép liên kết!');
      } else {
        toast.info(`Vui lòng sao chép thủ công: ${text}`);
      }
    } catch {
      toast.info(`Vui lòng sao chép thủ công: ${text}`);
    }
  };

  const handleNavigateBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push(`/@${profile.username}`);
    }
  };

  const handleShareProduct = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/@${profile.username}/products/${product.id}`;
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(() => toast.success('Đã sao chép link sản phẩm!'))
          .catch(() => fallbackCopyText(url));
      } else {
        fallbackCopyText(url);
      }
    }
  };

  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      setConfirmedOrder(order);

      // Invalidate các query dữ liệu đơn hàng và thống kê
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.orders() });
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.leads() });

      if (isFree) {
        setStep('SUCCESS');
        toast.success('Nhận quà thành công! Bạn có thể tải tài nguyên ngay bên dưới.');
      } else {
        setIsPaymentPopupOpen(true);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    }
  });

  const handleStep1Submit = (values: CheckoutStep1Values) => {
    setCustomerName(values.fullName);
    setCustomerEmail(values.email || '');
    if (values.phone) setCustomerPhone(values.phone);
    if (values.shippingAddress) setShippingAddress(values.shippingAddress);
    if (values.shippingNote) setCustomerNote(values.shippingNote);

    createOrderMutation.mutate({
      productId: product.id,
      customerName: values.fullName.trim(),
      customerEmail: values.email?.trim() || `${values.phone?.trim() || 'customer'}@tiemnho.vn`,
      customerPhone: values.phone?.trim() || '',
      shippingAddress: isPhysical ? values.shippingAddress?.trim() : undefined,
      customerNote: values.shippingNote?.trim() || undefined
    });
  };

  // Parser định dạng Markdown phong phú
  const renderFormattedDescription = (text?: string) => {
    if (!text || !text.trim()) {
      return (
        <p className='text-xs sm:text-sm text-muted-foreground italic'>
          Chưa có nội dung mô tả chi tiết cho sản phẩm này.
        </p>
      );
    }

    const lines = text.split('\n');

    return (
      <div className='space-y-2'>
        <div className='relative'>
          <div
            className={cn(
              'text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans space-y-2 transition-all duration-300',
              !isDescriptionExpanded &&
                hasLongDescription &&
                'max-h-[140px] sm:max-h-[180px] overflow-hidden'
            )}
          >
            {lines.map((rawLine, idx) => {
              const trimmed = rawLine.trim();

              if (!trimmed) {
                return <div key={idx} className='h-1.5' />;
              }

              if (trimmed === '---' || trimmed === '***') {
                return <hr key={idx} className='my-3 border-border' />;
              }

              // Tiêu đề H1/H2/H3
              if (trimmed.startsWith('### ')) {
                return (
                  <h3
                    key={idx}
                    className='text-sm sm:text-base font-bold text-foreground pt-2 pb-0.5'
                  >
                    {formatInline(trimmed.substring(4))}
                  </h3>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={idx}
                    className='text-base sm:text-lg font-bold text-foreground pt-2 pb-0.5'
                  >
                    {formatInline(trimmed.substring(3))}
                  </h2>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h1
                    key={idx}
                    className='text-lg sm:text-xl font-extrabold text-foreground pt-2 pb-0.5'
                  >
                    {formatInline(trimmed.substring(2))}
                  </h1>
                );
              }

              // Callout blockquote > 💡
              if (trimmed.startsWith('>')) {
                const content = trimmed.replace(/^>\s*/, '');
                return (
                  <div
                    key={idx}
                    className='my-2 p-3 rounded-xl border border-primary/25 bg-primary/5 text-foreground text-xs sm:text-sm font-medium leading-relaxed'
                  >
                    {formatInline(content)}
                  </div>
                );
              }

              // Checklist tick xanh ✅
              if (trimmed.startsWith('✅') || trimmed.startsWith('[x]')) {
                const content = trimmed.replace(/^✅\s*|^\[x\]\s*/, '');
                return (
                  <div
                    key={idx}
                    className='flex items-start gap-2 text-foreground py-0.5 font-medium'
                  >
                    <span className='text-emerald-500 shrink-0 text-sm sm:text-base mt-0.5 leading-none'>
                      ✅
                    </span>
                    <span>{formatInline(content)}</span>
                  </div>
                );
              }

              // Bullet points • hoặc - hoặc *
              if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const content = trimmed.replace(/^[•\-\*]\s*/, '');
                return (
                  <div key={idx} className='flex items-start gap-2 text-foreground/80 py-0.5'>
                    <span className='text-primary font-bold text-sm sm:text-base shrink-0 mt-0.5 leading-none'>
                      •
                    </span>
                    <span>{formatInline(content)}</span>
                  </div>
                );
              }

              // Dòng văn bản bình thường
              return (
                <p key={idx} className='leading-relaxed text-foreground/80'>
                  {formatInline(rawLine)}
                </p>
              );
            })}
          </div>

          {/* Gradient mờ dần dưới đáy nằm bên trong khung text, không che nút bấm */}
          {!isDescriptionExpanded && hasLongDescription && (
            <div className='absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-background via-background/70 to-transparent pointer-events-none' />
          )}
        </div>

        {/* Nút Xem thêm / Thu gọn chuẩn giao diện base, tách biệt hoàn toàn phía dưới */}
        {hasLongDescription && (
          <div className='pt-1 flex justify-center'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setIsDescriptionExpanded((prev) => !prev)}
              className='h-7 px-3.5 rounded-full text-xs font-semibold gap-1.5 shadow-2xs hover:bg-muted cursor-pointer'
            >
              <span>{isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
              {isDescriptionExpanded ? (
                <ChevronUp className='w-3.5 h-3.5' />
              ) : (
                <ChevronDown className='w-3.5 h-3.5' />
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Helper format bold, italic, underline, link
  const formatInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    const inlineRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)|<u>(.*?)<\/u>)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const [, , bold, italic, linkLabel, linkHref, underline] = match;

      if (bold) {
        parts.push(
          <strong key={keyIdx++} className='font-bold text-foreground'>
            {bold}
          </strong>
        );
      } else if (italic) {
        parts.push(
          <em key={keyIdx++} className='italic'>
            {italic}
          </em>
        );
      } else if (linkLabel && linkHref) {
        parts.push(
          <a
            key={keyIdx++}
            href={linkHref}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5 font-medium'
          >
            <span>{linkLabel}</span>
            <ExternalLink className='w-3 h-3 inline' />
          </a>
        );
      } else if (underline) {
        parts.push(
          <span key={keyIdx++} className='underline underline-offset-2'>
            {underline}
          </span>
        );
      }

      lastIndex = inlineRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // =========================================================================
  // KHỐI THANH TOÁN 2 BƯỚC (BƯỚC 1: FORM -> BƯỚC 2: VIETQR)
  // =========================================================================
  const renderPaymentSection = () => {
    // -----------------------------------------------------------------------
    // TRẠNG THÁI: THÀNH CÔNG 🎉
    // -----------------------------------------------------------------------
    if (step === 'SUCCESS') {
      return (
        <div className='p-6 rounded-3xl bg-card border border-border text-center space-y-4 shadow-xs animate-in fade-in duration-300'>
          <div className='w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-xs ring-6 ring-emerald-500/20'>
            <CheckCircle2 className='w-8 h-8' />
          </div>
          <div className='space-y-1'>
            <h3 className='text-lg font-black text-foreground'>
              {isFree ? 'Nhận tài liệu thành công' : 'Thanh toán thành công'}
            </h3>
            <p className='text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto'>
              Mã đơn hàng:{' '}
              <strong className='font-mono font-bold text-foreground'>
                #{confirmedOrder?.orderCode || orderCode}
              </strong>
              . Hệ thống đã ghi nhận đơn của{' '}
              <strong className='text-foreground'>{customerName || 'bạn'}</strong>.
            </p>
          </div>

          {/* Nút tải tài nguyên nếu là sản phẩm số */}
          {(confirmedOrder?.downloadUrl || product.fileUrl) && (
            <div className='pt-1'>
              <Button
                render={
                  <a
                    href={confirmedOrder?.downloadUrl || product.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                  />
                }
                size='lg'
                className='w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer shadow-sm'
              >
                <Download className='w-4 h-4' />
                <span>Tải tài liệu ngay ({product.fileName || 'File đính kèm'})</span>
              </Button>
            </div>
          )}

          {isPhysical && (
            <div className='p-3 rounded-2xl bg-muted/40 border border-border text-left text-xs space-y-1 text-foreground'>
              <p className='font-bold flex items-center gap-1.5'>
                <span>Đơn hàng sẽ được chuẩn bị giao tới:</span>
              </p>
              <p className='text-[11px] text-muted-foreground pl-4'>{shippingAddress}</p>
            </div>
          )}

          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleNavigateBack}
            className='text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer pt-2'
          >
            ← Quay lại trang tiệm của @{profile.username}
          </Button>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // NÚT LIÊN KẾT NGOÀI (EXTERNAL LINK)
    // -----------------------------------------------------------------------
    if (isLink) {
      return (
        <div className='p-5 rounded-3xl bg-card border border-border space-y-3.5 text-left shadow-xs'>
          <div className='flex items-center gap-2 text-xs font-bold text-foreground'>
            <ExternalLink className='w-4 h-4 text-primary' />
            <span>Liên kết chuyển hướng ngoài</span>
          </div>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            Nhấn vào nút bên dưới để mở liên kết sản phẩm trên Shopee / TikTok Shop / Website chính
            thức.
          </p>
          <Button
            render={
              <a href={product.externalUrl || '#'} target='_blank' rel='noopener noreferrer' />
            }
            size='lg'
            className='w-full h-12 rounded-2xl font-bold text-sm gap-2 cursor-pointer shadow-md'
          >
            <span>{product.buttonText || 'Mở liên kết ngay'}</span>
            <ExternalLink className='w-4 h-4' />
          </Button>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // THÔNG TIN CHECKOUT (LUÔN HIỂN THỊ FORM CHECKOUT NHƯ CŨ)
    // -----------------------------------------------------------------------
    return (
      <div className='p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs text-left'>
        {/* Banner nhỏ nhắc nhở nếu có đơn hàng đang chờ thanh toán */}
        {confirmedOrder && !isFree && confirmedOrder.status !== 'PAID' && (
          <div className='mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 shadow-2xs'>
            <div className='min-w-0'>
              <span className='text-[10px] text-amber-800 dark:text-amber-300 font-bold block'>
                Đơn hàng #{confirmedOrder.orderCode} đang chờ thanh toán
              </span>
              <span className='text-xs font-bold text-neutral-900 dark:text-white'>
                {formatPrice(confirmedOrder.amount)}
              </span>
            </div>
            <Button
              type='button'
              size='sm'
              onClick={() => setIsPaymentPopupOpen(true)}
              className='h-8 px-3 rounded-xl bg-[#FE2C55] hover:bg-[#E0264B] text-white text-xs font-bold gap-1.5 shrink-0 shadow-2xs cursor-pointer'
            >
              <QrCode className='w-3.5 h-3.5' />
              <span>Mở mã QR</span>
            </Button>
          </div>
        )}

        {/* Thông tin form checkout luôn giữ nguyên như cũ */}
        <CheckoutDrawerStep1
          product={product}
          onSubmit={handleStep1Submit}
          loading={createOrderMutation.isPending}
          submitButtonText={product.buttonText}
          initialValues={{
            fullName: customerName,
            email: customerEmail,
            phone: customerPhone,
            shippingAddress: shippingAddress,
            shippingNote: customerNote
          }}
        />
      </div>
    );
  };

  // =========================================================================
  // VIEW TRONG SIMULATOR IPHONE (Dành cho Dashboard Preview)
  // =========================================================================
  if (isSimulator) {
    return (
      <div className='relative w-full bg-background text-foreground font-sans antialiased px-3.5 py-3 text-xs flex flex-col min-h-full space-y-4'>
        {/* Top Header */}
        <div className='flex items-center justify-between py-1 border-b border-border/60'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleNavigateBack}
            className='h-8 px-2.5 rounded-xl gap-1 text-xs font-semibold'
          >
            <ChevronLeft className='w-4 h-4' />
            <span>Quay lại</span>
          </Button>
          <span className='font-mono text-[11px] text-muted-foreground'>@{profile.username}</span>
        </div>

        {/* Ảnh sản phẩm lớn */}
        <div className='w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted/40 relative border border-border shadow-2xs'>
          <Image
            src={
              product.coverImage ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
            }
            alt={product.title}
            fill
            className='object-cover'
            unoptimized
          />
          {product.isFeatured && (
            <Badge
              variant='destructive'
              className='absolute top-2 left-2 text-[9px] font-bold uppercase'
            >
              HOT
            </Badge>
          )}
        </div>

        {/* Tên & Giá sản phẩm */}
        <div className='space-y-1 text-left'>
          <h1 className='text-base font-bold text-foreground leading-snug'>{product.title}</h1>
          <div className='flex items-baseline gap-2'>
            <span className='text-base font-bold text-primary'>{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className='text-xs text-muted-foreground line-through'>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {product.subtitle && (
            <p className='text-xs text-muted-foreground font-medium leading-relaxed pt-0.5'>
              {product.subtitle}
            </p>
          )}
        </div>

        {/* Mô tả chi tiết (khoảng 5-10 dòng kèm nút xem thêm) */}
        <div className='pt-2 border-t border-border/60 text-left space-y-1.5'>
          <h3 className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            Mô tả chi tiết sản phẩm
          </h3>
          {renderFormattedDescription(product.description)}
        </div>

        {/* Khối QR Thanh toán trực tiếp theo quy trình 2 bước */}
        <div className='pt-2 border-t border-border/60'>{renderPaymentSection()}</div>

        {/* VietQR Payment Popup trong Simulator */}
        <VietQrPaymentPopup
          isOpen={isPaymentPopupOpen}
          onClose={() => setIsPaymentPopupOpen(false)}
          order={confirmedOrder}
          product={product}
          paymentConfig={paymentConfig}
          isSimulator={true}
          onPaymentSuccess={(order) => {
            setConfirmedOrder(order);
            setStep('SUCCESS');
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW STANDALONE & RESPONSIVE STOREFRONT (Mobile < 768px & Desktop >= 768px)
  // =========================================================================
  return (
    <div className='w-full min-h-screen bg-background text-foreground font-sans antialiased flex flex-col items-center selection:bg-primary selection:text-primary-foreground'>
      {/* ----------------------------------------------------------------- */}
      {/* A. MOBILE VIEW (< 768px): Khung Stan Store max 440px              */}
      {/* ----------------------------------------------------------------- */}
      <div className='w-full max-w-[440px] mx-auto min-h-screen px-4 pt-4 pb-16 bg-card text-card-foreground flex flex-col md:hidden shadow-xs relative border-x border-border/40'>
        {/* Top Navigation */}
        <div className='flex items-center justify-between py-2 mb-3'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleNavigateBack}
            className='h-9 px-3 rounded-full text-xs font-semibold gap-1.5 shadow-2xs'
            title='Quay lại tiệm'
          >
            <ChevronLeft className='w-4 h-4' />
            <span>Quay lại tiệm</span>
          </Button>

          <Button
            type='button'
            variant='outline'
            size='icon'
            onClick={handleShareProduct}
            className='h-9 w-9 rounded-full'
            title='Chia sẻ sản phẩm'
          >
            <Share2 className='w-4 h-4' />
          </Button>
        </div>

        {/* Khối Ảnh bìa / Mockup lớn */}
        <div className='w-full aspect-[4/3] rounded-3xl overflow-hidden bg-muted/40 relative border border-border shadow-xs'>
          <Image
            src={
              product.coverImage ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
            }
            alt={product.title}
            fill
            className='object-cover'
            unoptimized
            priority
          />
          {product.isFeatured && (
            <Badge
              variant='destructive'
              className='absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider shadow-xs'
            >
              NỔI BẬT
            </Badge>
          )}
        </div>

        {/* Tiêu đề & Khối giá tiền */}
        <div className='mt-4 text-left space-y-1.5'>
          <h1 className='text-xl sm:text-2xl font-extrabold text-foreground leading-tight tracking-tight'>
            {product.title}
          </h1>

          <div className='flex items-baseline gap-2'>
            <span className='text-xl sm:text-2xl font-bold text-primary'>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className='text-muted-foreground line-through text-sm font-normal'>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {product.subtitle && (
            <p className='text-xs sm:text-sm font-medium text-foreground/80 leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/70'>
              {product.subtitle}
            </p>
          )}
        </div>

        {/* Khối Description chi tiết (khoảng 5-10 dòng kèm xem thêm) */}
        <div className='mt-5 pt-4 border-t border-border/60 text-left space-y-2'>
          <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            Mô tả chi tiết sản phẩm
          </h3>
          <div className='bg-muted/30 p-3 rounded-2xl border border-border/70'>
            {renderFormattedDescription(product.description)}
          </div>
        </div>

        {/* KHỐI THANH TOÁN THEO QUY TRÌNH 2 BƯỚC */}
        <div className='mt-6 pt-4 border-t border-border/60'>{renderPaymentSection()}</div>

        {/* Cam kết tin cậy */}
        <div className='mt-6 p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-center gap-2 text-xs text-muted-foreground'>
          <ShieldCheck className='w-4 h-4 text-emerald-600 shrink-0' />
          <span>Thanh toán VietQR chính chủ nhận hàng tự động 24/7</span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* B. DESKTOP VIEW (>= 768px): Bố cục 2 Cột Cân Đối                  */}
      {/* ----------------------------------------------------------------- */}
      <div className='hidden md:flex flex-col w-full max-w-5xl mx-auto py-8 px-6 min-h-screen'>
        {/* Nút quay lại tiệm */}
        <div className='flex items-center justify-between mb-6'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleNavigateBack}
            className='rounded-xl text-xs gap-1.5'
          >
            <ChevronLeft className='w-4 h-4' />
            <span>Quay lại gian hàng của @{profile.username}</span>
          </Button>

          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={handleShareProduct}
            className='rounded-xl text-xs gap-1.5'
          >
            <Share2 className='w-3.5 h-3.5' />
            <span>Chia sẻ sản phẩm</span>
          </Button>
        </div>

        {/* Grid 2 Cột chuẩn Desktop */}
        <div className='grid grid-cols-12 gap-8 bg-card border border-border rounded-3xl p-8 shadow-xs items-start'>
          {/* CỘT TRÁI (5 Cột): Ảnh sản phẩm + Khối QR Thanh Toán */}
          <div className='col-span-5 space-y-6 sticky top-6'>
            {/* Ảnh sản phẩm */}
            <div className='w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted/40 relative border border-border shadow-md'>
              <Image
                src={
                  product.coverImage ||
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'
                }
                alt={product.title}
                fill
                className='object-cover'
                unoptimized
                priority
              />
              {product.isFeatured && (
                <Badge
                  variant='destructive'
                  className='absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider shadow-xs'
                >
                  NỔI BẬT
                </Badge>
              )}
            </div>

            {/* Khối QR Thanh Toán theo quy trình 2 bước */}
            {renderPaymentSection()}
          </div>

          {/* CỘT PHẢI (7 Cột): Tên, Giá, Subtitle, Mô tả chi tiết đầy đủ */}
          <div className='col-span-7 flex flex-col justify-between space-y-6 text-left pl-2'>
            <div className='space-y-4'>
              {/* Tiêu đề & Giá bán */}
              <div>
                <h1 className='text-2xl lg:text-3xl font-extrabold text-foreground leading-tight tracking-tight'>
                  {product.title}
                </h1>

                <div className='flex items-baseline gap-3 mt-3'>
                  <span className='text-2xl font-bold text-primary'>
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className='text-muted-foreground line-through text-base font-normal'>
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Subtitle nếu có */}
              {product.subtitle && (
                <p className='text-sm font-semibold text-foreground/90 leading-snug bg-muted/40 p-3.5 rounded-2xl border border-border/70'>
                  {product.subtitle}
                </p>
              )}

              {/* Mô tả chi tiết sản phẩm (khoảng 5-10 dòng kèm nút xem thêm) */}
              <div className='pt-4 border-t border-border/60 space-y-3'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Chi tiết sản phẩm & Quyền lợi
                </h3>
                <div className='bg-muted/20 p-4 rounded-2xl border border-border/70'>
                  {renderFormattedDescription(product.description)}
                </div>
              </div>
            </div>

            {/* Cam kết chân trang */}
            <div className='p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex items-center gap-2.5 text-xs text-muted-foreground'>
              <ShieldCheck className='w-4 h-4 text-emerald-600 shrink-0' />
              <span>Giao dịch bảo mật VietQR 24/7. Nhận file trực tiếp sau khi hoàn tất.</span>
            </div>
          </div>
        </div>
      </div>

      {/* VietQR Payment Popup chuẩn Web Modal */}
      <VietQrPaymentPopup
        isOpen={isPaymentPopupOpen}
        onClose={() => setIsPaymentPopupOpen(false)}
        order={confirmedOrder}
        product={product}
        paymentConfig={paymentConfig}
        isSimulator={false}
        onPaymentSuccess={(order) => {
          setConfirmedOrder(order);
          setStep('SUCCESS');
        }}
      />
    </div>
  );
}
