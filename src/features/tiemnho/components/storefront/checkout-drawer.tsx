'use client';

import * as React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Product, PaymentConfig, Order } from '@/constants/mock-tiemnho';
import { generateVietQrUrl } from '@/constants/mock-tiemnho';
import Image from 'next/image';

interface CheckoutDrawerProps {
  product: Product | null;
  paymentConfig: PaymentConfig;
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (order: Order) => void;
}

export function CheckoutDrawer({
  product,
  paymentConfig,
  isOpen,
  onClose,
  onOrderCompleted
}: CheckoutDrawerProps) {
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
      setCurrentOrder(null);
      setTimeLeft(900);
      setCopiedField(null);
    }
  }, [isOpen]);

  // Countdown effect during QR step
  React.useEffect(() => {
    if (step !== 'VIETQR') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Polling effect during QR step to check payment status
  React.useEffect(() => {
    if (step !== 'VIETQR' || !currentOrder) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${currentOrder.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'PAID') {
            clearInterval(pollInterval);
            setCurrentOrder((prev) =>
              prev ? { ...prev, status: 'PAID', paidAt: data.paidAt } : null
            );
            setStep('SUCCESS');
            toast.success('Thanh toán thành công! VietQR đã xác nhận biến động số dư.');
            if (onOrderCompleted && currentOrder) {
              onOrderCompleted({ ...currentOrder, status: 'PAID' });
            }
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [step, currentOrder, onOrderCompleted]);

  if (!product) return null;

  const isFree = product.price === 0 || product.type === 'LEAD_MAGNET';
  const isPhysical = product.type === 'PHYSICAL';

  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí (0đ)';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const handleCopy = (text: string, field: 'STK' | 'CODE') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field === 'STK' ? 'Số tài khoản' : 'Nội dung chuyển khoản'}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!isPhysical && !email.trim()) {
      toast.error('Vui lòng nhập email để nhận tài nguyên');
      return;
    }
    if (isPhysical && !phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại nhận hàng');
      return;
    }
    if (isPhysical && !address.trim()) {
      toast.error('Vui lòng nhập địa chỉ nhận hàng chi tiết');
      return;
    }

    setLoading(true);

    try {
      // Create order via internal mock service
      const { createOrder } = await import('@/features/tiemnho/api/service');
      const order = await createOrder({
        productId: product.id,
        customerName: name.trim(),
        customerEmail: email.trim() || `${phone.trim()}@customer.tiemnho.vn`,
        customerPhone: phone.trim(),
        shippingAddress: address.trim() || undefined,
        customerNote: note.trim() || undefined
      });

      setCurrentOrder(order);

      if (isFree) {
        setStep('SUCCESS');
        toast.success('Đã mở khóa tài liệu thành công!');
        if (onOrderCompleted) onOrderCompleted(order);
      } else {
        setStep('VIETQR');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/status`, { method: 'POST' });
      if (res.ok) {
        setStep('SUCCESS');
        toast.success(
          'Mô phỏng thanh toán VietQR thành công! Đơn hàng đã chuyển sang trạng thái Đã Thanh Toán.'
        );
        if (onOrderCompleted) {
          onOrderCompleted({ ...currentOrder, status: 'PAID' });
        }
      }
    } catch (e) {
      toast.error('Lỗi khi mô phỏng thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const qrImageUrl = currentOrder
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
      <DrawerContent className='mx-auto max-w-md max-h-[92vh] overflow-hidden flex flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl'>
        {/* Header Summary */}
        <DrawerHeader className='border-b border-border/60 pb-3 pt-4 px-5 text-left'>
          <div className='flex items-start gap-3'>
            <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted shadow-xs'>
              <img
                src={product.coverImage}
                alt={product.title}
                className='h-full w-full object-cover'
              />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-1.5 mb-1'>
                <Badge
                  variant='secondary'
                  className='text-[10px] font-semibold tracking-wider uppercase px-2 py-0'
                >
                  {product.type === 'DIGITAL' && 'Tài liệu số'}
                  {product.type === 'LEAD_MAGNET' && 'Quà tặng 0đ'}
                  {product.type === 'PHYSICAL' && 'Hàng vật lý'}
                  {product.type === 'EXTERNAL_LINK' && 'Liên kết'}
                </Badge>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className='text-[11px] text-muted-foreground line-through'>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              <DrawerTitle className='line-clamp-1 text-base font-semibold leading-tight text-foreground'>
                {product.title}
              </DrawerTitle>
              <DrawerDescription className='text-xs font-semibold text-primary mt-0.5'>
                {formatPrice(product.price)}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        {/* Content Body */}
        <div className='flex-1 overflow-y-auto px-5 py-4 space-y-4'>
          {/* STEP 1: FORM */}
          {step === 'FORM' && (
            <form id='checkout-form' onSubmit={handleSubmitForm} className='space-y-3.5'>
              <div className='space-y-1.5'>
                <label className='text-xs font-medium text-foreground flex items-center justify-between'>
                  <span>Họ và tên</span>
                  <span className='text-[10px] text-muted-foreground'>Bắt buộc</span>
                </label>
                <Input
                  placeholder='VD: Nguyễn Văn A'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='h-10 text-sm rounded-xl'
                  required
                />
              </div>

              {!isPhysical && (
                <div className='space-y-1.5'>
                  <label className='text-xs font-medium text-foreground flex items-center justify-between'>
                    <span>Địa chỉ Email nhận tài nguyên</span>
                    <span className='text-[10px] text-primary font-semibold'>Bắt buộc</span>
                  </label>
                  <Input
                    type='email'
                    placeholder='VD: email@gmail.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='h-10 text-sm rounded-xl'
                    required
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Đường dẫn tải tài nguyên sẽ được gửi tự động về email này sau khi hoàn tất.
                  </p>
                </div>
              )}

              <div className='space-y-1.5'>
                <label className='text-xs font-medium text-foreground flex items-center justify-between'>
                  <span>Số điện thoại (Zalo)</span>
                  <span className='text-[10px] text-muted-foreground'>
                    {isPhysical ? 'Bắt buộc giao hàng' : 'Nhận thông báo'}
                  </span>
                </label>
                <Input
                  type='tel'
                  placeholder='VD: 0912345678'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className='h-10 text-sm rounded-xl'
                  required={isPhysical}
                />
              </div>

              {isPhysical && (
                <>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-medium text-foreground flex items-center justify-between'>
                      <span>Địa chỉ giao hàng chi tiết</span>
                      <span className='text-[10px] text-primary font-semibold'>Bắt buộc</span>
                    </label>
                    <Textarea
                      placeholder='Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố...'
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className='min-h-[72px] text-sm rounded-xl resize-none'
                      required
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-medium text-foreground'>
                      Ghi chú đơn hàng (Size / Màu / Yêu cầu)
                    </label>
                    <Input
                      placeholder='VD: Size L màu đen, kèm lời chúc...'
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className='h-10 text-sm rounded-xl'
                    />
                  </div>
                </>
              )}

              {/* Security Banner */}
              <div className='rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground flex items-center gap-2 border border-border/40'>
                <Icons.lock className='h-4 w-4 text-emerald-500 shrink-0' />
                <span>
                  Thanh toán an toàn 100% qua Napas 247 VietQR. Tiền về thẳng tài khoản Creator.
                </span>
              </div>
            </form>
          )}

          {/* STEP 2: VIETQR */}
          {step === 'VIETQR' && currentOrder && (
            <div className='space-y-4 animate-in fade-in-50 duration-300'>
              <div className='text-center space-y-1'>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium'>
                  <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
                  </span>
                  Chờ chuyển khoản VietQR ({timeFormatted})
                </div>
                <p className='text-xs text-muted-foreground'>
                  Mở ứng dụng ngân hàng bất kỳ để quét mã QR bên dưới
                </p>
              </div>

              {/* VietQR Dynamic Code Display */}
              <div className='relative mx-auto max-w-[240px] aspect-square rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-md flex items-center justify-center'>
                <img
                  src={qrImageUrl}
                  alt='VietQR Payment'
                  className='h-full w-full object-contain'
                />
              </div>

              {/* Bank Details Card with 1-Tap Copy */}
              <div className='rounded-2xl border border-border bg-muted/40 p-3.5 space-y-2.5 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Ngân hàng:</span>
                  <span className='font-semibold text-foreground'>{paymentConfig.bankName}</span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>Chủ tài khoản:</span>
                  <span className='font-semibold text-foreground tracking-wide'>
                    {paymentConfig.accountName}
                  </span>
                </div>

                {/* 3 Nút bấm tiện ích cho khách thao tác trên 1 điện thoại */}
                <div className='grid grid-cols-2 gap-2 pt-2 border-t border-border/60'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-8 text-[11px] gap-1.5 rounded-xl border-border hover:bg-muted font-medium'
                    onClick={() => {
                      const text = `${paymentConfig.bankName} - ${paymentConfig.accountNumber} (${paymentConfig.accountName})`;
                      handleCopy(text, 'STK');
                      toast.success(
                        `Đã sao chép: ${paymentConfig.bankName} - ${paymentConfig.accountNumber}`
                      );
                    }}
                  >
                    {copiedField === 'STK' ? (
                      <>
                        <Icons.check className='h-3.5 w-3.5 text-emerald-500' />
                        Đã chép STK
                      </>
                    ) : (
                      <>
                        <Icons.copy className='h-3.5 w-3.5' />
                        Chép STK & NH
                      </>
                    )}
                  </Button>

                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='h-8 text-[11px] gap-1.5 rounded-xl border-primary/40 text-primary hover:bg-primary/5 font-medium'
                    onClick={() => {
                      handleCopy(currentOrder.orderCode, 'CODE');
                      toast.success(`Đã sao chép mã: ${currentOrder.orderCode}`);
                    }}
                  >
                    {copiedField === 'CODE' ? (
                      <>
                        <Icons.check className='h-3.5 w-3.5 text-emerald-500' />
                        Đã chép mã
                      </>
                    ) : (
                      <>
                        <Icons.copy className='h-3.5 w-3.5' />
                        Chép nội dung CK
                      </>
                    )}
                  </Button>
                </div>

                <div className='flex items-center justify-between pt-1 border-t border-border/60 font-semibold'>
                  <span className='text-muted-foreground'>Số tiền chuẩn:</span>
                  <span className='text-base text-emerald-600 dark:text-emerald-400 font-bold'>
                    {formatPrice(currentOrder.amount)}
                  </span>
                </div>
              </div>

              {/* Dev Simulation & Manual Reconciliation Trigger */}
              <div className='rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-center space-y-2'>
                <p className='text-[11px] text-muted-foreground'>
                  Nếu bạn đã chuyển khoản xong nhưng chưa thấy tự động chuyển trạng thái, hãy bấm
                  nút đối soát bên dưới:
                </p>
                <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={handleSimulatePayment}
                  disabled={loading}
                  className='w-full text-xs font-semibold h-8.5 rounded-lg gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary cursor-pointer'
                >
                  <RefreshCw className='h-3.5 w-3.5 text-emerald-500' />
                  Tôi đã chuyển khoản (Đối soát ngay)
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'SUCCESS' && currentOrder && (
            <div className='text-center py-6 px-2 space-y-5 animate-in zoom-in-95 duration-400'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5 shadow-inner'>
                <Icons.check className='h-8 w-8 stroke-[3]' />
              </div>

              <div className='space-y-1.5'>
                <h3 className='text-xl font-bold text-foreground flex items-center justify-center gap-1.5'>
                  <span>{isFree ? 'Mở khóa thành công!' : 'Thanh toán thành công!'}</span>
                  <Sparkles className='w-5 h-5 text-amber-500' />
                </h3>
                <p className='text-xs text-muted-foreground'>
                  Mã đơn hàng:{' '}
                  <span className='font-mono font-semibold text-foreground'>
                    {currentOrder.orderCode}
                  </span>
                </p>
              </div>

              {/* Resource Download Button for Digital Products */}
              {(product.type === 'DIGITAL' || product.type === 'LEAD_MAGNET') && (
                <div className='space-y-2.5 rounded-2xl bg-muted/50 p-4 border border-border'>
                  <p className='text-xs font-medium text-foreground'>
                    Tài nguyên đã sẵn sàng để bạn tải xuống:
                  </p>
                  <a
                    href={currentOrder.downloadUrl || product.fileUrl || '#'}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]'
                  >
                    <Icons.download className='h-4 w-4' />
                    Tải tài nguyên ngay ({product.fileName || 'Tài liệu'})
                  </a>
                  <p className='text-[11px] text-muted-foreground'>
                    Chúng tôi cũng đã gửi một bản sao đến hộp thư{' '}
                    <strong className='text-foreground'>{currentOrder.customerEmail}</strong>.
                  </p>
                </div>
              )}

              {/* Physical Order Notice */}
              {product.type === 'PHYSICAL' && (
                <div className='rounded-2xl bg-muted/50 p-4 border border-border text-left space-y-2 text-xs'>
                  <div className='font-semibold text-foreground flex items-center gap-1.5'>
                    <Icons.receipt className='h-4 w-4 text-primary' />
                    Thông tin gửi hàng:
                  </div>
                  <div className='text-muted-foreground space-y-1 text-[12px]'>
                    <p>
                      • Người nhận:{' '}
                      <strong className='text-foreground'>{currentOrder.customerName}</strong> (
                      {currentOrder.customerPhone})
                    </p>
                    <p>
                      • Địa chỉ:{' '}
                      <strong className='text-foreground'>{currentOrder.shippingAddress}</strong>
                    </p>
                    <p>
                      • Trạng thái:{' '}
                      <Badge variant='outline' className='ml-1 text-[10px]'>
                        Chờ đóng gói
                      </Badge>
                    </p>
                  </div>
                  <p className='text-[11px] text-muted-foreground pt-1'>
                    Creator sẽ tiến hành đóng gói và giao đến bưu cục trong 24 giờ.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DrawerFooter className='border-t border-border/60 pt-3 pb-5 px-5'>
          {step === 'FORM' && (
            <div className='flex gap-2.5'>
              <Button
                variant='outline'
                className='flex-1 h-11 rounded-xl text-sm'
                onClick={onClose}
              >
                Hủy
              </Button>
              <Button
                type='submit'
                form='checkout-form'
                disabled={loading}
                className='flex-2 h-11 rounded-xl text-sm font-semibold gap-1.5 shadow-sm'
              >
                {loading ? (
                  <>
                    <Icons.toastLoading className='h-4 w-4 animate-spin' />
                    Đang xử lý...
                  </>
                ) : isFree ? (
                  <>
                    <Icons.gift className='h-4 w-4' />
                    Nhận tài liệu ngay (0đ)
                  </>
                ) : (
                  <>
                    <Icons.qrcode className='h-4 w-4' />
                    Tiếp tục quét VietQR ({formatPrice(product.price)})
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'VIETQR' && (
            <div className='flex gap-2.5'>
              <Button
                variant='outline'
                className='flex-1 h-11 rounded-xl text-xs font-medium'
                onClick={() => setStep('FORM')}
              >
                Quay lại
              </Button>
              <Button
                variant='default'
                className='flex-2 h-11 rounded-xl text-xs font-semibold gap-1.5 shadow-sm'
                onClick={() => {
                  toast.info('Hệ thống đang kiểm tra tự động biến động số dư...');
                }}
              >
                <Icons.refresh className='h-3.5 w-3.5 animate-spin' />
                Tôi đã chuyển khoản
              </Button>
            </div>
          )}

          {step === 'SUCCESS' && (
            <Button
              className='w-full h-11 rounded-xl text-sm font-semibold shadow-sm'
              onClick={onClose}
            >
              Hoàn tất & Đóng
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
