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

// Schema xác thực cho Sản phẩm 0 đồng (Lead Magnet)
export const leadMagnetSchema = z.object({
  // 1. Thiết lập ảnh Thumbnail
  thumbnail: z.string().optional(),

  // 2. Tùy chỉnh hiển thị (Preview)
  title: z.string().min(1, 'Tiêu đề không được để trống').max(50, 'Tiêu đề tối đa 50 ký tự'),
  subtitle: z.string().max(100, 'Mô tả phụ tối đa 100 ký tự').optional(),
  buttonText: z
    .string()
    .min(1, 'Chữ hiển thị trên nút không được để trống')
    .max(30, 'Tối đa 30 ký tự'),

  // 3. Chi tiết quà tặng
  detailTitle: z.string().min(1, 'Tiêu đề trang chi tiết là bắt buộc'),
  descriptionBody: z.string().min(1, 'Nội dung mô tả chi tiết là bắt buộc'),
  bottomTitle: z.string().min(1, 'Tiêu đề kết thúc là bắt buộc'),
  ctaButton: z.string().min(1, 'Chữ trên nút kêu gọi nhận quà là bắt buộc'),
  successMessage: z.string().optional(),

  // 4. Đính kèm quà tặng (Tài liệu miễn phí / Link mở ngay)
  deliveryType: z.enum(['UPLOAD_FILE', 'REDIRECT_LINK']),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.string().optional(),
  redirectUrl: z.string().optional(),

  // 5. Ảnh bìa nổi bật (Feature Image)
  featureImage: z.string().optional(),

  // 6. Giá bán (Cố định 0đ)
  price: z.literal(0),

  // Trạng thái xuất bản
  isPublished: z.boolean()
});

export type LeadMagnetFormValues = z.infer<typeof leadMagnetSchema>;

interface LeadMagnetFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function LeadMagnetForm({ initialProduct, onSuccess, onCancel }: LeadMagnetFormProps) {
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

  const form = useForm<LeadMagnetFormValues>({
    resolver: zodResolver(leadMagnetSchema),
    defaultValues: {
      thumbnail: initialProduct?.coverImage || '',
      title: initialProduct?.title || '',
      subtitle: initialProduct?.subtitle || '',
      buttonText: initialProduct?.buttonText || 'Nhận quà 0đ',

      detailTitle: initialProduct?.detailTitle || initialProduct?.title || '',
      descriptionBody: initialProduct?.description || '',
      bottomTitle: initialProduct?.bottomTitle || '',
      ctaButton: initialProduct?.ctaButton || 'NHẬN MIỄN PHÍ NGAY',
      successMessage: initialProduct?.successMessage || 'Tài liệu đã được gửi vào Email của bạn!',

      deliveryType: initialProduct?.deliveryType || 'UPLOAD_FILE',
      fileUrl: initialProduct?.fileUrl || '',
      fileName: initialProduct?.fileName || '',
      fileSize: initialProduct?.fileSize || '',
      redirectUrl: initialProduct?.fileUrl || '',

      featureImage: initialProduct?.bannerImage || '',

      price: 0,
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

  // Upload thumbnail
  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingThumb(true);
      try {
        const res = await uploadClientFile(file, { folder: 'lead-magnets/thumbnails' });
        setValue('thumbnail', res.url);
        toast.success(
          `Đã tải ảnh đại diện thành công (${res.storage === 'r2' ? 'Cloudflare R2' : 'Lưu trữ local'})!`
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

  // Upload ảnh bìa nổi bật
  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBanner(true);
      try {
        const res = await uploadClientFile(file, { folder: 'lead-magnets/banners' });
        setValue('featureImage', res.url);
        toast.success(
          `Đã tải ảnh bìa nổi bật thành công (${res.storage === 'r2' ? 'Cloudflare R2' : 'Lưu trữ local'})!`
        );
      } catch (err: any) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setValue('featureImage', reader.result as string);
        };
        reader.readAsDataURL(file);
        toast.warning(err.message || 'Lỗi tải ảnh lên máy chủ, đã dùng bản xem trước tạm.');
      } finally {
        setIsUploadingBanner(false);
      }
    }
  };

  // Upload file quà tặng miễn phí
  const handleUploadDigitalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const toastId = toast.loading(`Đang tải tài liệu quà tặng ${file.name} (${sizeMb} MB)...`);
      try {
        const res = await uploadClientFile(file, { folder: 'lead-magnets/files' });
        setValue('fileName', file.name);
        setValue('fileSize', `${sizeMb} MB`);
        setValue('fileUrl', res.url);
        toast.success(
          `Đã đính kèm tài liệu thành công (${res.storage === 'r2' ? 'Cloudflare R2' : 'Lưu trữ local'})!`,
          { id: toastId }
        );
      } catch (err: any) {
        toast.error(err.message || 'Không thể tải file lên server.', { id: toastId });
      }
    }
  };

  const onSubmit = async (values: LeadMagnetFormValues) => {
    setLoading(true);
    try {
      const finalFile =
        values.deliveryType === 'REDIRECT_LINK' ? values.redirectUrl?.trim() : values.fileUrl;

      const payload = {
        type: 'LEAD_MAGNET' as const,
        title: values.title.trim(),
        description: values.descriptionBody.trim(),
        price: 0,
        coverImage: values.thumbnail || '',
        fileUrl: finalFile,
        fileName: values.deliveryType === 'UPLOAD_FILE' ? values.fileName : undefined,
        fileSize: values.deliveryType === 'UPLOAD_FILE' ? values.fileSize : undefined,
        deliveryType: values.deliveryType,
        successMessage: values.successMessage?.trim(),
        buttonText: values.buttonText.trim(),
        subtitle: values.subtitle?.trim(),
        detailTitle: values.detailTitle.trim(),
        bottomTitle: values.bottomTitle.trim(),
        ctaButton: values.ctaButton.trim(),
        bannerImage: values.featureImage,
        isPublished: values.isPublished,
        isFeatured: false,
        stock: 9999
      };

      let saved: Product;
      if (isEditMode && initialProduct) {
        saved = await updateProduct(initialProduct.id, payload);
        toast.success('Cập nhật quà tặng 0đ thành công!');
      } else {
        saved = await createProduct(payload);
        toast.success('Đã tạo và đưa quà tặng 0đ lên gian hàng!');
      }

      if (onSuccess) {
        onSuccess(saved);
      } else {
        router.push('/dashboard/products');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lưu quà tặng.');
    } finally {
      setLoading(false);
    }
  };

  // Preview đồng bộ thời gian thực
  const previewProduct: Product = React.useMemo(() => {
    return {
      id: initialProduct?.id || 'preview-lead-magnet',
      creatorId: profile.id,
      type: 'LEAD_MAGNET',
      title: watched.title?.trim() || 'Nhận Miễn Phí [Checklist / Ebook / Template]!',
      description: watched.descriptionBody?.trim() || 'Mô tả chi tiết quà tặng...',
      price: 0,
      coverImage:
        watched.thumbnail ||
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&h=400&q=80',
      fileUrl: watched.deliveryType === 'REDIRECT_LINK' ? watched.redirectUrl : watched.fileUrl,
      fileName: watched.fileName,
      fileSize: watched.fileSize,
      deliveryType: watched.deliveryType,
      successMessage: watched.successMessage,
      buttonText: watched.buttonText?.trim() || 'Nhận quà 0đ',
      subtitle: watched.subtitle?.trim(),
      detailTitle: watched.detailTitle?.trim(),
      bottomTitle: watched.bottomTitle?.trim(),
      ctaButton: watched.ctaButton?.trim(),
      bannerImage: watched.featureImage,
      isPublished: watched.isPublished,
      isFeatured: true,
      stock: 9999,
      displayOrder: 0,
      soldCount: initialProduct?.soldCount || 342,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [watched, profile.id, initialProduct]);

  const previewProductsList = React.useMemo(() => {
    const listWithoutCurrent = existingProducts.filter(
      (p) => p.id !== (initialProduct?.id || 'preview-lead-magnet')
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
                {isEditMode ? 'Chỉnh sửa quà tặng 0đ' : 'Thêm quà tặng 0đ'}
              </h1>
              <Badge className='text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20'>
                Giá cố định 0 VNĐ
              </Badge>
            </div>
            <p className='text-xs text-muted-foreground'>
              Checklist, Ebook, Template miễn phí nhằm thu thập Email & Số điện thoại khách hàng
              tiềm năng.
            </p>
          </div>
        </div>

        {/* Trạng thái mở tặng */}
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
                  className='data-[state=checked]:bg-emerald-500'
                />
                <span className='text-xs font-bold text-foreground'>
                  {field.value ? 'Đang mở tặng' : 'Tạm ẩn'}
                </span>
              </div>
            )}
          />
        </div>
      </div>

      {/* Banner thông báo nghiệp vụ Quà 0đ */}
      <div className='p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-emerald-900 dark:text-emerald-200 text-xs'>
        <div className='flex items-center gap-2.5'>
          <div className='h-7 w-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0'>
            <Icons.gift className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
          </div>
          <div>
            <strong className='font-bold'>Thu thập khách hàng tiềm năng:</strong> Khách chỉ cần điền
            Tên + Email là nhận quà ngay (không sinh mã VietQR). Toàn bộ liên hệ sẽ tự động lưu vào
            danh bạ khách để chăm sóc.
          </div>
        </div>
        <Badge
          variant='outline'
          className='bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] shrink-0 font-bold'
        >
          0% Phí & Không Escrow
        </Badge>
      </div>

      {/* Main 2-Column Grid (60% Form / 40% Live Preview) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: FORM 7 BƯỚC CHO QUÀ TẶNG 0 ĐỒNG                 */}
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
                  Thiết lập ảnh đại diện (Thumbnail)
                </h2>
              </div>

              <div className='p-6 rounded-2xl border-2 border-dashed border-border/80 bg-card hover:bg-muted/10 transition-colors flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative group'>
                    <div className='h-20 w-20 rounded-2xl overflow-hidden bg-muted border border-border/60 flex items-center justify-center shadow-xs'>
                      {watched.thumbnail ? (
                        <img
                          src={watched.thumbnail}
                          alt='Thumbnail quà tặng'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Icons.gift className='w-8 h-8 text-emerald-500' />
                      )}
                    </div>
                    <button
                      type='button'
                      onClick={() => thumbInputRef.current?.click()}
                      className='absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer'
                      title='Thay đổi ảnh đại diện quà tặng'
                    >
                      <Icons.edit className='w-3 h-3' />
                    </button>
                  </div>

                  <div>
                    <div className='text-xs font-bold text-foreground'>Ảnh đại diện quà tặng</div>
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
                    className='h-9 px-4 text-xs font-semibold rounded-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 cursor-pointer'
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
                  Tùy chỉnh thẻ hiển thị
                </h2>
              </div>

              <div className='space-y-3.5 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                {/* Tiêu đề */}
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
                    placeholder='Nhận Miễn Phí [Checklist / Ebook / Template]!'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.title && (
                    <p className='text-xs text-destructive font-medium'>{errors.title.message}</p>
                  )}
                </div>

                {/* Mô tả phụ */}
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
                    placeholder='Điền email của bạn để nhận link tải ngay lập tức'
                    className='h-10 text-xs rounded-xl'
                  />
                </div>

                {/* Chữ trên nút */}
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
                    placeholder='Nhận quà 0đ'
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
            {/* 3. Chi tiết quà tặng                                  */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  3
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Chi tiết quà tặng
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
                    placeholder='Nhận Miễn Phí [Checklist / Ebook / Template]!'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.detailTitle && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.detailTitle.message}
                    </p>
                  )}
                </div>

                {/* Nội dung mô tả chi tiết */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>
                      Nội dung mô tả <span className='text-destructive'>*</span>
                    </label>
                    <button
                      type='button'
                      onClick={() => toast.info('Trợ lý AI đang soạn bản thảo mô tả thu hút...')}
                      className='inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:opacity-80 transition-opacity cursor-pointer'
                    >
                      <Icons.sparkles className='w-3 h-3 text-emerald-600' />
                      <span>Tạo nội dung với AI</span>
                    </button>
                  </div>

                  {/* Thanh công cụ soạn thảo */}
                  <div className='rounded-xl border border-border overflow-hidden bg-background focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all'>
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
                      placeholder='Mô tả giá trị tài liệu miễn phí, lợi ích khách hàng nhận được khi điền email...'
                      className='border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none text-xs resize-y font-sans'
                    />
                  </div>
                  {errors.descriptionBody && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.descriptionBody.message}
                    </p>
                  )}
                </div>

                {/* Tiêu đề kết thúc */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Tiêu đề kết thúc <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    {...register('bottomTitle')}
                    placeholder='Nhận tài liệu miễn phí của bạn ngay hôm nay'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.bottomTitle && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.bottomTitle.message}
                    </p>
                  )}
                </div>

                {/* Chữ trên nút nhận quà */}
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Chữ trên nút kêu gọi hành động <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    {...register('ctaButton')}
                    placeholder='NHẬN MIỄN PHÍ NGAY'
                    className='h-10 text-xs rounded-xl uppercase font-bold text-emerald-600'
                  />
                  {errors.ctaButton && (
                    <p className='text-xs text-destructive font-medium'>
                      {errors.ctaButton.message}
                    </p>
                  )}
                </div>

                {/* Lời nhắn sau khi nhận quà thành công */}
                <div className='space-y-1.5 pt-1'>
                  <label className='text-xs font-semibold text-foreground flex items-center justify-between'>
                    <span>Lời nhắn sau khi nhận quà thành công</span>
                    <span className='text-[10px] text-muted-foreground'>Tùy chọn</span>
                  </label>
                  <Input
                    {...register('successMessage')}
                    placeholder='Tài liệu đã được gửi vào Email của bạn!'
                    className='h-10 text-xs rounded-xl'
                  />
                  <p className='text-[10px] text-muted-foreground'>
                    Hiển thị trên màn hình thành công sau khi khách bấm nhận quà.
                  </p>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 4. Đính kèm quà tặng                                  */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  4
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Đính kèm quà tặng
                </h2>
              </div>

              <div className='space-y-4 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                  <div>
                    <label className='text-xs font-bold text-foreground'>
                      Tài liệu tặng miễn phí <span className='text-destructive'>*</span>
                    </label>
                    <p className='text-[11px] text-muted-foreground mt-0.5'>
                      Khách hàng sẽ được tải file hoặc mở link này ngay lập tức sau khi điền thông
                      tin!
                    </p>
                  </div>

                  {/* Switcher hình thức gửi quà */}
                  <div className='inline-flex p-1 rounded-full bg-muted border border-border/60 self-start sm:self-auto'>
                    <button
                      type='button'
                      onClick={() => setValue('deliveryType', 'UPLOAD_FILE')}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        watched.deliveryType === 'UPLOAD_FILE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tải file tài liệu
                    </button>
                    <button
                      type='button'
                      onClick={() => setValue('deliveryType', 'REDIRECT_LINK')}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        watched.deliveryType === 'REDIRECT_LINK'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Link Drive / Canva
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
                        Kéo thả file quà tặng vào đây (.pdf, .zip, .epub, .xlsx)
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        className='h-8.5 px-4 text-xs font-bold rounded-full border-emerald-600 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 gap-1.5 cursor-pointer pointer-events-none'
                      >
                        <Icons.upload className='w-3.5 h-3.5' /> Chọn file từ máy
                      </Button>
                    </div>

                    {watched.fileName && (
                      <div className='p-3 rounded-xl border border-border bg-background flex items-center justify-between'>
                        <div className='flex items-center gap-2.5'>
                          <div className='h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center'>
                            <Icons.circleCheck className='w-4 h-4' />
                          </div>
                          <div>
                            <div className='text-xs font-bold text-foreground font-mono'>
                              {watched.fileName}
                            </div>
                            <div className='text-[10px] text-muted-foreground'>
                              {watched.fileSize || '5.2 MB'} • Sẵn sàng phát miễn phí
                            </div>
                          </div>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => fileInputRef.current?.click()}
                          className='h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10'
                        >
                          Đổi file
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='space-y-2 rounded-xl bg-muted/20 border border-border p-3.5'>
                    <label className='font-semibold text-foreground text-xs'>
                      Link tài nguyên (Google Drive, Canva, Notion){' '}
                      <span className='text-destructive'>*</span>
                    </label>
                    <Input
                      {...register('redirectUrl')}
                      placeholder='https://drive.google.com/... hoặc https://canva.com/...'
                      className='h-10 text-xs rounded-xl font-mono'
                    />
                    <p className='text-[11px] text-muted-foreground'>
                      Khách hàng sau khi điền email sẽ được mở trực tiếp liên kết này.
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
                          alt='Ảnh bìa quà tặng'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Icons.media className='w-6 h-6 text-muted-foreground' />
                      )}
                    </div>
                    <button
                      type='button'
                      onClick={() => bannerInputRef.current?.click()}
                      className='absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer'
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
                    className='h-9 px-4 text-xs font-semibold rounded-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 cursor-pointer'
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

              <div className='p-4.5 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <div className='text-xs font-bold text-foreground flex items-center gap-2'>
                    Giá bán:{' '}
                    <span className='text-emerald-600 font-black text-sm'>0 VNĐ (Miễn phí)</span>
                    <Badge
                      variant='outline'
                      className='bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]'
                    >
                      <Icons.lock className='w-2.5 h-2.5 mr-1 inline' /> Đã khóa
                    </Badge>
                  </div>
                  <p className='text-[11px] text-muted-foreground'>
                    Sản phẩm loại Quà tặng luôn có giá bán bằng 0đ để thu hút nhiều người đăng ký
                    nhất.
                  </p>
                </div>

                <div className='h-10 px-4 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center font-mono text-xs font-bold text-emerald-600'>
                  0 đ
                </div>
              </div>
            </div>

            {/* Nút hành động */}
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
                className='h-10 px-7 text-xs font-bold rounded-xl gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99] transition-all'
              >
                {loading ? (
                  <>
                    <Icons.spinner className='h-4 w-4 animate-spin' />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Icons.sparkles className='h-4 w-4' />
                    {isEditMode ? 'Cập nhật quà tặng' : 'Lưu & Đưa lên Tiệm'}
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
              <Icons.smartphone className='w-3.5 h-3.5 text-emerald-600' />
              <span>Xem trước điện thoại (Quà tặng 0đ)</span>
            </div>

            {/* Preview Device Card */}
            <div className='relative'>
              <div className='absolute -inset-1 rounded-[60px] bg-gradient-to-tr from-emerald-500/20 via-primary/10 to-teal-500/20 blur-2xl opacity-50' />
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
