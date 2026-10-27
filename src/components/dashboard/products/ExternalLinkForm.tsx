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
import { SOCIAL_PLATFORMS, SocialIconBadge } from '@/components/common/social-icons';

// Schema xác thực cho Nút link liên kết (External Link)
export const externalLinkSchema = z.object({
  // 1. Display Style (Kiểu hiển thị)
  displayStyle: z.enum(['BUTTON', 'CALLOUT']),

  // 2. Add destination (Đích đến)
  destinationUrl: z
    .string()
    .min(1, 'Đường link chuyển hướng không được để trống')
    .url('Vui lòng nhập đúng định dạng URL (vd: https://...)'),

  // 3. Set Thumbnail (Ảnh đại diện)
  thumbnail: z.string().optional(),

  // 4. Customize Button (Tùy chỉnh nút bấm)
  title: z
    .string()
    .min(1, 'Tiêu đề nút bấm không được để trống')
    .max(50, 'Tiêu đề tối đa 50 ký tự'),
  subtitle: z.string().max(100, 'Mô tả phụ tối đa 100 ký tự').optional(),

  // Icon type và tùy chọn mở tab mới
  iconType: z.enum([
    'shopee',
    'tiktok',
    'zalo',
    'youtube',
    'facebook',
    'instagram',
    'telegram',
    'threads',
    'messenger',
    'twitter',
    'external'
  ]),
  openInNewTab: z.boolean(),

  // Trạng thái xuất bản
  isPublished: z.boolean()
});

export type ExternalLinkFormValues = z.infer<typeof externalLinkSchema>;

interface ExternalLinkFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function ExternalLinkForm({ initialProduct, onSuccess, onCancel }: ExternalLinkFormProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<CreatorProfile>(defaultCreatorProfile);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig>(defaultPaymentConfig);
  const [existingProducts, setExistingProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isUploadingThumb, setIsUploadingThumb] = React.useState(false);

  const thumbInputRef = React.useRef<HTMLInputElement>(null);

  const isEditMode = !!initialProduct;

  const form = useForm<ExternalLinkFormValues>({
    resolver: zodResolver(externalLinkSchema),
    defaultValues: {
      displayStyle: initialProduct?.displayStyle || 'BUTTON',
      destinationUrl: initialProduct?.externalUrl || '',
      thumbnail: initialProduct?.coverImage || '',
      title: initialProduct?.title || '',
      subtitle: initialProduct?.subtitle || '',
      iconType: initialProduct?.iconType || 'external',
      openInNewTab: initialProduct?.openInNewTab ?? true,
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
        const res = await uploadClientFile(file, { folder: 'external-links/thumbnails' });
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

  const onSubmit = async (values: ExternalLinkFormValues) => {
    setLoading(true);
    try {
      const payload = {
        type: 'EXTERNAL_LINK' as const,
        title: values.title.trim(),
        description: values.subtitle?.trim() || '',
        price: 0,
        coverImage: values.thumbnail || '',
        externalUrl: values.destinationUrl.trim(),
        iconType: values.iconType,
        openInNewTab: values.openInNewTab,
        buttonText: 'Mở link',
        subtitle: values.subtitle?.trim(),
        displayStyle: values.displayStyle,
        isPublished: values.isPublished,
        isFeatured: false,
        stock: 9999
      };

      let saved: Product;
      if (isEditMode && initialProduct) {
        saved = await updateProduct(initialProduct.id, payload);
        toast.success('Cập nhật liên kết thành công!');
      } else {
        saved = await createProduct(payload);
        toast.success('Đã thêm link liên kết vào gian hàng!');
      }

      if (onSuccess) {
        onSuccess(saved);
      } else {
        router.push('/dashboard/products');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lưu liên kết.');
    } finally {
      setLoading(false);
    }
  };

  // Preview đồng bộ thời gian thực
  const previewProduct: Product = React.useMemo(() => {
    return {
      id: initialProduct?.id || 'preview-link',
      creatorId: profile.id,
      type: 'EXTERNAL_LINK',
      title: watched.title?.trim() || 'Ghé thăm gian hàng Shopee / TikTok của mình',
      description: watched.subtitle?.trim() || 'Liên kết ngoài',
      price: 0,
      coverImage:
        watched.thumbnail ||
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&h=400&q=80',
      externalUrl: watched.destinationUrl,
      iconType: watched.iconType,
      openInNewTab: watched.openInNewTab,
      buttonText: 'Mở link',
      subtitle: watched.subtitle?.trim(),
      displayStyle: watched.displayStyle,
      isPublished: watched.isPublished,
      isFeatured: true,
      stock: 9999,
      displayOrder: 0,
      soldCount: 0,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [watched, profile.id, initialProduct]);

  const previewProductsList = React.useMemo(() => {
    const listWithoutCurrent = existingProducts.filter(
      (p) => p.id !== (initialProduct?.id || 'preview-link')
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
              <h1 className='text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2'>
                {isEditMode ? 'Chỉnh sửa link liên kết' : 'Thêm nút link liên kết'}
              </h1>
              <Badge className='text-[10px] font-semibold bg-purple-500/10 text-purple-600 border-purple-500/20'>
                Chuyển hướng ngoài
              </Badge>
              <button
                type='button'
                onClick={() =>
                  toast.info(
                    'Link liên kết cho phép điều hướng khách hàng sang Shopee, TikTok Shop, nhóm Zalo kín hoặc kênh YouTube trực tiếp.'
                  )
                }
                className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold cursor-pointer transition-colors'
              >
                <Icons.info className='w-3 h-3' />
                <span>Cách hoạt động</span>
              </button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Trỏ sang gian hàng thương mại điện tử, nhóm kín Zalo/Telegram, video Youtube hoặc link
              Affiliate.
            </p>
          </div>
        </div>

        {/* Trạng thái Bật/Tắt hiển thị */}
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
                  {field.value ? 'Đang mở' : 'Tạm ẩn'}
                </span>
              </div>
            )}
          />
        </div>
      </div>

      {/* Main 2-Column Grid (60% Form / 40% Live Preview) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: FORM 4 BƯỚC CHUẨN STAN REFERRAL / EXTERNAL LINK */}
        {/* ========================================================= */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-7'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-7'>
            {/* ----------------------------------------------------- */}
            {/* 1. Kiểu hiển thị                                      */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  1
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>Kiểu hiển thị</h2>
              </div>

              <Controller
                control={control}
                name='displayStyle'
                render={({ field }) => (
                  <div className='flex items-center gap-3'>
                    {/* Option 1: Button */}
                    <div
                      onClick={() => field.onChange('BUTTON')}
                      className={`w-28 p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
                        field.value === 'BUTTON'
                          ? 'border-primary bg-primary/5 text-primary shadow-xs ring-2 ring-primary/20'
                          : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <div className='h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center'>
                        <Icons.link className='w-4.5 h-4.5' />
                      </div>
                      <span className='text-xs font-bold'>Dạng nút bấm</span>
                    </div>

                    {/* Option 2: Callout */}
                    <div
                      onClick={() => field.onChange('CALLOUT')}
                      className={`w-28 p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
                        field.value === 'CALLOUT'
                          ? 'border-primary bg-primary/5 text-primary shadow-xs ring-2 ring-primary/20'
                          : 'border-border/80 bg-card hover:border-border hover:bg-muted/30 text-muted-foreground'
                      }`}
                    >
                      <div className='h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center'>
                        <Icons.product className='w-4.5 h-4.5' />
                      </div>
                      <span className='text-xs font-bold'>Thẻ nổi bật</span>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* ----------------------------------------------------- */}
            {/* 2. Thêm liên kết đích                                 */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  2
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Thêm liên kết đích
                </h2>
              </div>

              <div className='space-y-2 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                <label className='text-xs font-bold text-foreground'>
                  Đường link chuyển hướng <span className='text-destructive'>*</span>
                </label>
                <Input
                  {...register('destinationUrl')}
                  placeholder='https://shopee.vn/gian-hang-cua-ban hoặc https://zalo.me/g/...'
                  className='h-10 text-xs rounded-xl font-mono'
                />
                {errors.destinationUrl && (
                  <p className='text-xs text-destructive font-medium'>
                    {errors.destinationUrl.message}
                  </p>
                )}
                <p className='text-[11px] text-muted-foreground'>
                  Khách hàng bấm vào nút trên trang cá nhân sẽ được chuyển hướng thẳng tới địa chỉ
                  này.
                </p>

                {/* Chọn biểu tượng & mở tab mới */}
                <div className='pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-2 col-span-1 sm:col-span-2'>
                    <label className='text-[11px] font-semibold text-foreground flex items-center justify-between'>
                      <span>Biểu tượng nền tảng (Chọn icon đại diện cho link)</span>
                      <span className='text-[10px] text-muted-foreground'>
                        11 Nền tảng phổ biến
                      </span>
                    </label>
                    <Controller
                      control={control}
                      name='iconType'
                      render={({ field }) => (
                        <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-6 gap-2'>
                          {Object.values(SOCIAL_PLATFORMS).map((item) => {
                            const isSelected = field.value === item.key;
                            return (
                              <button
                                key={item.key}
                                type='button'
                                onClick={() => field.onChange(item.key)}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30'
                                    : 'border-border/80 bg-background hover:bg-muted/50 hover:border-border'
                                }`}
                              >
                                <SocialIconBadge platform={item.key} size='sm' />
                                <span className='text-[11px] font-semibold truncate'>
                                  {item.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                  </div>

                  <div className='flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20 self-end'>
                    <div className='space-y-0.5 pr-2'>
                      <div className='font-semibold text-xs text-foreground'>
                        Mở link trên tab mới
                      </div>
                      <p className='text-[10px] text-muted-foreground'>
                        Khuyên dùng để giữ khách trên Bio Storefront
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name='openInNewTab'
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
            </div>

            {/* ----------------------------------------------------- */}
            {/* 3. Thiết lập ảnh đại diện                             */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  3
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Thiết lập ảnh đại diện
                </h2>
              </div>

              <div className='p-6 rounded-2xl border-2 border-dashed border-border/80 bg-card hover:bg-muted/10 transition-colors flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='relative group'>
                    <div className='h-20 w-20 rounded-2xl overflow-hidden bg-muted border border-border/60 flex items-center justify-center shadow-xs'>
                      {watched.thumbnail ? (
                        <img
                          src={watched.thumbnail}
                          alt='Thumbnail liên kết'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Icons.link className='w-8 h-8 text-purple-500' />
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
                    <div className='text-xs font-bold text-foreground'>Ảnh đại diện nút bấm</div>
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
            {/* 4. Tùy chỉnh nút bấm                                  */}
            {/* ----------------------------------------------------- */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <span className='h-6 w-6 rounded-full bg-muted text-muted-foreground font-bold text-xs flex items-center justify-center shrink-0'>
                  4
                </span>
                <h2 className='text-sm font-bold tracking-tight text-foreground'>
                  Tùy chỉnh nút bấm
                </h2>
              </div>

              <div className='space-y-3.5 bg-card border border-border/80 rounded-2xl p-4.5 shadow-xs'>
                {/* Tiêu đề */}
                <div className='space-y-1.5'>
                  <div className='flex items-center justify-between text-xs'>
                    <label className='font-semibold text-foreground'>
                      Tiêu đề hiển thị <span className='text-destructive'>*</span>
                    </label>
                    <span className='text-[11px] text-muted-foreground font-mono'>
                      {watched.title?.length || 0}/50 ký tự
                    </span>
                  </div>
                  <Input
                    {...register('title')}
                    maxLength={50}
                    placeholder='Ghé thăm gian hàng Shopee / TikTok của mình'
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
                    placeholder='Nhận mã giảm giá độc quyền 20% khi mua tại đây'
                    className='h-10 text-xs rounded-xl'
                  />
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
                className='h-10 px-7 text-xs font-bold rounded-xl gap-2 shadow-md bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-[0.99] transition-all'
              >
                {loading ? (
                  <>
                    <Icons.spinner className='h-4 w-4 animate-spin' />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Icons.sparkles className='h-4 w-4' />
                    {isEditMode ? 'Cập nhật liên kết' : 'Lưu & Đưa lên Tiệm'}
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
              <Icons.smartphone className='w-3.5 h-3.5 text-purple-600' />
              <span>Xem trước điện thoại (Link liên kết)</span>
            </div>

            {/* Preview Device Card */}
            <div className='relative'>
              <div className='absolute -inset-1 rounded-[60px] bg-gradient-to-tr from-purple-500/20 via-primary/10 to-pink-500/20 blur-2xl opacity-50' />
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
