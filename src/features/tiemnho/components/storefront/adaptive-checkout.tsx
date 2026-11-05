'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Product,
  PaymentConfig,
  Order,
  generateVietQrUrl,
  VIETNAMESE_BANKS
} from '@/constants/mock-tiemnho';
import { createOrder } from '../../api/service';
import {
  CheckCircle2,
  Copy,
  Download,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Gift,
  Loader2,
  ChevronLeft,
  QrCode,
  Building2,
  Check,
  PackageCheck
} from 'lucide-react';

// =========================================================================
// 1. ZOD VALIDATION SCHEMA GENERATOR THEO LOẠI SẢN PHẨM
// =========================================================================
function buildCheckoutSchema(productType?: Product['type']) {
  return z.object({
    fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự)'),

    email:
      productType === 'PHYSICAL'
        ? z.string().trim().email('Email không đúng định dạng').optional().or(z.literal(''))
        : z
            .string()
            .trim()
            .min(1, 'Vui lòng nhập Email để nhận tài nguyên')
            .email('Email không hợp lệ (VD: ten@gmail.com)'),

    phone:
      productType === 'PHYSICAL'
        ? z
            .string()
            .trim()
            .min(1, 'Vui lòng nhập số điện thoại nhận hàng')
            .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (VD: 0912345678)')
        : z.string().trim().optional().or(z.literal('')),

    shippingAddress:
      productType === 'PHYSICAL'
        ? z
            .string()
            .trim()
            .min(6, 'Vui lòng nhập đầy đủ: Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP')
        : z.string().optional().or(z.literal('')),

    shippingNote: z.string().optional().or(z.literal(''))
  });
}

type CheckoutFormValues = z.infer<ReturnType<typeof buildCheckoutSchema>>;

// =========================================================================
// 2. ADAPTIVE CHECKOUT COMPONENT (2-STEP BOTTOM SHEET DRAWER)
// =========================================================================
interface AdaptiveCheckoutProps {
  product: Product | null;
  paymentConfig: PaymentConfig;
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (order: Order) => void;
}

export function AdaptiveCheckout({
  product,
  paymentConfig,
  isOpen,
  onClose,
  onOrderCompleted
}: AdaptiveCheckoutProps) {
  // Phát hiện thiết bị Desktop (>= 768px) để render Dialog thay vì Drawer nếu cần
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    setIsDesktop(media.matches);

    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Quản lý quy trình 2 bước: FORM (Bước 1) -> VIETQR (Bước 2) -> SUCCESS (Bước 3)
  const [step, setStep] = React.useState<'FORM' | 'VIETQR' | 'SUCCESS'>('FORM');
  const [loading, setLoading] = React.useState(false);

  // Đơn hàng tạm thời sau khi lưu thông tin ở Bước 1
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(null);

  // Trạng thái copy 1 chạm
  const [copiedField, setCopiedField] = React.useState<'STK' | 'CODE' | 'AMOUNT' | null>(null);

  // Đồng hồ đếm ngược 15 phút (900 giây)
  const [timeLeft, setTimeLeft] = React.useState(900);

  // Schema form động theo product.type
  const schema = React.useMemo(() => buildCheckoutSchema(product?.type), [product?.type]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      shippingAddress: '',
      shippingNote: ''
    }
  });

  // Reset form & state khi drawer mở/đóng hoặc đổi sản phẩm
  React.useEffect(() => {
    if (isOpen) {
      setStep('FORM');
      setLoading(false);
      setTimeLeft(900);
      setCurrentOrder(null);
      setCopiedField(null);
      reset({
        fullName: '',
        email: '',
        phone: '',
        shippingAddress: '',
        shippingNote: ''
      });
    }
  }, [isOpen, product, reset]);

  // Bộ đếm ngược 15 phút khi ở Bước 2 (VIETQR)
  React.useEffect(() => {
    if (step !== 'VIETQR') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // =========================================================================
  // REAL-TIME POLLING: Tự động kiểm tra trạng thái đơn hàng mỗi 2s ở Bước 2
  // =========================================================================
  React.useEffect(() => {
    if (step !== 'VIETQR' || !currentOrder) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${currentOrder.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'PAID') {
            clearInterval(interval);
            setCurrentOrder((prev) =>
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
            toast.success('Thanh toán thành công! VietQR đã xác nhận giao dịch.');
            if (onOrderCompleted) {
              onOrderCompleted({
                ...currentOrder,
                status: 'PAID',
                paidAt: data.paidAt
              });
            }
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, currentOrder, onOrderCompleted]);

  if (!product) return null;

  const isLeadMagnet = product.type === 'LEAD_MAGNET' || product.price === 0;
  const isPhysical = product.type === 'PHYSICAL';

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

  // Cơ chế sao chép đa nền tảng an toàn 100%
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

  // =========================================================================
  // XỬ LÝ SUBMIT BƯỚC 1: Validate -> Tạo đơn PENDING -> Chuyển sang Bước 2
  // =========================================================================
  const onSubmitStep1 = async (values: CheckoutFormValues) => {
    setLoading(true);

    try {
      const order = await createOrder({
        productId: product.id,
        customerName: values.fullName.trim(),
        customerEmail: values.email?.trim() || `${values.phone?.trim() || 'customer'}@tiemnho.vn`,
        customerPhone: values.phone?.trim() || '',
        shippingAddress: isPhysical ? values.shippingAddress?.trim() : undefined,
        customerNote: values.shippingNote?.trim() || undefined
      });

      setCurrentOrder(order);

      // Nếu là quà tặng 0đ (Lead Magnet): Bỏ qua Bước 2, chuyển thẳng sang Thành công!
      if (isLeadMagnet) {
        setStep('SUCCESS');
        toast.success('Nhận tài liệu thành công! Bạn có thể tải ngay bây giờ.');
        if (onOrderCompleted) onOrderCompleted(order);
      } else {
        // Chuyển sang Bước 2 (Quét mã VietQR)
        setStep('VIETQR');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Nút phụ: "Tôi đã chuyển khoản xong" (Kích hoạt kiểm tra trạng thái tức thì)
  const handleManualCheck = async () => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/status`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentOrder((prev) =>
          prev
            ? {
                ...prev,
                status: 'PAID',
                paidAt: data.order?.paidAt || new Date().toISOString()
              }
            : null
        );
        setStep('SUCCESS');
        toast.success('Thanh toán thành công! Đơn hàng đã được kích hoạt.');
        if (onOrderCompleted) {
          onOrderCompleted({
            ...currentOrder,
            status: 'PAID'
          });
        }
      } else {
        toast.info('Hệ thống đang kiểm tra biến động số dư ngân hàng, vui lòng đợi vài giây...');
      }
    } catch {
      toast.error('Chưa ghi nhận biến động số dư. Bạn kiểm tra lại giao dịch trên App nhé.');
    } finally {
      setLoading(false);
    }
  };

  // Link VietQR động được gắn cứng mã đơn hàng và số tiền chính xác
  const qrUrl = currentOrder
    ? generateVietQrUrl({
        bankId: paymentConfig.bankId,
        accountNumber: paymentConfig.accountNumber,
        accountName: paymentConfig.accountName,
        amount: currentOrder.amount,
        orderCode: currentOrder.orderCode
      })
    : '';

  // =========================================================================
  // NỘI DUNG 2 BƯỚC CHECKOUT (DÙNG CHUNG CHO CẢ DRAWER VÀ DIALOG)
  // =========================================================================
  const renderCheckoutContent = () => (
    <div className='w-full text-neutral-900 font-sans'>
      {/* ----------------------------------------------------------------- */}
      {/* BƯỚC 1: FORM THÔNG TIN NGƯỜI NHẬN (CUSTOMER INFO STEP)             */}
      {/* ----------------------------------------------------------------- */}
      {step === 'FORM' && (
        <form onSubmit={handleSubmit(onSubmitStep1)} className='space-y-4 pt-1'>
          {/* Header Bước 1: Tiêu đề Drawer & Tóm tắt sản phẩm */}
          <div className='text-left space-y-2.5 border-b border-neutral-100 pb-3'>
            <div>
              <h3 className='text-base sm:text-lg font-black tracking-tight text-neutral-900'>
                Thông tin nhận hàng
              </h3>
              <p className='text-xs text-neutral-500'>
                {isLeadMagnet
                  ? 'Điền thông tin để nhận tài liệu miễn phí tức thì'
                  : 'Điền thông tin người nhận trước khi quét mã VietQR'}
              </p>
            </div>

            {/* Thẻ tóm tắt sản phẩm & giá bán */}
            <div className='flex items-center gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200/70'>
              <div className='relative h-13 w-13 rounded-xl overflow-hidden shrink-0 border border-neutral-200/80 bg-white shadow-2xs'>
                <Image
                  src={product.coverImage}
                  alt={product.title}
                  fill
                  className='object-cover'
                  unoptimized
                />
              </div>
              <div className='flex-1 min-w-0 text-left'>
                <h4 className='text-xs sm:text-sm font-bold text-neutral-900 line-clamp-1'>
                  {product.title}
                </h4>
                <div className='flex items-baseline gap-2 mt-0.5'>
                  <span className='font-extrabold text-sm text-[#FE2C55]'>
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className='text-[11px] text-neutral-400 line-through'>
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Các trường nhập liệu tùy biến linh hoạt theo product.type */}
          <div className='space-y-3.5 text-xs text-left max-h-[52vh] overflow-y-auto px-0.5 overscroll-contain'>
            {/* 1. Họ và tên (Dùng chung cho mọi loại sản phẩm) */}
            <div className='space-y-1'>
              <label className='font-bold text-neutral-800 text-xs flex items-center justify-between'>
                <span>
                  Họ và tên <strong className='text-rose-500'>*</strong>
                </span>
                <span className='text-[10px] text-neutral-400 font-normal'>Bắt buộc</span>
              </label>
              <Input
                {...register('fullName')}
                placeholder='VD: Nguyễn Văn A'
                className='h-10 text-xs rounded-xl border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
              />
              {errors.fullName && (
                <p className='text-[11px] font-semibold text-rose-500 pt-0.5'>
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* 2. Các trường dành riêng cho DIGITAL (Sản phẩm số) */}
            {!isPhysical && (
              <>
                <div className='space-y-1'>
                  <label className='font-bold text-neutral-800 text-xs flex items-center justify-between'>
                    <span>
                      Email nhận tài liệu <strong className='text-rose-500'>*</strong>
                    </span>
                    <span className='text-[10px] text-neutral-400 font-normal'>
                      Gửi link tải tự động
                    </span>
                  </label>
                  <Input
                    type='email'
                    {...register('email')}
                    placeholder='email@gmail.com'
                    className='h-10 text-xs rounded-xl border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                  {errors.email && (
                    <p className='text-[11px] font-semibold text-rose-500 pt-0.5'>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className='space-y-1'>
                  <label className='font-bold text-neutral-800 text-xs flex items-center justify-between'>
                    <span>Số điện thoại (Zalo)</span>
                    <span className='text-[10px] text-neutral-400 font-normal'>Tùy chọn</span>
                  </label>
                  <Input
                    type='tel'
                    {...register('phone')}
                    placeholder='0912345678'
                    className='h-10 text-xs rounded-xl border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>
              </>
            )}

            {/* 3. Các trường dành riêng cho PHYSICAL (Hàng vật lý / Đặt trước) */}
            {isPhysical && (
              <>
                <div className='space-y-1'>
                  <label className='font-bold text-neutral-800 text-xs flex items-center justify-between'>
                    <span>
                      Số điện thoại nhận hàng <strong className='text-rose-500'>*</strong>
                    </span>
                    <span className='text-[10px] text-neutral-400 font-normal'>
                      Bưu tá gọi khi giao
                    </span>
                  </label>
                  <Input
                    type='tel'
                    {...register('phone')}
                    placeholder='VD: 0912345678'
                    className='h-10 text-xs rounded-xl border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                  {errors.phone && (
                    <p className='text-[11px] font-semibold text-rose-500 pt-0.5'>
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className='space-y-1'>
                  <label className='font-bold text-neutral-800 text-xs flex items-center justify-between'>
                    <span>Email (Tùy chọn)</span>
                    <span className='text-[10px] text-neutral-400 font-normal'>
                      Nhận mã vận đơn
                    </span>
                  </label>
                  <Input
                    type='email'
                    {...register('email')}
                    placeholder='email@gmail.com'
                    className='h-10 text-xs rounded-xl border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                  {errors.email && (
                    <p className='text-[11px] font-semibold text-rose-500 pt-0.5'>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className='space-y-1'>
                  <label className='font-bold text-neutral-800 text-xs flex items-center justify-between'>
                    <span>
                      Địa chỉ giao hàng chi tiết <strong className='text-rose-500'>*</strong>
                    </span>
                  </label>
                  <Textarea
                    {...register('shippingAddress')}
                    placeholder='Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP'
                    className='min-h-[72px] text-xs rounded-xl border-neutral-200 bg-white resize-none focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                  {errors.shippingAddress && (
                    <p className='text-[11px] font-semibold text-rose-500 pt-0.5'>
                      {errors.shippingAddress.message}
                    </p>
                  )}
                </div>

                <div className='space-y-1'>
                  <label className='font-bold text-neutral-800 text-xs'>
                    Ghi chú phân loại / yêu cầu riêng
                  </label>
                  <Input
                    {...register('shippingNote')}
                    placeholder='VD: Size L, màu trắng, hoặc giao giờ hành chính...'
                    className='h-10 text-xs rounded-xl border-neutral-200 bg-white focus-visible:ring-2 focus-visible:ring-[#FE2C55]/20 focus-visible:border-[#FE2C55]'
                  />
                </div>
              </>
            )}

            {/* Thông báo tin cậy */}
            <div className='flex items-center gap-2 p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600'>
              <ShieldCheck className='h-4 w-4 text-emerald-600 shrink-0' />
              <span>
                Thông tin được mã hóa bảo mật & gửi trực tiếp tới tài khoản chính chủ Creator.
              </span>
            </div>
          </div>

          {/* Nút CTA Dưới cùng */}
          <div className='pt-2'>
            <Button
              type='submit'
              disabled={loading}
              className='w-full h-11 sm:h-12 text-xs sm:text-sm font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 px-3 cursor-pointer overflow-hidden'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin shrink-0' />
                  <span className='truncate'>Đang xử lý thông tin...</span>
                </>
              ) : isLeadMagnet ? (
                <>
                  <Gift className='h-4 w-4 shrink-0' />
                  <span className='truncate'>Nhận tài liệu ngay (0đ)</span>
                </>
              ) : (
                <>
                  <span className='truncate'>Tiếp tục thanh toán</span>
                  <span className='shrink-0'>• {formatPrice(product.price)}</span>
                  <ArrowRight className='h-4 w-4 shrink-0' />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* BƯỚC 2: MÀN HÌNH QUÉT VIETQR & THANH TOÁN (PAYMENT STEP)           */}
      {/* ----------------------------------------------------------------- */}
      {step === 'VIETQR' && currentOrder && (
        <div className='space-y-4 pt-1'>
          {/* Header Bước 2: Nút quay lại sửa thông tin & Đếm ngược 15 phút */}
          <div className='flex items-center justify-between pb-2.5 border-b border-neutral-100 gap-2'>
            <button
              type='button'
              onClick={() => setStep('FORM')}
              className='inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0'
              title='Quay lại sửa thông tin người nhận'
            >
              <ChevronLeft className='h-4 w-4' />
              <span>Quay lại</span>
            </button>

            {/* Đồng hồ đếm ngược */}
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold shadow-2xs shrink-0'>
              <Clock className='h-3.5 w-3.5 text-amber-600 animate-pulse' />
              <span>Hết hạn: {formattedCountdown}</span>
            </div>
          </div>

          {/* Tiêu đề & Thông báo quét mã */}
          <div className='text-left space-y-1'>
            <div className='flex items-center gap-2'>
              <h3 className='text-base sm:text-lg font-black text-neutral-900'>
                Quét mã VietQR 24/7
              </h3>
              <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap shrink-0'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                Tự động
              </span>
            </div>
            <p className='text-xs text-neutral-500'>
              Dùng App Ngân hàng bất kỳ (MB, VCB, TCB, VPB, MoMo...) quét mã
            </p>
          </div>

          {/* Khung VietQR trung tâm lớn, sắc nét */}
          <div className='flex flex-col items-center justify-center p-3.5 bg-neutral-50/70 rounded-2xl border border-neutral-200/80 shadow-2xs'>
            <div className='relative h-48 w-48 sm:h-56 sm:w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white p-2 shadow-xs'>
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrUrl}
                  alt='Mã VietQR thanh toán'
                  className='h-full w-full object-contain'
                />
              ) : (
                <div className='h-full w-full flex items-center justify-center text-xs text-neutral-400'>
                  Đang khởi tạo mã QR...
                </div>
              )}
            </div>

            <div className='mt-2 text-center'>
              <span className='text-[11px] text-neutral-500 block leading-tight'>
                Số tiền thanh toán:
              </span>
              <span className='text-lg sm:text-xl font-black text-[#FE2C55]'>
                {formatPrice(currentOrder.amount)}
              </span>
            </div>
          </div>

          {/* Khối thông tin chuyển khoản kèm tiện ích sao chép 1 chạm */}
          <div className='space-y-2 text-xs text-left'>
            {/* 1. Ngân hàng thụ hưởng với Logo chính thức */}
            <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border border-neutral-200/80 gap-2.5'>
              <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                <div className='w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs'>
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
                    <Building2 className='w-5 h-5 text-neutral-500' />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <span className='text-neutral-400 text-[10px] block leading-none'>
                    Ngân hàng thụ hưởng:
                  </span>
                  <span className='font-bold text-xs sm:text-sm text-neutral-900 leading-tight block truncate mt-1'>
                    {bankShortName}
                  </span>
                  <span
                    className='text-[10px] text-neutral-500 block truncate leading-tight mt-0.5'
                    title={bankFullName}
                  >
                    {bankFullName}
                  </span>
                </div>
              </div>
              <span className='px-2 py-1 rounded-lg bg-neutral-100 text-neutral-600 text-[10px] font-mono font-bold uppercase shrink-0 whitespace-nowrap'>
                {paymentConfig.bankId || 'NAPAS'}
              </span>
            </div>

            {/* 2. Số tài khoản */}
            <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border border-neutral-200/80 gap-2'>
              <div className='space-y-0.5 min-w-0 flex-1'>
                <span className='text-neutral-400 text-[10px] block leading-none'>
                  Số tài khoản:
                </span>
                <strong className='font-mono text-sm sm:text-base font-bold text-neutral-900 tracking-wider block truncate mt-0.5'>
                  {paymentConfig.accountNumber}
                </strong>
              </div>
              <button
                type='button'
                onClick={() => handleCopy(paymentConfig.accountNumber, 'STK')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-all shadow-2xs active:scale-95 ${
                  copiedField === 'STK'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200/60'
                }`}
              >
                {copiedField === 'STK' ? (
                  <>
                    <Check className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                    <span className='whitespace-nowrap'>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className='w-3.5 h-3.5 text-neutral-600 shrink-0' />
                    <span className='whitespace-nowrap'>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Chủ tài khoản */}
            <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border border-neutral-200/80 gap-2'>
              <span className='text-neutral-400 text-[10px] shrink-0'>Chủ tài khoản:</span>
              <span className='font-bold text-xs sm:text-sm text-neutral-900 uppercase text-right truncate'>
                {paymentConfig.accountName}
              </span>
            </div>

            {/* 4. Số tiền thanh toán */}
            <div className='flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border border-neutral-200/80 gap-2'>
              <div className='space-y-0.5 min-w-0 flex-1'>
                <span className='text-neutral-400 text-[10px] block leading-none'>
                  Số tiền thanh toán:
                </span>
                <strong className='text-sm sm:text-base font-extrabold text-[#FE2C55] block mt-0.5'>
                  {formatPrice(currentOrder.amount)}
                </strong>
              </div>
              <button
                type='button'
                onClick={() => handleCopy(String(currentOrder.amount), 'AMOUNT')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-all shadow-2xs active:scale-95 ${
                  copiedField === 'AMOUNT'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200/60'
                }`}
              >
                {copiedField === 'AMOUNT' ? (
                  <>
                    <Check className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                    <span className='whitespace-nowrap'>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className='w-3.5 h-3.5 text-neutral-600 shrink-0' />
                    <span className='whitespace-nowrap'>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* 5. Nội dung chuyển khoản (Bắt buộc chứa mã đơn) */}
            <div className='p-3 rounded-2xl bg-amber-50/90 border border-amber-300/80 flex items-center justify-between gap-2.5 shadow-2xs'>
              <div className='space-y-0.5 min-w-0 flex-1'>
                <div className='flex items-center gap-1.5 flex-nowrap'>
                  <span className='text-amber-900 text-[11px] font-bold whitespace-nowrap block'>
                    Nội dung CK:
                  </span>
                  <span className='px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200/80 text-amber-900 whitespace-nowrap shrink-0 leading-none'>
                    Bắt buộc
                  </span>
                </div>
                <strong className='font-mono text-sm sm:text-base font-black text-amber-950 block tracking-wider mt-0.5'>
                  {currentOrder.orderCode}
                </strong>
              </div>
              <button
                type='button'
                onClick={() => handleCopy(currentOrder.orderCode, 'CODE')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer transition-all shadow-xs active:scale-95 ${
                  copiedField === 'CODE'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-amber-300 hover:bg-amber-400 text-amber-950 shadow-amber-300/30'
                }`}
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
              </button>
            </div>
          </div>

          {/* Nút phụ dưới cùng: "Tôi đã chuyển khoản xong" */}
          <div className='pt-2 space-y-2'>
            <Button
              type='button'
              onClick={handleManualCheck}
              disabled={loading}
              className='w-full h-11 text-xs sm:text-sm font-bold rounded-2xl bg-neutral-900 hover:bg-black text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Đang kiểm tra giao dịch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className='h-4 w-4 text-emerald-400' />
                  <span>TÔI ĐÃ CHUYỂN KHOẢN XONG</span>
                </>
              )}
            </Button>

            <p className='text-[11px] text-neutral-400 text-center'>
              Hệ thống tự động lắng nghe biến động 24/7 và duyệt đơn trong 3 giây.
            </p>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* BƯỚC 3: MÀN HÌNH THÀNH CÔNG 🎉 (FULFILLMENT STEP)                  */}
      {/* ----------------------------------------------------------------- */}
      {step === 'SUCCESS' && currentOrder && (
        <div className='space-y-4 pt-3 text-center'>
          <div className='h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50'>
            <CheckCircle2 className='h-9 w-9' strokeWidth={2.2} />
          </div>

          <div className='space-y-1'>
            <h3 className='text-lg sm:text-xl font-black text-neutral-900'>
              {isLeadMagnet ? 'Nhận tài liệu thành công 🎉' : 'Thanh toán thành công 🎉'}
            </h3>
            <p className='text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed'>
              Cảm ơn <strong>{currentOrder.customerName}</strong>! Mã đơn hàng:{' '}
              <strong className='font-mono text-neutral-900'>#{currentOrder.orderCode}</strong>.
            </p>
          </div>

          {/* Khối nhận hàng tương ứng loại sản phẩm */}
          <div className='bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3 text-left'>
            {isPhysical ? (
              <div className='space-y-2 text-xs'>
                <div className='font-bold text-neutral-900 flex items-center gap-1.5'>
                  <PackageCheck className='h-4 w-4 text-emerald-600' />
                  <span>Đặt hàng thành công! Đơn hàng sẽ được chuẩn bị.</span>
                </div>
                <p className='text-[11px] text-neutral-600 leading-relaxed bg-white p-2.5 rounded-xl border border-neutral-100'>
                  Địa chỉ giao hàng: <strong>{currentOrder.shippingAddress}</strong>
                </p>
                <p className='text-[11px] text-neutral-500'>
                  Creator sẽ sớm liên hệ số điện thoại <strong>{currentOrder.customerPhone}</strong>{' '}
                  để xác nhận và giao hàng tới bạn.
                </p>
              </div>
            ) : (
              <div className='space-y-2.5 text-xs'>
                <div className='font-bold text-neutral-900 flex items-center gap-1.5'>
                  <Sparkles className='h-4 w-4 text-[#FE2C55]' />
                  <span>Tài liệu đã sẵn sàng để truy cập ngay:</span>
                </div>

                {currentOrder.downloadUrl || product.fileUrl ? (
                  <a
                    href={currentOrder.downloadUrl || product.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer'
                  >
                    <Download className='h-4 w-4' />
                    <span>Tải tài liệu ngay ({product.fileName || 'File đính kèm'})</span>
                  </a>
                ) : (
                  <div className='p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200'>
                    Link truy cập đã được gửi dự phòng vào email:{' '}
                    <strong>{currentOrder.customerEmail}</strong>.
                  </div>
                )}

                <p className='text-[11px] text-neutral-500 text-center'>
                  (Đồng thời hệ thống cũng đã gửi link dự phòng tới email:{' '}
                  <strong>{currentOrder.customerEmail}</strong>)
                </p>
              </div>
            )}
          </div>

          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            className='w-full h-11 text-xs font-bold rounded-2xl border-neutral-200 hover:bg-neutral-100 cursor-pointer'
          >
            Đóng và tiếp tục xem Tiệm
          </Button>
        </div>
      )}
    </div>
  );

  // Desktop Dialog View (>= 768px)
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className='sm:max-w-md rounded-3xl p-5 border border-neutral-200 bg-white shadow-2xl overflow-hidden'>
          <DialogHeader className='hidden'>
            <DialogTitle>Thanh toán đơn hàng</DialogTitle>
            <DialogDescription>Quy trình thanh toán 2 bước</DialogDescription>
          </DialogHeader>
          {renderCheckoutContent()}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile Bottom Sheet Drawer View (< 768px)
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className='max-w-md mx-auto bg-white text-neutral-900 border-neutral-200 rounded-t-3xl px-4 pb-6 outline-none max-h-[88vh] flex flex-col overflow-hidden'>
        <DrawerHeader className='hidden'>
          <DrawerTitle>Thanh toán đơn hàng</DrawerTitle>
          <DrawerDescription>Quy trình thanh toán 2 bước</DrawerDescription>
        </DrawerHeader>
        {/* Swipe Handle */}
        <div className='mx-auto w-12 h-1.5 shrink-0 rounded-full bg-neutral-300 my-2.5' />
        <div className='flex-1 overflow-y-auto overscroll-contain pr-0.5'>
          {renderCheckoutContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
