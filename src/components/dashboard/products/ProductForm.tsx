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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80'
];

export const productFormSchema = z
  .object({
    type: z.enum(['DIGITAL', 'LEAD_MAGNET', 'PHYSICAL', 'EXTERNAL_LINK']),
    title: z.string().min(1, 'Tiêu đề sản phẩm là bắt buộc').max(100, 'Tiêu đề tối đa 100 ký tự'),
    coverImage: z.string().optional(),
    description: z.string().max(200, 'Mô tả tối đa 200 ký tự').optional(),
    price: z.number().min(0, 'Giá bán không được âm'),
    isPublished: z.boolean(),
    buttonText: z.string().optional(),

    // DIGITAL & LEAD_MAGNET fulfillment
    deliveryType: z.enum(['UPLOAD_FILE', 'REDIRECT_LINK']),
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.string().optional(),
    redirectUrl: z.string().optional(),
    successMessage: z.string().optional(),

    // PHYSICAL fulfillment
    stock: z.number().min(0, 'Số lượng không được âm').optional().nullable(),
    estimatedFulfillment: z.string().optional(),
    variants: z.array(z.string()),
    enableZaloConfirm: z.boolean(),

    // EXTERNAL_LINK fulfillment
    destinationUrl: z.string().optional(),
    iconType: z
      .enum([
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
      ])
      .optional(),
    openInNewTab: z.boolean()
  })
  .superRefine((data, ctx) => {
    // Lead magnet must have price = 0
    if (data.type === 'LEAD_MAGNET' && data.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Quà tặng 0đ (Lead Magnet) có giá cố định là 0 VNĐ'
      });
    }

    // Digital or Lead Magnet with REDIRECT_LINK must have a redirectUrl
    if (
      (data.type === 'DIGITAL' || data.type === 'LEAD_MAGNET') &&
      data.deliveryType === 'REDIRECT_LINK' &&
      (!data.redirectUrl || data.redirectUrl.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['redirectUrl'],
        message: 'Vui lòng dán đường link tài nguyên bảo mật (Google Drive, Notion, Canva)'
      });
    }

    // External link requires destinationUrl
    if (
      data.type === 'EXTERNAL_LINK' &&
      (!data.destinationUrl || data.destinationUrl.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationUrl'],
        message: 'Vui lòng nhập đường link chuyển hướng đích (Shopee, TikTok Shop, Zalo)'
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export interface ProductFormProps {
  initialProduct?: Product | null;
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
}

export function ProductForm({ initialProduct, onSuccess, onCancel }: ProductFormProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<CreatorProfile>(defaultCreatorProfile);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig>(defaultPaymentConfig);
  const [existingProducts, setExistingProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [newVariantInput, setNewVariantInput] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const digitalUploadRef = React.useRef<HTMLInputElement>(null);

  const isEditMode = !!initialProduct;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      type: initialProduct?.type || 'DIGITAL',
      title: initialProduct?.title || '',
      coverImage: initialProduct?.coverImage || PRESET_COVERS[0],
      description: initialProduct?.description || '',
      price: initialProduct ? initialProduct.price : 149000,
      isPublished: initialProduct ? initialProduct.isPublished : true,
      buttonText: initialProduct?.buttonText || '',

      deliveryType:
        initialProduct?.deliveryType ||
        (initialProduct?.fileUrl?.startsWith('http') && !initialProduct.fileName
          ? 'REDIRECT_LINK'
          : 'UPLOAD_FILE'),
      fileUrl: initialProduct?.fileUrl || '',
      fileName: initialProduct?.fileName || 'Template-Notion-2025.pdf',
      fileSize: initialProduct?.fileSize || '12.4 MB',
      redirectUrl: initialProduct?.fileUrl || 'https://notion.so/giangdinh/template-notion-creator',
      successMessage: initialProduct?.successMessage || 'Tài liệu đã được gửi vào Email của bạn!',

      stock: initialProduct?.stock !== undefined ? initialProduct.stock : 50,
      estimatedFulfillment: initialProduct?.estimatedFulfillment || 'Giao sau 3-5 ngày làm việc',
      variants: initialProduct?.variants || ['Size M', 'Size L', 'Màu Đen'],
      enableZaloConfirm: initialProduct?.enableZaloConfirm ?? true,

      destinationUrl: initialProduct?.externalUrl || 'https://shopee.vn/gian-hang-chinh-hang',
      iconType: initialProduct?.iconType || 'shopee',
      openInNewTab: initialProduct?.openInNewTab ?? true
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

  // Load creator profile & existing products for Live Mockup
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
        // fallback to defaults
      }
    }
    loadData();
  }, []);

  // When type changes: If LEAD_MAGNET, lock price to 0
  React.useEffect(() => {
    if (watchedValues.type === 'LEAD_MAGNET') {
      setValue('price', 0);
    } else if (watchedValues.type === 'DIGITAL' && watchedValues.price === 0) {
      setValue('price', 149000);
    } else if (watchedValues.type === 'PHYSICAL' && watchedValues.price === 0) {
      setValue('price', 250000);
    }
  }, [watchedValues.type, setValue, watchedValues.price]);

  // Handle Cover Image Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('coverImage', reader.result as string);
        setIsUploading(false);
        toast.success('Đã tải ảnh thumbnail thành công!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Digital File Upload Simulation
  const handleDigitalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setValue('fileName', file.name);
      setValue('fileSize', `${sizeMb} MB`);
      setValue('fileUrl', `https://storage.tiemnho.vn/r2/files/${file.name}`);
      toast.success(`Đã chuẩn bị file đính kèm: ${file.name} (${sizeMb} MB)`);
    }
  };

  // Handle adding variants
  const handleAddVariant = () => {
    const trimmed = newVariantInput.trim();
    if (!trimmed) return;
    const currentVariants = watchedValues.variants || [];
    if (!currentVariants.includes(trimmed)) {
      setValue('variants', [...currentVariants, trimmed]);
      setNewVariantInput('');
    } else {
      toast.error('Phân loại này đã tồn tại');
    }
  };

  const handleRemoveVariant = (indexToRemove: number) => {
    const currentVariants = watchedValues.variants || [];
    setValue(
      'variants',
      currentVariants.filter((_, idx) => idx !== indexToRemove)
    );
  };

  // Submit Handler
  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      const finalFileUrl =
        values.type === 'EXTERNAL_LINK'
          ? undefined
          : values.deliveryType === 'REDIRECT_LINK'
            ? values.redirectUrl?.trim()
            : values.fileUrl;

      const finalFileName =
        values.type === 'EXTERNAL_LINK' || values.deliveryType === 'REDIRECT_LINK'
          ? undefined
          : values.fileName;

      const finalFileSize =
        values.type === 'EXTERNAL_LINK' || values.deliveryType === 'REDIRECT_LINK'
          ? undefined
          : values.fileSize;

      let savedProduct: Product;

      if (isEditMode && initialProduct) {
        savedProduct = await updateProduct(initialProduct.id, {
          type: values.type,
          title: values.title.trim(),
          description: values.description?.trim() || '',
          price: values.type === 'LEAD_MAGNET' ? 0 : values.price,
          coverImage: values.coverImage || PRESET_COVERS[0],
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          deliveryType: values.deliveryType,
          successMessage: values.type === 'LEAD_MAGNET' ? values.successMessage?.trim() : undefined,
          estimatedFulfillment:
            values.type === 'PHYSICAL' ? values.estimatedFulfillment?.trim() : undefined,
          variants: values.type === 'PHYSICAL' ? values.variants : undefined,
          enableZaloConfirm: values.type === 'PHYSICAL' ? values.enableZaloConfirm : undefined,
          externalUrl: values.type === 'EXTERNAL_LINK' ? values.destinationUrl?.trim() : undefined,
          iconType: values.type === 'EXTERNAL_LINK' ? values.iconType : undefined,
          openInNewTab: values.type === 'EXTERNAL_LINK' ? values.openInNewTab : undefined,
          buttonText: values.buttonText?.trim() || undefined,
          isPublished: values.isPublished,
          stock: values.type === 'PHYSICAL' ? (values.stock ?? 999) : 999
        });
        toast.success('Đã cập nhật sản phẩm thành công!');
      } else {
        savedProduct = await createProduct({
          type: values.type,
          title: values.title.trim(),
          description: values.description?.trim() || '',
          price: values.type === 'LEAD_MAGNET' ? 0 : values.price,
          coverImage: values.coverImage || PRESET_COVERS[0],
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          fileSize: finalFileSize,
          deliveryType: values.deliveryType,
          successMessage: values.type === 'LEAD_MAGNET' ? values.successMessage?.trim() : undefined,
          estimatedFulfillment:
            values.type === 'PHYSICAL' ? values.estimatedFulfillment?.trim() : undefined,
          variants: values.type === 'PHYSICAL' ? values.variants : undefined,
          enableZaloConfirm: values.type === 'PHYSICAL' ? values.enableZaloConfirm : undefined,
          externalUrl: values.type === 'EXTERNAL_LINK' ? values.destinationUrl?.trim() : undefined,
          iconType: values.type === 'EXTERNAL_LINK' ? values.iconType : undefined,
          openInNewTab: values.type === 'EXTERNAL_LINK' ? values.openInNewTab : undefined,
          buttonText: values.buttonText?.trim() || undefined,
          isPublished: values.isPublished,
          isFeatured: false,
          stock: values.type === 'PHYSICAL' ? (values.stock ?? 999) : 999
        });
        toast.success('Đã tạo và đưa sản phẩm lên gian hàng thành công!');
      }

      if (onSuccess) {
        onSuccess(savedProduct);
      } else {
        router.push('/dashboard/products');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time Virtual Preview Product
  const previewProduct: Product = React.useMemo(() => {
    const defaultBtn =
      watchedValues.type === 'LEAD_MAGNET'
        ? 'Nhận 0đ'
        : watchedValues.type === 'PHYSICAL'
          ? watchedValues.stock !== undefined &&
            watchedValues.stock !== null &&
            watchedValues.stock <= 0
            ? 'Hết hàng'
            : 'Đặt trước'
          : watchedValues.type === 'EXTERNAL_LINK'
            ? 'Mở link'
            : 'Mua ngay';

    return {
      id: initialProduct?.id || 'preview-draft',
      creatorId: profile.id,
      type: watchedValues.type,
      title: watchedValues.title.trim() || 'Tên sản phẩm của bạn',
      description:
        watchedValues.description?.trim() ||
        'Mô tả ngắn gọn về giá trị của tài nguyên số hoặc sản phẩm cá nhân của bạn.',
      price: watchedValues.type === 'LEAD_MAGNET' ? 0 : watchedValues.price,
      coverImage: watchedValues.coverImage || PRESET_COVERS[0],
      fileUrl:
        watchedValues.deliveryType === 'REDIRECT_LINK'
          ? watchedValues.redirectUrl
          : watchedValues.fileUrl,
      fileName: watchedValues.fileName,
      fileSize: watchedValues.fileSize,
      deliveryType: watchedValues.deliveryType,
      successMessage: watchedValues.successMessage,
      estimatedFulfillment: watchedValues.estimatedFulfillment,
      variants: watchedValues.variants,
      enableZaloConfirm: watchedValues.enableZaloConfirm,
      externalUrl: watchedValues.destinationUrl,
      iconType: watchedValues.iconType,
      openInNewTab: watchedValues.openInNewTab,
      buttonText: watchedValues.buttonText?.trim() || defaultBtn,
      isPublished: watchedValues.isPublished,
      isFeatured: true,
      stock: watchedValues.stock ?? 50,
      displayOrder: 0,
      soldCount: initialProduct?.soldCount || 0,
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

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-16'>
      {/* Top Bar Header */}
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
            <h1 className='text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2'>
              {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}
            </h1>
            <p className='text-xs text-muted-foreground'>
              Thiết lập thông tin bán hàng, phương thức trả hàng tự động và xem trước trực tiếp trên
              điện thoại.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Layout (60% Form / 40% Mobile Preview) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: DYNAMIC PRODUCT FORM (60% - 7 Cols trên lg)     */}
        {/* ========================================================= */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* 1. CHỌN LOẠI SẢN PHẨM (4 ĐỊNH DẠNG THEO BUSINESS CORE) */}
            <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
              <div className='p-4 border-b border-border/60 bg-muted/20'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  1. Chọn định dạng sản phẩm
                </h3>
              </div>
              <CardContent className='p-4 pt-4'>
                <Controller
                  control={control}
                  name='type'
                  render={({ field }) => (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      {[
                        {
                          type: 'DIGITAL' as ProductType,
                          title: 'Sản phẩm số',
                          desc: 'Ebook, Template Notion, Preset, file PDF/Zip, link Canva...',
                          icon: Icons.post,
                          badge: 'File / Link bảo mật'
                        },
                        {
                          type: 'LEAD_MAGNET' as ProductType,
                          title: 'Quà tặng 0đ',
                          desc: 'Checklist, cẩm nang miễn phí nhằm thu thập Email & SĐT',
                          icon: Icons.gift,
                          badge: 'Giá cố định 0đ'
                        },
                        {
                          type: 'PHYSICAL' as ProductType,
                          title: 'Hàng vật lý',
                          desc: 'Sách in, quà tặng, đồ thủ công, sản phẩm đóng gói...',
                          icon: Icons.product,
                          badge: 'Tồn kho & Size/Màu'
                        },
                        {
                          type: 'EXTERNAL_LINK' as ProductType,
                          title: 'Nút link liên kết',
                          desc: 'Trỏ sang Shopee, TikTok Shop, nhóm Zalo kín, kênh YouTube...',
                          icon: Icons.link,
                          badge: 'Mở tab mới'
                        }
                      ].map((item) => {
                        const IconComp = item.icon;
                        const isSelected = field.value === item.type;
                        return (
                          <div
                            key={item.type}
                            onClick={() => field.onChange(item.type)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                              isSelected
                                ? 'border-[#FE2C55] bg-[#FE2C55]/5 ring-2 ring-[#FE2C55]/20 shadow-xs'
                                : 'border-border/80 bg-card hover:border-border hover:bg-muted/40'
                            }`}
                          >
                            <div className='flex items-start gap-3'>
                              <div
                                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? 'bg-[#FE2C55] text-white shadow-xs'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <IconComp className='w-4.5 h-4.5' />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between'>
                                  <span className='font-bold text-xs text-foreground'>
                                    {item.title}
                                  </span>
                                  {isSelected && (
                                    <span className='h-4 w-4 rounded-full bg-[#FE2C55] text-white flex items-center justify-center text-[10px]'>
                                      <Icons.check className='w-2.5 h-2.5' />
                                    </span>
                                  )}
                                </div>
                                <p className='text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed'>
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            {/* 2. CỤM FORM FIELDS CHUNG (HIỂN THỊ CHO MỌI LOẠI SẢN PHẨM) */}
            <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
              <div className='p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  2. Cụm trường thông tin chung
                </h3>
                <span className='text-[11px] text-muted-foreground'>
                  Hiển thị thẻ (Card) ngoài Bio Storefront
                </span>
              </div>
              <CardContent className='p-4.5 space-y-4 text-xs'>
                {/* A. Tiêu đề / Tên sản phẩm */}
                <div className='space-y-1.5'>
                  <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                    <span>
                      Tiêu đề / Tên sản phẩm <span className='text-[#FE2C55]'>*</span>
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      {watchedValues.title?.length || 0}/100 ký tự
                    </span>
                  </label>
                  <Input
                    {...register('title')}
                    placeholder='VD: Bộ template Notion Quản lý tài chính'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.title && (
                    <p className='text-[11px] text-destructive font-medium'>
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* B. Ảnh bìa / Thumbnail */}
                <div className='space-y-2 pt-1'>
                  <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                    <span>Ảnh bìa / Thumbnail (Tùy chọn)</span>
                    <span className='text-[10px] text-muted-foreground'>Tỉ lệ 1:1 hoặc 16:9</span>
                  </label>

                  <div className='flex items-start gap-4'>
                    <div className='relative h-20 w-20 rounded-2xl border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-xs'>
                      {watchedValues.coverImage ? (
                        <img
                          src={watchedValues.coverImage}
                          alt='Preview'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Icons.media className='w-6 h-6 text-muted-foreground' />
                      )}
                    </div>

                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center gap-2'>
                        <input
                          type='file'
                          ref={fileInputRef}
                          onChange={handleCoverUpload}
                          accept='image/*'
                          className='hidden'
                        />
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className='h-8.5 rounded-xl text-xs gap-1.5 cursor-pointer hover:bg-muted'
                        >
                          <Icons.upload className='w-3.5 h-3.5' />
                          {isUploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
                        </Button>
                      </div>

                      {/* Dán link ảnh trực tiếp */}
                      <Input
                        {...register('coverImage')}
                        placeholder='Hoặc dán URL ảnh bìa...'
                        className='h-8 text-xs rounded-xl font-mono'
                      />

                      {/* Ảnh mẫu có sẵn */}
                      <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
                        <span className='text-[10px] text-muted-foreground shrink-0'>Preset:</span>
                        {PRESET_COVERS.map((url, i) => (
                          <button
                            key={i}
                            type='button'
                            onClick={() => setValue('coverImage', url)}
                            className={`h-7 w-7 rounded-lg overflow-hidden border transition-all cursor-pointer shrink-0 ${
                              watchedValues.coverImage === url
                                ? 'border-[#FE2C55] ring-2 ring-[#FE2C55]/30'
                                : 'border-border/60 hover:opacity-80'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`Preset ${i}`}
                              className='h-full w-full object-cover'
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Mô tả ngắn gọn lợi ích nhận được (textarea tối đa 200 ký tự) */}
                <div className='space-y-1.5 pt-1'>
                  <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                    <span>Mô tả ngắn gọn lợi ích nhận được (Tùy chọn)</span>
                    <span
                      className={`text-[10px] ${
                        (watchedValues.description?.length || 0) > 200
                          ? 'text-destructive font-bold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {watchedValues.description?.length || 0}/200 ký tự
                    </span>
                  </label>
                  <Textarea
                    {...register('description')}
                    rows={3}
                    maxLength={200}
                    placeholder='Mô tả ngắn gọn lợi ích nổi bật của tài liệu hoặc sản phẩm để kích thích khách bấm mua...'
                    className='text-xs rounded-xl resize-none'
                  />
                  {errors.description && (
                    <p className='text-[11px] text-destructive font-medium'>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* D. Giá bán tính bằng VNĐ */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1'>
                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                      <span>
                        Giá bán (VNĐ) <span className='text-[#FE2C55]'>*</span>
                      </span>
                      {watchedValues.type === 'LEAD_MAGNET' && (
                        <Badge
                          variant='outline'
                          className='text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        >
                          Tự động khóa 0đ (LEAD_MAGNET)
                        </Badge>
                      )}
                    </label>
                    <Input
                      type='number'
                      disabled={watchedValues.type === 'LEAD_MAGNET'}
                      value={watchedValues.type === 'LEAD_MAGNET' ? 0 : watchedValues.price}
                      onChange={(e) => setValue('price', Number(e.target.value))}
                      placeholder='149000'
                      className={`h-10 text-xs rounded-xl font-mono ${
                        watchedValues.type === 'LEAD_MAGNET'
                          ? 'bg-muted/70 text-muted-foreground cursor-not-allowed opacity-80'
                          : ''
                      }`}
                    />
                    {errors.price && (
                      <p className='text-[11px] text-destructive font-medium'>
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  {/* E. Chữ hiển thị trên nút CTA (buttonText) */}
                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                      <span>Chữ hiển thị trên nút CTA (buttonText)</span>
                      <span className='text-[10px] text-muted-foreground'>Tùy chọn</span>
                    </label>
                    <Input
                      {...register('buttonText')}
                      placeholder={
                        watchedValues.type === 'LEAD_MAGNET'
                          ? 'VD: Nhận 0đ'
                          : watchedValues.type === 'PHYSICAL'
                            ? 'VD: Đặt trước'
                            : watchedValues.type === 'EXTERNAL_LINK'
                              ? 'VD: Mở link'
                              : 'VD: Mua ngay'
                      }
                      className='h-10 text-xs rounded-xl'
                    />
                    <p className='text-[10px] text-muted-foreground'>
                      Để trống sẽ tự động lấy theo loại mặt hàng.
                    </p>
                  </div>
                </div>

                {/* F. Toggle Bật/Tắt hiển thị sản phẩm trên Storefront (isPublished) */}
                <div className='flex items-center justify-between rounded-xl border border-border/80 p-3.5 bg-muted/20 mt-2'>
                  <div className='space-y-0.5 pr-2'>
                    <div className='font-semibold text-xs text-foreground flex items-center gap-2'>
                      Bật hiển thị sản phẩm trên Storefront
                      {watchedValues.isPublished ? (
                        <Badge className='text-[10px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20'>
                          Đang hiển thị
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-[10px] text-muted-foreground'>
                          Đang ẩn
                        </Badge>
                      )}
                    </div>
                    <p className='text-[11px] text-muted-foreground'>
                      Khi tắt, sản phẩm vẫn được lưu trữ trong Dashboard nhưng sẽ ẩn khỏi trang Bio
                      Storefront công khai của bạn.
                    </p>
                  </div>
                  <Controller
                    control={control}
                    name='isPublished'
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='data-[state=checked]:bg-[#FE2C55]'
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. CỤM TRƯỜNG ĐỘNG ĐẶC THÙ (FULFILLMENT FIELDS) THEO TỪNG LOẠI SẢN PHẨM */}
            <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
              <div className='p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  3. Cụm trường đặc thù (Fulfillment Fields)
                </h3>
                <Badge variant='outline' className='text-[10px] font-semibold uppercase'>
                  {watchedValues.type}
                </Badge>
              </div>

              <CardContent className='p-4.5 space-y-4 text-xs'>
                {/* ========================================================= */}
                {/* A. LOẠI "SẢN PHẨM SỐ" (DIGITAL)                          */}
                {/* ========================================================= */}
                {watchedValues.type === 'DIGITAL' && (
                  <div className='space-y-4'>
                    <div className='space-y-1.5'>
                      <label className='font-semibold text-foreground text-xs'>
                        Hình thức giao hàng tự động (deliveryType)
                      </label>
                      <div className='grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/70 border border-border/60'>
                        <button
                          type='button'
                          onClick={() => setValue('deliveryType', 'UPLOAD_FILE')}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            watchedValues.deliveryType === 'UPLOAD_FILE'
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icons.upload className='w-3.5 h-3.5 text-blue-500' />
                          Tải file lên hệ thống
                        </button>
                        <button
                          type='button'
                          onClick={() => setValue('deliveryType', 'REDIRECT_LINK')}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            watchedValues.deliveryType === 'REDIRECT_LINK'
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icons.link className='w-3.5 h-3.5 text-indigo-500' />
                          Dán link truy cập bảo mật
                        </button>
                      </div>
                    </div>

                    {watchedValues.deliveryType === 'UPLOAD_FILE' ? (
                      <div className='space-y-3 rounded-xl bg-muted/20 border border-border p-3.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Kéo thả file đính kèm (.pdf, .zip, .epub, .xlsx)
                        </label>
                        <input
                          type='file'
                          ref={digitalUploadRef}
                          onChange={handleDigitalFileUpload}
                          accept='.pdf,.zip,.epub,.xlsx,.xls'
                          className='hidden'
                        />
                        <div
                          onClick={() => digitalUploadRef.current?.click()}
                          className='border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-card hover:bg-muted/40'
                        >
                          <Icons.upload className='w-6 h-6 text-muted-foreground mx-auto mb-1.5' />
                          <div className='text-xs font-semibold text-foreground'>
                            {watchedValues.fileName
                              ? watchedValues.fileName
                              : 'Bấm để tải file tài nguyên'}
                          </div>
                          <p className='text-[10px] text-muted-foreground mt-0.5'>
                            Hỗ trợ định dạng: .pdf, .zip, .epub, .xlsx
                          </p>
                          {watchedValues.fileName && (
                            <div className='mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[11px] font-mono'>
                              <Icons.circleCheck className='w-3.5 h-3.5' />
                              <span>{watchedValues.fileName}</span>
                              <span className='opacity-60'>
                                ({watchedValues.fileSize || '12.4 MB'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-2 rounded-xl bg-muted/20 border border-border p-3.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Ô Input redirectUrl (Link Notion, Google Drive, Canva...){' '}
                          <span className='text-[#FE2C55]'>*</span>
                        </label>
                        <Input
                          {...register('redirectUrl')}
                          placeholder='Link Notion Duplicate, Google Drive cấp quyền, link Canva'
                          className='h-10 text-xs rounded-xl font-mono'
                        />
                        {errors.redirectUrl && (
                          <p className='text-[11px] text-destructive font-medium'>
                            {errors.redirectUrl.message}
                          </p>
                        )}
                        <p className='text-[11px] text-muted-foreground'>
                          Sau khi thanh toán VietQR thành công, khách hàng sẽ nhận được quyền truy
                          cập link bảo mật này tức thì.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================= */}
                {/* B. LOẠI "QUÀ 0Đ" (LEAD_MAGNET)                           */}
                {/* ========================================================= */}
                {watchedValues.type === 'LEAD_MAGNET' && (
                  <div className='space-y-4'>
                    <div className='p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2'>
                      <Icons.gift className='w-4 h-4 text-emerald-500 shrink-0' />
                      <span className='text-[11px]'>
                        <strong>Quà tặng 0đ:</strong> Giá bán được tự động ép bằng{' '}
                        <strong>0 VNĐ</strong>. Khách chỉ cần điền Họ tên & Email là nhận được quà
                        ngay.
                      </span>
                    </div>

                    <div className='space-y-1.5'>
                      <label className='font-semibold text-foreground text-xs'>
                        Hình thức gửi quà tặng miễn phí
                      </label>
                      <div className='grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/70 border border-border/60'>
                        <button
                          type='button'
                          onClick={() => setValue('deliveryType', 'UPLOAD_FILE')}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            watchedValues.deliveryType === 'UPLOAD_FILE'
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icons.upload className='w-3.5 h-3.5 text-emerald-500' />
                          Tải file tài liệu miễn phí (.pdf, .zip)
                        </button>
                        <button
                          type='button'
                          onClick={() => setValue('deliveryType', 'REDIRECT_LINK')}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            watchedValues.deliveryType === 'REDIRECT_LINK'
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icons.link className='w-3.5 h-3.5 text-indigo-500' />
                          Link Google Drive / Canva
                        </button>
                      </div>
                    </div>

                    {watchedValues.deliveryType === 'UPLOAD_FILE' ? (
                      <div className='space-y-3 rounded-xl bg-muted/20 border border-border p-3.5'>
                        <input
                          type='file'
                          ref={digitalUploadRef}
                          onChange={handleDigitalFileUpload}
                          accept='.pdf,.zip,.epub,.xlsx'
                          className='hidden'
                        />
                        <div
                          onClick={() => digitalUploadRef.current?.click()}
                          className='border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-card hover:bg-muted/40'
                        >
                          <Icons.upload className='w-6 h-6 text-muted-foreground mx-auto mb-1.5' />
                          <div className='text-xs font-semibold text-foreground'>
                            {watchedValues.fileName
                              ? watchedValues.fileName
                              : 'Bấm tải file quà tặng (Ebook, Checklist...)'}
                          </div>
                          <p className='text-[10px] text-muted-foreground mt-0.5'>
                            Hỗ trợ .pdf, .zip, .epub, .xlsx
                          </p>
                          {watchedValues.fileName && (
                            <div className='mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-mono'>
                              <Icons.circleCheck className='w-3.5 h-3.5' />
                              <span>{watchedValues.fileName}</span>
                              <span className='opacity-60'>
                                ({watchedValues.fileSize || '3.2 MB'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-2 rounded-xl bg-muted/20 border border-border p-3.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Đường link nhận quà (Google Drive / Canva / Notion){' '}
                          <span className='text-[#FE2C55]'>*</span>
                        </label>
                        <Input
                          {...register('redirectUrl')}
                          placeholder='https://drive.google.com/file/d/...'
                          className='h-10 text-xs rounded-xl font-mono'
                        />
                        {errors.redirectUrl && (
                          <p className='text-[11px] text-destructive font-medium'>
                            {errors.redirectUrl.message}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Lời nhắn sau khi nhận quà thành công (successMessage) */}
                    <div className='space-y-1.5 rounded-xl bg-muted/20 border border-border p-3.5'>
                      <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                        <span>Lời nhắn sau khi nhận quà thành công (successMessage)</span>
                        <span className='text-[10px] text-muted-foreground'>Tùy chọn</span>
                      </label>
                      <Input
                        {...register('successMessage')}
                        placeholder='Tài liệu đã được gửi vào Email của bạn!'
                        className='h-10 text-xs rounded-xl'
                      />
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* C. LOẠI "HÀNG VẬT LÝ" (PHYSICAL - Made-to-Order)          */}
                {/* ========================================================= */}
                {watchedValues.type === 'PHYSICAL' && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {/* Giới hạn số lượng nhận đơn / tồn kho (stock) */}
                      <div className='space-y-1.5'>
                        <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                          <span>Giới hạn số lượng nhận đơn / tồn kho (stock)</span>
                          <span className='text-[10px] text-muted-foreground'>
                            Để trống = Không giới hạn
                          </span>
                        </label>
                        <Input
                          type='number'
                          value={watchedValues.stock ?? ''}
                          onChange={(e) =>
                            setValue('stock', e.target.value === '' ? null : Number(e.target.value))
                          }
                          placeholder='VD: 50 (để trống nếu không giới hạn)'
                          className='h-10 text-xs rounded-xl font-mono'
                        />
                        <p className='text-[10px] text-muted-foreground'>
                          Khi hết hàng, nút ngoài Storefront tự chuyển thành &quot;Hết hàng&quot;.
                        </p>
                      </div>

                      {/* Thời gian dự kiến hoàn thiện / giao hàng (estimatedFulfillment) */}
                      <div className='space-y-1.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Thời gian dự kiến hoàn thiện / giao hàng
                        </label>
                        <Input
                          {...register('estimatedFulfillment')}
                          placeholder='VD: Giao sau 3-5 ngày làm việc'
                          className='h-10 text-xs rounded-xl'
                        />
                      </div>
                    </div>

                    {/* Danh sách phân loại (variants tags input: S, M, L hoặc Đen, Trắng) */}
                    <div className='space-y-2 rounded-xl bg-muted/20 border border-border p-3.5'>
                      <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                        <span>Danh sách phân loại hàng (variants)</span>
                        <span className='text-[10px] text-muted-foreground'>Tags input</span>
                      </label>

                      <div className='flex items-center gap-2'>
                        <Input
                          value={newVariantInput}
                          onChange={(e) => setNewVariantInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddVariant();
                            }
                          }}
                          placeholder='Nhập phân loại (VD: Size S, Size M, Màu Đen) rồi nhấn Thêm'
                          className='h-9 text-xs rounded-xl'
                        />
                        <Button
                          type='button'
                          size='sm'
                          onClick={handleAddVariant}
                          className='h-9 px-3 rounded-xl text-xs gap-1 cursor-pointer bg-primary'
                        >
                          <Icons.add className='w-3.5 h-3.5' /> Thêm
                        </Button>
                      </div>

                      {/* Hiển thị tags variants */}
                      <div className='flex flex-wrap items-center gap-1.5 pt-1'>
                        {(watchedValues.variants || []).map((variant, idx) => (
                          <Badge
                            key={idx}
                            variant='secondary'
                            className='px-2.5 py-1 text-xs rounded-lg gap-1.5 bg-background border border-border'
                          >
                            <span>{variant}</span>
                            <button
                              type='button'
                              onClick={() => handleRemoveVariant(idx)}
                              className='text-muted-foreground hover:text-destructive cursor-pointer'
                            >
                              <Icons.close className='w-3 h-3' />
                            </button>
                          </Badge>
                        ))}
                        {(watchedValues.variants || []).length === 0 && (
                          <span className='text-[11px] text-muted-foreground italic'>
                            Chưa có phân loại nào (Sản phẩm chỉ có 1 phiên bản chuẩn).
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle: Gửi tin nhắn Zalo xác nhận đơn hàng sau khi quét QR */}
                    <div className='flex items-center justify-between rounded-xl border border-border p-3.5 bg-card'>
                      <div className='space-y-0.5 pr-2'>
                        <div className='font-semibold text-xs text-foreground flex items-center gap-1.5'>
                          <Icons.chat className='w-3.5 h-3.5 text-blue-500' />
                          Gửi tin nhắn Zalo xác nhận đơn hàng sau khi quét QR
                        </div>
                        <p className='text-[11px] text-muted-foreground'>
                          Hệ thống tự động kích hoạt thông báo Zalo ZNS kèm mã vận đơn tới số điện
                          thoại người mua.
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
                )}

                {/* ========================================================= */}
                {/* D. LOẠI "NÚT LINK LIÊN KẾT" (EXTERNAL_LINK)               */}
                {/* ========================================================= */}
                {watchedValues.type === 'EXTERNAL_LINK' && (
                  <div className='space-y-4'>
                    {/* URL chuyển hướng đích (destinationUrl) */}
                    <div className='space-y-1.5 rounded-xl bg-muted/20 border border-border p-3.5'>
                      <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                        <span>
                          URL chuyển hướng đích (destinationUrl){' '}
                          <span className='text-[#FE2C55]'>*</span>
                        </span>
                      </label>
                      <Input
                        {...register('destinationUrl')}
                        placeholder='https://shopee.vn/... hoặc https://zalo.me/g/...'
                        className='h-10 text-xs rounded-xl font-mono'
                      />
                      {errors.destinationUrl && (
                        <p className='text-[11px] text-destructive font-medium'>
                          {errors.destinationUrl.message}
                        </p>
                      )}
                      <p className='text-[11px] text-muted-foreground'>
                        Người xem nhấn vào nút trên Bio Storefront sẽ được chuyển hướng thẳng tới
                        link này.
                      </p>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {/* Chọn icon đại diện (iconType) */}
                      <div className='space-y-1.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Chọn icon đại diện (iconType)
                        </label>
                        <Controller
                          control={control}
                          name='iconType'
                          render={({ field }) => (
                            <div className='grid grid-cols-5 gap-2'>
                              {[
                                { key: 'shopee', label: 'Shopee', icon: Icons.shoppingCart },
                                { key: 'tiktok', label: 'TikTok', icon: Icons.tiktok },
                                { key: 'zalo', label: 'Zalo', icon: Icons.zalo },
                                { key: 'youtube', label: 'YouTube', icon: Icons.youtube },
                                { key: 'external', label: 'Khác', icon: Icons.externalLink }
                              ].map((item) => {
                                const IconComp = item.icon;
                                const isSelected = field.value === item.key;
                                return (
                                  <button
                                    key={item.key}
                                    type='button'
                                    onClick={() => field.onChange(item.key)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                      isSelected
                                        ? 'border-[#FE2C55] bg-[#FE2C55]/10 text-[#FE2C55] font-bold'
                                        : 'border-border/80 bg-background hover:bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    <IconComp className='w-4 h-4 mb-1' />
                                    <span className='text-[10px]'>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        />
                      </div>

                      {/* Toggle: Mở link trên tab mới khi khách bấm (openInNewTab) */}
                      <div className='flex items-center justify-between rounded-xl border border-border p-3.5 bg-card self-end'>
                        <div className='space-y-0.5 pr-2'>
                          <div className='font-semibold text-xs text-foreground'>
                            Mở link trên tab mới khi khách bấm
                          </div>
                          <p className='text-[10px] text-muted-foreground'>
                            Khuyên dùng để giữ chân khách trên Bio Storefront
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
                )}
              </CardContent>
            </Card>

            {/* 4. NÚT LƯU FOOTER */}
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
                className='h-10 px-6 text-xs font-bold rounded-xl gap-2 shadow-md bg-[#FE2C55] hover:bg-[#ef244b] text-white cursor-pointer transition-all active:scale-[0.99]'
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
              <span>Xem trước điện thoại (Thời gian thực)</span>
            </div>

            <div className='relative'>
              <div className='absolute -inset-1 rounded-[60px] bg-gradient-to-tr from-[#FE2C55]/20 via-emerald-500/10 to-indigo-500/20 blur-2xl opacity-50' />
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
