'use client';

import * as React from 'react';
import {
  Product,
  PaymentConfig,
  Order,
  generateVietQrUrl,
  VIETNAMESE_BANKS
} from '@/constants/mock-tiemnho';
import {
  Copy,
  Check,
  Clock,
  CheckCircle2,
  Download,
  PackageCheck,
  Sparkles,
  Loader2,
  X,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface VietQrPaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  product: Product;
  paymentConfig: PaymentConfig;
  onPaymentSuccess?: (order: Order) => void;
  isSimulator?: boolean;
}

export function VietQrPaymentPopup({
  isOpen,
  onClose,
  order,
  product,
  paymentConfig,
  onPaymentSuccess,
  isSimulator = false
}: VietQrPaymentPopupProps) {
  // Đồng hồ đếm ngược 15 phút (900s)
  const [timeLeft, setTimeLeft] = React.useState(900);
  const [copiedField, setCopiedField] = React.useState<'STK' | 'CODE' | 'AMOUNT' | null>(null);
  const [checkingManual, setCheckingManual] = React.useState(false);
  const [downloadingQr, setDownloadingQr] = React.useState(false);
  const [paidOrder, setPaidOrder] = React.useState<Order | null>(null);

  // Đặt lại đếm ngược khi popup mở
  React.useEffect(() => {
    if (isOpen) {
      setTimeLeft(900);
      setCopiedField(null);
      setCheckingManual(false);
      setDownloadingQr(false);
      setPaidOrder(null);
    }
  }, [isOpen, order?.id]);

  // Đếm ngược mỗi giây
  React.useEffect(() => {
    if (!isOpen || paidOrder) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, paidOrder]);

  const activeOrder = paidOrder || order;
  const isPaid = activeOrder?.status === 'PAID';
  const isPhysical = product.type === 'PHYSICAL';

  // Polling tự động kiểm tra trạng thái đơn hàng mỗi 2.5s
  React.useEffect(() => {
    if (!isOpen || !order || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'PAID') {
            clearInterval(interval);
            const updated = {
              ...order,
              status: 'PAID' as const,
              paidAt: data.paidAt,
              downloadUrl: data.downloadUrl || order.downloadUrl
            };
            setPaidOrder(updated);
            toast.success('Thanh toán thành công! VietQR đã xác nhận.');
            if (onPaymentSuccess) {
              onPaymentSuccess(updated);
            }
          }
        }
      } catch {
        // bỏ qua lỗi polling mạng
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, order, isPaid, onPaymentSuccess]);

  // Định dạng thời gian đếm ngược
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const formatPrice = (p: number) => {
    if (p === 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(p) + ' đ';
  };

  // Tra cứu thông tin ngân hàng
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

  const bankShortName = bankInfo?.shortName || paymentConfig.bankId || 'Ngân hàng';

  const qrImageUrl = order
    ? generateVietQrUrl({
        bankId: paymentConfig.bankId,
        accountNumber: paymentConfig.accountNumber,
        accountName: paymentConfig.accountName,
        amount: order.amount,
        orderCode: order.orderCode
      })
    : '';

  // Sao chép 1 chạm có thông báo & phản hồi trực quan
  const handleCopy = (text: string, field: 'STK' | 'CODE' | 'AMOUNT') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      const label =
        field === 'STK' ? 'Số tài khoản' : field === 'CODE' ? 'Nội dung chuyển khoản' : 'Số tiền';
      toast.success(`Đã sao chép ${label}!`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Tải ảnh mã QR về máy
  const handleDownloadQr = async () => {
    if (!qrImageUrl) return;
    setDownloadingQr(true);
    try {
      const res = await fetch(qrImageUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `vietqr-${order?.orderCode || 'payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Đã lưu mã QR vào máy!');
    } catch {
      // Fallback mở tab mới tải về
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.target = '_blank';
      link.download = `vietqr-${order?.orderCode || 'payment'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đang mở mã QR để lưu!');
    } finally {
      setDownloadingQr(false);
    }
  };

  // Kiểm tra thủ công khi người dùng bấm "Tôi đã chuyển khoản xong"
  const handleManualCheck = async () => {
    if (!order) return;
    setCheckingManual(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        const updated = {
          ...order,
          status: 'PAID' as const,
          paidAt: data.paidAt || new Date().toISOString(),
          downloadUrl: data.downloadUrl || order.downloadUrl
        };
        setPaidOrder(updated);
        toast.success('Xác nhận thanh toán thành công!');
        if (onPaymentSuccess) {
          onPaymentSuccess(updated);
        }
      } else {
        toast.info('Hệ thống đang kiểm tra biến động số dư qua VietQR...');
      }
    } catch {
      toast.info('Hệ thống đang kiểm tra biến động số dư...');
    } finally {
      setCheckingManual(false);
    }
  };

  if (!isOpen || !order) return null;

  // =========================================================================
  // GIAO DIỆN NỘI DUNG POPUP THANH TOÁN VIETQR (CLEAN MINIMALIST)
  // =========================================================================
  const popupBody = (
    <div className='w-full text-neutral-900 dark:text-neutral-100 font-sans text-left'>
      {/* 1. Header Tinh Gọn */}
      <div className='flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800 gap-2'>
        <h3 className='text-base font-bold text-neutral-900 dark:text-white leading-tight'>
          {isPaid ? 'Đã thanh toán' : 'Thanh toán VietQR'}
        </h3>

        {/* Cụm bên phải: Đồng hồ đếm ngược + Nút đóng [X] */}
        <div className='flex items-center gap-1.5 shrink-0'>
          {!isPaid && (
            <div className='text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-1 rounded-md flex items-center gap-1'>
              <Clock className='w-3 h-3 text-amber-600 animate-pulse' />
              <span>{formattedCountdown}</span>
            </div>
          )}

          <button
            type='button'
            onClick={onClose}
            className='w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer shrink-0'
            title='Đóng'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TRƯỜNG HỢP: ĐÃ THANH TOÁN THÀNH CÔNG                                  */}
      {/* ===================================================================== */}
      {isPaid ? (
        <div className='py-4 space-y-4 text-center'>
          <div className='w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-6 ring-emerald-50'>
            <CheckCircle2 className='w-8 h-8' strokeWidth={2.2} />
          </div>

          <div className='space-y-1'>
            <h4 className='text-base sm:text-lg font-black text-neutral-900 dark:text-white'>
              Thanh toán thành công!
            </h4>
            <p className='text-xs text-neutral-600 dark:text-neutral-300 max-w-xs mx-auto leading-relaxed'>
              VietQR đã khớp lệnh thanh toán cho đơn hàng{' '}
              <strong className='font-mono text-neutral-900 dark:text-white'>
                #{order.orderCode}
              </strong>
              .
            </p>
          </div>

          <div className='bg-neutral-50 dark:bg-neutral-900 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 text-left space-y-2'>
            {isPhysical ? (
              <div className='space-y-1.5 text-xs'>
                <div className='font-bold text-neutral-900 dark:text-white flex items-center gap-1.5'>
                  <PackageCheck className='w-4 h-4 text-emerald-600' />
                  <span>Đơn hàng đã được chuyển tới Creator</span>
                </div>
                <p className='text-[11px] text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-800 p-2 rounded-xl border border-neutral-100 dark:border-neutral-700'>
                  Địa chỉ giao: <strong>{order.shippingAddress}</strong>
                </p>
              </div>
            ) : (
              <div className='space-y-2 text-xs'>
                <div className='font-bold text-neutral-900 dark:text-white flex items-center gap-1.5'>
                  <Sparkles className='w-4 h-4 text-[#FE2C55]' />
                  <span>Tài liệu đã sẵn sàng để tải về:</span>
                </div>

                {order.downloadUrl || product.fileUrl ? (
                  <a
                    href={order.downloadUrl || product.fileUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer'
                  >
                    <Download className='w-4 h-4' />
                    <span>Tải tài liệu ngay ({product.fileName || 'File đính kèm'})</span>
                  </a>
                ) : (
                  <div className='p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800'>
                    Đường link tải tài liệu đã được gửi về email:{' '}
                    <strong>{order.customerEmail}</strong>.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type='button'
            onClick={onClose}
            className='w-full h-10 rounded-xl bg-neutral-900 hover:bg-black text-white font-semibold text-xs transition-colors cursor-pointer'
          >
            Đóng cửa sổ
          </button>
        </div>
      ) : (
        /* =================================================================== */
        /* TRƯỜNG HỢP: QUÉT MÃ VIETQR & THÔNG TIN CHUYỂN KHOẢN                 */
        /* =================================================================== */
        <div className='pt-2.5'>
          {/* 2. Khung Mã QR hiển thị ở trung tâm */}
          <div className='p-2 sm:p-2.5 bg-white dark:bg-card rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs max-w-[210px] mx-auto flex flex-col items-center justify-center'>
            <div className='relative w-32 h-32 sm:w-36 sm:h-36 overflow-hidden flex items-center justify-center'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt='Mã QR Thanh Toán VietQR'
                className='w-full h-full object-contain'
              />
            </div>
          </div>

          {/* Nút lưu mã QR vào máy */}
          <button
            type='button'
            onClick={handleDownloadQr}
            disabled={downloadingQr}
            className='w-full max-w-[210px] mx-auto h-8 sm:h-9 mt-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-xs font-semibold text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer'
          >
            {downloadingQr ? (
              <>
                <Loader2 className='w-3.5 h-3.5 animate-spin' />
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <Download className='w-3.5 h-3.5' />
                <span>Lưu mã QR vào máy</span>
              </>
            )}
          </button>

          {/* 3. Gom Khối Thông Tin Chuyển Khoản Vào 1 Thẻ Duy Nhất */}
          <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 p-3 sm:p-3.5 space-y-2 text-xs mt-2.5'>
            {/* Dòng 1: Ngân hàng MB Bank • Tên chủ TK */}
            <div className='flex items-center justify-between text-neutral-600 dark:text-neutral-400 gap-1.5 leading-tight'>
              <span className='shrink-0 text-neutral-500'>Ngân hàng:</span>
              <span className='font-semibold text-neutral-900 dark:text-white truncate text-right'>
                {bankShortName} • {paymentConfig.accountName}
              </span>
            </div>

            {/* Dòng 2: STK */}
            <div className='flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800'>
              <div className='min-w-0 flex items-center gap-1.5'>
                <span className='text-neutral-500 shrink-0'>STK:</span>
                <span className='font-mono font-bold text-neutral-900 dark:text-white tracking-wide truncate'>
                  {paymentConfig.accountNumber}
                </span>
              </div>
              <button
                type='button'
                onClick={() => handleCopy(paymentConfig.accountNumber, 'STK')}
                className='h-7 px-2 rounded-lg bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-2xs'
              >
                {copiedField === 'STK' ? (
                  <>
                    <Check className='w-3 h-3 text-emerald-600' />
                    <span className='text-emerald-600 font-bold'>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className='w-3 h-3 text-neutral-400' />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* Dòng 3: Số tiền */}
            <div className='flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-800'>
              <div className='min-w-0 flex items-center gap-1.5'>
                <span className='text-neutral-500 shrink-0'>Số tiền:</span>
                <span className='font-bold text-rose-600 dark:text-rose-500 text-sm tracking-tight truncate'>
                  {formatPrice(order.amount)}
                </span>
              </div>
              <button
                type='button'
                onClick={() => handleCopy(order.amount.toString(), 'AMOUNT')}
                className='h-7 px-2 rounded-lg bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-2xs'
              >
                {copiedField === 'AMOUNT' ? (
                  <>
                    <Check className='w-3 h-3 text-emerald-600' />
                    <span className='text-emerald-600 font-bold'>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className='w-3 h-3 text-neutral-400' />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* Dòng 4: Nội dung chuyển khoản (Nổi bật nhất) */}
            <div className='p-2 rounded-xl bg-amber-100/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-between gap-2 mt-1.5'>
              <div className='min-w-0 flex items-center gap-1.5'>
                <span className='text-[11px] text-amber-800 dark:text-amber-300 font-semibold shrink-0'>
                  Nội dung CK:
                </span>
                <span className='font-mono font-black text-sm text-amber-950 dark:text-amber-200 tracking-wider truncate'>
                  {order.orderCode}
                </span>
              </div>
              <button
                type='button'
                onClick={() => handleCopy(order.orderCode, 'CODE')}
                className='h-7 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-xs'
              >
                {copiedField === 'CODE' ? (
                  <>
                    <Check className='w-3 h-3' />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className='w-3 h-3' />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* Dòng nhắc nhở siêu ngắn dưới đáy thẻ */}
            <p className='text-[10.5px] text-neutral-500 dark:text-neutral-400 text-center leading-tight pt-0.5'>
              Giữ đúng nội dung để hệ thống tự động kích hoạt trong 3s
            </p>
          </div>

          {/* 4. Nút Hành Động Phụ & Footer */}
          <div className='pt-0.5'>
            <button
              type='button'
              onClick={handleManualCheck}
              disabled={checkingManual}
              className='w-full h-10 sm:h-11 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.99] font-medium text-xs text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-2 mt-2.5 cursor-pointer transition-all bg-white dark:bg-neutral-900 shadow-2xs disabled:opacity-70'
            >
              {checkingManual ? (
                <>
                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                  <span>Đang kiểm tra biến động số dư...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className='w-3.5 h-3.5 text-neutral-500' />
                  <span>Tôi đã chuyển khoản xong</span>
                </>
              )}
            </button>

            {/* Dòng bảo chứng dưới cùng */}
            <div className='flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 mt-2'>
              <ShieldCheck className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
              <span>Thanh toán an toàn 100% qua Napas247</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // SIMULATOR TRÊN ĐIỆN THOẠI: RENDER DẠNG OVERLAY BOTTOM SHEET GỌN GÀNG
  // =========================================================================
  if (isSimulator) {
    return (
      <div
        className='fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in-0 duration-200'
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className='w-full max-h-[96%] bg-white dark:bg-card rounded-t-[28px] p-3 border-t border-neutral-200/80 shadow-2xl overflow-y-auto overscroll-contain scrollbar-none'
          onClick={(e) => e.stopPropagation()}
        >
          {popupBody}
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRANG WEB THỰC TẾ (DESKTOP & MOBILE WEB): RENDER DIALOG CHUẨN
  // =========================================================================
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className='max-w-[360px] w-[92vw] rounded-3xl p-4 sm:p-5 border border-neutral-200/80 bg-white dark:bg-card shadow-2xl max-h-[96vh] overflow-y-auto'
        showCloseButton={false}
      >
        <DialogTitle className='sr-only'>Thanh toán VietQR</DialogTitle>
        <DialogDescription className='sr-only'>
          Quét mã QR hoặc chuyển khoản ngân hàng theo thông tin chi tiết bên dưới
        </DialogDescription>
        {popupBody}
      </DialogContent>
    </Dialog>
  );
}

export const PaymentModal = VietQrPaymentPopup;
export const VietQRPaymentStep = VietQrPaymentPopup;
