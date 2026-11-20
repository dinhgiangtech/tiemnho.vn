'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Product,
  ProductType,
  CreatorProfile,
  PaymentConfig,
  defaultCreatorProfile,
  defaultPaymentConfig
} from '@/constants/mock-tiemnho';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tiemNhoKeys,
  profileQueryOptions,
  paymentConfigQueryOptions,
  productsQueryOptions
} from '@/features/tiemnho/api/queries';
import { createProduct, updateProduct } from '@/features/tiemnho/api/service';
import { PhoneMockup } from '@/features/tiemnho/components/mobile-preview/phone-mockup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { uploadClientFile } from '@/lib/upload-client';
import { ProductDescriptionEditor } from './ProductDescriptionEditor';
import { cn } from '@/lib/utils';
import {
  Camera,
  Upload,
  Image as ImageIcon,
  FileCheck,
  Smartphone,
  Monitor,
  ArrowLeft,
  FileText,
  Gift,
  Package,
  ExternalLink
} from 'lucide-react';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80'
];

const PRODUCT_TYPES: { type: ProductType; title: string; desc: string; icon: any }[] = [
  { type: 'DIGITAL', title: 'Sản phẩm số', desc: 'Ebook, preset, template', icon: FileText },
  { type: 'LEAD_MAGNET', title: 'Quà tặng 0đ', desc: 'Thu thập Email & SĐT', icon: Gift },
  { type: 'PHYSICAL', title: 'Hàng thủ công', desc: 'Đặt trước / Handmade', icon: Package },
  {
    type: 'EXTERNAL_LINK',
    title: 'Nút liên kết',
    desc: 'Shopee, TikTok Shop, Zalo',
    icon: ExternalLink
  }
];

export const productFormSchema = z
  .object({
    type: z.enum(['DIGITAL', 'LEAD_MAGNET', 'PHYSICAL', 'EXTERNAL_LINK']),
    title: z.string().min(1, 'Tiêu đề sản phẩm là bắt buộc').max(60, 'Tiêu đề tối đa 60 ký tự'),
    subtitle: z.string().max(100, 'Dòng tóm tắt tối đa 100 ký tự').optional(),
    coverImage: z.string().optional(),
    featureImage: z.string().optional(),
    description: z.string().optional(),
    price: z.number().min(0, 'Giá bán không được âm'),
    hasDiscount: z.boolean(),
    originalPrice: z.number().min(0).optional().nullable(),
    isPublished: z.boolean(),
    buttonText: z.string().max(30).optional(),

    // DIGITAL & LEAD_MAGNET
    deliveryType: z.enum(['UPLOAD_FILE', 'REDIRECT_LINK']),
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.string().optional(),
    redirectUrl: z.string().optional(),

    // PHYSICAL
    stock: z.number().min(0).optional().nullable(),
    estimatedFulfillment: z.string().optional(),

    // EXTERNAL_LINK
    destinationUrl: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.type === 'LEAD_MAGNET' && data.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Quà tặng 0đ (Lead Magnet) có giá cố định là 0 VNĐ'
      });
    }

    if (
      (data.type === 'DIGITAL' || data.type === 'LEAD_MAGNET') &&
      data.deliveryType === 'REDIRECT_LINK' &&
      (!data.redirectUrl || data.redirectUrl.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['redirectUrl'],
        message: 'Vui lòng dán đường link tài nguyên bảo mật'
      });
    }

    if (
      data.type === 'EXTERNAL_LINK' &&
      (!data.destinationUrl || data.destinationUrl.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationUrl'],
        message: 'Vui lòng nhập đường link chuyển hướng đích'
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductFormProps {
  initialProduct?: Product | null;
  initialType?: ProductType;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

// Helper định dạng tiền VNĐ có dấu chấm hàng nghìn
const formatCurrencyDisplay = (num?: number | null) => {
  if (num === undefined || num === null || isNaN(num) || num === 0) return '';
  return new Intl.NumberFormat('vi-VN').format(num);
};

const parseCurrencyInput = (str: string) => {
  const clean = str.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export function ProductForm({
  initialProduct,
  initialType,
  onSuccess,
  onCancel
}: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile = defaultCreatorProfile } = useQuery(profileQueryOptions());
  const { data: paymentConfig = defaultPaymentConfig } = useQuery(paymentConfigQueryOptions());
  const { data: existingProducts = [] } = useQuery(productsQueryOptions());

  const [isUploadingThumb, setIsUploadingThumb] = React.useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = React.useState(false);
  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'desktop'>('mobile');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
  const digitalUploadRef = React.useRef<HTMLInputElement>(null);

  const isEditMode = !!initialProduct;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      type: initialProduct?.type || initialType || 'DIGITAL',
      title: initialProduct?.title || '',
      subtitle: initialProduct?.subtitle || '',
      coverImage: initialProduct?.coverImage || '',
      featureImage: initialProduct?.bannerImage || '',
      description: initialProduct?.description || '',
      price: initialProduct
        ? initialProduct.type === 'LEAD_MAGNET'
          ? 0
          : initialProduct.price
        : 149000,
      hasDiscount: !!initialProduct?.originalPrice,
      originalPrice: initialProduct?.originalPrice ?? null,
      isPublished: initialProduct ? initialProduct.isPublished : true,
      buttonText: initialProduct?.buttonText || 'Mua ngay',

      deliveryType: initialProduct?.deliveryType || 'UPLOAD_FILE',
      fileUrl: initialProduct?.fileUrl || '',
      fileName: initialProduct?.fileName || '',
      fileSize: initialProduct?.fileSize || '',
      redirectUrl: initialProduct?.fileUrl || '',

      stock: initialProduct?.stock !== undefined ? initialProduct.stock : 50,
      estimatedFulfillment: initialProduct?.estimatedFulfillment || '3 - 5 ngày làm việc',

      destinationUrl: initialProduct?.externalUrl || ''
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

  const watchedValues = watch();

  // Reset form khi có initialProduct hoặc initialType
  React.useEffect(() => {
    if (initialProduct) {
      form.reset({
        type: initialProduct.type,
        title: initialProduct.title || '',
        subtitle: initialProduct.subtitle || '',
        coverImage: initialProduct.coverImage || '',
        featureImage: initialProduct.bannerImage || '',
        description: initialProduct.description || '',
        price: initialProduct.type === 'LEAD_MAGNET' ? 0 : (initialProduct.price ?? 0),
        hasDiscount: !!initialProduct.originalPrice,
        originalPrice: initialProduct.originalPrice ?? null,
        isPublished: initialProduct.isPublished ?? true,
        buttonText: initialProduct.buttonText || 'Mua ngay',

        deliveryType: initialProduct.deliveryType || 'UPLOAD_FILE',
        fileUrl: initialProduct.fileUrl || '',
        fileName: initialProduct.fileName || '',
        fileSize: initialProduct.fileSize || '',
        redirectUrl: initialProduct.fileUrl || '',

        stock: initialProduct.stock !== undefined ? initialProduct.stock : 50,
        estimatedFulfillment: initialProduct.estimatedFulfillment || '3 - 5 ngày làm việc',

        destinationUrl: initialProduct.externalUrl || ''
      });
    } else if (initialType) {
      setValue('type', initialType);
      if (initialType === 'LEAD_MAGNET') {
        setValue('price', 0);
        setValue('buttonText', 'Nhận ngay');
      } else if (initialType === 'PHYSICAL') {
        setValue('buttonText', 'Đặt trước');
      } else if (initialType === 'EXTERNAL_LINK') {
        setValue('buttonText', 'Mở liên kết');
      }
    }
  }, [initialProduct, initialType, form, setValue]);

  // Thay đổi loại sản phẩm
  const handleTypeChange = (newType: ProductType) => {
    setValue('type', newType);
    if (newType === 'LEAD_MAGNET') {
      setValue('price', 0);
      setValue('hasDiscount', false);
      setValue('originalPrice', null);
      if (!watchedValues.buttonText || watchedValues.buttonText === 'Mua ngay') {
        setValue('buttonText', 'Nhận ngay');
      }
    } else if (newType === 'PHYSICAL') {
      if (!watchedValues.buttonText || watchedValues.buttonText === 'Mua ngay') {
        setValue('buttonText', 'Đặt trước');
      }
    } else if (newType === 'EXTERNAL_LINK') {
      if (!watchedValues.buttonText || watchedValues.buttonText === 'Mua ngay') {
        setValue('buttonText', 'Mở liên kết');
      }
    } else {
      if (
        !watchedValues.buttonText ||
        watchedValues.buttonText === 'Nhận ngay' ||
        watchedValues.buttonText === 'Đặt trước' ||
        watchedValues.buttonText === 'Mở liên kết'
      ) {
        setValue('buttonText', 'Mua ngay');
      }
    }
  };

  // Upload Thumbnail 1:1
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chỉ chọn tệp hình ảnh (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    setIsUploadingThumb(true);
    try {
      const res = await uploadClientFile(file, 'products');
      setValue('coverImage', res.url, { shouldValidate: true, shouldDirty: true });
      toast.success('Tải ảnh đại diện thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi tải ảnh lên');
    } finally {
      setIsUploadingThumb(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Upload Banner 16:9
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chỉ chọn tệp hình ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng ảnh bìa tối đa là 10MB');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const res = await uploadClientFile(file, 'products');
      setValue('featureImage', res.url, { shouldValidate: true, shouldDirty: true });
      toast.success('Tải ảnh bìa thành công!');
    } catch {
      toast.error('Có lỗi xảy ra khi tải ảnh bìa');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  // Upload File giao cho khách
  const handleDigitalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Đang tải lên tệp: ${file.name}...`);
    try {
      const res = await uploadClientFile(file, 'products');
      setValue('fileUrl', res.url);
      setValue('fileName', file.name);
      setValue('fileSize', `${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      toast.success('Tải tệp tài nguyên lên máy chủ thành công!', { id: toastId });
    } catch {
      toast.error('Có lỗi xảy ra khi tải tệp lên', { id: toastId });
    } finally {
      if (digitalUploadRef.current) digitalUploadRef.current.value = '';
    }
  };

  // Mutation lưu sản phẩm với TanStack Query
  const saveProductMutation = useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      if (isEditMode && initialProduct) {
        return await updateProduct(initialProduct.id, payload);
      } else {
        return await createProduct(payload as any);
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.products() });
      queryClient.invalidateQueries({ queryKey: tiemNhoKeys.analytics() });
      if (isEditMode && initialProduct) {
        queryClient.invalidateQueries({ queryKey: tiemNhoKeys.productDetail(initialProduct.id) });
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        toast.success('Đã tạo và đưa sản phẩm lên gian hàng!');
      }

      if (onSuccess) {
        onSuccess(saved);
      } else {
        router.push('/dashboard/products');
      }
    },
    onError: () => {
      toast.error('Có lỗi xảy ra khi lưu sản phẩm.');
    }
  });

  const loading = saveProductMutation.isPending;

  // Xử lý lưu form
  const onSubmit = (values: ProductFormValues) => {
    const payload: Partial<Product> = {
      creatorId: profile.id,
      type: values.type,
      title: values.title.trim(),
      subtitle: values.subtitle?.trim() || undefined,
      description: values.description?.trim() || '',
      price: values.type === 'LEAD_MAGNET' ? 0 : values.price,
      originalPrice:
        values.hasDiscount && values.originalPrice ? Number(values.originalPrice) : undefined,
      buttonText: values.buttonText?.trim() || 'Mua ngay',
      coverImage: values.coverImage || PRESET_COVERS[0],
      bannerImage: values.featureImage || undefined,
      deliveryType: values.deliveryType,
      fileUrl: values.deliveryType === 'REDIRECT_LINK' ? values.redirectUrl : values.fileUrl,
      fileName: values.fileName,
      fileSize: values.fileSize,
      stock: values.type === 'PHYSICAL' ? (values.stock ?? 50) : 999,
      estimatedFulfillment: values.type === 'PHYSICAL' ? values.estimatedFulfillment : undefined,
      externalUrl: values.type === 'EXTERNAL_LINK' ? values.destinationUrl : undefined,
      isPublished: values.isPublished,
      isFeatured: true
    };

    saveProductMutation.mutate(payload);
  };

  // Real-time Virtual Preview Product
  const previewProduct: Product = React.useMemo(() => {
    const defaultBtn =
      watchedValues.type === 'LEAD_MAGNET'
        ? 'Nhận ngay'
        : watchedValues.type === 'PHYSICAL'
          ? 'Đặt trước'
          : watchedValues.type === 'EXTERNAL_LINK'
            ? 'Mở liên kết'
            : 'Mua ngay';

    return {
      id: initialProduct?.id || 'preview-draft',
      creatorId: profile.id,
      type: watchedValues.type,
      title: watchedValues.title?.trim() || 'Tên sản phẩm của bạn',
      subtitle: watchedValues.subtitle?.trim() || '',
      description:
        watchedValues.description?.trim() ||
        'Mô tả chi tiết giá trị tài nguyên số hoặc sản phẩm cá nhân của bạn.',
      price: watchedValues.type === 'LEAD_MAGNET' ? 0 : (watchedValues.price ?? 0),
      originalPrice:
        watchedValues.hasDiscount && watchedValues.originalPrice
          ? Number(watchedValues.originalPrice)
          : undefined,
      coverImage: watchedValues.coverImage || PRESET_COVERS[0],
      bannerImage: watchedValues.featureImage,
      fileUrl:
        watchedValues.deliveryType === 'REDIRECT_LINK'
          ? watchedValues.redirectUrl
          : watchedValues.fileUrl,
      fileName: watchedValues.fileName,
      fileSize: watchedValues.fileSize,
      deliveryType: watchedValues.deliveryType,
      estimatedFulfillment: watchedValues.estimatedFulfillment,
      externalUrl: watchedValues.destinationUrl,
      buttonText: watchedValues.buttonText?.trim() || defaultBtn,
      isPublished: watchedValues.isPublished,
      isFeatured: true,
      stock: watchedValues.stock ?? 50,
      displayOrder: 0,
      soldCount: initialProduct?.soldCount || 128,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [watchedValues, profile.id, initialProduct]);

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

  const hasCoverImage = Boolean(watchedValues.coverImage);
  const coverButtonText = hasCoverImage ? 'Đổi ảnh' : 'Tải ảnh';

  return (
    <div className='w-full max-w-[1600px] mx-auto space-y-6 pb-24'>
      {/* Main 2-Column Grid (Bố cục 65% Biểu mẫu - 35% Khung xem trước cố định) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-1'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: BIỂU MẪU NHẬP LIỆU (CHIẾM ~65% BỀ NGANG)         */}
        {/* ========================================================= */}
        <div className='lg:col-span-8 xl:col-span-8 space-y-6'>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* ----------------------------------------------------- */}
            {/* THẺ 1: THẺ HIỂN THỊ VÀ GIÁ BÁN                        */}
            {/* ----------------------------------------------------- */}
            <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-card p-6 md:p-8 shadow-xs space-y-6 mb-6'>
              {/* Trạng thái mở bán */}
              <div className='flex items-center justify-between pb-3.5 border-b border-neutral-100 dark:border-neutral-800/80'>
                <span className='text-xs font-bold text-neutral-900 dark:text-white'>
                  Trạng thái hiển thị trên Tiệm
                </span>
                <Controller
                  control={control}
                  name='isPublished'
                  render={({ field }) => (
                    <div className='flex items-center gap-2'>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                      <span className='text-xs font-bold text-neutral-900 dark:text-white'>
                        {field.value ? 'Đang mở bán' : 'Ẩn sản phẩm'}
                      </span>
                    </div>
                  )}
                />
              </div>

              {/* 1.1 Ô chọn ảnh đại diện vuông */}
              <div className='space-y-2'>
                <label className='text-sm font-bold text-neutral-900 dark:text-white block'>
                  Ảnh đại diện sản phẩm <span className='text-[#FE2C55]'>*</span>
                </label>

                <div className='flex items-center gap-4 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30'>
                  <input
                    type='file'
                    ref={fileInputRef}
                    onChange={handleCoverUpload}
                    accept='image/*'
                    className='hidden'
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-2xs'
                  >
                    {hasCoverImage ? (
                      <img
                        src={watchedValues.coverImage}
                        alt='Thumbnail'
                        className='w-full h-full object-cover transition-transform group-hover:scale-105 duration-200'
                      />
                    ) : (
                      <div className='flex flex-col items-center justify-center text-neutral-400 group-hover:text-primary transition-colors p-2 text-center'>
                        <Camera className='w-6 h-6 mb-1' />
                        <span className='text-[10px] font-semibold'>Tải ảnh</span>
                      </div>
                    )}
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1'>
                      <Upload className='w-4 h-4' />
                      <span>{coverButtonText}</span>
                    </div>
                  </div>

                  <div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingThumb}
                      className='h-9 text-xs font-semibold rounded-xl gap-2 cursor-pointer'
                    >
                      <Upload className='w-3.5 h-3.5' />
                      <span>
                        {isUploadingThumb
                          ? 'Đang tải lên...'
                          : watchedValues.coverImage
                            ? 'Thay ảnh khác'
                            : 'Chọn ảnh từ máy'}
                      </span>
                    </Button>
                  </div>
                </div>
                {errors.coverImage && (
                  <p className='text-xs text-destructive font-medium'>
                    {errors.coverImage.message}
                  </p>
                )}
              </div>

              {/* 1.2 Tiêu đề sản phẩm * */}
              <div className='space-y-2'>
                <label className='text-sm font-bold text-neutral-900 dark:text-white block'>
                  Tiêu đề sản phẩm <span className='text-[#FE2C55]'>*</span>
                </label>
                <Input
                  {...register('title')}
                  maxLength={60}
                  placeholder='VD: Bộ 100 Hook Viral & Kịch Bản Triệu View TikTok'
                  className='h-11 text-sm md:text-base font-medium rounded-xl'
                />
                {errors.title && (
                  <p className='text-xs text-destructive font-medium'>{errors.title.message}</p>
                )}
              </div>

              {/* 1.3 Dòng tóm tắt ngắn */}
              <div className='space-y-2'>
                <label className='text-sm font-bold text-neutral-900 dark:text-white block'>
                  Dòng tóm tắt ngắn
                </label>
                <Input
                  {...register('subtitle')}
                  maxLength={100}
                  placeholder='VD: Nhận ngay bộ 13 kịch bản triệu view hoặc Never run out of ideas'
                  className='h-11 text-sm rounded-xl'
                />
              </div>

              {/* 1.4 Hàng giá bán gồm hai cột song song */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1'>
                {/* Cột 1: Giá bán thực tế (VNĐ) * */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-bold text-neutral-900 dark:text-white block'>
                      Giá bán thực tế (VNĐ) <span className='text-[#FE2C55]'>*</span>
                    </label>
                    {watchedValues.type === 'LEAD_MAGNET' && (
                      <Badge
                        variant='outline'
                        className='text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      >
                        Khóa 0đ
                      </Badge>
                    )}
                  </div>
                  <div className='relative'>
                    <Input
                      type='text'
                      inputMode='numeric'
                      disabled={watchedValues.type === 'LEAD_MAGNET'}
                      value={
                        watchedValues.type === 'LEAD_MAGNET'
                          ? '0'
                          : watchedValues.price
                            ? formatCurrencyDisplay(watchedValues.price)
                            : ''
                      }
                      onChange={(e) => {
                        const parsed = parseCurrencyInput(e.target.value);
                        setValue('price', parsed, { shouldValidate: true });
                      }}
                      placeholder='149.000'
                      className={cn(
                        'h-11 text-sm md:text-base font-semibold rounded-xl pr-12 font-mono',
                        watchedValues.type === 'LEAD_MAGNET' &&
                          'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-80'
                      )}
                    />
                    <span className='absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400'>
                      VNĐ
                    </span>
                  </div>
                  {errors.price && (
                    <p className='text-xs text-destructive font-medium'>{errors.price.message}</p>
                  )}
                </div>

                {/* Cột 2: Giá gốc niêm yết (kèm nút gạt Switch) */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <label className='text-sm font-bold text-neutral-900 dark:text-white block'>
                      Giá gốc niêm yết
                    </label>
                    <Controller
                      control={control}
                      name='hasDiscount'
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          disabled={watchedValues.type === 'LEAD_MAGNET'}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className='relative'>
                    <Input
                      type='text'
                      inputMode='numeric'
                      disabled={!watchedValues.hasDiscount || watchedValues.type === 'LEAD_MAGNET'}
                      value={
                        watchedValues.originalPrice
                          ? formatCurrencyDisplay(watchedValues.originalPrice)
                          : ''
                      }
                      onChange={(e) => {
                        const parsed = parseCurrencyInput(e.target.value);
                        setValue('originalPrice', parsed);
                      }}
                      placeholder='350.000'
                      className={cn(
                        'h-11 text-sm md:text-base font-semibold rounded-xl pr-12 font-mono',
                        (!watchedValues.hasDiscount || watchedValues.type === 'LEAD_MAGNET') &&
                          'bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed opacity-60'
                      )}
                    />
                    <span className='absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400'>
                      VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* 1.5 Chữ trên nút bấm * */}
              <div className='space-y-2 pt-1'>
                <label className='text-sm font-bold text-neutral-900 dark:text-white block'>
                  Chữ trên nút bấm <span className='text-[#FE2C55]'>*</span>
                </label>
                <Input
                  {...register('buttonText')}
                  maxLength={30}
                  placeholder='Mua ngay'
                  className='h-11 text-sm rounded-xl'
                />
                {/* Các ô chọn nhanh: Mua ngay, Tải ngay, Đặt trước */}
                <div className='flex items-center gap-2 flex-wrap pt-1'>
                  {['Mua ngay', 'Tải ngay', 'Đặt trước', 'Nhận tài liệu'].map((label) => (
                    <button
                      key={label}
                      type='button'
                      onClick={() => setValue('buttonText', label, { shouldValidate: true })}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium',
                        watchedValues.buttonText === label
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-2xs'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* THẺ 2: BÀI VIẾT MÔ TẢ CHI TIẾT                        */}
            {/* ----------------------------------------------------- */}
            <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-card p-6 md:p-8 shadow-xs space-y-6 mb-6'>
              <h2 className='text-base font-bold text-neutral-900 dark:text-white tracking-tight pb-3 border-b border-neutral-100 dark:border-neutral-800/80'>
                Bài viết mô tả chi tiết
              </h2>

              {/* 2.1 Ảnh bìa nổi bật */}
              <div className='space-y-2'>
                <label className='text-sm font-bold text-neutral-900 dark:text-white block'>
                  Ảnh bìa nổi bật
                </label>

                <input
                  type='file'
                  ref={bannerInputRef}
                  onChange={handleBannerUpload}
                  accept='image/*'
                  className='hidden'
                />
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className='relative group w-full aspect-video sm:h-44 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary transition-all flex items-center justify-center cursor-pointer shadow-2xs'
                >
                  {watchedValues.featureImage ? (
                    <img
                      src={watchedValues.featureImage}
                      alt='Ảnh bìa 16:9'
                      className='w-full h-full object-cover transition-transform group-hover:scale-105 duration-200'
                    />
                  ) : (
                    <div className='flex flex-col items-center justify-center text-neutral-400 group-hover:text-primary transition-colors p-4 text-center'>
                      <ImageIcon className='w-8 h-8 mb-1.5' />
                      <span className='text-xs font-semibold'>Tải ảnh bìa (16:9)</span>
                    </div>
                  )}
                  <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5'>
                    <Upload className='w-4 h-4' />
                    <span>{watchedValues.featureImage ? 'Thay ảnh bìa khác' : 'Tải ảnh bìa'}</span>
                  </div>
                </div>
              </div>

              {/* 2.2 Mô tả chi tiết sản phẩm * */}
              <div className='space-y-2'>
                <ProductDescriptionEditor
                  value={watchedValues.description || ''}
                  onChange={(val) =>
                    setValue('description', val, { shouldValidate: true, shouldDirty: true })
                  }
                  productTitle={watchedValues.title}
                  error={errors.description?.message}
                  required={true}
                  label='Mô tả chi tiết sản phẩm'
                />
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* THẺ 3: TÀI NGUYÊN GIAO CHO KHÁCH                      */}
            {/* ----------------------------------------------------- */}
            <div className='rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-card p-6 md:p-8 shadow-xs space-y-6 mb-6'>
              {/* Chuyển đổi giữa hai thẻ theo yêu cầu */}
              {watchedValues.type === 'DIGITAL' || watchedValues.type === 'LEAD_MAGNET' ? (
                <div className='space-y-4'>
                  <div className='inline-flex p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-xs w-full sm:w-auto'>
                    <button
                      type='button'
                      onClick={() => setValue('deliveryType', 'UPLOAD_FILE')}
                      className={cn(
                        'flex-1 sm:flex-initial px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer text-center',
                        watchedValues.deliveryType === 'UPLOAD_FILE'
                          ? 'bg-white dark:bg-card text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      )}
                    >
                      Tải tệp lên máy chủ
                    </button>
                    <button
                      type='button'
                      onClick={() => setValue('deliveryType', 'REDIRECT_LINK')}
                      className={cn(
                        'flex-1 sm:flex-initial px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer text-center',
                        watchedValues.deliveryType === 'REDIRECT_LINK'
                          ? 'bg-white dark:bg-card text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      )}
                    >
                      Dán liên kết bí mật
                    </button>
                  </div>

                  {watchedValues.deliveryType === 'UPLOAD_FILE' ? (
                    <div className='space-y-3'>
                      <input
                        type='file'
                        ref={digitalUploadRef}
                        onChange={handleDigitalFileUpload}
                        accept='.pdf,.zip,.epub,.xlsx,.xls'
                        className='hidden'
                      />
                      <div
                        onClick={() => digitalUploadRef.current?.click()}
                        className='p-7 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-neutral-50/50 dark:bg-neutral-900/30 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 group'
                      >
                        <div className='w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110'>
                          <Upload className='w-5 h-5' />
                        </div>
                        <div className='text-xs font-semibold text-neutral-800 dark:text-neutral-200'>
                          Bấm hoặc kéo thả để tải tệp lên (.pdf, .zip, .epub, .xlsx)
                        </div>
                      </div>

                      {watchedValues.fileName && (
                        <div className='p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card flex items-center justify-between shadow-2xs'>
                          <div className='flex items-center gap-3 min-w-0'>
                            <div className='h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0'>
                              <FileCheck className='w-5 h-5' />
                            </div>
                            <div className='min-w-0'>
                              <div className='text-xs font-bold text-neutral-900 dark:text-white truncate font-mono'>
                                {watchedValues.fileName}
                              </div>
                              <div className='text-[11px] text-neutral-500'>
                                {watchedValues.fileSize || 'Đã sẵn sàng'}
                              </div>
                            </div>
                          </div>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => digitalUploadRef.current?.click()}
                            className='h-8 text-xs text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                          >
                            Đổi tệp
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='space-y-2 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 p-4'>
                      <label className='font-bold text-neutral-900 dark:text-white text-xs block'>
                        Liên kết bí mật <span className='text-[#FE2C55]'>*</span>
                      </label>
                      <Input
                        {...register('redirectUrl')}
                        placeholder='https://notion.so/... hoặc https://drive.google.com/...'
                        className='h-11 text-xs rounded-xl font-mono bg-white dark:bg-card'
                      />
                      {errors.redirectUrl && (
                        <p className='text-[11px] text-destructive font-medium'>
                          {errors.redirectUrl.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : watchedValues.type === 'PHYSICAL' ? (
                <div className='space-y-4'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <label className='font-bold text-neutral-900 dark:text-white text-xs block'>
                        Giới hạn tồn kho / nhận đơn (stock)
                      </label>
                      <Input
                        type='number'
                        value={watchedValues.stock ?? ''}
                        onChange={(e) =>
                          setValue('stock', e.target.value === '' ? null : Number(e.target.value))
                        }
                        placeholder='50'
                        className='h-11 text-sm rounded-xl font-mono'
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='font-bold text-neutral-900 dark:text-white text-xs block'>
                        Thời gian hoàn thiện dự kiến
                      </label>
                      <Input
                        {...register('estimatedFulfillment')}
                        placeholder='VD: 3 - 5 ngày làm việc'
                        className='h-11 text-sm rounded-xl'
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* EXTERNAL_LINK */
                <div className='space-y-2 rounded-xl bg-neutral-50/70 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-800 p-4'>
                  <label className='font-bold text-neutral-900 dark:text-white text-xs block'>
                    Đường link chuyển hướng đích <span className='text-[#FE2C55]'>*</span>
                  </label>
                  <Input
                    {...register('destinationUrl')}
                    placeholder='https://shopee.vn/... hoặc https://tiktok.com/@...'
                    className='h-11 text-xs sm:text-sm rounded-xl font-mono bg-white dark:bg-card'
                  />
                  {errors.destinationUrl && (
                    <p className='text-[11px] text-destructive font-medium'>
                      {errors.destinationUrl.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ----------------------------------------------------- */}
            {/* THANH HÀNH ĐỘNG DÍNH CHẶT ĐÁY (STICKY BOTTOM ACTION BAR) */}
            {/* ----------------------------------------------------- */}
            <div
              className='fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200/90 dark:border-neutral-800 px-4 py-3 lg:sticky lg:bottom-4 lg:z-20 lg:rounded-2xl lg:border lg:py-3.5 lg:px-6 lg:shadow-lg lg:mt-6 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
              <div className='flex items-center gap-3 sm:gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleBack}
                  className='h-10 px-4 text-xs font-semibold rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer'
                >
                  Hủy
                </Button>
                <div className='flex items-center gap-2 pl-2 sm:pl-3 border-l border-neutral-200 dark:border-neutral-700'>
                  <Controller
                    control={control}
                    name='isPublished'
                    render={({ field }) => (
                      <div className='flex items-center gap-2'>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <span className='text-xs font-semibold text-neutral-600 dark:text-neutral-400 hidden xs:inline'>
                          {field.value ? 'Mở bán' : 'Ẩn'}
                        </span>
                      </div>
                    )}
                  />
                </div>
              </div>
              <Button
                type='submit'
                disabled={loading}
                className='h-10 px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]'
              >
                {loading ? (
                  <>
                    <Icons.spinner className='h-4 w-4 animate-spin' />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Icons.check className='w-4 h-4 stroke-[2.5]' />
                    <span>{isEditMode ? 'Cập nhật sản phẩm' : 'Lưu và Đưa lên Tiệm'}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: KHUNG XEM TRƯỚC TRỰC TIẾP (CỐ ĐỊNH KHI CUỘN)    */}
        {/* ========================================================= */}
        <div className='lg:col-span-4 xl:col-span-4 hidden lg:block sticky top-6 space-y-4'>
          {/* Thanh chuyển đổi xem trước phía trên khung: Điện thoại / Máy tính */}
          <div className='flex items-center justify-center'>
            <div className='inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-xs shadow-xs'>
              <button
                type='button'
                onClick={() => setPreviewDevice('mobile')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer',
                  previewDevice === 'mobile'
                    ? 'bg-white dark:bg-card text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <Smartphone className='w-4 h-4' />
                <span>Điện thoại</span>
              </button>
              <button
                type='button'
                onClick={() => setPreviewDevice('desktop')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer',
                  previewDevice === 'desktop'
                    ? 'bg-white dark:bg-card text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                <Monitor className='w-4 h-4' />
                <span>Máy tính</span>
              </button>
            </div>
          </div>

          {/* Khung mô phỏng hiển thị thời gian thực */}
          <div className='relative'>
            <div className='absolute -inset-1 rounded-[44px] bg-gradient-to-tr from-[#FE2C55]/20 via-primary/10 to-blue-500/20 blur-2xl opacity-40' />
            <PhoneMockup
              profile={profile}
              products={previewProductsList}
              paymentConfig={paymentConfig}
              deviceMode={previewDevice}
              activeProduct={previewProduct}
              className='shadow-2xl'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
