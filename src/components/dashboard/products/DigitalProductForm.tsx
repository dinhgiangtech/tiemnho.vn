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

// Schema xác thực dữ liệu Tiếng Việt
export const digitalProductSchema = z.object({
  // 1. Thiết lập ảnh Thumbnail
  thumbnail: z.string().min(1, 'Vui lòng chọn hoặc tải ảnh đại diện'),

  // 2. Tùy chỉnh hiển thị (Preview)
  title: z.string().min(1, 'Tiêu đề không được để trống').max(50, 'Tiêu đề tối đa 50 ký tự'),
  subtitle: z.string().max(100, 'Mô tả phụ tối đa 100 ký tự').optional(),
  buttonText: z
    .string()
    .min(1, 'Chữ hiển thị trên nút không được để trống')
    .max(30, 'Tối đa 30 ký tự'),

  // 3. Chi tiết sản phẩm
  detailTitle: z.string().min(1, 'Tiêu đề trang chi tiết là bắt buộc'),
  descriptionBody: z.string().min(1, 'Nội dung mô tả chi tiết là bắt buộc'),
  bottomTitle: z.string().min(1, 'Tiêu đề kết thúc (Bottom title) là bắt buộc'),
  ctaButton: z.string().min(1, 'Chữ trên nút kêu gọi hành động (CTA) là bắt buộc'),

  // 4. Đính kèm sản phẩm số
  deliveryType: z.enum(['UPLOAD_FILE', 'REDIRECT_LINK']),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.string().optional(),
  redirectUrl: z.string().optional(),

  // 5. Ảnh bìa nổi bật (Feature Image)
  featureImage: z.string().optional(),

  // 6. Thiết lập giá bán
  price: z.number().min(0, 'Giá bán không được âm'),
  hasDiscount: z.boolean(),
  discountPrice: z.number().min(0, 'Giá niêm yết không được âm').optional(),

  // Trạng thái xuất bản
  isPublished: z.boolean()
});

export type DigitalProductFormValues = z.infer<typeof digitalProductSchema>;

interface DigitalProductFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function DigitalProductForm({
  initialProduct,
  onSuccess,
  onCancel
}: DigitalProductFormProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<CreatorProfile>(defaultCreatorProfile);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig>(defaultPaymentConfig);
  const [existingProducts, setExistingProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = React.useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);

  const thumbInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isEditMode = !!initialProduct;

  const form = useForm<DigitalProductFormValues>({
    resolver: zodResolver(digitalProductSchema),
    defaultValues: {
      thumbnail:
        initialProduct?.coverImage ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&h=400&q=80',
      title: initialProduct?.title || 'Sở hữu ngay [Bộ Template / Ebook / Khóa học]!',
      subtitle: initialProduct?.subtitle || 'Chúng tôi sẽ gửi tài liệu này thẳng vào Email của bạn',
      buttonText: initialProduct?.buttonText || 'Nhận tài liệu ngay',

      detailTitle:
        initialProduct?.detailTitle ||
        initialProduct?.title ||
        'Sở hữu ngay [Bộ Template / Ebook / Khóa học]!',
      descriptionBody:
        initialProduct?.description ||
        `Tài liệu [Template/Ebook/Khóa học] này sẽ giúp bạn đạt được mọi mục tiêu mong muốn.\n\nTài liệu này đặc biệt dành cho bạn nếu bạn muốn:\n• Hiện thực hóa ước mơ phát triển bản thân\n• Tối ưu năng suất công việc mỗi ngày\n• Tự do tài chính & Tận hưởng cuộc sống`,
      bottomTitle: initialProduct?.bottomTitle || 'Bắt đầu nâng cấp kỹ năng của bạn ngay hôm nay',
      ctaButton: initialProduct?.ctaButton || 'MUA NGAY',

      deliveryType: initialProduct?.deliveryType || 'UPLOAD_FILE',
      fileUrl: initialProduct?.fileUrl || '',
      fileName: initialProduct?.fileName || 'Template-Notion-2025.pdf',
      fileSize: initialProduct?.fileSize || '14.8 MB',
      redirectUrl: initialProduct?.fileUrl || '',

      featureImage:
        initialProduct?.bannerImage ||
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&h=675&q=80',

      price: initialProduct?.price ?? 149000,
      hasDiscount: !!initialProduct?.originalPrice,
      discountPrice: initialProduct?.originalPrice ?? 299000,

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
        // fallback
      }
    }
    loadData();
  }, []);

  // Xử lý upload thumbnail
  const handleUploadThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingThumb(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('thumbnail', reader.result as string);
        setIsUploadingThumb(false);
        toast.success('Đã tải ảnh đại diện thành công!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý upload ảnh bìa
  const handleUploadBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBanner(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('featureImage', reader.result as string);
        setIsUploadingBanner(false);
        toast.success('Đã tải ảnh bìa nổi bật thành công!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý upload file đính kèm
  const handleUploadDigitalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setValue('fileName', file.name);
      setValue('fileSize', `${sizeMb} MB`);
      setValue('fileUrl', `https://storage.tiemnho.vn/r2/files/${file.name}`);
      toast.success(`Đã đính kèm file: ${file.name} (${sizeMb} MB)`);
    }
  };

  const onSubmit = async (values: DigitalProductFormValues) => {
    setLoading(true);
    try {
      const finalFile =
        values.deliveryType === 'REDIRECT_LINK' ? values.redirectUrl?.trim() : values.fileUrl;
      const originalPrice = values.hasDiscount ? values.discountPrice : undefined;

      const payload = {
        type: 'DIGITAL' as const,
        title: values.title.trim(),
        description: values.descriptionBody.trim(),
        price: values.price,
        originalPrice: originalPrice,
        coverImage: values.thumbnail,
        fileUrl: finalFile,
        fileName: values.deliveryType === 'UPLOAD_FILE' ? values.fileName : undefined,
        fileSize: values.deliveryType === 'UPLOAD_FILE' ? values.fileSize : undefined,
        deliveryType: values.deliveryType,
        buttonText: values.buttonText.trim(),
        subtitle: values.subtitle?.trim(),
        detailTitle: values.detailTitle.trim(),
        bottomTitle: values.bottomTitle.trim(),
        ctaButton: values.ctaButton.trim(),
        bannerImage: values.featureImage,
        isPublished: values.isPublished,
        isFeatured: false,
        stock: 999
      };

      let saved: Product;
      if (isEditMode && initialProduct) {
        saved = await updateProduct(initialProduct.id, payload);
        toast.success('Cập nhật sản phẩm số thành công!');
      } else {
        saved = await createProduct(payload);
        toast.success('Đã tạo và đưa sản phẩm số lên gian hàng!');
      }

      if (onSuccess) {
        onSuccess(saved);
      } else {
        router.push('/dashboard/products');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lưu sản phẩm số.');
    } finally {
      setLoading(false);
    }
  };

  // Preview đồng bộ thời gian thực
  const previewProduct: Product = React.useMemo(() => {
    return {
      id: initialProduct?.id || 'preview-draft',
      creatorId: profile.id,
      type: 'DIGITAL',
      title: watched.title?.trim() || 'Sở hữu ngay [Bộ Template / Ebook / Khóa học]!',
      description: watched.descriptionBody?.trim() || 'Mô tả chi tiết sản phẩm số...',
      price: watched.price,
      originalPrice: watched.hasDiscount ? watched.discountPrice : undefined,
      coverImage:
        watched.thumbnail ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&h=400&q=80',
      fileUrl: watched.deliveryType === 'REDIRECT_LINK' ? watched.redirectUrl : watched.fileUrl,
      fileName: watched.fileName,
      fileSize: watched.fileSize,
      deliveryType: watched.deliveryType,
      buttonText: watched.buttonText?.trim() || 'Nhận tài liệu ngay',
      subtitle: watched.subtitle?.trim(),
      detailTitle: watched.detailTitle?.trim(),
      bottomTitle: watched.bottomTitle?.trim(),
      ctaButton: watched.ctaButton?.trim(),
      bannerImage: watched.featureImage,
      isPublished: watched.isPublished,
      isFeatured: true,
      stock: 999,
      displayOrder: 0,
      soldCount: initialProduct?.soldCount || 128,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [watched, profile.id, initialProduct]);

  const previewProductsList = React.useMemo(() => {
    const listWithoutCurrent = existingProducts.filter(
      (p) => p.id !== (initialProduct?.id || 'preview-draft')
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
                {isEditMode ? 'Chỉnh sửa Sản phẩm số' : 'Thêm Sản phẩm số'}
              </h1>
            </div>
            <p className='text-xs text-muted-foreground'>
              Ebook, Template Notion, Preset Lightroom, Khóa học video, tài liệu PDF gửi tự động sau
              khi thanh toán VietQR.
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
                  {field.value ? 'Đang mở bán' : 'Tạm ẩn'}
                </span>
              </div>
            )}
          />
        </div>
      </div>

      {/* Main 2-Column Grid (60% Form / 40% Live Preview) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: FORM 7 BƯỚC CHUẨN TIẾNG VIỆT                   */}
        {/* ========================================================= */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-7'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-7'>
            {/* ----------------------------------------------------- */}
            {/* 1. Thiết lập ảnh đại diện                             */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  1
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Ảnh đại diện sản phẩm
                </h2>
              </div>

              <div className='p-6 rounded-2xl border-2 border-dashed border-border/80 bg-card hover:bg-muted/10 transition-colors flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  {/* Thumbnail Preview kèm nút sửa */}
                  <div className='relative group'>
                    <div className='h-20 w-20 rounded-2xl overflow-hidden bg-muted border border-border/60 flex items-center justify-center shadow-xs'>
                      {watched.thumbnail ? (
                        <img
                          src={watched.thumbnail}
                          alt='Ảnh đại diện'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Icons.workspace className='w-8 h-8 text-amber-500' />
                      )}
                    </div>
                    <button
                      type='button'
                      onClick={() => thumbInputRef.current?.click()}
                      className='absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer'
                      title='Thay đổi ảnh đại diện'
                    >
                      <Icons.edit className='w-3 h-3' />
                    </button>
                  </div>

                  <div>
                    <div className='text-xs font-bold text-foreground'>Ảnh đại diện sản phẩm</div>
                    <div className='text-[11px] text-muted-foreground mt-0.5 font-mono'>
                      Kích thước: 400 × 400
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
              {errors.thumbnail && (
                <p className='text-xs text-destructive font-medium'>{errors.thumbnail.message}</p>
              )}
            </div>

            {/* ----------------------------------------------------- */}
            {/* 2. Tùy chỉnh thẻ hiển thị                             */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  2
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Tùy chỉnh thẻ sản phẩm
                </h2>
              </div>

              <div className='space-y-3.5 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                {/* Tiêu đề thẻ (Title) */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>
                      Tiêu đề <span className='text-destructive'>*</span>
                    </label>
                    <span className='text-[11px] text-muted-foreground font-mono'>
                      {watched.title?.length || 0}/50 ký tự
                    </span>
                  </div>
                  <Input
                    {...register('title')}
                    maxLength={50}
                    placeholder='Sở hữu ngay [Bộ Template / Ebook / Khóa học]!'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.title && (
                    <p className='text-xs text-destructive font-medium'>{errors.title.message}</p>
                  )}
                </div>

                {/* Phụ đề */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>Mô tả phụ</label>
                    <span className='text-[11px] text-muted-foreground font-mono'>
                      {watched.subtitle?.length || 0}/100 ký tự
                    </span>
                  </div>
                  <Input
                    {...register('subtitle')}
                    maxLength={100}
                    placeholder='Chúng tôi sẽ gửi tài liệu này thẳng vào Email của bạn'
                    className='h-10 text-xs rounded-xl'
                  />
                </div>

                {/* Nút bấm */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>
                      Chữ trên nút bấm <span className='text-destructive'>*</span>
                    </label>
                    <span className='text-[11px] text-muted-foreground font-mono'>
                      {watched.buttonText?.length || 0}/30 ký tự
                    </span>
                  </div>
                  <Input
                    {...register('buttonText')}
                    maxLength={30}
                    placeholder='Nhận tài liệu ngay'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.buttonText && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.buttonText.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 3. Chi tiết sản phẩm                                  */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  3
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Chi tiết sản phẩm
                </h2>
              </div>

              <div className='space-y-4 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                {/* Tiêu đề trang chi tiết */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Tiêu đề bài viết chi tiết <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    {...register('detailTitle')}
                    placeholder='Sở hữu ngay [Bộ Template / Ebook / Khóa học]!'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.detailTitle && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.detailTitle.message}
                    </p>
                  )}
                </div>

                {/* Nội dung mô tả chi tiết kèm thanh công cụ */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>
                      Nội dung mô tả <span className='text-destructive'>*</span>
                    </label>
                    <button
                      type='button'
                      onClick={() =>
                        toast.info('Trợ lý AI đang soạn bản thảo mô tả chuyển đổi cao...')
                      }
                      className='inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:opacity-80 transition-opacity cursor-pointer'
                    >
                      <Icons.sparkles className='w-3 h-3 text-primary' />
                      <span>Tạo nội dung với AI</span>
                    </button>
                  </div>

                  {/* Thanh công cụ soạn thảo */}
                  <div className='rounded-xl border border-border overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all'>
                    <div className='flex items-center gap-1 p-1.5 bg-muted/40 border-b border-border/60 text-muted-foreground'>
                      <button
                        type='button'
                        className='p-1.5 rounded-md hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                        title='Tiêu đề'
                      >
                        <Icons.text className='w-3.5 h-3.5' />
                      </button>
                      <button
                        type='button'
                        className='p-1.5 rounded-md hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                        title='In đậm'
                      >
                        <Icons.bold className='w-3.5 h-3.5' />
                      </button>
                      <button
                        type='button'
                        className='p-1.5 rounded-md hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                        title='In nghiêng'
                      >
                        <Icons.italic className='w-3.5 h-3.5' />
                      </button>
                      <button
                        type='button'
                        className='p-1.5 rounded-md hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                        title='Gạch chân'
                      >
                        <Icons.underline className='w-3.5 h-3.5' />
                      </button>
                      <div className='h-4 w-px bg-border mx-1' />
                      <button
                        type='button'
                        className='p-1.5 rounded-md hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                        title='Chèn hình ảnh'
                      >
                        <Icons.media className='w-3.5 h-3.5' />
                      </button>
                      <button
                        type='button'
                        className='p-1.5 rounded-md hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                        title='Chèn liên kết'
                      >
                        <Icons.link className='w-3.5 h-3.5' />
                      </button>
                      <button
                        type='button'
                        className='p-1.5 rounded-md hover:bg-muted hover:text-foreground cursor-pointer transition-colors'
                        title='Nhúng Video'
                      >
                        <Icons.video className='w-3.5 h-3.5' />
                      </button>
                    </div>

                    <Textarea
                      {...register('descriptionBody')}
                      rows={6}
                      placeholder='Viết mô tả chi tiết giá trị tài liệu, mục lục, hoặc lợi ích khách hàng nhận được...'
                      className='border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none text-xs resize-y font-sans'
                    />
                  </div>
                  {errors.descriptionBody && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.descriptionBody.message}
                    </p>
                  )}
                </div>

                {/* Tiêu đề cuối trang */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Tiêu đề chân trang (kêu gọi hành động){' '}
                    <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    {...register('bottomTitle')}
                    placeholder='Bắt đầu nâng cấp kỹ năng của bạn ngay hôm nay'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.bottomTitle && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.bottomTitle.message}
                    </p>
                  )}
                </div>

                {/* Nút kêu gọi hành động */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Chữ trên nút thanh toán <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    {...register('ctaButton')}
                    placeholder='MUA NGAY'
                    className='h-10 text-xs rounded-xl uppercase font-bold'
                  />
                  {errors.ctaButton && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.ctaButton.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 4. Đính kèm sản phẩm số                               */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  4
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Đính kèm sản phẩm số
                </h2>
              </div>

              <div className='space-y-4 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <div>
                    <label className='text-xs font-bold text-foreground'>
                      Tài nguyên số giao cho khách <span className='text-destructive'>*</span>
                    </label>
                    <p className='text-[11px] text-muted-foreground mt-0.5'>
                      Hệ thống sẽ tự động giao các file hoặc link này tới khách hàng ngay khi thanh
                      toán VietQR thành công!
                    </p>
                  </div>

                  {/* Nút chuyển đổi */}
                  <div className='inline-flex p-1 rounded-full bg-muted border border-border/60 self-start sm:self-auto'>
                    <button
                      type='button'
                      onClick={() => setValue('deliveryType', 'UPLOAD_FILE')}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        watched.deliveryType === 'UPLOAD_FILE'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tải file lên
                    </button>
                    <button
                      type='button'
                      onClick={() => setValue('deliveryType', 'REDIRECT_LINK')}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        watched.deliveryType === 'REDIRECT_LINK'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Dán link bí mật
                    </button>
                  </div>
                </div>

                {watched.deliveryType === 'UPLOAD_FILE' ? (
                  <div className='space-y-3'>
                    <input
                      type='file'
                      ref={fileInputRef}
                      onChange={handleUploadDigitalFile}
                      accept='.pdf,.zip,.epub,.xlsx,.xls'
                      className='hidden'
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className='p-8 rounded-2xl border-2 border-dashed border-border/80 bg-muted/10 hover:bg-muted/30 transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2'
                    >
                      <div className='text-xs font-semibold text-muted-foreground'>
                        Kéo thả file tài liệu của bạn vào đây
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-8.5 px-4 text-xs font-bold rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary gap-1.5 cursor-pointer pointer-events-none'
                      >
                        <Icons.upload className='w-3.5 h-3.5' /> Chọn file từ máy
                      </Button>
                    </div>

                    {watched.fileName && (
                      <div className='p-3 rounded-xl border border-border bg-background flex items-center justify-between'>
                        <div className='flex items-center gap-2.5'>
                          <div className='h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center'>
                            <Icons.fileTypePdf className='w-4 h-4' />
                          </div>
                          <div>
                            <div className='text-xs font-bold text-foreground font-mono'>
                              {watched.fileName}
                            </div>
                            <div className='text-[10px] text-muted-foreground'>
                              {watched.fileSize || '14.8 MB'} • Đã sẵn sàng phát tự động
                            </div>
                          </div>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => fileInputRef.current?.click()}
                          className='h-7 text-xs text-primary hover:text-primary hover:bg-primary/10'
                        >
                          Đổi file
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='space-y-2 rounded-xl bg-muted/20 border border-border p-3.5'>
                    <label className='font-semibold text-foreground text-xs'>
                      Link truy cập bảo mật (Google Drive, Notion){' '}
                      <span className='text-[#FE2C55]'>*</span>
                    </label>
                    <Input
                      {...register('redirectUrl')}
                      placeholder='https://notion.so/... hoặc https://drive.google.com/...'
                      className='h-10 text-xs rounded-xl font-mono'
                    />
                    <p className='text-[11px] text-muted-foreground'>
                      Khách hàng sau khi chuyển khoản VietQR thành công sẽ được tự động mở liên kết
                      này.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 5. Ảnh bìa nổi bật                                    */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  5
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Ảnh bìa nổi bật
                </h2>
              </div>

              <div className='p-6 rounded-2xl border-2 border-dashed border-border/80 bg-card hover:bg-muted/10 transition-colors flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative group'>
                    <div className='h-16 w-24 rounded-xl overflow-hidden bg-muted border border-border/60 flex items-center justify-center shadow-xs'>
                      {watched.featureImage ? (
                        <img
                          src={watched.featureImage}
                          alt='Ảnh bìa nổi bật'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Icons.media className='w-6 h-6 text-muted-foreground' />
                      )}
                    </div>
                    <button
                      type='button'
                      onClick={() => bannerInputRef.current?.click()}
                      className='absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer'
                      title='Thay đổi ảnh bìa'
                    >
                      <Icons.edit className='w-3 h-3' />
                    </button>
                  </div>

                  <div>
                    <div className='text-xs font-semibold text-muted-foreground'>
                      Kéo thả ảnh bìa ngang vào đây
                    </div>
                    <div className='text-[11px] text-muted-foreground mt-0.5 font-mono'>
                      Kích thước: 1920 × 1080
                    </div>
                  </div>
                </div>

                <div>
                  <input
                    type='file'
                    ref={bannerInputRef}
                    onChange={handleUploadBanner}
                    accept='image/*'
                    className='hidden'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className='h-9 px-4 text-xs font-semibold rounded-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary cursor-pointer'
                  >
                    {isUploadingBanner ? 'Đang tải lên...' : 'Chọn ảnh'}
                  </Button>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 6. Thiết lập giá bán                                  */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  6
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Thiết lập giá bán
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                {/* Giá bán (VNĐ) */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Giá bán thực tế (VNĐ) <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    type='number'
                    value={watched.price}
                    onChange={(e) => setValue('price', Number(e.target.value))}
                    placeholder='149000'
                    className='h-10 text-xs rounded-xl font-mono'
                  />
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
                  <Input
                    type='number'
                    disabled={!watched.hasDiscount}
                    value={watched.discountPrice ?? ''}
                    onChange={(e) =>
                      setValue('discountPrice', e.target.value ? Number(e.target.value) : undefined)
                    }
                    placeholder='299000'
                    className={`h-10 text-xs rounded-xl font-mono ${
                      !watched.hasDiscount ? 'bg-muted/70 cursor-not-allowed opacity-60' : ''
                    }`}
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
                    {isEditMode ? 'Cập nhật sản phẩm' : 'Lưu & Đưa lên Tiệm'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: XEM TRƯỚC ĐIỆN THOẠI                            */}
        {/* ========================================================= */}
        <div className='lg:col-span-5 xl:col-span-5 hidden lg:block sticky top-20'>
          <div className='space-y-3 text-center'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-semibold text-muted-foreground'>
              <Icons.smartphone className='w-3.5 h-3.5 text-[#FE2C55]' />
              <span>Xem trước điện thoại (Cập nhật trực tiếp)</span>
            </div>

            {/* Preview Device Card */}
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
