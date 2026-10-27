'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Product,
  CreatorProfile,
  PaymentConfig,
  defaultCreatorProfile,
  defaultPaymentConfig
} from '@/constants/mock-tiemnho';
import {
  createProduct,
  updateProduct,
  getProfile,
  getPaymentConfig,
  getProducts
} from '@/features/tiemnho/api/service';
import { PhoneMockup } from '@/features/tiemnho/components/mobile-preview/phone-mockup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { uploadClientFile } from '@/lib/upload-client';

// Schema xác thực cho Sản phẩm Hàng đặt trước / Thủ công (PHYSICAL)
export const physicalProductSchema = z.object({
  // 1. Ảnh thumbnail (Tùy chọn: 1:1 hoặc 16:9)
  thumbnail: z.string().optional(),

  // 2. Tên món đồ (Bắt buộc)
  title: z.string().min(1, 'Vui lòng nhập tên món đồ').max(100, 'Tên món đồ tối đa 100 ký tự'),

  // 3. Giá bán VNĐ (Bắt buộc)
  price: z.number().min(1000, 'Giá bán tối thiểu 1.000 VNĐ'),
  hasDiscount: z.boolean(),
  discountPrice: z.number().min(0, 'Giá niêm yết không được âm').optional(),

  // 4. Mô tả sản phẩm (Tùy chọn: tối đa 200 ký tự)
  description: z.string().max(200, 'Mô tả tối đa 200 ký tự').optional(),

  // 5. Số lượng giới hạn (Tùy chọn: null hoặc number >= 0)
  stock: z.number().min(0, 'Số lượng không được âm').optional().nullable(),

  // 6. Dòng thông báo thời gian làm hàng (Tùy chọn)
  estimatedFulfillment: z.string().max(100, 'Tối đa 100 ký tự').optional(),

  // 7. Gửi tin Zalo xác nhận đơn sau khi quét VietQR
  enableZaloConfirm: z.boolean(),

  // Trạng thái xuất bản
  isPublished: z.boolean()
});

export type PhysicalProductFormValues = z.infer<typeof physicalProductSchema>;

interface PhysicalProductFormProps {
  initialProduct?: Product | null;
  onCancel?: () => void;
  onSuccess?: (product: Product) => void;
}

export function PhysicalProductForm({
  initialProduct,
  onCancel,
  onSuccess
}: PhysicalProductFormProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<CreatorProfile>(defaultCreatorProfile);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig>(defaultPaymentConfig);
  const [existingProducts, setExistingProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = React.useState(false);

  const thumbInputRef = React.useRef<HTMLInputElement>(null);

  const isEditMode = !!initialProduct;

  const form = useForm<PhysicalProductFormValues>({
    resolver: zodResolver(physicalProductSchema),
    defaultValues: {
      thumbnail: initialProduct?.coverImage || '',
      title: initialProduct?.title || '',
      price: initialProduct?.price ?? 250000,
      hasDiscount: !!initialProduct?.originalPrice,
      discountPrice: initialProduct?.originalPrice ?? 350000,
      description: initialProduct?.description || '',
      stock: initialProduct?.stock !== undefined ? initialProduct.stock : null,
      estimatedFulfillment: initialProduct?.estimatedFulfillment || '',
      enableZaloConfirm: initialProduct?.enableZaloConfirm ?? true,
      isPublished: initialProduct?.isPublished ?? true
    }
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = form;

  const watched = watch();

  // Load profile và sản phẩm cho Live Mockup
  React.useEffect(() => {
    async function loadData() {
      try {
        const [prof, pay, prods] = await Promise.all([
          getProfile().catch(() => defaultCreatorProfile),
          getPaymentConfig().catch(() => defaultPaymentConfig),
          getProducts().catch(() => [])
        ]);
        setProfile(prof);
        setPaymentConfig(pay);
        setExistingProducts(prods);
      } catch {
        // Fallback
      }
    }
    loadData();
  }, []);

  // Xử lý upload thumbnail
  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingThumb(true);
      try {
        const res = await uploadClientFile(file, { folder: 'products/physical' });
        setValue('thumbnail', res.url);
        toast.success(
          `Đã tải ảnh thumbnail thành công (${res.storage === 'r2' ? 'Cloudflare R2' : 'Lưu trữ local'})!`
        );
      } catch (err: any) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setValue('thumbnail', reader.result as string);
        };
        reader.readAsDataURL(file);
        toast.warning(err.message || 'Lỗi tải ảnh lên máy chủ, đã dùng bản xem trước tạm.');
      } finally {
        setIsUploadingThumb(false);
      }
    }
  };

  const onSubmit = async (values: PhysicalProductFormValues) => {
    setLoading(true);
    try {
      const originalPrice = values.hasDiscount ? values.discountPrice : undefined;
      const isOutOfStock = values.stock !== null && values.stock !== undefined && values.stock <= 0;

      const payload = {
        type: 'PHYSICAL' as const,
        title: values.title.trim(),
        description: (values.description || '').trim(),
        price: values.price,
        originalPrice: originalPrice,
        coverImage:
          values.thumbnail ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        stock: values.stock === null ? undefined : values.stock,
        estimatedFulfillment: values.estimatedFulfillment?.trim() || undefined,
        enableZaloConfirm: values.enableZaloConfirm,
        buttonText: isOutOfStock ? 'Hết hàng' : 'Đặt trước',
        isPublished: values.isPublished,
        isFeatured: false
      };

      let savedProduct: Product;
      if (isEditMode && initialProduct) {
        savedProduct = await updateProduct(initialProduct.id, payload);
        toast.success('Đã cập nhật sản phẩm Hàng đặt trước / Thủ công thành công!');
      } else {
        savedProduct = await createProduct(payload);
        toast.success('Đã tạo món đồ Hàng đặt trước / Thủ công thành công!');
      }

      if (onSuccess) {
        onSuccess(savedProduct);
      } else {
        router.push('/dashboard/products');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Live preview mockup
  const previewProduct: Product = React.useMemo(() => {
    const isOutOfStock =
      watched.stock !== null && watched.stock !== undefined && watched.stock <= 0;
    return {
      id: initialProduct?.id || 'preview-physical-draft',
      creatorId: profile.id,
      type: 'PHYSICAL',
      title: watched.title.trim() || 'Áo thun Merch giới hạn / Sách có chữ ký',
      description: watched.description?.trim() || 'Mô tả sản phẩm thủ công, chế tác theo đơn.',
      price: watched.price || 0,
      originalPrice: watched.hasDiscount ? watched.discountPrice : undefined,
      coverImage:
        watched.thumbnail ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      stock: watched.stock ?? undefined,
      estimatedFulfillment: watched.estimatedFulfillment || 'Giao sau 3–5 ngày làm việc',
      enableZaloConfirm: watched.enableZaloConfirm,
      buttonText: isOutOfStock ? 'Hết hàng' : 'Đặt trước',
      isPublished: watched.isPublished,
      isFeatured: false,
      displayOrder: 0,
      soldCount: initialProduct?.soldCount || 18,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [watched, profile.id, initialProduct]);

  const previewProductsList = React.useMemo(() => {
    const listWithoutCurrent = existingProducts.filter(
      (p) => p.id !== (initialProduct?.id || 'preview-physical-draft')
    );
    return [previewProduct, ...listWithoutCurrent];
  }, [previewProduct, existingProducts, initialProduct]);

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-20'>
      {/* Header Top Bar */}
      <div className='flex items-center justify-between pb-4 border-b border-border/60'>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleBack}
            className='h-9 w-9 p-0 rounded-xl cursor-pointer hover:bg-muted'
          >
            <Icons.arrowLeft className='h-4 w-4 text-foreground' />
          </Button>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-lg sm:text-xl font-bold tracking-tight text-foreground'>
                {isEditMode
                  ? 'Chỉnh sửa Hàng đặt trước / Thủ công'
                  : 'Thêm Hàng đặt trước / Thủ công'}
              </h1>
              <Badge className='text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20'>
                Pre-order / Handmade
              </Badge>
              <button
                type='button'
                onClick={() =>
                  toast.info(
                    'Sản phẩm Pre-order/Thủ công thu thập Họ tên, SĐT, Địa chỉ chi tiết và ghi chú tùy biến (size, màu, khắc tên).'
                  )
                }
                className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold cursor-pointer transition-colors'
              >
                <Icons.info className='w-3 h-3' />
                <span>Cách hoạt động</span>
              </button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Áo thun Merch giới hạn, sách in có chữ ký, đồ lưu niệm thủ công chế tác theo đơn đặt.
            </p>
          </div>
        </div>

        {/* Bật/Tắt Hiển thị */}
        <div className='flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60'>
          <span className='text-xs font-medium text-muted-foreground'>Trạng thái:</span>
          <Controller
            control={control}
            name='isPublished'
            render={({ field }) => (
              <div className='flex items-center gap-1.5'>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className='data-[state=checked]:bg-[#FE2C55]'
                />
                <span className='text-xs font-bold text-foreground'>
                  {field.value ? 'Đang mở nhận đơn' : 'Tạm ẩn'}
                </span>
              </div>
            )}
          />
        </div>
      </div>

      {/* Main 2-Column Grid (60% Form / 40% Live Preview) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: FORM 5 BƯỚC ĐỒNG BỘ GIAO DIỆN CHUẨN             */}
        {/* ========================================================= */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-7'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-7'>
            {/* ----------------------------------------------------- */}
            {/* 1. Thiết lập ảnh đại diện (Thumbnail)                */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  1
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Ảnh thumbnail món đồ
                </h2>
              </div>

              <div className='p-6 rounded-2xl border-2 border-dashed border-border/80 bg-card hover:bg-muted/10 transition-colors flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative group'>
                    <div className='h-20 w-20 rounded-2xl overflow-hidden bg-muted border border-border/60 flex items-center justify-center shadow-xs'>
                      {watched.thumbnail ? (
                        <img
                          src={watched.thumbnail}
                          alt='Thumbnail'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Icons.package className='w-8 h-8 text-emerald-500' />
                      )}
                    </div>
                    <button
                      type='button'
                      onClick={() => thumbInputRef.current?.click()}
                      className='absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer'
                      title='Thay đổi ảnh thumbnail'
                    >
                      <Icons.edit className='w-3 h-3' />
                    </button>
                  </div>

                  <div>
                    <div className='text-xs font-bold text-foreground'>Ảnh thumbnail món đồ</div>
                    <div className='text-[11px] text-muted-foreground mt-0.5 font-mono'>
                      Tỉ lệ khuyến nghị: 1:1 hoặc 16:9
                    </div>
                  </div>
                </div>

                <div>
                  <input
                    type='file'
                    ref={thumbInputRef}
                    onChange={handleUploadThumbnail}
                    accept='image/*'
                    className='hidden'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={isUploadingThumb}
                    className='h-9 px-4 text-xs font-semibold rounded-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary cursor-pointer'
                  >
                    {isUploadingThumb ? 'Đang tải lên...' : 'Chọn ảnh'}
                  </Button>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 2. Thông tin món đồ (Tiêu đề & Mô tả ngắn)           */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  2
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Thông tin món đồ
                </h2>
              </div>

              <div className='space-y-3.5 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                {/* Tiêu đề món đồ */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>
                      Tên món đồ <span className='text-destructive'>*</span>
                    </label>
                    <span className='text-[11px] text-muted-foreground font-mono'>
                      {watched.title?.length || 0}/100 ký tự
                    </span>
                  </div>
                  <Input
                    {...register('title')}
                    maxLength={100}
                    placeholder='VD: Áo thun Merch giới hạn, Sách in có chữ ký'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.title && (
                    <p className='text-xs text-destructive font-medium'>{errors.title.message}</p>
                  )}
                </div>

                {/* Mô tả ngắn */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>
                      Mô tả sản phẩm (Tùy chọn)
                    </label>
                    <span className='text-[11px] text-muted-foreground font-mono'>
                      {watched.description?.length || 0}/200 ký tự
                    </span>
                  </div>
                  <Textarea
                    {...register('description')}
                    rows={3}
                    maxLength={200}
                    placeholder='2–3 dòng mô tả sản phẩm (chất liệu, kích cỡ, ý nghĩa đặc biệt của món đồ...)'
                    className='text-xs rounded-xl resize-none'
                  />
                  {errors.description && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 3. Thiết lập giá bán & Khuyến mãi                     */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  3
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Thiết lập giá bán
                </h2>
              </div>

              <div className='bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {/* Giá bán thực tế */}
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                      <span>
                        Giá bán VNĐ <span className='text-destructive'>*</span>
                      </span>
                      <span className='text-[10px] text-muted-foreground'>
                        {watched.price > 0 &&
                          `${new Intl.NumberFormat('vi-VN').format(watched.price)} đ`}
                      </span>
                    </label>
                    <div className='relative'>
                      <Input
                        type='number'
                        value={watched.price === 0 ? '' : watched.price}
                        onChange={(e) =>
                          setValue('price', e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        placeholder='VD: 250000'
                        className='h-10 text-xs rounded-xl font-mono pr-12'
                      />
                      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground'>
                        VNĐ
                      </span>
                    </div>
                    {errors.price && (
                      <p className='text-xs text-destructive font-medium'>{errors.price.message}</p>
                    )}
                  </div>

                  {/* Giá gốc niêm yết (Gạch đi) */}
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between text-xs'>
                      <label className='font-semibold text-foreground'>
                        Giá gốc niêm yết (Gạch đi)
                      </label>
                      <Controller
                        control={control}
                        name='hasDiscount'
                        render={({ field }) => (
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className='data-[state=checked]:bg-[#FE2C55]'
                          />
                        )}
                      />
                    </div>
                    <div className='relative'>
                      <Input
                        type='number'
                        disabled={!watched.hasDiscount}
                        value={watched.discountPrice ?? ''}
                        onChange={(e) =>
                          setValue(
                            'discountPrice',
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        placeholder='VD: 350000'
                        className={`h-10 text-xs rounded-xl font-mono pr-12 ${
                          !watched.hasDiscount ? 'bg-muted/70 cursor-not-allowed opacity-60' : ''
                        }`}
                      />
                      <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground'>
                        VNĐ
                      </span>
                    </div>
                  </div>
                </div>

                <div className='rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-center gap-2 border border-border/50'>
                  <Icons.info className='h-4 w-4 text-primary shrink-0' />
                  <span>
                    Khuyến khích cộng sẵn phí ship vào giá bán để freeship toàn quốc, giúp tăng tỷ
                    lệ chốt đơn hàng đặt trước.
                  </span>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 4. Vận hành & Quản lý nhận đơn                        */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  4
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Vận hành & Nhận đơn
                </h2>
              </div>

              <div className='bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  {/* Số lượng giới hạn (stock) */}
                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                      <span>Số lượng giới hạn (stock)</span>
                      <span className='text-[10px] text-muted-foreground'>Tùy chọn</span>
                    </label>
                    <Input
                      type='number'
                      value={watched.stock ?? ''}
                      onChange={(e) =>
                        setValue('stock', e.target.value === '' ? null : Number(e.target.value))
                      }
                      placeholder='VD: 30 (để trống nếu không giới hạn)'
                      className='h-10 text-xs rounded-xl font-mono'
                    />
                    <p className='text-[10px] text-muted-foreground'>
                      Nhận tối đa số đơn này, khi về 0 tự đổi nhãn nút mua thành &quot;Hết
                      hàng&quot;.
                    </p>
                  </div>

                  {/* Thời gian làm hàng (estimatedFulfillment) */}
                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                      <span>Thời gian làm hàng</span>
                      <span className='text-[10px] text-muted-foreground'>Tùy chọn</span>
                    </label>
                    <Input
                      {...register('estimatedFulfillment')}
                      placeholder='Giao sau 3–5 ngày làm việc'
                      className='h-10 text-xs rounded-xl'
                    />
                    <p className='text-[10px] text-muted-foreground'>
                      Thông báo hiển thị trên Drawer đặt hàng giúp khách an tâm chờ đợi.
                    </p>
                  </div>
                </div>

                {/* Gửi tin nhắn Zalo xác nhận đơn */}
                <div className='flex items-center justify-between rounded-xl border border-border p-3.5 bg-muted/20'>
                  <div className='space-y-0.5 pr-2'>
                    <div className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                      <Icons.chat className='w-4 h-4 text-primary' />
                      Gửi tin Zalo xác nhận đơn sau khi quét VietQR
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      Hệ thống tự động kích hoạt thông báo Zalo ZNS kèm mã đơn tới số điện thoại
                      người mua.
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name='enableZaloConfirm'
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='data-[state=checked]:bg-[#FE2C55]'
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Nút hành động Lưu & Đưa lên Tiệm */}
            <div className='flex items-center justify-end gap-3 pt-4 border-t border-border/60'>
              <Button
                type='button'
                variant='outline'
                onClick={handleBack}
                className='h-10 px-5 text-xs font-semibold rounded-xl cursor-pointer hover:bg-muted'
              >
                Hủy
              </Button>
              <Button
                type='submit'
                disabled={loading}
                className='h-10 px-7 text-xs font-bold rounded-xl gap-2 shadow-md bg-[#FE2C55] hover:bg-[#ef244b] text-white cursor-pointer active:scale-[0.99] transition-all'
              >
                {loading ? (
                  <>
                    <Icons.spinner className='h-4 w-4 animate-spin' />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Icons.sparkles className='h-4 w-4' />
                    {isEditMode ? 'Cập nhật món đồ' : 'Lưu & Đưa lên Tiệm'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: XEM TRƯỚC ĐIỆN THOẠI (LIVE PREVIEW)             */}
        {/* ========================================================= */}
        <div className='lg:col-span-5 xl:col-span-5 hidden lg:block sticky top-20'>
          <div className='space-y-3 text-center'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-semibold text-muted-foreground'>
              <Icons.smartphone className='w-3.5 h-3.5 text-[#FE2C55]' />
              <span>Xem trước điện thoại (Cập nhật trực tiếp)</span>
            </div>

            <div className='relative'>
              <div className='absolute -inset-1 rounded-[60px] bg-gradient-to-tr from-[#FE2C55]/20 via-primary/10 to-blue-500/20 blur-2xl opacity-50' />
              <PhoneMockup
                profile={profile}
                products={previewProductsList}
                paymentConfig={paymentConfig}
                className='scale-[0.92] origin-top shadow-2xl'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
