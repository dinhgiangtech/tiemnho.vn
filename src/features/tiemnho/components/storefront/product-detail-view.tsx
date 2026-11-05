'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Sparkles,
  ShieldCheck,
  Copy,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  QrCode,
  Loader2,
  Share2,
  Building2,
  ShoppingBag,
  Gift
} from 'lucide-react';
import {
  Product,
  PaymentConfig,
  CreatorProfile,
  Order,
  generateVietQrUrl,
  VIETNAMESE_BANKS
} from '@/constants/mock-tiemnho';
import { createOrder } from '../../api/service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

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

  const [loadingOrder, setLoadingOrder] = React.useState(false);
  // Quy trình 2 bước: FORM (Bước 1) -> VIETQR (Bước 2) -> SUCCESS (Bước 3)
  const [step, setStep] = React.useState<'FORM' | 'VIETQR' | 'SUCCESS'>('FORM');
  const [confirmedOrder, setConfirmedOrder] = React.useState<Order | null>(null);

  // Trạng thái thu gọn / xem thêm mô tả (5-10 dòng)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  // Kiểm tra mô tả có dài quá 5 dòng hoặc 200 ký tự hay không
  const hasLongDescription = React.useMemo(() => {
    if (!product.description) return false;
    const lines = product.description.split('\n').filter((l) => l.trim().length > 0);
    return lines.length > 5 || product.description.length > 220;
  }, [product.description]);

  // Copy state
  const [copiedField, setCopiedField] = React.useState<'STK' | 'CODE' | 'AMOUNT' | null>(null);

  // Đồng hồ đếm ngược 15 phút
  const [timeLeft, setTimeLeft] = React.useState(900);

  React.useEffect(() => {
    if (step !== 'VIETQR' || product.price === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, product.price]);

  // Real-time Polling kiểm tra trạng thái thanh toán mỗi 2s ở Bước 2
  React.useEffect(() => {
    if (step !== 'VIETQR' || !confirmedOrder) return;

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
            toast.success('Thanh toán thành công! VietQR đã xác nhận.');
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, confirmedOrder]);

  const isPhysical = product.type === 'PHYSICAL';
  const isFree = product.price === 0 || product.type === 'LEAD_MAGNET';
  const isLink = product.type === 'EXTERNAL_LINK';

  const formatPrice = (p: number) => {
    if (p === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  // Tra cứu thông tin ngân hàng & logo VietQR chính thức
  const bankInfo = React.useMemo(() => {
    const rawBankId = (paymentConfig.bankId || '').trim().toLowerCase();
    const rawBankName = (paymentConfig.bankName || '').trim().toLowerCase();
    return VIETNAMESE_BANKS.find(
      (b) =>
        b.id.toLowerCase() === rawBankId ||
        b.code.toLowerCase() === rawBankId ||
        b.shortName.toLowerCase() === rawBankId ||
        rawBankName.includes(b.shortName.toLowerCase()) ||
        rawBankName.includes(b.code.toLowerCase()) ||
        rawBankName.includes(b.id.toLowerCase())
    );
  }, [paymentConfig.bankId, paymentConfig.bankName]);

  const bankLogoUrl =
    bankInfo?.logo || `https://api.vietqr.io/img/${paymentConfig.bankId || 'MB'}.png`;
  const bankShortName = bankInfo?.shortName || paymentConfig.bankId || 'Ngân hàng';
  const bankFullName = paymentConfig.bankName || bankInfo?.name || 'Ngân hàng thụ hưởng';

  // Thông báo copy thành công
  const triggerCopySuccess = (field: 'STK' | 'CODE' | 'AMOUNT') => {
    setCopiedField(field);
    toast.success(
      field === 'STK'
        ? 'Đã sao chép Số tài khoản!'
        : field === 'CODE'
          ? 'Đã sao chép Nội dung chuyển khoản!'
          : 'Đã sao chép Số tiền!'
    );
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Cơ chế sao chép đa nền tảng
  const handleCopy = (text: string, field: 'STK' | 'CODE' | 'AMOUNT') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => triggerCopySuccess(field))
        .catch(() => fallbackCopyText(text, field));
      return;
    }
    fallbackCopyText(text, field);
  };

  const fallbackCopyText = (text: string, field: 'STK' | 'CODE' | 'AMOUNT') => {
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
        triggerCopySuccess(field);
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
          .catch(() => {
            fallbackCopyText(url, 'STK');
            toast.success('Đã sao chép link sản phẩm!');
          });
      } else {
        fallbackCopyText(url, 'STK');
        toast.success('Đã sao chép link sản phẩm!');
      }
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Vui lòng nhập Họ và tên');
      return;
    }

    if (!customerEmail.trim() && !isPhysical) {
      toast.error('Vui lòng nhập Email để nhận link tải tài liệu');
      return;
    }

    if (!customerPhone.trim() && isPhysical) {
      toast.error('Vui lòng nhập Số điện thoại nhận hàng');
      return;
    }

    if (isPhysical && !shippingAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ nhận hàng');
      return;
    }

    setLoadingOrder(true);
    try {
      const order = await createOrder({
        productId: product.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.trim() || 'customer'}@tiemnho.vn`,
        customerPhone: customerPhone.trim(),
        shippingAddress: isPhysical ? shippingAddress.trim() : undefined,
        customerNote: customerNote.trim() || undefined
      });

      setConfirmedOrder(order);

      if (isFree) {
        setStep('SUCCESS');
        toast.success('Nhận quà thành công! Bạn có thể tải tài nguyên ngay bên dưới.');
      } else {
        setStep('VIETQR');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleManualCheck = async () => {
    if (!confirmedOrder) return;
    setLoadingOrder(true);
    try {
      const res = await fetch(`/api/orders/${confirmedOrder.id}/status`, {
        method: 'POST'
      });
      if (res.ok) {
        setStep('SUCCESS');
        toast.success('Thanh toán thành công! VietQR đã xác nhận.');
      } else {
        toast.info('Hệ thống đang kiểm tra biến động số dư ngân hàng...');
      }
    } catch {
      toast.error('Chưa ghi nhận biến động số dư. Bạn hãy kiểm tra lại nhé.');
    } finally {
      setLoadingOrder(false);
    }
  };

  // URL tạo mã QR VietQR chuẩn gắn cứng theo mã đơn và số tiền
  const qrUrl = React.useMemo(() => {
    return generateVietQrUrl({
      bankId: paymentConfig.bankId,
      accountNumber: paymentConfig.accountNumber,
      accountName: paymentConfig.accountName,
      amount: confirmedOrder?.amount || product.price,
      orderCode: confirmedOrder?.orderCode || orderCode
    });
  }, [paymentConfig, product.price, confirmedOrder, orderCode]);

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
              {isFree ? 'Nhận tài liệu thành công 🎉' : 'Thanh toán thành công 🎉'}
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
                asChild
                size='lg'
                className='w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer shadow-sm'
              >
                <a
                  href={confirmedOrder?.downloadUrl || product.fileUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Download className='w-4 h-4' />
                  <span>Tải tài liệu ngay ({product.fileName || 'File đính kèm'})</span>
                </a>
              </Button>
            </div>
          )}

          {isPhysical && (
            <div className='p-3 rounded-2xl bg-muted/40 border border-border text-left text-xs space-y-1 text-foreground'>
              <p className='font-bold flex items-center gap-1.5'>
                <span>📦 Đơn hàng sẽ được chuẩn bị giao tới:</span>
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
            asChild
            size='lg'
            className='w-full h-12 rounded-2xl font-bold text-sm gap-2 cursor-pointer shadow-md'
          >
            <a href={product.externalUrl || '#'} target='_blank' rel='noopener noreferrer'>
              <span>{product.buttonText || 'Mở liên kết ngay'}</span>
              <ExternalLink className='w-4 h-4' />
            </a>
          </Button>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // BƯỚC 1: FORM THÔNG TIN NGƯỜI NHẬN (CUSTOMER INFO STEP)
    // -----------------------------------------------------------------------
    if (step === 'FORM') {
      return (
        <div className='p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-left'>
          <div className='flex items-center gap-2.5 pb-3 border-b border-border/60'>
            <div className='w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0'>
              <ShoppingBag className='w-4 h-4' />
            </div>
            <div>
              <h3 className='text-sm font-bold text-foreground'>Thông tin nhận hàng</h3>
              <p className='text-[11px] text-muted-foreground'>
                {isFree
                  ? 'Điền thông tin để nhận tài liệu miễn phí tức thì'
                  : 'Bước 1: Điền thông tin trước khi thanh toán VietQR'}
              </p>
            </div>
          </div>

          <form onSubmit={handleConfirmOrder} className='space-y-3.5'>
            {/* Họ và tên */}
            <div className='space-y-1'>
              <label className='text-xs font-bold text-foreground flex items-center justify-between'>
                <span>
                  Họ và tên <strong className='text-rose-500'>*</strong>
                </span>
                <span className='text-[10px] text-muted-foreground font-normal'>Bắt buộc</span>
              </label>
              <Input
                type='text'
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder='VD: Nguyễn Văn A'
                className='h-10 text-xs rounded-xl border border-input/80 bg-background px-3 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
              />
            </div>

            {/* Sản phẩm số: Email bắt buộc, SĐT tùy chọn, ẨN ô địa chỉ */}
            {!isPhysical && (
              <>
                <div className='space-y-1'>
                  <label className='text-xs font-bold text-foreground flex items-center justify-between'>
                    <span>
                      Email nhận tài liệu <strong className='text-rose-500'>*</strong>
                    </span>
                    <span className='text-[10px] text-muted-foreground font-normal'>
                      Gửi link tải tự động
                    </span>
                  </label>
                  <Input
                    type='email'
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder='email@gmail.com'
                    className='h-10 text-xs rounded-xl border border-input/80 bg-background px-3 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-xs font-bold text-foreground flex items-center justify-between'>
                    <span>Số điện thoại (Zalo)</span>
                    <span className='text-[10px] text-muted-foreground font-normal'>Tùy chọn</span>
                  </label>
                  <Input
                    type='tel'
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder='0912345678'
                    className='h-10 text-xs rounded-xl border border-input/80 bg-background px-3 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>
              </>
            )}

            {/* Hàng vật lý: SĐT bắt buộc, Địa chỉ bắt buộc (1 ô duy nhất) */}
            {isPhysical && (
              <>
                <div className='space-y-1'>
                  <label className='text-xs font-bold text-foreground flex items-center justify-between'>
                    <span>
                      Số điện thoại nhận hàng <strong className='text-rose-500'>*</strong>
                    </span>
                    <span className='text-[10px] text-muted-foreground font-normal'>
                      Bưu tá gọi khi giao
                    </span>
                  </label>
                  <Input
                    type='tel'
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder='0912345678'
                    className='h-10 text-xs rounded-xl border border-input/80 bg-background px-3 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-xs font-bold text-foreground flex items-center justify-between'>
                    <span>Email (Tùy chọn)</span>
                    <span className='text-[10px] text-muted-foreground font-normal'>
                      Nhận thông báo đơn
                    </span>
                  </label>
                  <Input
                    type='email'
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder='email@gmail.com'
                    className='h-10 text-xs rounded-xl border border-input/80 bg-background px-3 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-xs font-bold text-foreground flex items-center justify-between'>
                    <span>
                      Địa chỉ nhận hàng chi tiết <strong className='text-rose-500'>*</strong>
                    </span>
                  </label>
                  <Textarea
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder='Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP'
                    className='min-h-[72px] text-xs rounded-xl border border-input/80 bg-background px-3 py-2 resize-none focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-xs font-bold text-foreground'>
                    Ghi chú phân loại / yêu cầu riêng
                  </label>
                  <Input
                    type='text'
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder='Size, màu sắc hoặc lời nhắn riêng cho Creator'
                    className='h-10 text-xs rounded-xl border border-input/80 bg-background px-3 focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>
              </>
            )}

            {/* Nút CTA Bước 1 - Đỏ hồng TikTok đồng bộ, tự động co giãn vừa vặn */}
            <Button
              type='submit'
              disabled={loadingOrder}
              className='w-full h-11 sm:h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-foreground font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 px-3 transition-all cursor-pointer overflow-hidden'
            >
              {loadingOrder ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin shrink-0' />
                  <span className='truncate'>Đang xử lý thông tin...</span>
                </>
              ) : isFree ? (
                <>
                  <Gift className='w-4 h-4 shrink-0' />
                  <span className='truncate'>Nhận tài liệu ngay (0đ)</span>
                </>
              ) : (
                <>
                  <span className='truncate'>Tiếp tục thanh toán</span>
                  <span className='shrink-0'>• {formatPrice(product.price)}</span>
                  <ArrowRight className='w-4 h-4 shrink-0' />
                </>
              )}
            </Button>
          </form>
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // BƯỚC 2: MÀN HÌNH QUÉT VIETQR & THANH TOÁN (PAYMENT STEP)
    // -----------------------------------------------------------------------
    return (
      <div className='rounded-3xl bg-card border border-border p-4 sm:p-5 text-left space-y-4 shadow-xs'>
        {/* Nút quay lại Bước 1 sửa thông tin & Đồng hồ đếm ngược */}
        <div className='flex items-center justify-between pb-3 border-b border-border/60 gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setStep('FORM')}
            className='h-8 px-2.5 rounded-xl text-xs font-bold gap-1 cursor-pointer shrink-0'
            title='Quay lại sửa thông tin người nhận'
          >
            <ChevronLeft className='h-4 w-4' />
            <span>Quay lại</span>
          </Button>

          {/* Đếm ngược 15 phút */}
          <Badge
            variant='outline'
            className='bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-mono font-bold px-2.5 py-1 rounded-full gap-1 shadow-2xs shrink-0'
          >
            <Clock className='w-3 h-3 text-amber-600 animate-pulse' />
            <span>Hết hạn: {formattedCountdown}</span>
          </Badge>
        </div>

        {/* Tiêu đề & Thông báo quét mã */}
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0'>
            <QrCode className='w-4 h-4' />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-1.5 flex-nowrap'>
              <h3 className='text-xs sm:text-sm font-bold text-foreground whitespace-nowrap'>
                Quét mã VietQR 24/7
              </h3>
              <Badge
                variant='outline'
                className='bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md gap-1 shrink-0'
              >
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                Tự động
              </Badge>
            </div>
            <p className='text-[10px] text-muted-foreground whitespace-nowrap truncate'>
              Kích hoạt sau 3 giây thanh toán
            </p>
          </div>
        </div>

        {/* Khung Mã QR VietQR sắc nét */}
        <div className='flex flex-col items-center justify-center p-3.5 bg-muted/30 rounded-2xl border border-border shadow-2xs'>
          <div className='relative w-44 h-44 sm:w-52 sm:h-52 bg-white rounded-xl overflow-hidden flex items-center justify-center p-1 border border-border shadow-xs'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt='Mã QR Thanh Toán VietQR'
              className='w-full h-full object-contain'
            />
          </div>
          <p className='text-[11px] font-medium text-muted-foreground mt-2 text-center'>
            Dùng App Ngân hàng bất kỳ (MB, VCB, TCB, VPB, MoMo...) quét mã
          </p>
        </div>

        {/* Hộp thông tin chuyển khoản với logo ngân hàng & nút sao chép 1 chạm */}
        <div className='space-y-2 text-xs'>
          {/* Ngân hàng với Logo chính thức */}
          <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-muted/40 border border-border gap-2.5'>
            <div className='flex items-center gap-2.5 min-w-0 flex-1'>
              <div className='w-10 h-10 rounded-xl bg-background border border-border p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs'>
                {bankLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bankLogoUrl}
                    alt={bankShortName}
                    className='w-full h-full object-contain'
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className='w-5 h-5 text-muted-foreground' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <span className='text-muted-foreground text-[10px] block leading-none'>
                  Ngân hàng thụ hưởng:
                </span>
                <span className='font-bold text-xs sm:text-sm text-foreground leading-tight block truncate mt-1'>
                  {bankShortName}
                </span>
                <span
                  className='text-[10px] text-muted-foreground block truncate leading-tight mt-0.5'
                  title={bankFullName}
                >
                  {bankFullName}
                </span>
              </div>
            </div>
            <Badge
              variant='secondary'
              className='font-mono font-bold text-[10px] uppercase shrink-0'
            >
              {paymentConfig.bankId || 'NAPAS'}
            </Badge>
          </div>

          {/* Số tài khoản */}
          <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-muted/40 border border-border gap-2'>
            <div className='space-y-0.5 min-w-0 flex-1'>
              <span className='text-muted-foreground text-[10px] sm:text-[11px] block leading-none'>
                Số tài khoản:
              </span>
              <strong className='font-mono text-sm sm:text-base font-bold text-foreground tracking-wider block truncate mt-0.5'>
                {paymentConfig.accountNumber}
              </strong>
            </div>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={() => handleCopy(paymentConfig.accountNumber, 'STK')}
              className={cn(
                'h-8 px-3 rounded-xl text-[11px] font-bold gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-2xs',
                copiedField === 'STK' &&
                  'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
              )}
            >
              {copiedField === 'STK' ? (
                <>
                  <Check className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                  <span className='whitespace-nowrap'>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                  <span className='whitespace-nowrap'>Sao chép</span>
                </>
              )}
            </Button>
          </div>

          {/* Chủ tài khoản */}
          <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-muted/40 border border-border gap-2'>
            <span className='text-muted-foreground text-[10px] sm:text-[11px] shrink-0'>
              Chủ tài khoản:
            </span>
            <span className='font-bold text-xs sm:text-sm text-foreground uppercase text-right truncate'>
              {paymentConfig.accountName}
            </span>
          </div>

          {/* Số tiền */}
          <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-muted/40 border border-border gap-2'>
            <div className='space-y-0.5 min-w-0 flex-1'>
              <span className='text-muted-foreground text-[10px] sm:text-[11px] block leading-none'>
                Số tiền thanh toán:
              </span>
              <strong className='text-sm sm:text-base font-extrabold text-primary block mt-0.5'>
                {formatPrice(confirmedOrder?.amount || product.price)}
              </strong>
            </div>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={() => handleCopy(String(confirmedOrder?.amount || product.price), 'AMOUNT')}
              className={cn(
                'h-8 px-3 rounded-xl text-[11px] font-bold gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-2xs',
                copiedField === 'AMOUNT' &&
                  'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
              )}
            >
              {copiedField === 'AMOUNT' ? (
                <>
                  <Check className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                  <span className='whitespace-nowrap'>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
                  <span className='whitespace-nowrap'>Sao chép</span>
                </>
              )}
            </Button>
          </div>

          {/* Nội dung chuyển khoản */}
          <div className='p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2.5 shadow-2xs'>
            <div className='space-y-0.5 min-w-0 flex-1'>
              <div className='flex items-center gap-1.5 flex-nowrap'>
                <span className='text-amber-900 dark:text-amber-300 text-[11px] font-bold whitespace-nowrap block'>
                  Nội dung CK:
                </span>
                <Badge
                  variant='outline'
                  className='bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0'
                >
                  Bắt buộc
                </Badge>
              </div>
              <strong className='font-mono text-sm sm:text-base font-black text-amber-950 dark:text-amber-200 block tracking-wider mt-0.5'>
                {confirmedOrder?.orderCode || orderCode}
              </strong>
            </div>
            <Button
              type='button'
              size='sm'
              onClick={() => handleCopy(confirmedOrder?.orderCode || orderCode, 'CODE')}
              className={cn(
                'h-8 px-3.5 rounded-xl text-xs font-bold gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-xs',
                copiedField === 'CODE'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold'
              )}
            >
              {copiedField === 'CODE' ? (
                <>
                  <Check className='w-4 h-4 shrink-0' />
                  <span className='whitespace-nowrap'>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4 shrink-0' />
                  <span className='whitespace-nowrap'>Sao chép</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Nút kiểm tra trạng thái tức thì */}
        <div className='pt-2 space-y-2'>
          <Button
            type='button'
            onClick={handleManualCheck}
            disabled={loadingOrder}
            className='w-full h-11 sm:h-12 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.99] text-primary-foreground font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all'
          >
            {loadingOrder ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin shrink-0' />
                <span>Đang kiểm tra giao dịch...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className='w-4 h-4 shrink-0 text-white' />
                <span>TÔI ĐÃ CHUYỂN KHOẢN XONG</span>
              </>
            )}
          </Button>
          <p className='text-[10px] text-muted-foreground text-center'>
            Hệ thống tự động lắng nghe biến động 24/7 và duyệt đơn trong 3 giây.
          </p>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VIEW TRONG SIMULATOR IPHONE (Dành cho Dashboard Preview)
  // =========================================================================
  if (isSimulator) {
    return (
      <div className='w-full bg-background text-foreground font-sans antialiased px-3.5 py-3 text-xs flex flex-col min-h-full space-y-4'>
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
    </div>
  );
}
