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
import {
  FileText,
  Gift,
  Package,
  Link2,
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Icons } from '@/components/icons';

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80'
];

interface ProductFormValues {
  type: ProductType;
  title: string;
  price: number;
  originalPrice?: number;
  coverImage: string;
  description?: string;
  deliveryMode: 'UPLOAD' | 'LINK';
  fileUrl?: string;
  fileName?: string;
  stock?: number;
  deliveryEstimate?: string;
  enableZaloNotification: boolean;
  externalUrl?: string;
}

const productFormSchema = z.object({
  type: z.enum(['DIGITAL', 'LEAD_MAGNET', 'PHYSICAL', 'EXTERNAL_LINK']),
  title: z.string().min(1, 'Tiêu đề sản phẩm là bắt buộc').max(100, 'Tiêu đề không quá 100 ký tự'),
  price: z.number().min(0, 'Giá bán không được âm'),
  originalPrice: z.number().optional(),
  coverImage: z.string().min(1, 'Ảnh thumbnail / cover là bắt buộc'),
  description: z.string().max(200, 'Mô tả ngắn tối đa 200 ký tự').optional(),
  deliveryMode: z.enum(['UPLOAD', 'LINK']),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  stock: z.number().min(1, 'Số lượng tối thiểu là 1').optional(),
  deliveryEstimate: z.string().optional(),
  enableZaloNotification: z.boolean(),
  externalUrl: z.string().optional()
});

export function CreateProductView() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<CreatorProfile>(defaultCreatorProfile);
  const [paymentConfig, setPaymentConfig] = React.useState<PaymentConfig>(defaultPaymentConfig);
  const [existingProducts, setExistingProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const digitalUploadRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      type: 'DIGITAL',
      title: '',
      price: 149000,
      originalPrice: 299000,
      coverImage: PRESET_COVERS[0],
      description: '',
      deliveryMode: 'LINK',
      fileUrl: 'https://notion.so/giangdinh/template-notion-creator',
      fileName: 'Template-Notion-2025.pdf',
      stock: 50,
      deliveryEstimate: 'Giao sau 3-5 ngày làm việc',
      enableZaloNotification: true,
      externalUrl: ''
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
        // fallback
      }
    }
    loadData();
  }, []);

  // When type changes: If LEAD_MAGNET, price is fixed to 0
  React.useEffect(() => {
    if (watchedValues.type === 'LEAD_MAGNET') {
      setValue('price', 0);
      setValue('originalPrice', undefined);
    } else if (watchedValues.type === 'DIGITAL' && watchedValues.price === 0) {
      setValue('price', 149000);
      setValue('originalPrice', 299000);
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
      setValue('fileName', file.name);
      setValue('fileUrl', `https://storage.tiemnho.vn/r2/files/${file.name}`);
      toast.success(`Đã chuẩn bị file đính kèm: ${file.name}`);
    }
  };

  // Submit Handler
  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      await createProduct({
        type: values.type,
        title: values.title.trim(),
        description: values.description?.trim() || '',
        price: values.price,
        originalPrice: values.originalPrice,
        coverImage: values.coverImage,
        fileUrl: values.type === 'EXTERNAL_LINK' ? undefined : values.fileUrl,
        fileName: values.type === 'EXTERNAL_LINK' ? undefined : values.fileName,
        externalUrl: values.type === 'EXTERNAL_LINK' ? values.externalUrl?.trim() : undefined,
        buttonText:
          values.type === 'LEAD_MAGNET'
            ? 'Nhận ngay'
            : values.type === 'PHYSICAL'
              ? 'Đặt trước'
              : values.type === 'EXTERNAL_LINK'
                ? 'Mở link'
                : 'Mua ngay',
        isPublished: true,
        isFeatured: false,
        stock: values.type === 'PHYSICAL' ? values.stock : 999
      });

      toast.success('Đã tạo và đưa sản phẩm lên gian hàng thành công!');
      router.push('/dashboard/products');
    } catch {
      toast.error('Không thể tạo sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time Virtual Preview Product
  const previewProduct: Product = React.useMemo(() => {
    return {
      id: 'preview-draft',
      creatorId: profile.id,
      type: watchedValues.type,
      title: watchedValues.title.trim() || 'Tên sản phẩm của bạn',
      description:
        watchedValues.description?.trim() ||
        'Mô tả ngắn gọn về giá trị của tài nguyên số hoặc sản phẩm cá nhân của bạn.',
      price: watchedValues.price,
      originalPrice: watchedValues.originalPrice,
      coverImage: watchedValues.coverImage || PRESET_COVERS[0],
      fileUrl: watchedValues.fileUrl,
      fileName: watchedValues.fileName,
      externalUrl: watchedValues.externalUrl,
      buttonText:
        watchedValues.type === 'LEAD_MAGNET'
          ? 'Nhận ngay'
          : watchedValues.type === 'PHYSICAL'
            ? 'Đặt trước'
            : watchedValues.type === 'EXTERNAL_LINK'
              ? 'Mở link'
              : 'Mua ngay',
      isPublished: true,
      isFeatured: true,
      stock: watchedValues.stock || 50,
      displayOrder: 0,
      soldCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [watchedValues, profile.id]);

  const previewProductsList = React.useMemo(() => {
    return [previewProduct, ...existingProducts.filter((p) => p.id !== 'preview-draft')];
  }, [previewProduct, existingProducts]);

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-16'>
      {/* Top Bar Header */}
      <div className='flex items-center justify-between pb-4 border-b border-border/60'>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.back()}
            className='h-9 w-9 p-0 rounded-xl cursor-pointer hover:bg-muted'
          >
            <ArrowLeft className='h-4 w-4 text-foreground' />
          </Button>
          <div>
            <h1 className='text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2'>
              Tạo sản phẩm mới
              <Badge
                variant='outline'
                className='text-[10px] font-semibold uppercase bg-primary/10 text-primary border-primary/20'
              >
                Draft Realtime
              </Badge>
            </h1>
            <p className='text-xs text-muted-foreground'>
              Thiết lập thông tin bán hàng, cơ chế giao nhận tự động và xem trước trực tiếp trên
              iPhone.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Layout (60% Form / 40% Mobile Preview) */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
        {/* ========================================================= */}
        {/* CỘT TRÁI: FORM NHẬP LIỆU (60% - 7 Cols trên lg)           */}
        {/* ========================================================= */}
        <div className='lg:col-span-7 xl:col-span-7 space-y-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            {/* 1. CHỌN LOẠI SẢN PHẨM (4 TYPES) */}
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
                          desc: 'Ebook, Template Notion, Preset, file PDF/Zip...',
                          icon: FileText,
                          color: 'text-blue-500'
                        },
                        {
                          type: 'LEAD_MAGNET' as ProductType,
                          title: 'Quà tặng 0đ (Lead Magnet)',
                          desc: 'Checklist, cẩm nang miễn phí để thu thập Email & SĐT',
                          icon: Gift,
                          color: 'text-emerald-500'
                        },
                        {
                          type: 'PHYSICAL' as ProductType,
                          title: 'Hàng vật lý / Thủ công',
                          desc: 'Sách in, áo thun merch, đồ làm theo yêu cầu...',
                          icon: Package,
                          color: 'text-amber-500'
                        },
                        {
                          type: 'EXTERNAL_LINK' as ProductType,
                          title: 'Nút link liên kết',
                          desc: 'Trỏ sang Shopee, TikTok Shop, nhóm Zalo, YouTube...',
                          icon: Link2,
                          color: 'text-purple-500'
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
                                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-[#FE2C55] text-white shadow-xs'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <IconComp className='w-4.5 h-4.5' strokeWidth={1.75} />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between'>
                                  <span className='font-bold text-xs text-foreground'>
                                    {item.title}
                                  </span>
                                  {isSelected && (
                                    <span className='h-4 w-4 rounded-full bg-[#FE2C55] text-white flex items-center justify-center text-[10px]'>
                                      <Check className='w-2.5 h-2.5 stroke-[3]' />
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

            {/* 2. CỤM FORM FIELDS CHUNG (Áp dụng cho mọi loại) */}
            <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
              <div className='p-4 border-b border-border/60 bg-muted/20'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  2. Thông tin chung & Hiển thị
                </h3>
              </div>
              <CardContent className='p-4.5 space-y-4 text-xs'>
                {/* Tiêu đề sản phẩm */}
                <div className='space-y-1.5'>
                  <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                    <span>
                      Tiêu đề sản phẩm <span className='text-[#FE2C55]'>*</span>
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      {watchedValues.title?.length || 0}/100 ký tự
                    </span>
                  </label>
                  <Input
                    {...register('title')}
                    placeholder='VD: Bộ 50+ Template Notion Quản lý Tài chính Cá nhân 2025'
                    className='h-10 text-xs rounded-xl'
                  />
                  {errors.title && (
                    <p className='text-[11px] text-destructive font-medium'>
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Giá bán VNĐ & Giá gốc gạch đi */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                          Cố định 0đ (Lead Magnet)
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
                          ? 'bg-muted/70 text-muted-foreground cursor-not-allowed'
                          : ''
                      }`}
                    />
                    {errors.price && (
                      <p className='text-[11px] text-destructive font-medium'>
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-1.5'>
                    <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                      <span>Giá gốc niêm yết (Gạch đi)</span>
                      <span className='text-[10px] text-muted-foreground'>Không bắt buộc</span>
                    </label>
                    <Input
                      type='number'
                      disabled={watchedValues.type === 'LEAD_MAGNET'}
                      value={watchedValues.originalPrice ?? ''}
                      onChange={(e) =>
                        setValue(
                          'originalPrice',
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder='299000'
                      className='h-10 text-xs rounded-xl font-mono'
                    />
                  </div>
                </div>

                {/* Ảnh Thumbnail / Cover */}
                <div className='space-y-2 pt-1'>
                  <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                    <span>
                      Ảnh Thumbnail / Cover <span className='text-[#FE2C55]'>*</span>
                    </span>
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
                        <ImageIcon className='w-6 h-6 text-muted-foreground' />
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
                          <Upload className='w-3.5 h-3.5' />
                          {isUploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}
                        </Button>
                      </div>

                      {/* Ảnh mẫu có sẵn */}
                      <div className='flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none'>
                        <span className='text-[10px] text-muted-foreground shrink-0'>Ảnh mẫu:</span>
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

                {/* Mô tả ngắn (Tối đa 200 ký tự) */}
                <div className='space-y-1.5 pt-1'>
                  <label className='font-semibold text-foreground text-xs flex items-center justify-between'>
                    <span>Mô tả ngắn (Description)</span>
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
                    placeholder='Mô tả giá trị nổi bật của tài liệu, quà tặng hoặc sản phẩm nhằm kích thích khách bấm mua...'
                    className='text-xs rounded-xl resize-none'
                  />
                  {errors.description && (
                    <p className='text-[11px] text-destructive font-medium'>
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 3. CỤM FORM FIELDS ĐỘNG (FULFILLMENT FIELDS THEO LOẠI) */}
            <Card className='border border-border/80 shadow-xs rounded-2xl overflow-hidden'>
              <div className='p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  3. Cơ chế giao nhận & Trả hàng tự động
                </h3>
                <Badge variant='outline' className='text-[10px] font-semibold uppercase'>
                  {watchedValues.type}
                </Badge>
              </div>
              <CardContent className='p-4.5 space-y-4 text-xs'>
                {/* TRƯỜNG HỢP: DIGITAL hoặc LEAD_MAGNET */}
                {(watchedValues.type === 'DIGITAL' || watchedValues.type === 'LEAD_MAGNET') && (
                  <div className='space-y-4'>
                    {/* Tabs chọn: Tải file lên Cloudflare R2 hoặc Dán link truy cập kín */}
                    <div className='flex items-center p-1 rounded-xl bg-muted/70 border border-border/60'>
                      <button
                        type='button'
                        onClick={() => setValue('deliveryMode', 'LINK')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          watchedValues.deliveryMode === 'LINK'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <LinkIcon className='w-3.5 h-3.5' />
                        Dán link truy cập kín (Drive/Notion)
                      </button>
                      <button
                        type='button'
                        onClick={() => setValue('deliveryMode', 'UPLOAD')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          watchedValues.deliveryMode === 'UPLOAD'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Upload className='w-3.5 h-3.5' />
                        Tải file lên (Cloudflare R2)
                      </button>
                    </div>

                    {watchedValues.deliveryMode === 'LINK' ? (
                      <div className='space-y-2 rounded-xl bg-muted/20 border border-border p-3.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Đường link tải tài nguyên kín (Google Drive, Notion, Canva...){' '}
                          <span className='text-[#FE2C55]'>*</span>
                        </label>
                        <Input
                          {...register('fileUrl')}
                          placeholder='https://notion.so/giangdinh/tai-nguyen-bi-mat'
                          className='h-10 text-xs rounded-xl font-mono'
                        />
                        <p className='text-[11px] text-muted-foreground'>
                          Người mua quét mã VietQR thành công sẽ được cấp quyền bấm mở link này ngay
                          lập tức + nhận qua email.
                        </p>
                      </div>
                    ) : (
                      <div className='space-y-3 rounded-xl bg-muted/20 border border-border p-3.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Tải tài liệu PDF / Zip lên hạ tầng Cloudflare R2 (Pre-signed URL)
                        </label>
                        <input
                          type='file'
                          ref={digitalUploadRef}
                          onChange={handleDigitalFileUpload}
                          className='hidden'
                        />
                        <div
                          onClick={() => digitalUploadRef.current?.click()}
                          className='border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-card hover:bg-muted/40'
                        >
                          <Upload className='w-6 h-6 text-muted-foreground mx-auto mb-1.5' />
                          <div className='text-xs font-semibold text-foreground'>
                            {watchedValues.fileName
                              ? watchedValues.fileName
                              : 'Bấm để tải file lên'}
                          </div>
                          <p className='text-[10px] text-muted-foreground mt-0.5'>
                            Hỗ trợ PDF, ZIP, EPUB, PNG, MP3 (Tối đa 250MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TRƯỜNG HỢP: PHYSICAL */}
                {watchedValues.type === 'PHYSICAL' && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      {/* Ô nhập số lượng tối đa */}
                      <div className='space-y-1.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Số lượng tối đa (Stock Limit) <span className='text-[#FE2C55]'>*</span>
                        </label>
                        <Input
                          type='number'
                          {...register('stock', { valueAsNumber: true })}
                          placeholder='50'
                          className='h-10 text-xs rounded-xl font-mono'
                        />
                        <p className='text-[10px] text-muted-foreground'>
                          Hết hàng hệ thống sẽ tự động đóng nút đặt mua.
                        </p>
                      </div>

                      {/* Ô thời gian hoàn thiện dự kiến */}
                      <div className='space-y-1.5'>
                        <label className='font-semibold text-foreground text-xs'>
                          Thời gian hoàn thiện dự kiến
                        </label>
                        <Input
                          {...register('deliveryEstimate')}
                          placeholder='Giao sau 3-5 ngày làm việc'
                          className='h-10 text-xs rounded-xl'
                        />
                      </div>
                    </div>

                    {/* Toggle Switch: Bật gửi tin Zalo xác nhận đơn hàng */}
                    <div className='flex items-center justify-between rounded-xl border border-border p-3.5 bg-card'>
                      <div className='space-y-0.5 pr-2'>
                        <div className='font-semibold text-xs text-foreground'>
                          Bật gửi tin Zalo xác nhận đơn hàng
                        </div>
                        <p className='text-[11px] text-muted-foreground'>
                          Tự động gửi tin nhắn ZNS xác nhận thông tin nhận hàng và mã vận đơn đến
                          SĐT người mua.
                        </p>
                      </div>
                      <Controller
                        control={control}
                        name='enableZaloNotification'
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

                {/* TRƯỜNG HỢP: EXTERNAL_LINK */}
                {watchedValues.type === 'EXTERNAL_LINK' && (
                  <div className='space-y-2 rounded-xl bg-muted/20 border border-border p-3.5'>
                    <label className='font-semibold text-foreground text-xs'>
                      Ô dán URL chuyển hướng đích (Target URL){' '}
                      <span className='text-[#FE2C55]'>*</span>
                    </label>
                    <Input
                      {...register('externalUrl')}
                      placeholder='https://shopee.vn/san-pham-doc-quyen hoặc https://zalo.me/g/...'
                      className='h-10 text-xs rounded-xl font-mono'
                    />
                    {errors.externalUrl && (
                      <p className='text-[11px] text-destructive font-medium'>
                        {errors.externalUrl.message}
                      </p>
                    )}
                    <p className='text-[11px] text-muted-foreground'>
                      Khách hàng bấm vào nút trên Bio sẽ mở thẳng liên kết ngoài trong tab mới.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. NÚT BẤM FOOTER */}
            <div className='flex items-center justify-end gap-3 pt-4 border-t border-border/60'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
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
                    <Sparkles className='h-4 w-4' />
                    Lưu & Đưa lên Tiệm
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: LIVE MOBILE PREVIEW (40% - 5 Cols trên lg)      */}
        {/* ========================================================= */}
        <div className='lg:col-span-5 xl:col-span-5 hidden lg:block sticky top-20'>
          <div className='space-y-3 text-center'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-semibold text-muted-foreground'>
              <Smartphone className='w-3.5 h-3.5 text-primary' />
              <span>Xem trước iPhone (Cập nhật thời gian thực)</span>
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
