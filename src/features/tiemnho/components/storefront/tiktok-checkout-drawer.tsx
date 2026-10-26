'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Product, PaymentConfig, Order, generateVietQrUrl } from '@/constants/mock-tiemnho';
import { createOrder } from '../../api/service';
import {
  CheckCircle2,
  Copy,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Gift,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface TikTokCheckoutDrawerProps {
  product: Product | null;
  paymentConfig: PaymentConfig;
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (order: Order) => void;
}

export function TikTokCheckoutDrawer({
  product,
  paymentConfig,
  isOpen,
  onClose,
  onOrderCompleted
}: TikTokCheckoutDrawerProps) {
  const [step, setStep] = React.useState<'FORM' | 'VIETQR' | 'SUCCESS'>('FORM');
  const [loading, setLoading] = React.useState(false);

  // Form states
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [note, setNote] = React.useState('');

  // Order state after creation
  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(null);

  // Copy states
  const [copiedField, setCopiedField] = React.useState<'STK' | 'CODE' | null>(null);

  // Countdown timer: 15 minutes (900 seconds)
  const [timeLeft, setTimeLeft] = React.useState(900);

  // Reset when drawer opens or closes
  React.useEffect(() => {
    if (isOpen) {
      setStep('FORM');
      setLoading(false);
      setTimeLeft(900);
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNote('');
      setCurrentOrder(null);
    }
  }, [isOpen]);

  // Timer countdown during VietQR step
  React.useEffect(() => {
    if (step !== 'VIETQR') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Polling check order payment status every 2.5s during VIETQR step
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
              prev ? { ...prev, status: 'PAID', paidAt: data.paidAt } : null
            );
            setStep('SUCCESS');
            toast.success('Thanh toán thành công! VietQR đã xác nhận.');
            if (onOrderCompleted) {
              onOrderCompleted({
                ...currentOrder,
                status: 'PAID'
              });
            }
          }
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, currentOrder, onOrderCompleted]);

  if (!product) return null;

  const isLeadMagnet = product.type === 'LEAD_MAGNET';
  const isPhysical = product.type === 'PHYSICAL';

  const formatPrice = (p: number) => {
    if (p === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopy = (text: string, field: 'STK' | 'CODE') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(field === 'STK' ? 'Đã sao chép số tài khoản!' : 'Đã sao chép mã đơn hàng!');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Submit form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!email.trim() && !isPhysical) {
      toast.error('Vui lòng nhập địa chỉ Email để nhận tài nguyên số');
      return;
    }
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (isPhysical && !address.trim()) {
      toast.error('Vui lòng nhập địa chỉ nhận hàng chi tiết');
      return;
    }

    setLoading(true);

    try {
      const order = await createOrder({
        productId: product.id,
        customerName: name.trim(),
        customerEmail: email.trim() || `${phone.trim()}@customer.tiemnho.vn`,
        customerPhone: phone.trim(),
        shippingAddress: isPhysical ? address.trim() : undefined,
        customerNote: note.trim() || undefined
      });

      setCurrentOrder(order);

      // Nếu là Lead Magnet (0đ) -> Vào ngay SUCCESS
      if (isLeadMagnet || product.price === 0) {
        setStep('SUCCESS');
        toast.success('Nhận quà thành công!');
        if (onOrderCompleted) onOrderCompleted(order);
      } else {
        // Có phí -> Chuyển sang quét VietQR
        setStep('VIETQR');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Nút dự phòng: Người mua bấm "Tôi đã chuyển khoản"
  const handleManualCheck = async () => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/status`, { method: 'POST' });
      if (res.ok) {
        setStep('SUCCESS');
        toast.success('Thanh toán thành công!');
      } else {
        toast.info('Hệ thống đang kiểm tra biến động số dư ngân hàng, vui lòng đợi vài giây...');
      }
    } catch {
      toast.error('Chưa ghi nhận thanh toán. Bạn hãy kiểm tra lại giao dịch nhé.');
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = currentOrder
    ? generateVietQrUrl({
        bankId: paymentConfig.bankId,
        accountNumber: paymentConfig.accountNumber,
        accountName: paymentConfig.accountName,
        amount: currentOrder.amount,
        orderCode: currentOrder.orderCode
      })
    : '';

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className='max-w-md mx-auto bg-white text-[#161823] border-[#E3E3E4] rounded-t-2xl px-2 sm:px-4 pb-6 outline-none'>
        {/* ========================================================= */}
        {/* STEP 1: FORM THU THẬP THÔNG TIN (1-TAP CHECKOUT)          */}
        {/* ========================================================= */}
        {step === 'FORM' && (
          <form onSubmit={handleSubmitForm} className='space-y-4 pt-2'>
            <DrawerHeader className='p-0 text-left space-y-1.5 border-b border-[#E3E3E4] pb-3'>
              <div className='flex items-center gap-2'>
                <div className='p-1.5 rounded-lg bg-[#FE2C55]/10 text-[#FE2C55]'>
                  {isLeadMagnet ? (
                    <Gift className='h-4 w-4' strokeWidth={1.75} />
                  ) : (
                    <ShoppingBag className='h-4 w-4' strokeWidth={1.75} />
                  )}
                </div>
                <div>
                  <DrawerTitle className='text-sm sm:text-base font-bold text-[#161823] tracking-tight'>
                    {isLeadMagnet ? 'Nhận quà miễn phí' : 'Thông tin thanh toán'}
                  </DrawerTitle>
                  <DrawerDescription className='text-xs text-[#73747B]'>
                    {isLeadMagnet
                      ? 'Nhập email để nhận link tài nguyên tải về ngay lập tức'
                      : 'Hoàn tất thông tin để quét mã VietQR nhận tài nguyên'}
                  </DrawerDescription>
                </div>
              </div>

              {/* Tóm tắt sản phẩm đang chọn */}
              <div className='flex items-center gap-3 bg-[#F8F8F8] p-2.5 rounded-xl border border-[#E3E3E4] mt-2'>
                <div className='relative h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-[#E3E3E4] bg-white'>
                  <Image
                    src={product.coverImage}
                    alt={product.title}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <h4 className='text-xs font-semibold text-[#161823] line-clamp-1'>
                    {product.title}
                  </h4>
                  <div className='flex items-baseline gap-2 mt-0.5'>
                    <span className='font-bold text-xs text-[#FE2C55]'>
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className='text-[10px] text-[#73747B] line-through'>
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DrawerHeader>

            {/* Các trường nhập liệu tối giản */}
            <div className='space-y-3 text-xs'>
              <div className='space-y-1'>
                <label className='font-semibold text-[#161823] text-xs flex items-center justify-between'>
                  <span>
                    Họ và tên <strong className='text-[#FE2C55]'>*</strong>
                  </span>
                  <span className='text-[10px] text-[#73747B] font-normal'>Để lưu đơn hàng</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='VD: Nguyễn Văn A'
                  className='h-10 text-xs rounded-lg border-[#E3E3E4] bg-[#F8F8F8] focus-visible:ring-1 focus-visible:ring-[#FE2C55]'
                  required
                />
              </div>

              <div className='space-y-1'>
                <label className='font-semibold text-[#161823] text-xs flex items-center justify-between'>
                  <span>
                    Địa chỉ Email <strong className='text-[#FE2C55]'>*</strong>
                  </span>
                  <span className='text-[10px] text-[#FE2C55] font-medium'>
                    Gửi tài nguyên tải về
                  </span>
                </label>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='tenban@gmail.com'
                  className='h-10 text-xs rounded-lg border-[#E3E3E4] bg-[#F8F8F8] focus-visible:ring-1 focus-visible:ring-[#FE2C55]'
                  required={!isPhysical}
                />
              </div>

              <div className='space-y-1'>
                <label className='font-semibold text-[#161823] text-xs'>
                  Số điện thoại <strong className='text-[#FE2C55]'>*</strong>
                </label>
                <Input
                  type='tel'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='0988xxxxxx'
                  className='h-10 text-xs rounded-lg border-[#E3E3E4] bg-[#F8F8F8] focus-visible:ring-1 focus-visible:ring-[#FE2C55]'
                  required
                />
              </div>

              {/* Trường riêng cho HÀNG VẬT LÝ */}
              {isPhysical && (
                <>
                  <div className='space-y-1'>
                    <label className='font-semibold text-[#161823] text-xs flex items-center justify-between'>
                      <span>
                        Địa chỉ nhận hàng chi tiết <strong className='text-[#FE2C55]'>*</strong>
                      </span>
                    </label>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder='Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố...'
                      className='min-h-[60px] text-xs rounded-lg border-[#E3E3E4] bg-[#F8F8F8] focus-visible:ring-1 focus-visible:ring-[#FE2C55] resize-none'
                      required
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='font-semibold text-[#161823] text-xs'>
                      Ghi chú thêm (Size, màu sắc...)
                    </label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder='VD: Áo size L màu đen, giao giờ hành chính'
                      className='h-9 text-xs rounded-lg border-[#E3E3E4] bg-[#F8F8F8] focus-visible:ring-1 focus-visible:ring-[#FE2C55]'
                    />
                  </div>
                </>
              )}

              {/* Badge cam kết bảo mật & 0% Escrow */}
              <div className='flex items-center gap-1.5 p-2 rounded-lg bg-[#FE2C55]/5 border border-[#FE2C55]/20 text-[11px] text-[#161823]'>
                <ShieldCheck className='h-4 w-4 text-[#FE2C55] shrink-0' strokeWidth={1.75} />
                <span>
                  Thanh toán trực tiếp 100% tới tài khoản chính chủ của Creator qua VietQR.
                </span>
              </div>
            </div>

            <DrawerFooter className='p-0 pt-2'>
              <Button
                type='submit'
                disabled={loading}
                className='w-full h-11 text-xs font-bold rounded-lg shadow-sm gap-2 bg-[#FE2C55] hover:bg-[#EF244B] text-white transition-all duration-200 cursor-pointer'
              >
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' strokeWidth={1.75} />
                    <span>Đang xử lý...</span>
                  </>
                ) : isLeadMagnet ? (
                  <>
                    <Gift className='h-4 w-4' strokeWidth={1.75} />
                    <span>Nhận tài nguyên miễn phí ngay</span>
                  </>
                ) : (
                  <>
                    <span>Tiếp tục thanh toán • {formatPrice(product.price)}</span>
                    <ArrowRight className='h-4 w-4' strokeWidth={1.75} />
                  </>
                )}
              </Button>
            </DrawerFooter>
          </form>
        )}

        {/* ========================================================= */}
        {/* STEP 2: QUÉT MÃ VIETQR ĐỘNG CHUẨN NAPAS 247              */}
        {/* ========================================================= */}
        {step === 'VIETQR' && currentOrder && (
          <div className='space-y-4 pt-2'>
            <DrawerHeader className='p-0 text-center space-y-1 border-b border-[#E3E3E4] pb-2.5'>
              <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FE2C55]/10 text-[#FE2C55] text-xs font-semibold mx-auto'>
                <Clock className='h-3.5 w-3.5 animate-pulse' strokeWidth={1.75} />
                <span>Hết hạn sau: {formattedTime}</span>
              </div>
              <DrawerTitle className='text-sm sm:text-base font-bold text-[#161823] pt-1'>
                Quét mã VietQR để thanh toán
              </DrawerTitle>
              <DrawerDescription className='text-xs text-[#73747B]'>
                Mở app ngân hàng bất kỳ, quét mã QR và xác nhận chuyển khoản
              </DrawerDescription>
            </DrawerHeader>

            {/* Khung VietQR sinh động */}
            <div className='flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-[#E3E3E4] shadow-sm'>
              <div className='relative h-56 w-56 sm:h-64 sm:w-64 overflow-hidden rounded-lg border border-[#E3E3E4] bg-white p-2'>
                {qrUrl ? (
                  <img src={qrUrl} alt='Mã VietQR' className='h-full w-full object-contain' />
                ) : (
                  <div className='h-full w-full flex items-center justify-center text-xs text-[#73747B]'>
                    Đang tạo mã QR...
                  </div>
                )}
              </div>

              {/* Số tiền cần thanh toán */}
              <div className='mt-2 text-center'>
                <span className='text-[11px] text-[#73747B] block'>Số tiền chuyển:</span>
                <span className='text-lg font-black text-[#FE2C55]'>
                  {formatPrice(currentOrder.amount)}
                </span>
              </div>
            </div>

            {/* Thông tin chuyển khoản cho khách dùng 1 máy (Copy STK & Nội dung) */}
            <div className='space-y-2 bg-[#F8F8F8] p-3 rounded-xl border border-[#E3E3E4] text-xs'>
              <div className='text-[11px] font-semibold text-[#73747B] uppercase tracking-wider mb-1'>
                Chuyển khoản thủ công (1 máy điện thoại):
              </div>

              {/* Ngân hàng */}
              <div className='flex items-center justify-between py-1 border-b border-[#E3E3E4]'>
                <span className='text-[#73747B]'>Ngân hàng:</span>
                <span className='font-semibold text-[#161823]'>{paymentConfig.bankName}</span>
              </div>

              {/* Số tài khoản + Nút sao chép */}
              <div className='flex items-center justify-between py-1 border-b border-[#E3E3E4]'>
                <span className='text-[#73747B]'>Số tài khoản:</span>
                <div className='flex items-center gap-1.5'>
                  <span className='font-mono font-bold text-[#161823]'>
                    {paymentConfig.accountNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(paymentConfig.accountNumber, 'STK')}
                    className='p-1 rounded hover:bg-white text-[#73747B] hover:text-[#FE2C55] transition-colors cursor-pointer'
                    title='Sao chép STK'
                  >
                    {copiedField === 'STK' ? (
                      <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' strokeWidth={1.75} />
                    ) : (
                      <Copy className='h-3.5 w-3.5' strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className='flex items-center justify-between py-1 border-b border-[#E3E3E4]'>
                <span className='text-[#73747B]'>Chủ tài khoản:</span>
                <span className='font-semibold text-[#161823]'>{paymentConfig.accountName}</span>
              </div>

              {/* Nội dung chuyển khoản (Bắt buộc chứa orderCode) */}
              <div className='flex items-center justify-between py-1'>
                <span className='text-[#73747B]'>Nội dung CK:</span>
                <div className='flex items-center gap-1.5'>
                  <span className='font-mono font-bold text-[#FE2C55] bg-[#FE2C55]/10 px-1.5 py-0.5 rounded'>
                    {currentOrder.orderCode}
                  </span>
                  <button
                    onClick={() => handleCopy(currentOrder.orderCode, 'CODE')}
                    className='p-1 rounded hover:bg-white text-[#73747B] hover:text-[#FE2C55] transition-colors cursor-pointer'
                    title='Sao chép nội dung CK'
                  >
                    {copiedField === 'CODE' ? (
                      <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' strokeWidth={1.75} />
                    ) : (
                      <Copy className='h-3.5 w-3.5' strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Nút kiểm tra thủ công nếu mạng ngân hàng chậm */}
            <div className='space-y-2 pt-1'>
              <Button
                onClick={handleManualCheck}
                disabled={loading}
                className='w-full h-11 text-xs font-bold rounded-lg bg-[#FE2C55] hover:bg-[#EF244B] text-white shadow-sm gap-2 cursor-pointer'
              >
                {loading ? (
                  <Loader2 className='h-4 w-4 animate-spin' strokeWidth={1.75} />
                ) : (
                  <CheckCircle2 className='h-4 w-4' strokeWidth={1.75} />
                )}
                <span>Tôi đã chuyển khoản thành công</span>
              </Button>

              <div className='flex items-center justify-center gap-1.5 text-[11px] text-[#73747B]'>
                <AlertCircle className='h-3.5 w-3.5 text-amber-500 shrink-0' strokeWidth={1.75} />
                <span>Hệ thống tự động kích hoạt ngay khi nhận biến động số dư</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: HOÀN TẤT & TRẢ TÀI NGUYÊN (FULFILLMENT)           */}
        {/* ========================================================= */}
        {step === 'SUCCESS' && currentOrder && (
          <div className='space-y-4 pt-4 text-center'>
            <div className='h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto ring-4 ring-emerald-500/20'>
              <CheckCircle2 className='h-8 w-8' strokeWidth={2} />
            </div>

            <div className='space-y-1'>
              <h3 className='text-base sm:text-lg font-bold text-[#161823]'>
                {isLeadMagnet ? 'Đã nhận quà thành công!' : 'Thanh toán thành công!'}
              </h3>
              <p className='text-xs text-[#73747B] max-w-xs mx-auto'>
                Cảm ơn <strong>{currentOrder.customerName}</strong>! Đơn hàng{' '}
                <strong className='font-mono text-[#161823]'>#{currentOrder.orderCode}</strong> đã
                được ghi nhận.
              </p>
            </div>

            {/* Khu vực phát hàng theo loại sản phẩm */}
            <div className='bg-[#F8F8F8] p-4 rounded-xl border border-[#E3E3E4] space-y-3 text-left'>
              {isPhysical ? (
                // Hàng vật lý
                <div className='space-y-1.5 text-xs'>
                  <div className='font-semibold text-[#161823] flex items-center gap-1.5'>
                    <ShoppingBag className='h-4 w-4 text-[#FE2C55]' strokeWidth={1.75} />
                    <span>Đơn hàng đang được chuẩn bị đóng gói</span>
                  </div>
                  <p className='text-[11px] text-[#73747B] leading-relaxed'>
                    Creator sẽ gửi hàng tới địa chỉ: <strong>{currentOrder.shippingAddress}</strong>
                    . Mã vận đơn sẽ được thông báo qua SĐT/Email của bạn.
                  </p>
                </div>
              ) : (
                // Sản phẩm số hoặc Lead Magnet
                <div className='space-y-2 text-xs'>
                  <div className='font-semibold text-[#161823] flex items-center gap-1.5'>
                    <Sparkles className='h-4 w-4 text-[#FE2C55]' strokeWidth={1.75} />
                    <span>Tài nguyên độc quyền sẵn sàng để tải:</span>
                  </div>

                  {currentOrder.downloadUrl ? (
                    <a
                      href={currentOrder.downloadUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='w-full py-2.5 px-4 rounded-lg bg-[#FE2C55] hover:bg-[#EF244B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer'
                    >
                      <Download className='h-4 w-4' strokeWidth={1.75} />
                      <span>Tải tài nguyên ngay (.PDF / Drive Link)</span>
                    </a>
                  ) : (
                    <div className='p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium'>
                      Link truy cập đã được gửi dự phòng vào hộp thư{' '}
                      <strong>{currentOrder.customerEmail}</strong>.
                    </div>
                  )}

                  <p className='text-[10px] text-[#73747B] text-center'>
                    (Đồng thời link dự phòng cũng đã được gửi tới email của bạn)
                  </p>
                </div>
              )}
            </div>

            <Button
              variant='outline'
              onClick={onClose}
              className='w-full h-10 text-xs font-semibold rounded-lg border-[#E3E3E4] text-[#161823] hover:bg-[#F8F8F8] cursor-pointer'
            >
              Đóng và tiếp tục xem Tiệm
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
