'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product } from '@/constants/mock-tiemnho';
import { Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// =========================================================================
// ZOD SCHEMA CHO BƯỚC 1 CHECKOUT
// =========================================================================
export const createCheckoutStep1Schema = (isPhysical: boolean) =>
  z.object({
    email: isPhysical
      ? z.string().trim().email('Email không đúng định dạng').optional().or(z.literal(''))
      : z
          .string()
          .trim()
          .min(1, 'Vui lòng nhập email nhận tài liệu')
          .email('Email không đúng định dạng (VD: vidu@gmail.com)'),
    fullName: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập họ và tên của bạn')
      .min(2, 'Họ và tên cần tối thiểu 2 ký tự'),
    phone: isPhysical
      ? z
          .string()
          .trim()
          .min(1, 'Vui lòng nhập số điện thoại nhận hàng')
          .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ (VD: 0912 345 678)')
      : z
          .string()
          .trim()
          .optional()
          .refine(
            (val) => !val || /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(val.replace(/\s+/g, '')),
            'Số điện thoại không hợp lệ (VD: 0912 345 678)'
          )
          .or(z.literal('')),
    shippingAddress: isPhysical
      ? z
          .string()
          .trim()
          .min(6, 'Vui lòng nhập địa chỉ nhận hàng chi tiết (Số nhà, tên đường, phường/xã...)')
      : z.string().optional().or(z.literal('')),
    shippingNote: z.string().optional().or(z.literal(''))
  });

export type CheckoutStep1Values = z.infer<ReturnType<typeof createCheckoutStep1Schema>>;

export interface CheckoutDrawerStep1Props {
  product: Product;
  onSubmit: (values: CheckoutStep1Values) => void | Promise<void>;
  loading?: boolean;
  initialValues?: Partial<CheckoutStep1Values>;
  className?: string;
  submitButtonText?: string;
}

export function CheckoutDrawerStep1({
  product,
  onSubmit,
  loading = false,
  initialValues,
  className,
  submitButtonText
}: CheckoutDrawerStep1Props) {
  const isPhysical = product.type === 'PHYSICAL';
  const isFree = product.price === 0 || product.type === 'LEAD_MAGNET';

  const schema = React.useMemo(() => createCheckoutStep1Schema(isPhysical), [isPhysical]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CheckoutStep1Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initialValues?.email || '',
      fullName: initialValues?.fullName || '',
      phone: initialValues?.phone || '',
      shippingAddress: initialValues?.shippingAddress || '',
      shippingNote: initialValues?.shippingNote || ''
    }
  });

  const formatPrice = (price: number) => {
    if (price === 0) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const ctaLeftText = React.useMemo(() => {
    if (product.type === 'PHYSICAL' && product.stock !== undefined && product.stock <= 0) {
      return 'Hết hàng';
    }
    if (submitButtonText && submitButtonText.trim()) {
      return submitButtonText.trim();
    }
    if (product.buttonText && product.buttonText.trim()) {
      return product.buttonText.trim();
    }
    if (isFree) return 'Nhận miễn phí';
    if (isPhysical) return 'Đặt hàng ngay';
    return 'Tiếp tục thanh toán';
  }, [submitButtonText, product.buttonText, product.type, product.stock, isFree, isPhysical]);

  return (
    <div className={cn('w-full text-neutral-900 font-sans space-y-4', className)}>
      {/* 1. Header & Tóm tắt nhanh sản phẩm ở đầu form */}
      {/* 2. Form nhập liệu: noValidate chặn tooltip mặc định của trình duyệt */}
      <form noValidate onSubmit={handleSubmit(onSubmit)} className='space-y-3.5 text-left'>
        {/* ========================================================= */}
        {/* THỨ TỰ SẢN PHẨM SỐ (DIGITAL / LEAD MAGNET)                */}
        {/* ========================================================= */}
        {!isPhysical ? (
          <>
            {/* Ô 1: Email nhận tài liệu * (Ưu tiên số 1) */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-email'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between'
              >
                <span>
                  Email nhận tài liệu <strong className='text-rose-500'>*</strong>
                </span>
              </label>
              <input
                id='step1-email'
                type='email'
                inputMode='email'
                autoComplete='email'
                {...register('email')}
                placeholder='vidu@gmail.com'
                className={cn(
                  'w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 text-sm font-medium text-neutral-900 dark:text-white',
                  'placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal',
                  'focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors',
                  errors.email && 'border-rose-400 focus:border-rose-500'
                )}
              />
              {errors.email && (
                <p className='text-xs text-rose-500 mt-1 font-medium'>{errors.email.message}</p>
              )}
            </div>

            {/* Ô 2: Họ và tên * */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-fullname'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between'
              >
                <span>
                  Họ và tên <strong className='text-rose-500'>*</strong>
                </span>
              </label>
              <input
                id='step1-fullname'
                type='text'
                autoComplete='name'
                {...register('fullName')}
                placeholder='Nguyễn Văn A'
                className={cn(
                  'w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 text-sm font-medium text-neutral-900 dark:text-white',
                  'placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal',
                  'focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors',
                  errors.fullName && 'border-rose-400 focus:border-rose-500'
                )}
              />
              {errors.fullName && (
                <p className='text-xs text-rose-500 mt-1 font-medium'>{errors.fullName.message}</p>
              )}
            </div>

            {/* Ô 3: Số điện thoại (Tùy chọn) */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-phone'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between'
              >
                <span>Số điện thoại</span>
                <span className='text-[11px] text-neutral-400 font-normal'>Tùy chọn</span>
              </label>
              <input
                id='step1-phone'
                type='tel'
                inputMode='numeric'
                autoComplete='tel'
                {...register('phone')}
                placeholder='0912 345 678'
                className={cn(
                  'w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 text-sm font-medium text-neutral-900 dark:text-white',
                  'placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal',
                  'focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors',
                  errors.phone && 'border-rose-400 focus:border-rose-500'
                )}
              />
              {errors.phone && (
                <p className='text-xs text-rose-500 mt-1 font-medium'>{errors.phone.message}</p>
              )}
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* THỨ TỰ SẢN PHẨM VẬT LÝ / ĐẶT TRƯỚC (PHYSICAL)             */
          /* ========================================================= */
          <>
            {/* Họ và tên * */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-fullname-phys'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between'
              >
                <span>
                  Họ và tên người nhận <strong className='text-rose-500'>*</strong>
                </span>
              </label>
              <input
                id='step1-fullname-phys'
                type='text'
                autoComplete='name'
                {...register('fullName')}
                placeholder='Nguyễn Văn A'
                className={cn(
                  'w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 text-sm font-medium text-neutral-900 dark:text-white',
                  'placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal',
                  'focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors',
                  errors.fullName && 'border-rose-400 focus:border-rose-500'
                )}
              />
              {errors.fullName && (
                <p className='text-xs text-rose-500 mt-1 font-medium'>{errors.fullName.message}</p>
              )}
            </div>

            {/* Số điện thoại nhận hàng * */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-phone-phys'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between'
              >
                <span>
                  Số điện thoại nhận hàng <strong className='text-rose-500'>*</strong>
                </span>
                <span className='text-[11px] text-neutral-400 font-normal'>
                  Bưu tá gọi khi giao
                </span>
              </label>
              <input
                id='step1-phone-phys'
                type='tel'
                inputMode='numeric'
                autoComplete='tel'
                {...register('phone')}
                placeholder='0912 345 678'
                className={cn(
                  'w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 text-sm font-medium text-neutral-900 dark:text-white',
                  'placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal',
                  'focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors',
                  errors.phone && 'border-rose-400 focus:border-rose-500'
                )}
              />
              {errors.phone && (
                <p className='text-xs text-rose-500 mt-1 font-medium'>{errors.phone.message}</p>
              )}
            </div>

            {/* Địa chỉ giao hàng chi tiết * */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-address'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between'
              >
                <span>
                  Địa chỉ giao hàng chi tiết <strong className='text-rose-500'>*</strong>
                </span>
              </label>
              <textarea
                id='step1-address'
                rows={2}
                {...register('shippingAddress')}
                placeholder='Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP'
                className={cn(
                  'w-full min-h-[64px] rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 text-sm font-medium text-neutral-900 dark:text-white resize-none',
                  'placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal',
                  'focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors',
                  errors.shippingAddress && 'border-rose-400 focus:border-rose-500'
                )}
              />
              {errors.shippingAddress && (
                <p className='text-xs text-rose-500 mt-1 font-medium'>
                  {errors.shippingAddress.message}
                </p>
              )}
            </div>

            {/* Email (Tùy chọn) */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-email-phys'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between'
              >
                <span>Email nhận mã vận đơn</span>
                <span className='text-[11px] text-neutral-400 font-normal'>Tùy chọn</span>
              </label>
              <input
                id='step1-email-phys'
                type='email'
                inputMode='email'
                autoComplete='email'
                {...register('email')}
                placeholder='vidu@gmail.com'
                className={cn(
                  'w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 text-sm font-medium text-neutral-900 dark:text-white',
                  'placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal',
                  'focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors',
                  errors.email && 'border-rose-400 focus:border-rose-500'
                )}
              />
              {errors.email && (
                <p className='text-xs text-rose-500 mt-1 font-medium'>{errors.email.message}</p>
              )}
            </div>

            {/* Ghi chú */}
            <div className='space-y-1'>
              <label
                htmlFor='step1-note'
                className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'
              >
                Ghi chú cho người bán
              </label>
              <input
                id='step1-note'
                type='text'
                {...register('shippingNote')}
                placeholder='VD: Size L, màu trắng, giao giờ hành chính...'
                className='w-full h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-500 placeholder:font-normal focus:border-neutral-900 dark:focus:border-neutral-400 focus:outline-none focus:ring-0 transition-colors'
              />
            </div>
          </>
        )}

        {/* 3. Nút CTA Chính (Primary Action Button) không bị cắt chữ */}
        <div className='pt-2'>
          <button
            type='submit'
            disabled={loading}
            className={cn(
              'w-full h-12 bg-[#FE2C55] hover:bg-[#E0264B] active:scale-[0.99] text-white rounded-xl font-bold text-sm flex items-center justify-between px-5 shadow-sm transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed',
              loading && 'justify-center'
            )}
          >
            {loading ? (
              <div className='flex items-center gap-2'>
                <Loader2 className='w-4 h-4 animate-spin shrink-0' />
                <span>{isFree ? 'Đang kích hoạt...' : 'Đang tạo mã VietQR...'}</span>
              </div>
            ) : isFree ? (
              <>
                <span className='line-clamp-1 pr-2 text-left'>{ctaLeftText}</span>
                <span className='font-semibold shrink-0'>Miễn phí →</span>
              </>
            ) : (
              <>
                <span className='line-clamp-1 pr-2 text-left'>{ctaLeftText}</span>
                <span className='font-bold tabular-nums flex items-center gap-1.5 shrink-0'>
                  {formatPrice(product.price)}
                  <span aria-hidden='true'>→</span>
                </span>
              </>
            )}
          </button>
        </div>

        {/* 4. Huy hiệu bảo mật thanh toán */}
        <div className='flex items-center justify-center gap-1.5 pt-1 text-[11px] text-neutral-400 dark:text-neutral-500'>
          <ShieldCheck className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
          <span>Bảo mật 100% qua chuẩn VietQR Napas247</span>
        </div>
      </form>
    </div>
  );
}
